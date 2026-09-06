import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

import { neon } from '@neondatabase/serverless';
import { loadKaptNearbyPlaceSeed } from './kapt-nearby-place-source.mjs';

function digest(values) {
  return createHash('sha256').update([...values].sort().join('\n')).digest('hex');
}

function chunks(rows, size) {
  const output = [];
  for (let offset = 0; offset < rows.length; offset += size) output.push(rows.slice(offset, offset + size));
  return output;
}

export function createKaptNearbyPlaceSeedRunner(port, loadSeed = loadKaptNearbyPlaceSeed) {
  return Object.freeze({
    async run({ batchSize = 500, verifyOnly = false } = {}) {
      if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 1_000) {
        throw new RangeError('K-apt nearby-place batch size must be between 1 and 1000.');
      }
      const seed = loadSeed();
      if (seed.rows.some((row) => !row.buildingKey.startsWith('seoul:')
        || !['station', 'school'].includes(row.kind)
        || !row.providerId.startsWith('kapt:'))) {
        throw new RangeError('K-apt nearby-place seed scope is limited to Seoul.');
      }
      let changed = 0;
      if (!verifyOnly) {
        for (const batch of chunks(seed.rows, batchSize)) changed += await port.upsert(batch);
      }
      const verification = await port.verify(seed.summary);
      if (verification.total !== seed.summary.total || verification.digest !== seed.summary.digest) {
        throw new Error('K-apt nearby-place seed verification mismatch.');
      }
      return Object.freeze({ changed, verification });
    },
  });
}

function parseCount(value) {
  const count = typeof value === 'string' ? Number(value) : value;
  if (!Number.isSafeInteger(count) || count < 0) throw new TypeError('Invalid K-apt nearby-place count.');
  return count;
}

function databasePort(connectionString) {
  const sql = neon(connectionString);
  return Object.freeze({
    async upsert(rows) {
      const [result] = await sql.query(`
        WITH changed AS (
          INSERT INTO nearby_places (
            building_key, kind, provider_id, name, distance_meters, walking_minutes,
            latitude, longitude, lines, is_nearest, source, evidence_sha256, checked_at
          )
          SELECT building_key, kind, provider_id, name, distance_meters, walking_minutes,
            latitude, longitude, lines, is_nearest, source, evidence_sha256, checked_at
          FROM jsonb_to_recordset($1::jsonb) AS row(
            building_key text, kind text, provider_id text, name text,
            distance_meters integer, walking_minutes integer, latitude double precision,
            longitude double precision, lines jsonb, is_nearest boolean, source text,
            evidence_sha256 char(64), checked_at timestamptz
          )
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
      `, [JSON.stringify(rows.map((row) => ({
        building_key: row.buildingKey, kind: row.kind, provider_id: row.providerId,
        name: row.name, distance_meters: row.distanceMeters,
        walking_minutes: row.walkingMinutes, latitude: row.latitude,
        longitude: row.longitude, lines: row.lines, is_nearest: row.isNearest,
        source: row.source, evidence_sha256: row.evidenceSha256,
        checked_at: row.checkedAt,
      })))]);
      return parseCount(result?.changed ?? '0');
    },
    async verify() {
      const rows = await sql.query(`
        SELECT place.building_key, place.kind, place.provider_id
        FROM nearby_places AS place
        INNER JOIN buildings AS building ON building.key = place.building_key
        WHERE place.provider_id LIKE 'kapt:%'
          AND building.market_key = 'seoul'
        ORDER BY place.building_key, place.kind, place.provider_id
      `);
      return Object.freeze({
        total: rows.length,
        digest: digest(rows.map((row) => `${row.building_key}:${row.kind}:${row.provider_id}`)),
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
  const seed = loadKaptNearbyPlaceSeed();
  if (options.dryRun) {
    process.stdout.write(`${JSON.stringify({ state: 'dry-run', summary: seed.summary })}\n`);
    return;
  }
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error('DATABASE_URL is required.');
  const result = await createKaptNearbyPlaceSeedRunner(databasePort(connectionString))
    .run({ batchSize: options.batchSize, verifyOnly: options.verifyOnly });
  process.stdout.write(`${JSON.stringify({ state: options.verifyOnly ? 'verified' : 'seeded', ...result })}\n`);
}

const entry = process.argv[1] === undefined ? null : pathToFileURL(process.argv[1]).href;
if (entry === import.meta.url) await main();
