import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

import { neon } from '@neondatabase/serverless';
import { loadSingaporeNearbyPlaceSeed } from './singapore-nearby-place-source.mjs';

function digest(values) {
  return createHash('sha256').update([...values].sort().join('\n')).digest('hex');
}

function chunks(rows, size) {
  const output = [];
  for (let offset = 0; offset < rows.length; offset += size) output.push(rows.slice(offset, offset + size));
  return output;
}

export function createSingaporeNearbyPlaceSeedRunner(port, loadSeed = loadSingaporeNearbyPlaceSeed) {
  return Object.freeze({
    async run({ batchSize = 500, verifyOnly = false } = {}) {
      if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 1_000) {
        throw new RangeError('Singapore nearby-place batch size must be between 1 and 1000.');
      }
      const seed = loadSeed();
      if (seed.rows.some((row) => !row.buildingKey.startsWith('singapore:')
        || !['station', 'school'].includes(row.kind)
        || (row.kind === 'station' && !row.providerId.startsWith('lta:station:'))
        || (row.kind === 'school' && !row.providerId.startsWith('moe:school:')))) {
        throw new RangeError('Singapore nearby-place seed scope is limited to official Singapore rows.');
      }
      let upserted = 0;
      let pruned = 0;
      const current = await port.verify();
      const currentMatches = current.total === seed.summary.total
        && current.digest === seed.summary.digest
        && current.generationSha256 === seed.summary.sourceSha256;
      if (currentMatches) {
        if (!verifyOnly) await port.resetStage();
        return Object.freeze({ changed: 0, upserted: 0, pruned: 0, verification: current });
      }
      if (!verifyOnly) {
        await port.resetStage(seed.summary.sourceSha256);
        for (const [batchNumber, batch] of chunks(seed.rows, batchSize).entries()) {
          await port.stage(batch, seed.summary.sourceSha256, batchNumber);
        }
        const staged = await port.verifyStage(seed.summary.sourceSha256);
        if (staged.total !== seed.summary.total || staged.digest !== seed.summary.digest) {
          throw new Error('Singapore nearby-place staged generation verification mismatch.');
        }
        ({ upserted, pruned } = await port.publish(seed.summary.sourceSha256, seed.summary.total));
      }
      const verification = await port.verify();
      if (verification.total !== seed.summary.total
        || verification.digest !== seed.summary.digest
        || verification.generationSha256 !== seed.summary.sourceSha256) {
        throw new Error('Singapore nearby-place seed verification mismatch.');
      }
      return Object.freeze({ changed: upserted + pruned, upserted, pruned, verification });
    },
  });
}

function parseCount(value) {
  const count = typeof value === 'string' ? Number(value) : value;
  if (!Number.isSafeInteger(count) || count < 0) throw new TypeError('Invalid Singapore nearby-place count.');
  return count;
}

function databasePort(connectionString) {
  const sql = neon(connectionString);
  return Object.freeze({
    async resetStage() {
      await sql.query('TRUNCATE nearby_place_seed_stage');
    },
    async stage(rows, sourceSha256, batchNumber) {
      const payload = rows.map((row) => ({
        building_key: row.buildingKey,
        kind: row.kind,
        provider_id: row.providerId,
        name: row.name,
        distance_meters: row.distanceMeters,
        walking_minutes: row.walkingMinutes,
        latitude: row.latitude,
        longitude: row.longitude,
        lines: row.lines,
        is_nearest: row.isNearest,
        source: row.source,
        evidence_sha256: row.evidenceSha256,
        checked_at: row.checkedAt,
      }));
      await sql.query(`
        INSERT INTO nearby_place_seed_stage (
          generation_sha256, building_key, kind, provider_id, name,
          lines, is_nearest, source, evidence_sha256, checked_at
        )
        VALUES (
          $1::char(64), 'singapore:seed-batch', 'station', $2, $3,
          $4::jsonb, false, $5, $1::char(64), $6::timestamptz
        )
        ON CONFLICT (generation_sha256, building_key, kind, provider_id) DO UPDATE SET
          name = excluded.name,
          lines = excluded.lines,
          source = excluded.source,
          evidence_sha256 = excluded.evidence_sha256,
          checked_at = excluded.checked_at
      `, [
        sourceSha256,
        `batch:${String(batchNumber).padStart(6, '0')}`,
        `Singapore nearby-place seed batch ${batchNumber + 1}`,
        JSON.stringify(payload),
        'signedprice-singapore-nearby-seed',
        rows[0]?.checkedAt ?? new Date(0).toISOString(),
      ]);
    },
    async verifyStage(sourceSha256) {
      const batches = await sql.query(`
        SELECT lines AS payload
        FROM nearby_place_seed_stage
        WHERE generation_sha256 = $1::char(64)
          AND building_key = 'singapore:seed-batch'
        ORDER BY provider_id
      `, [sourceSha256]);
      const rows = batches.flatMap(({ payload }) => Array.isArray(payload) ? payload : []);
      return Object.freeze({
        total: rows.length,
        digest: digest(rows.map((row) => `${row.building_key}:${row.kind}:${row.provider_id}`)),
      });
    },
    async publish(sourceSha256, expectedTotal) {
      const [upsertResult, pruneResult] = await sql.transaction((transaction) => [
        transaction.query(`
          WITH staged AS (
            SELECT row.*
            FROM nearby_place_seed_stage AS batch
            CROSS JOIN LATERAL jsonb_to_recordset(batch.lines) AS row(
              building_key text, kind text, provider_id text, name text,
              distance_meters integer, walking_minutes integer, latitude double precision,
              longitude double precision, lines jsonb, is_nearest boolean, source text,
              evidence_sha256 char(64), checked_at timestamptz
            )
            WHERE batch.generation_sha256 = $1::char(64)
              AND batch.building_key = 'singapore:seed-batch'
          ), changed AS (
            INSERT INTO nearby_places (
              building_key, kind, provider_id, name, distance_meters, walking_minutes,
              latitude, longitude, lines, is_nearest, source, evidence_sha256, checked_at
            )
            SELECT building_key, kind, provider_id, name, distance_meters, walking_minutes,
              latitude, longitude, lines, is_nearest, source, evidence_sha256, checked_at
            FROM staged
            ON CONFLICT (building_key, kind, provider_id) DO UPDATE SET
              name = excluded.name,
              distance_meters = excluded.distance_meters,
              walking_minutes = excluded.walking_minutes,
              latitude = excluded.latitude,
              longitude = excluded.longitude,
              lines = excluded.lines,
              is_nearest = excluded.is_nearest,
              source = excluded.source,
              evidence_sha256 = excluded.evidence_sha256,
              checked_at = excluded.checked_at,
              updated_at = now()
            WHERE (
              nearby_places.name, nearby_places.distance_meters, nearby_places.walking_minutes,
              nearby_places.latitude, nearby_places.longitude, nearby_places.lines,
              nearby_places.is_nearest, nearby_places.source,
              nearby_places.evidence_sha256, nearby_places.checked_at
            ) IS DISTINCT FROM (
              excluded.name, excluded.distance_meters, excluded.walking_minutes,
              excluded.latitude, excluded.longitude, excluded.lines,
              excluded.is_nearest, excluded.source,
              excluded.evidence_sha256, excluded.checked_at
            )
            RETURNING id
          )
          SELECT count(*)::text AS changed FROM changed
        `, [sourceSha256]),
        transaction.query(`
          WITH removed AS (
            DELETE FROM nearby_places AS place
            USING buildings AS building
            WHERE building.key = place.building_key
              AND building.market_key = 'singapore'
              AND (place.provider_id LIKE 'lta:station:%' OR place.provider_id LIKE 'moe:school:%')
              AND place.evidence_sha256 IS DISTINCT FROM $1::char(64)
            RETURNING place.id
          )
          SELECT count(*)::text AS changed FROM removed
        `, [sourceSha256]),
        transaction.query(`
          SELECT count(*)::text AS total,
            1 / CASE WHEN count(*) = $1::bigint THEN 1 ELSE 0 END AS integrity_guard
          FROM nearby_places AS place
          INNER JOIN buildings AS building ON building.key = place.building_key
          WHERE building.market_key = 'singapore'
            AND (place.provider_id LIKE 'lta:station:%' OR place.provider_id LIKE 'moe:school:%')
        `, [expectedTotal]),
        transaction.query('TRUNCATE nearby_place_seed_stage'),
      ]);
      return Object.freeze({
        upserted: parseCount(upsertResult[0]?.changed ?? '0'),
        pruned: parseCount(pruneResult[0]?.changed ?? '0'),
      });
    },
    async verify() {
      const rows = await sql.query(`
        SELECT place.building_key, place.kind, place.provider_id, place.evidence_sha256
        FROM nearby_places AS place
        INNER JOIN buildings AS building ON building.key = place.building_key
        WHERE building.market_key = 'singapore'
          AND (place.provider_id LIKE 'lta:station:%' OR place.provider_id LIKE 'moe:school:%')
        ORDER BY place.building_key, place.kind, place.provider_id
      `);
      const generations = new Set(rows.map((row) => String(row.evidence_sha256)));
      return Object.freeze({
        total: rows.length,
        digest: digest(rows.map((row) => `${row.building_key}:${row.kind}:${row.provider_id}`)),
        generationSha256: generations.size === 1 ? [...generations][0] : null,
      });
    },
  });
}

function parseArguments(argv) {
  const batch = argv.find((argument) => argument.startsWith('--batch-size='));
  return Object.freeze({
    dryRun: argv.includes('--dry-run'),
    verifyOnly: argv.includes('--verify-only'),
    batchSize: batch === undefined ? 500 : Number(batch.slice('--batch-size='.length)),
  });
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (process.argv.includes('--if-production') && process.env.VERCEL_ENV !== 'production') {
    process.stdout.write(`${JSON.stringify({ state: 'skipped', reason: 'not-production' })}\n`);
    return;
  }
  const seed = loadSingaporeNearbyPlaceSeed();
  if (options.dryRun) {
    process.stdout.write(`${JSON.stringify({ state: 'dry-run', summary: seed.summary })}\n`);
    return;
  }
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error('DATABASE_URL is required.');
  const result = await createSingaporeNearbyPlaceSeedRunner(databasePort(connectionString))
    .run({ batchSize: options.batchSize, verifyOnly: options.verifyOnly });
  process.stdout.write(`${JSON.stringify({ state: options.verifyOnly ? 'verified' : 'seeded', source: seed.summary, ...result })}\n`);
}

const entry = process.argv[1] === undefined ? null : pathToFileURL(process.argv[1]).href;
if (entry === import.meta.url) await main();
