import { createHash } from 'node:crypto';

import { neon } from '@neondatabase/serverless';
import { loadPropertySeedRows } from './property-seed-source.mjs';

const argumentsSet = new Set(process.argv.slice(2));
const dryRun = argumentsSet.has('--dry-run');
const verifyOnly = argumentsSet.has('--verify-only');
const ifConfigured = argumentsSet.has('--if-configured');
const connectionString = process.env.DATABASE_URL?.trim();
const CHUNK_SIZE = 1000;

function stableDigest(values) {
  return createHash('sha256').update([...values].sort().join('\n')).digest('hex');
}

function chunks(values, size = CHUNK_SIZE) {
  const result = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

function uniqueBy(values, key) {
  const map = new Map();
  for (const value of values) map.set(key(value), value);
  return [...map.values()];
}

function compactRow(row) {
  const housingSector = row.localAttributes.housingSector === 'hdb'
    ? 'hdb'
    : row.localAttributes.housingSector === 'private_residential'
      ? 'private_residential'
      : null;
  return {
    legacy_key: row.legacyKey,
    legacy_market_key: row.legacyMarketKey,
    external_id: row.externalId,
    name: row.name,
    normalized_name: row.normalizedName,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    entity_id: row.globalEntityId,
    global_market_id: row.globalMarketId,
    entity_kind: row.globalKind,
    geography_id: row.geographyId,
    housing_sector: housingSector,
    local_schema_version: row.localSchemaVersion,
    local_attributes: row.localAttributes,
    external_source_id: row.externalSourceId,
    external_type: row.externalType,
  };
}

async function verify(sql, seed) {
  const legacyRows = await sql.query(`
    SELECT market_key, external_id
    FROM buildings
    WHERE (market_key = 'seoul' AND key LIKE 'seoul:%')
       OR (market_key = 'singapore' AND (key LIKE 'singapore:project:%' OR key LIKE 'singapore:block:%'))
    ORDER BY market_key, external_id
  `);
  const entityRows = await sql.query(`
    SELECT id
    FROM property_entities
    WHERE id LIKE 'kr-seoul:estate:%'
       OR id LIKE 'sg-singapore:project:%'
       OR id LIKE 'sg-singapore:block:%'
    ORDER BY id
  `);
  const legacyIds = legacyRows.map((row) => `${row.market_key}:${row.external_id}`);
  const entityIds = entityRows.map((row) => String(row.id));
  const database = {
    legacyCount: legacyIds.length,
    entityCount: entityIds.length,
    legacyIdDigest: stableDigest(legacyIds),
    entityIdDigest: stableDigest(entityIds),
  };
  const expected = {
    legacyCount: seed.summary.total,
    entityCount: seed.summary.total,
    legacyIdDigest: seed.summary.legacyIdDigest,
    entityIdDigest: seed.summary.entityIdDigest,
  };
  if (JSON.stringify(database) !== JSON.stringify(expected)) {
    throw new Error(`SignedPrice property seed verification failed: ${JSON.stringify({ expected, database })}`);
  }
  const [counts] = await sql.query(`
    SELECT
      count(*) FILTER (WHERE market_key = 'seoul' AND key LIKE 'seoul:%')::int AS seoul,
      count(*) FILTER (WHERE market_key = 'singapore' AND key LIKE 'singapore:project:%')::int AS singapore_private,
      count(*) FILTER (WHERE market_key = 'singapore' AND key LIKE 'singapore:block:%')::int AS singapore_hdb
    FROM buildings
  `);
  const sourceCounts = {
    seoul: seed.summary.seoul,
    singaporePrivate: seed.summary.singaporePrivate,
    singaporeHdb: seed.summary.singaporeHdb,
  };
  const databaseCounts = {
    seoul: Number(counts?.seoul ?? -1),
    singaporePrivate: Number(counts?.singapore_private ?? -1),
    singaporeHdb: Number(counts?.singapore_hdb ?? -1),
  };
  if (JSON.stringify(sourceCounts) !== JSON.stringify(databaseCounts)) {
    throw new Error(`SignedPrice property seed count verification failed: ${JSON.stringify({ sourceCounts, databaseCounts })}`);
  }
  return Object.freeze({ ...database, ...databaseCounts });
}

const seed = loadPropertySeedRows();
if (dryRun) {
  process.stdout.write(`${JSON.stringify({ state: 'dry-run', ...seed.summary })}\n`);
  process.exit(0);
}

if (!connectionString) {
  if (ifConfigured) {
    process.stdout.write('DATABASE_URL is not configured; SignedPrice property seed skipped.\n');
    process.exit(0);
  }
  throw new Error('DATABASE_URL is required.');
}

const sql = neon(connectionString);
if (!verifyOnly) {
  await sql.transaction((transaction) => [
    transaction.query(`
      INSERT INTO markets (key, name, country_code)
      VALUES ('seoul', 'Seoul', 'KR'), ('singapore', 'Singapore', 'SG'),
             ('kr-seoul', 'Seoul', 'KR'), ('sg-singapore', 'Singapore', 'SG')
      ON CONFLICT (key) DO UPDATE SET
        name = excluded.name,
        country_code = excluded.country_code,
        updated_at = CASE
          WHEN (markets.name, markets.country_code) IS DISTINCT FROM (excluded.name, excluded.country_code)
          THEN now() ELSE markets.updated_at END
    `),
  ]);

  const geographyRows = uniqueBy(seed.all, (row) => row.geographyId).map((row) => ({
    id: row.geographyId,
    market_id: row.globalMarketId,
    kind: row.geographyKind,
    official_name: row.geographyName,
    provider_code: row.geographyProviderCode,
  }));
  for (const batch of chunks(geographyRows)) {
    await sql.transaction((transaction) => [transaction.query(`
      INSERT INTO geographies (id, market_id, kind, official_name, provider_code)
      SELECT id, market_id, kind, official_name, provider_code
      FROM jsonb_to_recordset($1::jsonb) AS source(
        id text, market_id text, kind text, official_name text, provider_code text
      )
      ON CONFLICT (id) DO UPDATE SET
        market_id = excluded.market_id,
        kind = excluded.kind,
        official_name = excluded.official_name,
        provider_code = excluded.provider_code,
        updated_at = now()
      WHERE (geographies.market_id, geographies.kind, geographies.official_name, geographies.provider_code)
        IS DISTINCT FROM (excluded.market_id, excluded.kind, excluded.official_name, excluded.provider_code)
    `, [JSON.stringify(batch)])]);
  }

  for (const sourceBatch of chunks(seed.all)) {
    const batch = sourceBatch.map(compactRow);
    const payload = JSON.stringify(batch);
    await sql.transaction((transaction) => [
      transaction.query(`
        INSERT INTO buildings (
          key, market_key, external_id, official_name, normalized_name,
          legal_address, latitude, longitude, identity_status
        )
        SELECT legacy_key, legacy_market_key, external_id, name, normalized_name,
          address, latitude, longitude, 'verified'
        FROM jsonb_to_recordset($1::jsonb) AS source(
          legacy_key text, legacy_market_key text, external_id text, name text,
          normalized_name text, address text, latitude double precision, longitude double precision
        )
        ON CONFLICT (key) DO UPDATE SET
          market_key = excluded.market_key,
          external_id = excluded.external_id,
          official_name = excluded.official_name,
          normalized_name = excluded.normalized_name,
          legal_address = excluded.legal_address,
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          identity_status = 'verified',
          updated_at = now()
        WHERE (
          buildings.market_key, buildings.external_id, buildings.official_name,
          buildings.normalized_name, buildings.legal_address, buildings.latitude,
          buildings.longitude, buildings.identity_status
        ) IS DISTINCT FROM (
          excluded.market_key, excluded.external_id, excluded.official_name,
          excluded.normalized_name, excluded.legal_address, excluded.latitude,
          excluded.longitude, excluded.identity_status
        )
      `, [payload]),
      transaction.query(`
        INSERT INTO property_entities (
          id, market_id, geography_id, kind, canonical_name, normalized_name,
          address_text, latitude, longitude, housing_sector, identity_status,
          local_attributes, local_schema_version
        )
        SELECT entity_id, global_market_id, geography_id, entity_kind, name, normalized_name,
          address, latitude, longitude, housing_sector, 'verified', local_attributes, local_schema_version
        FROM jsonb_to_recordset($1::jsonb) AS source(
          entity_id text, global_market_id text, geography_id text, entity_kind text,
          name text, normalized_name text, address text, latitude double precision,
          longitude double precision, housing_sector text, local_attributes jsonb,
          local_schema_version text
        )
        ON CONFLICT (id) DO UPDATE SET
          market_id = excluded.market_id,
          geography_id = excluded.geography_id,
          kind = excluded.kind,
          canonical_name = excluded.canonical_name,
          normalized_name = excluded.normalized_name,
          address_text = excluded.address_text,
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          housing_sector = excluded.housing_sector,
          identity_status = 'verified',
          local_attributes = excluded.local_attributes,
          local_schema_version = excluded.local_schema_version,
          updated_at = now()
        WHERE (
          property_entities.market_id, property_entities.geography_id,
          property_entities.kind, property_entities.canonical_name,
          property_entities.normalized_name, property_entities.address_text,
          property_entities.latitude, property_entities.longitude,
          property_entities.housing_sector, property_entities.identity_status,
          property_entities.local_attributes, property_entities.local_schema_version
        ) IS DISTINCT FROM (
          excluded.market_id, excluded.geography_id, excluded.kind,
          excluded.canonical_name, excluded.normalized_name, excluded.address_text,
          excluded.latitude, excluded.longitude, excluded.housing_sector,
          excluded.identity_status, excluded.local_attributes, excluded.local_schema_version
        )
      `, [payload]),
      transaction.query(`
        INSERT INTO external_identifiers (
          entity_id, source_id, external_type, external_value,
          match_confidence, match_method
        )
        SELECT entity_id, external_source_id, external_type, external_id, 1.0, 'signedprice-stable-id'
        FROM jsonb_to_recordset($1::jsonb) AS source(
          entity_id text, external_source_id text, external_type text, external_id text
        )
        ON CONFLICT (source_id, external_type, external_value) DO UPDATE SET
          entity_id = excluded.entity_id,
          match_confidence = 1.0,
          match_method = 'signedprice-stable-id',
          updated_at = now()
        WHERE external_identifiers.entity_id IS DISTINCT FROM excluded.entity_id
           OR external_identifiers.match_confidence IS DISTINCT FROM 1.0
           OR external_identifiers.match_method IS DISTINCT FROM 'signedprice-stable-id'
      `, [payload]),
    ]);
  }
}

const verified = await verify(sql, seed);
process.stdout.write(`${JSON.stringify({ state: verifyOnly ? 'verified' : 'seeded', source: seed.summary, database: verified })}\n`);
