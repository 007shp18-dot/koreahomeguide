import 'server-only';
import { unstable_cache } from 'next/cache';
import { japanSqlPort } from './repository.server';
import { TOKYO_CONDOMINIUM_TYPE } from './query';
import type { TokyoPriceDistribution } from './price-check';

export type TokyoPriceCohort = { city: string; year: string; quarter: string; neighbourhood: string; minArea: number; maxArea: number };
export type TokyoPriceEvidence = TokyoPriceDistribution & { retrievedAt: string | null };

export async function readTokyoPriceEvidence(cohort: TokyoPriceCohort, port = japanSqlPort(true)): Promise<TokyoPriceEvidence> {
  if (!port) throw new Error('database_not_configured');
  const rows = await port.query(`/* japan:asking-price-cohort */
    SELECT count(*)::integer AS count,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY (a.record->>'price')::numeric / (a.record->>'areaSqm')::numeric) AS median,
      percentile_cont(0.25) WITHIN GROUP (ORDER BY (a.record->>'price')::numeric / (a.record->>'areaSqm')::numeric) AS lower,
      percentile_cont(0.75) WITHIN GROUP (ORDER BY (a.record->>'price')::numeric / (a.record->>'areaSqm')::numeric) AS upper,
      max(r.retrieved_at)::text AS retrieved_at
    FROM japan_area_publications p
    JOIN japan_area_releases r ON r.id = p.release_id AND r.state = 'published'
    JOIN japan_area_records a ON a.release_id = r.id
    WHERE p.city = $1 AND p.year = $2::integer AND p.quarter = $3::integer
      AND ($4 = '' OR a.record->>'district' = $4)
      AND (a.record->>'areaSqm')::numeric BETWEEN $5::numeric AND $6::numeric
      AND (a.record->>'areaSqm')::numeric > 0 AND (a.record->>'price')::numeric > 0
      AND a.record->>'type' = $7`,
  [cohort.city, cohort.year, cohort.quarter, cohort.neighbourhood, cohort.minArea, cohort.maxArea, TOKYO_CONDOMINIUM_TYPE]);
  const row = rows[0];
  return { count: Number(row?.count ?? 0), median: row?.median == null ? null : Number(row.median),
    lower: row?.lower == null ? null : Number(row.lower), upper: row?.upper == null ? null : Number(row.upper),
    retrievedAt: row?.retrieved_at == null ? null : String(row.retrieved_at) };
}

// Asking prices never enter the cache key: the published cohort is shared.
export const readCachedTokyoPriceEvidence = unstable_cache(readTokyoPriceEvidence, ['tokyo-price-cohort-v1'], { revalidate: 300 });
