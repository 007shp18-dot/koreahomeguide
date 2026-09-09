import 'server-only';
import { unstable_cache } from 'next/cache';
import { japanSqlPort } from './repository.server';

export type TokyoAreaSummary = { city: string; year: string; quarter: string; municipality: string; district: string | null; count: number; median: number };
export const readTokyoAreaMapSummary = unstable_cache(async (city: string, year: string, quarter: string): Promise<TokyoAreaSummary[]> => {
  const port = japanSqlPort(true);
  if (!port) throw new Error('database_not_configured');
  const rows = await port.query(`/* japan:map-summary */
    WITH selected_periods AS (
      SELECT DISTINCT ON (p.city) p.* FROM japan_area_publications p
      ORDER BY p.city, (p.year = $2::integer AND p.quarter = $3::integer) DESC, p.year DESC, p.quarter DESC
    ), current_records AS (
      SELECT p.city, p.year, p.quarter, a.record->>'municipality' AS municipality, NULLIF(a.record->>'district', '') AS district,
        (a.record->>'price')::numeric AS price
      FROM selected_periods p JOIN japan_area_releases r ON r.id = p.release_id AND r.state = 'published'
      JOIN japan_area_records a ON a.release_id = r.id
    )
    SELECT city, year, quarter, municipality, CASE WHEN GROUPING(district) = 1 THEN NULL ELSE district END AS district,
      count(*)::integer AS count, percentile_cont(0.5) WITHIN GROUP (ORDER BY price) AS median
    FROM current_records
    GROUP BY GROUPING SETS ((city, year, quarter, municipality), (city, year, quarter, municipality, district))
    HAVING GROUPING(district) = 1 OR (city = $1 AND district IS NOT NULL)
    ORDER BY city, district NULLS FIRST`, [city, year, quarter]);
  return rows.map(row => ({ city: String(row.city), year: String(row.year), quarter: String(row.quarter), municipality: String(row.municipality), district: row.district == null ? null : String(row.district), count: Number(row.count), median: Number(row.median) }));
}, ['tokyo-area-map-v1'], { revalidate: 300 });
