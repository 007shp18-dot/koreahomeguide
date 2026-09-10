import 'server-only';
import type { SqlPort } from '../evidence-pool/repository.server';

export type DataQuality = {
  market: string; records: number; periodStart: string | null; periodEnd: string | null;
  entities: number; missingAddress: number; missingCoordinates: number; unverifiedIdentity: number;
  photoUnavailable: number; photoUnchecked: number; wards: number | null;
};

// Stored active evidence, not an assertion that every row is publicly released.
// Aggregate on demand in the authenticated operations screen only.
export const DATA_QUALITY_SQL = `WITH contracts AS (
  SELECT market_id, count(*)::integer AS records, min(observed_at)::text AS period_start,
    max(coalesce(period_end,observed_at))::text AS period_end
  FROM observations WHERE status='active' GROUP BY market_id
), entities AS (
  SELECT e.market_id, count(*)::integer AS entities,
    count(*) FILTER (WHERE nullif(trim(e.address_text),'') IS NULL)::integer AS missing_address,
    count(*) FILTER (WHERE e.latitude IS NULL OR e.longitude IS NULL)::integer AS missing_coordinates,
    count(*) FILTER (WHERE e.identity_status <> 'verified')::integer AS unverified_identity,
    count(*) FILTER (WHERE p.state='unavailable')::integer AS photo_unavailable,
    count(*) FILTER (WHERE p.entity_id IS NULL)::integer AS photo_unchecked
  FROM property_entities e LEFT JOIN building_photo_coverage p ON p.entity_id=e.id
  GROUP BY e.market_id
), japan AS (
  SELECT coalesce(sum(r.expected_count),0)::integer AS records,
    min(p.year::text || '-Q' || p.quarter::text) AS period_start,
    max(p.year::text || '-Q' || p.quarter::text) AS period_end,
    count(DISTINCT p.city)::integer AS wards
  FROM japan_area_publications p JOIN japan_area_releases r ON r.id=p.release_id
  WHERE r.state='published'
)
SELECT m.key AS market, coalesce(c.records,0) AS records, c.period_start,c.period_end,
  coalesce(e.entities,0) AS entities, coalesce(e.missing_address,0) AS missing_address,
  coalesce(e.missing_coordinates,0) AS missing_coordinates,
  coalesce(e.unverified_identity,0) AS unverified_identity,
  coalesce(e.photo_unavailable,0) AS photo_unavailable, coalesce(e.photo_unchecked,0) AS photo_unchecked,
  NULL::integer AS wards
FROM markets m LEFT JOIN contracts c ON c.market_id=m.key LEFT JOIN entities e ON e.market_id=m.key
WHERE m.key IN ('kr-seoul','sg-singapore','ae-dubai')
UNION ALL SELECT 'jp-tokyo',records,period_start,period_end,0,0,0,0,0,0,wards FROM japan`;

export async function dataQuality(sql: SqlPort): Promise<DataQuality[]> {
  return (await sql.query(DATA_QUALITY_SQL)).map(row => ({
    market: String(row.market), records: Number(row.records),
    periodStart: row.period_start == null ? null : String(row.period_start),
    periodEnd: row.period_end == null ? null : String(row.period_end),
    entities: Number(row.entities), missingAddress: Number(row.missing_address),
    missingCoordinates: Number(row.missing_coordinates), unverifiedIdentity: Number(row.unverified_identity),
    photoUnavailable: Number(row.photo_unavailable), photoUnchecked: Number(row.photo_unchecked),
    wards: row.wards == null ? null : Number(row.wards),
  }));
}
