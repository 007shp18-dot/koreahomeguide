import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

import { propertySeedPage } from '@/scripts/property-seed-source.mjs';
import { SEED_PASSWORD } from './seed-password.generated';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TEST_HOST = 'ep-rapid-grass-b34p9oiz.c-4.ap-southeast-1.aws.neon.tech';
const TEST_ROLE = 'signedprice_seed_runner';
const CHUNK_SIZE = 1000;

type SeedItem = {
  legacyKey: string;
  legacyMarketKey: string;
  externalId: string;
  name: string;
  normalizedName: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  globalEntityId: string;
  globalMarketId: string;
  globalKind: string;
  geographyId: string;
  geographyKind: string;
  geographyName: string;
  geographyProviderCode: string;
  localSchemaVersion: string;
  localAttributes: Record<string, unknown>;
  externalSourceId: string;
  externalType: string;
};

function integer(value: string | null, fallback: number, maximum: number): number {
  if (value === null || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? Math.min(parsed, maximum) : fallback;
}

function compactRow(row: SeedItem) {
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
    geography_kind: row.geographyKind,
    geography_name: row.geographyName,
    geography_provider_code: row.geographyProviderCode,
    housing_sector: housingSector,
    local_schema_version: row.localSchemaVersion,
    local_attributes: row.localAttributes,
    external_source_id: row.externalSourceId,
    external_type: row.externalType,
  };
}

async function seedPage(sql: any, kind: string, offset: number) {
  const page = propertySeedPage(kind, offset, CHUNK_SIZE);
  if (page.items.length === 0) return { count: 0, total: page.total };
  const rows = (page.items as readonly SeedItem[]).map(compactRow);
  const geographies = [...new Map(rows.map((row) => [row.geography_id, {
    id: row.geography_id,
    market_id: row.global_market_id,
    kind: row.geography_kind,
    official_name: row.geography_name,
    provider_code: row.geography_provider_code,
  }])).values()];
  const payload = JSON.stringify(rows);
  const geographyPayload = JSON.stringify(geographies);
  await sql.transaction((tx: any) => [
    tx.query(`
      INSERT INTO markets (key, name, country_code)
      VALUES ('seoul', 'Seoul', 'KR'), ('singapore', 'Singapore', 'SG'),
             ('kr-seoul', 'Seoul', 'KR'), ('sg-singapore', 'Singapore', 'SG')
      ON CONFLICT (key) DO UPDATE SET name = excluded.name, country_code = excluded.country_code
      WHERE (markets.name, markets.country_code) IS DISTINCT FROM (excluded.name, excluded.country_code)
    `),
    tx.query(`
      INSERT INTO geographies (id, market_id, kind, official_name, provider_code)
      SELECT id, market_id, kind, official_name, provider_code
      FROM jsonb_to_recordset($1::jsonb) AS source(
        id text, market_id text, kind text, official_name text, provider_code text
      )
      ON CONFLICT (id) DO UPDATE SET
        market_id = excluded.market_id, kind = excluded.kind,
        official_name = excluded.official_name, provider_code = excluded.provider_code,
        updated_at = now()
      WHERE (geographies.market_id, geographies.kind, geographies.official_name, geographies.provider_code)
        IS DISTINCT FROM (excluded.market_id, excluded.kind, excluded.official_name, excluded.provider_code)
    `, [geographyPayload]),
    tx.query(`
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
        market_key = excluded.market_key, external_id = excluded.external_id,
        official_name = excluded.official_name, normalized_name = excluded.normalized_name,
        legal_address = excluded.legal_address, latitude = excluded.latitude,
        longitude = excluded.longitude, identity_status = 'verified', updated_at = now()
      WHERE (buildings.market_key, buildings.external_id, buildings.official_name,
        buildings.normalized_name, buildings.legal_address, buildings.latitude,
        buildings.longitude, buildings.identity_status)
      IS DISTINCT FROM (excluded.market_key, excluded.external_id, excluded.official_name,
        excluded.normalized_name, excluded.legal_address, excluded.latitude,
        excluded.longitude, excluded.identity_status)
    `, [payload]),
    tx.query(`
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
        market_id = excluded.market_id, geography_id = excluded.geography_id,
        kind = excluded.kind, canonical_name = excluded.canonical_name,
        normalized_name = excluded.normalized_name, address_text = excluded.address_text,
        latitude = excluded.latitude, longitude = excluded.longitude,
        housing_sector = excluded.housing_sector, identity_status = 'verified',
        local_attributes = excluded.local_attributes, local_schema_version = excluded.local_schema_version,
        updated_at = now()
      WHERE (property_entities.market_id, property_entities.geography_id,
        property_entities.kind, property_entities.canonical_name,
        property_entities.normalized_name, property_entities.address_text,
        property_entities.latitude, property_entities.longitude,
        property_entities.housing_sector, property_entities.identity_status,
        property_entities.local_attributes, property_entities.local_schema_version)
      IS DISTINCT FROM (excluded.market_id, excluded.geography_id, excluded.kind,
        excluded.canonical_name, excluded.normalized_name, excluded.address_text,
        excluded.latitude, excluded.longitude, excluded.housing_sector,
        excluded.identity_status, excluded.local_attributes, excluded.local_schema_version)
    `, [payload]),
    tx.query(`
      INSERT INTO external_identifiers (
        entity_id, source_id, external_type, external_value, match_confidence, match_method
      )
      SELECT entity_id, external_source_id, external_type, external_id, 1.0, 'signedprice-stable-id'
      FROM jsonb_to_recordset($1::jsonb) AS source(
        entity_id text, external_source_id text, external_type text, external_id text
      )
      ON CONFLICT (source_id, external_type, external_value) DO UPDATE SET
        entity_id = excluded.entity_id, match_confidence = 1.0,
        match_method = 'signedprice-stable-id', updated_at = now()
      WHERE external_identifiers.entity_id IS DISTINCT FROM excluded.entity_id
         OR external_identifiers.match_confidence IS DISTINCT FROM 1.0
         OR external_identifiers.match_method IS DISTINCT FROM 'signedprice-stable-id'
    `, [payload]),
  ]);
  return { count: page.items.length, total: page.total };
}

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV !== 'preview') {
    return new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  if (!SEED_PASSWORD) return NextResponse.json({ error: 'seed_runner_disabled' }, { status: 503 });
  const url = new URL(request.url);
  const kind = url.searchParams.get('kind') ?? 'seoul';
  const offset = integer(url.searchParams.get('offset'), 0, 100_000);
  const batches = Math.max(1, integer(url.searchParams.get('batches'), 5, 10));
  const connection = `postgresql://${TEST_ROLE}:${encodeURIComponent(SEED_PASSWORD)}@${TEST_HOST}/neondb?sslmode=require`;
  const sql = neon(connection);
  try {
    let seeded = 0;
    let total = 0;
    let cursor = offset;
    for (let index = 0; index < batches; index += 1) {
      const result = await seedPage(sql, kind, cursor);
      total = result.total;
      seeded += result.count;
      cursor += result.count;
      if (result.count < CHUNK_SIZE) break;
    }
    return NextResponse.json({ kind, offset, nextOffset: cursor, seeded, total }, {
      headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
    });
  } catch (error) {
    console.error('SignedPrice preview property seed failed.', error);
    return NextResponse.json({ error: 'seed_failed' }, { status: 500 });
  }
}
