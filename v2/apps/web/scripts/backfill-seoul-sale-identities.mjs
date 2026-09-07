import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { loadSeoulBuildingSeed } from './property-seed-source.mjs';

export function saleOnlyRows() {
  const inventory = JSON.parse(gunzipSync(readFileSync(new URL('../data/observed-building-inventory.json.gz', import.meta.url))));
  const existing = new Set(inventory.records.map(row => row.buildingId));
  return loadSeoulBuildingSeed().filter(row => !existing.has(row.externalId));
}

// Insert-only: never replace enriched addresses, coordinates, names or prior mappings.
export const backfillSql = `WITH source AS (
  SELECT * FROM jsonb_to_recordset($1::jsonb) AS row(
    "legacyKey" text, "externalId" text, name text, "normalizedName" text,
    address text, "globalEntityId" text, "geographyId" text,
    "geographyName" text, "geographyProviderCode" text, "localAttributes" jsonb
  )
), geo AS (
  INSERT INTO geographies (id, market_id, kind, official_name, provider_code)
  SELECT DISTINCT "geographyId", 'kr-seoul', 'neighborhood', "geographyName", "geographyProviderCode" FROM source
  ON CONFLICT (id) DO NOTHING RETURNING id
), buildings_added AS (
  INSERT INTO buildings (key, market_key, external_id, official_name, normalized_name, legal_address, identity_status)
  SELECT "legacyKey", 'seoul', "externalId", name, "normalizedName", address, 'verified' FROM source
  ON CONFLICT (key) DO NOTHING RETURNING key
), entities_added AS (
  INSERT INTO property_entities (id, market_id, geography_id, kind, canonical_name, normalized_name, address_text, identity_status, local_attributes, local_schema_version)
  SELECT "globalEntityId", 'kr-seoul', "geographyId", 'estate', name, "normalizedName", address, 'verified', "localAttributes", 'kr-property@1'
  FROM source CROSS JOIN (SELECT count(*) FROM geo) dependency
  ON CONFLICT (id) DO NOTHING RETURNING id
), identifiers_added AS (
  INSERT INTO external_identifiers (entity_id, source_id, external_type, external_value, match_confidence, match_method)
  SELECT "globalEntityId", 'signedprice-korea-building', 'building-id', "externalId", 1.0, 'signedprice-stable-id'
  FROM source CROSS JOIN (SELECT count(*) FROM entities_added) dependency
  ON CONFLICT (source_id, external_type, external_value) DO NOTHING RETURNING entity_id
)
SELECT (SELECT count(*) FROM buildings_added) AS buildings,
  (SELECT count(*) FROM entities_added) AS entities,
  (SELECT count(*) FROM identifiers_added) AS identifiers`;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rows = saleOnlyRows();
  if (!process.argv.includes('--apply')) console.log(JSON.stringify({ mode: 'dry-run', candidates: rows.length }));
  else {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required');
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    for (let offset = 0; offset < rows.length; offset += 500) {
      console.log(await sql.query(backfillSql, [JSON.stringify(rows.slice(offset, offset + 500))]));
    }
  }
}
