import 'server-only';

import { contentDatabase } from '../db/postgres.server';
import type { OfficialBuildingFacts } from './official-building-facts.server';

export type BuildingFactsIdentity = Readonly<{
  districtSlug: string;
  buildingId: string;
  districtLawdCd: string;
  neighborhoodName: string;
  officialName: string;
  housingType: string;
}>;

function isReadyFacts(value: unknown): value is Extract<OfficialBuildingFacts, { status: 'ready' }> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const source = value as Record<string, unknown>;
  if (source.status !== 'ready' || typeof source.match !== 'object' || source.match === null
    || typeof source.apartment !== 'object' || source.apartment === null) return false;
  const match = source.match as Record<string, unknown>;
  const apartment = source.apartment as Record<string, unknown>;
  return typeof match.kaptCode === 'string' && typeof match.bjdCode === 'string'
    && typeof apartment.name === 'string' && typeof apartment.legalAddress === 'string';
}

function keys(identity: BuildingFactsIdentity) {
  return Object.freeze({
    marketKey: 'seoul',
    districtKey: `seoul:${identity.districtSlug}`,
    buildingKey: `seoul:${identity.buildingId}`,
  });
}

export async function loadStoredBuildingFacts(identity: BuildingFactsIdentity): Promise<OfficialBuildingFacts | null> {
  const sql = contentDatabase();
  if (sql === null) return null;
  const { buildingKey } = keys(identity);
  const [row] = await sql`
    SELECT payload
    FROM building_facts
    WHERE building_key = ${buildingKey}
      AND checked_at >= now() - interval '30 days'
    LIMIT 1
  `;
  return isReadyFacts(row?.payload) ? Object.freeze(row.payload) : null;
}

export async function storeBuildingFacts(
  identity: BuildingFactsIdentity,
  facts: Extract<OfficialBuildingFacts, { status: 'ready' }>,
): Promise<void> {
  const sql = contentDatabase();
  if (sql === null) return;
  const { marketKey, districtKey, buildingKey } = keys(identity);
  const normalizedName = identity.officialName.normalize('NFKC').toLocaleLowerCase('ko-KR')
    .replace(/[^\p{L}\p{N}]+/gu, '');
  await sql`
    WITH market_upsert AS (
      INSERT INTO markets (key, name, country_code)
      VALUES (${marketKey}, 'Seoul', 'KR')
      ON CONFLICT (key) DO UPDATE SET updated_at = now()
      RETURNING key
    ), district_upsert AS (
      INSERT INTO districts (key, market_key, name, lawd_code)
      SELECT ${districtKey}, market_upsert.key, ${identity.districtSlug}, ${identity.districtLawdCd}
      FROM market_upsert
      ON CONFLICT (key) DO UPDATE SET
        lawd_code = excluded.lawd_code,
        updated_at = now()
      RETURNING key, market_key
    ), building_upsert AS (
      INSERT INTO buildings (
        key, market_key, district_key, external_id, official_name, normalized_name,
        legal_address, road_address, identity_status
      )
      SELECT
        ${buildingKey}, district_upsert.market_key, district_upsert.key, ${identity.buildingId},
        ${identity.officialName}, ${normalizedName}, ${facts.apartment.legalAddress},
        ${facts.apartment.roadAddress}, 'verified'
      FROM district_upsert
      ON CONFLICT (key) DO UPDATE SET
        district_key = excluded.district_key,
        official_name = excluded.official_name,
        normalized_name = excluded.normalized_name,
        legal_address = excluded.legal_address,
        road_address = excluded.road_address,
        identity_status = 'verified',
        updated_at = now()
      RETURNING key
    )
    INSERT INTO building_facts (
      building_key, apartment_source, register_source, kapt_code, bjd_code, payload
    )
    SELECT
      building_upsert.key,
      'MOLIT K-apt apartment basic information',
      'MOLIT Building HUB building register',
      ${facts.match.kaptCode},
      ${facts.match.bjdCode},
      ${JSON.stringify(facts)}::jsonb
    FROM building_upsert
    ON CONFLICT (building_key) DO UPDATE SET
      kapt_code = excluded.kapt_code,
      bjd_code = excluded.bjd_code,
      payload = excluded.payload,
      checked_at = now(),
      updated_at = now()
  `;
}

