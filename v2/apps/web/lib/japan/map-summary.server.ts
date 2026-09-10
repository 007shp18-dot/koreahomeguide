import 'server-only';
import { unstable_cache } from 'next/cache';
import { japanSqlPort, type JapanFilters } from './repository.server';
import { TOKYO_WARDS } from './query';

export type TokyoMapFilters = Pick<JapanFilters, 'q' | 'neighbourhood' | 'type' | 'minArea' | 'maxArea'>;
export type TokyoWardSummary = { city: string; count: number; medianPrice: number | null };

export async function readTokyoMapSummary(year: string, quarter: string, filters: TokyoMapFilters,
  port = japanSqlPort(true)): Promise<TokyoWardSummary[]> {
  if (!port) throw new Error('database_not_configured');
  // Aggregate only the selected quarter's activated releases. Never transfer
  // transaction rows to the map or calculate statistics from a paginated list.
  const rows = await port.query(`/* japan:map-summary */
    SELECT p.city, count(a.record)::integer AS count,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY (a.record->>'price')::numeric) AS median_price
    FROM japan_area_publications p
    JOIN japan_area_releases r ON r.id = p.release_id AND r.state = 'published'
    LEFT JOIN japan_area_records a ON a.release_id = r.id
      AND ($3 = '' OR concat_ws(' ', a.record->>'district', a.record->>'municipality', a.record->>'floorPlan', a.record->>'buildingYear') ILIKE '%' || $3 || '%')
      AND ($4 = '' OR a.record->>'type' = $4)
      AND ($5::numeric IS NULL OR (a.record->>'areaSqm')::numeric >= $5::numeric)
      AND ($6::numeric IS NULL OR (a.record->>'areaSqm')::numeric <= $6::numeric)
    WHERE p.year = $1::integer AND p.quarter = $2::integer AND p.city = ANY($7::text[])
    GROUP BY p.city ORDER BY p.city`,
  [year, quarter, filters.q, filters.type, filters.minArea, filters.maxArea, TOKYO_WARDS.map(([code]) => code)]);
  return rows.map(row => ({ city: String(row.city), count: Number(row.count),
    medianPrice: row.median_price == null ? null : Number(row.median_price) }));
}

export const readCachedTokyoMapSummary = unstable_cache(
  (year: string, quarter: string, filters: TokyoMapFilters) => readTokyoMapSummary(year, quarter, filters),
  ['jp-tokyo-map-summary-v1'], { revalidate: 60 });
