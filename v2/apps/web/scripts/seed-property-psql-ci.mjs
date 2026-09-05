import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadPropertySeedRows } from './property-seed-source.mjs';

const BRANCH = 'codex/signedprice-db-seed-run';
const DATABASE_URL = 'postgresql://signedprice_seed_runner@ep-rapid-grass-b34p9oiz.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const CHUNK_SIZE = 1000;

if (process.env.GITHUB_ACTIONS !== 'true' || process.env.GITHUB_REF_NAME !== BRANCH) {
  process.stdout.write(`${JSON.stringify({ state: 'skipped', reason: 'temporary-ci-branch-only' })}\n`);
  process.exit(0);
}

function literalJson(value) {
  return `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
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

function buildSeedSql(seed) {
  const statements = [
    'BEGIN;',
    `INSERT INTO markets (key, name, country_code)\nVALUES ('seoul','Seoul','KR'),('singapore','Singapore','SG'),('kr-seoul','Seoul','KR'),('sg-singapore','Singapore','SG')\nON CONFLICT (key) DO UPDATE SET name=excluded.name,country_code=excluded.country_code,updated_at=CASE WHEN (markets.name,markets.country_code) IS DISTINCT FROM (excluded.name,excluded.country_code) THEN now() ELSE markets.updated_at END;`,
  ];
  const geographyRows = [...new Map(seed.all.map((row) => [row.geographyId, {
    id: row.geographyId,
    market_id: row.globalMarketId,
    kind: row.geographyKind,
    official_name: row.geographyName,
    provider_code: row.geographyProviderCode,
  }])).values()];
  statements.push(`INSERT INTO geographies (id,market_id,kind,official_name,provider_code)\nSELECT id,market_id,kind,official_name,provider_code FROM jsonb_to_recordset(${literalJson(geographyRows)}) AS source(id text,market_id text,kind text,official_name text,provider_code text)\nON CONFLICT (id) DO UPDATE SET market_id=excluded.market_id,kind=excluded.kind,official_name=excluded.official_name,provider_code=excluded.provider_code,updated_at=now()\nWHERE (geographies.market_id,geographies.kind,geographies.official_name,geographies.provider_code) IS DISTINCT FROM (excluded.market_id,excluded.kind,excluded.official_name,excluded.provider_code);`);

  for (let offset = 0; offset < seed.all.length; offset += CHUNK_SIZE) {
    const payload = seed.all.slice(offset, offset + CHUNK_SIZE).map(compactRow);
    const json = literalJson(payload);
    statements.push(`INSERT INTO buildings (key,market_key,external_id,official_name,normalized_name,legal_address,latitude,longitude,identity_status)\nSELECT legacy_key,legacy_market_key,external_id,name,normalized_name,address,latitude,longitude,'verified' FROM jsonb_to_recordset(${json}) AS source(legacy_key text,legacy_market_key text,external_id text,name text,normalized_name text,address text,latitude double precision,longitude double precision)\nON CONFLICT (key) DO UPDATE SET market_key=excluded.market_key,external_id=excluded.external_id,official_name=excluded.official_name,normalized_name=excluded.normalized_name,legal_address=excluded.legal_address,latitude=excluded.latitude,longitude=excluded.longitude,identity_status='verified',updated_at=now()\nWHERE (buildings.market_key,buildings.external_id,buildings.official_name,buildings.normalized_name,buildings.legal_address,buildings.latitude,buildings.longitude,buildings.identity_status) IS DISTINCT FROM (excluded.market_key,excluded.external_id,excluded.official_name,excluded.normalized_name,excluded.legal_address,excluded.latitude,excluded.longitude,excluded.identity_status);`);
    statements.push(`INSERT INTO property_entities (id,market_id,geography_id,kind,canonical_name,normalized_name,address_text,latitude,longitude,housing_sector,identity_status,local_attributes,local_schema_version)\nSELECT entity_id,global_market_id,geography_id,entity_kind,name,normalized_name,address,latitude,longitude,housing_sector,'verified',local_attributes,local_schema_version FROM jsonb_to_recordset(${json}) AS source(entity_id text,global_market_id text,geography_id text,entity_kind text,name text,normalized_name text,address text,latitude double precision,longitude double precision,housing_sector text,local_attributes jsonb,local_schema_version text)\nON CONFLICT (id) DO UPDATE SET market_id=excluded.market_id,geography_id=excluded.geography_id,kind=excluded.kind,canonical_name=excluded.canonical_name,normalized_name=excluded.normalized_name,address_text=excluded.address_text,latitude=excluded.latitude,longitude=excluded.longitude,housing_sector=excluded.housing_sector,identity_status='verified',local_attributes=excluded.local_attributes,local_schema_version=excluded.local_schema_version,updated_at=now()\nWHERE (property_entities.market_id,property_entities.geography_id,property_entities.kind,property_entities.canonical_name,property_entities.normalized_name,property_entities.address_text,property_entities.latitude,property_entities.longitude,property_entities.housing_sector,property_entities.identity_status,property_entities.local_attributes,property_entities.local_schema_version) IS DISTINCT FROM (excluded.market_id,excluded.geography_id,excluded.kind,excluded.canonical_name,excluded.normalized_name,excluded.address_text,excluded.latitude,excluded.longitude,excluded.housing_sector,excluded.identity_status,excluded.local_attributes,excluded.local_schema_version);`);
    statements.push(`INSERT INTO external_identifiers (entity_id,source_id,external_type,external_value,match_confidence,match_method)\nSELECT entity_id,external_source_id,external_type,external_id,1.0,'signedprice-stable-id' FROM jsonb_to_recordset(${json}) AS source(entity_id text,external_source_id text,external_type text,external_id text)\nON CONFLICT (source_id,external_type,external_value) DO UPDATE SET entity_id=excluded.entity_id,match_confidence=1.0,match_method='signedprice-stable-id',updated_at=now()\nWHERE external_identifiers.entity_id IS DISTINCT FROM excluded.entity_id OR external_identifiers.match_confidence IS DISTINCT FROM 1.0 OR external_identifiers.match_method IS DISTINCT FROM 'signedprice-stable-id';`);
  }
  statements.push('COMMIT;');
  return statements.join('\n');
}

function psql(args, options = {}) {
  return execFileSync('psql', [DATABASE_URL, '-X', '-v', 'ON_ERROR_STOP=1', ...args], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    ...options,
  });
}

function snapshot() {
  const output = psql(['-At', '-F', '|', '-c', `WITH legacy AS (SELECT market_key,external_id FROM buildings WHERE (market_key='seoul' AND key LIKE 'seoul:%') OR (market_key='singapore' AND (key LIKE 'singapore:project:%' OR key LIKE 'singapore:block:%'))), entities AS (SELECT id FROM property_entities WHERE id LIKE 'kr-seoul:estate:%' OR id LIKE 'sg-singapore:project:%' OR id LIKE 'sg-singapore:block:%') SELECT (SELECT count(*) FROM legacy),(SELECT count(*) FROM entities),(SELECT count(*) FROM external_identifiers WHERE match_method='signedprice-stable-id'),(SELECT count(*) FROM buildings WHERE market_key='seoul' AND key LIKE 'seoul:%'),(SELECT count(*) FROM buildings WHERE market_key='singapore' AND key LIKE 'singapore:project:%'),(SELECT count(*) FROM buildings WHERE market_key='singapore' AND key LIKE 'singapore:block:%'),(SELECT encode(digest(string_agg(market_key||':'||external_id,E'\\n' ORDER BY (market_key||':'||external_id) COLLATE \"C\"),'sha256'),'hex') FROM legacy),(SELECT encode(digest(string_agg(id,E'\\n' ORDER BY id COLLATE \"C\"),'sha256'),'hex') FROM entities),(SELECT count(*) FROM buildings WHERE market_key='dubai' OR key LIKE 'dubai:%'),(SELECT count(*) FROM property_entities WHERE market_id='ae-dubai'),(SELECT to_char(max(updated_at) AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US') FROM buildings WHERE market_key IN ('seoul','singapore')),(SELECT to_char(max(updated_at) AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US') FROM property_entities WHERE market_id IN ('kr-seoul','sg-singapore'));`]).trim();
  const [legacyCount, entityCount, identifierCount, seoul, privateCount, hdb, legacyDigest, entityDigest, dubaiLegacy, dubaiGlobal, buildingUpdated, entityUpdated] = output.split('|');
  return { legacyCount: Number(legacyCount), entityCount: Number(entityCount), identifierCount: Number(identifierCount), seoul: Number(seoul), singaporePrivate: Number(privateCount), singaporeHdb: Number(hdb), legacyDigest, entityDigest, dubaiLegacy: Number(dubaiLegacy), dubaiGlobal: Number(dubaiGlobal), buildingUpdated, entityUpdated };
}

const seed = loadPropertySeedRows();
const directory = mkdtempSync(join(tmpdir(), 'signedprice-seed-'));
const sqlPath = join(directory, 'seed.sql');
try {
  execFileSync('psql', ['--version'], { encoding: 'utf8' });
  writeFileSync(sqlPath, buildSeedSql(seed), 'utf8');
  psql(['-q', '-f', sqlPath]);
  const first = snapshot();
  psql(['-q', '-f', sqlPath]);
  const second = snapshot();
  const expected = {
    legacyCount: seed.summary.total,
    entityCount: seed.summary.total,
    identifierCount: seed.summary.total,
    seoul: seed.summary.seoul,
    singaporePrivate: seed.summary.singaporePrivate,
    singaporeHdb: seed.summary.singaporeHdb,
    legacyDigest: seed.summary.legacyIdDigest,
    entityDigest: seed.summary.entityIdDigest,
    dubaiLegacy: 0,
    dubaiGlobal: 0,
  };
  for (const [key, value] of Object.entries(expected)) {
    if (first[key] !== value || second[key] !== value) throw new Error(`seed_verification_failed:${key}`);
  }
  if (first.buildingUpdated !== second.buildingUpdated || first.entityUpdated !== second.entityUpdated) {
    throw new Error('seed_idempotency_failed:updated_at_changed');
  }
  process.stdout.write(`${JSON.stringify({ state: 'verified', source: seed.summary, first, second })}\n`);
} finally {
  rmSync(directory, { recursive: true, force: true });
}
