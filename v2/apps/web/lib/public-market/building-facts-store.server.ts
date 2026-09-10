import 'server-only';

import { contentDatabase, publicContentDatabase } from '../db/postgres.server';
import type { PublicEntityProximity } from '../public-data/entity-location-projection.server';
import type { ReportedNearbyPlace } from './reported-nearby-places';
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
  const apartmentSource = facts.source?.apartment ?? 'MOLIT K-apt apartment basic information';
  const registerSource = facts.source?.register
    ?? (facts.register === null ? null : 'MOLIT Building HUB building register');
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
      ${apartmentSource},
      ${registerSource},
      ${facts.match.kaptCode},
      ${facts.match.bjdCode},
      ${JSON.stringify(facts)}::jsonb
    FROM building_upsert
    ON CONFLICT (building_key) DO UPDATE SET
      apartment_source = excluded.apartment_source,
      register_source = excluded.register_source,
      kapt_code = excluded.kapt_code,
      bjd_code = excluded.bjd_code,
      payload = excluded.payload,
      checked_at = now(),
      updated_at = now()
  `;
}


/** Read the existing nearby-place store directly by an already verified identity.
 * This also covers legacy buildings not yet mapped into property_entities. */
export async function loadStoredBuildingProximity(identity: BuildingFactsIdentity): Promise<PublicEntityProximity | null> {
  const sql = publicContentDatabase();
  if (sql === null) return null;
  const rows = await sql`
    SELECT DISTINCT ON (kind) kind, provider_id, name, distance_meters, lines
    FROM nearby_places
    WHERE building_key = ${`seoul:${identity.buildingId}`}
      AND kind IN ('station', 'school') AND distance_meters IS NOT NULL
    ORDER BY kind, is_nearest DESC, distance_meters, provider_id
    LIMIT 2
  `;
  let nearestStation: PublicEntityProximity['nearestStation'] = null;
  let nearestSchool: PublicEntityProximity['nearestSchool'] = null;
  for (const row of rows) {
    if (row.distance_meters == null) continue;
    const distanceMeters = Number(row.distance_meters);
    if (!Number.isFinite(distanceMeters) || distanceMeters < 0 || typeof row.name !== 'string'
      || !row.name.trim() || typeof row.provider_id !== 'string') continue;
    if (row.kind === 'station' && nearestStation === null) nearestStation = {
      sourceId: row.provider_id, name: row.name, distanceMeters,
      lines: Array.isArray(row.lines) ? row.lines.filter((line): line is string => typeof line === 'string') : [],
    };
    if (row.kind === 'school' && nearestSchool === null) nearestSchool = { sourceId: row.provider_id, name: row.name, distanceMeters };
  }
  return nearestStation === null && nearestSchool === null ? null : {
    status: 'ready', coordinateStatus: 'ready', nearestStation, nearestSchool,
  };
}

/** K-apt names remain useful when no measured distance is available. The seed
 * records walking ranges as their upper bound, never an exact walking time. */
export async function loadStoredReportedNearby(identity: BuildingFactsIdentity): Promise<readonly ReportedNearbyPlace[]> {
  const sql = publicContentDatabase();
  if (sql === null) return [];
  const rows = await sql`
    SELECT kind, provider_id, name, lines, walking_minutes, source
    FROM nearby_places
    WHERE building_key = ${`seoul:${identity.buildingId}`}
      AND kind IN ('station', 'school') AND distance_meters IS NULL
      AND source = 'https://www.k-apt.go.kr/' AND provider_id LIKE 'kapt:%'
    ORDER BY kind, name, provider_id
    LIMIT 40
  `;
  return rows.flatMap((row): ReportedNearbyPlace[] => {
    if ((row.kind !== 'station' && row.kind !== 'school') || typeof row.name !== 'string'
      || !row.name.trim() || typeof row.provider_id !== 'string' || !row.provider_id.startsWith('kapt:')
      || row.source !== 'https://www.k-apt.go.kr/') return [];
    const minutes = row.walking_minutes == null ? null : Number(row.walking_minutes);
    return [{
      kind: row.kind, sourceId: row.provider_id, name: row.name.trim(), source: row.source,
      lines: Array.isArray(row.lines) ? row.lines.filter((line): line is string => typeof line === 'string' && Boolean(line.trim())) : [],
      walkingMinutesUpperBound: row.kind === 'station' && minutes !== null && Number.isInteger(minutes) && minutes > 0 ? minutes : null,
    }];
  });
}
