import 'server-only';
import { unstable_cache } from 'next/cache';
import { publicContentDatabase } from '../db/postgres.server';
import { TOKYO_CONDOMINIUM_TYPE, TOKYO_WARDS } from '../japan/query';
import type { PassportMarketEvidence, PassportScope } from './model';

export const TOKYO_PASSPORT_SQL = `/* passport:tokyo-condominium */
  WITH latest AS (
    SELECT DISTINCT ON (p.city) p.city, p.year, p.quarter, p.release_id
    FROM japan_area_publications p JOIN japan_area_releases r ON r.id = p.release_id
    WHERE r.state = 'published' AND p.city = ANY($2::text[])
    ORDER BY p.city, p.year DESC, p.quarter DESC
  ), typed AS (
    SELECT l.*, a.record->>'district' AS neighbourhood,
      CASE WHEN jsonb_typeof(a.record->'price') = 'number' THEN (a.record->>'price')::numeric END AS price,
      CASE WHEN jsonb_typeof(a.record->'areaSqm') = 'number' THEN (a.record->>'areaSqm')::numeric END AS area
    FROM latest l JOIN japan_area_records a ON a.release_id = l.release_id
    WHERE a.record->>'type' = $1
  ), valid AS (
    SELECT * FROM typed WHERE price > 0 AND area > 0
  ), total AS (
    SELECT count(*) AS total_sample, percentile_cont(0.5) WITHIN GROUP (ORDER BY price / area) AS median_psm,
      min(year * 4 + quarter - 1) AS first_period, max(year * 4 + quarter - 1) AS last_period FROM valid
  ), neighbourhoods AS (
    SELECT city, year, quarter, neighbourhood, count(*) AS sample,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY price) AS median_price
    FROM valid WHERE length(trim(neighbourhood)) BETWEEN 1 AND 100
    GROUP BY city, year, quarter, neighbourhood
  ) SELECT total.*, n.* FROM total LEFT JOIN neighbourhoods n ON true
    ORDER BY n.city, n.neighbourhood`;

export function unavailableTokyoPassport(): PassportMarketEvidence {
  return { id: 'jp-tokyo', city: 'Tokyo', currency: 'JPY', localBudget: 0,
    medianPsm: null, sample: 0, period: 'Unavailable', scopes: [] };
}
const positive = (value: unknown) => typeof value === 'number' || typeof value === 'string'
  ? Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : null : null;
const quarterLabel = (period: number) => `${Math.floor(period / 4)} Q${period % 4 + 1}`;

export function normalizeTokyoPassport(rows: readonly Record<string, unknown>[]): PassportMarketEvidence {
  const first = rows[0];
  const sample = positive(first?.total_sample);
  const medianPsm = positive(first?.median_psm);
  if (!first || !sample || !Number.isSafeInteger(sample) || !medianPsm) throw new Error('tokyo_unavailable');
  const start = Number(first.first_period); const end = Number(first.last_period);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 2024 * 4 || end < start
    || end > new Date().getUTCFullYear() * 4 + 3) throw new Error('tokyo_invalid_period');
  const scopes: PassportScope[] = [];
  for (const row of rows) {
    if (row.city == null) continue;
    const ward = TOKYO_WARDS.find(([code]) => code === row.city);
    const year = Number(row.year); const quarter = Number(row.quarter);
    const count = positive(row.sample); const price = positive(row.median_price);
    const name = typeof row.neighbourhood === 'string' ? row.neighbourhood.trim() : '';
    if (!ward || !Number.isInteger(year) || !Number.isInteger(quarter) || quarter < 1 || quarter > 4
      || year * 4 + quarter - 1 < start || year * 4 + quarter - 1 > end
      || !count || !Number.isSafeInteger(count) || !price || !name || name.length > 100) throw new Error('tokyo_invalid_scope');
    const query = new URLSearchParams({ city: ward[0], year: String(year), quarter: String(quarter),
      neighbourhood: name, type: TOKYO_CONDOMINIUM_TYPE });
    scopes.push({ name, kind: 'neighbourhood', sample: count, medianPrice: price,
      neighborhoodName: name, locationLabel: `${ward[1]} · ${year} Q${quarter}`,
      href: `/jp/tokyo/?${query.toString()}` });
  }
  return { id: 'jp-tokyo', city: 'Tokyo', currency: 'JPY', localBudget: 0, medianPsm,
    sample, priceBasis: 'transactions', priceSample: sample,
    period: start === end ? quarterLabel(start) : `${quarterLabel(start)}–${quarterLabel(end)} · latest per ward`, scopes };
}

const cachedTokyoEvidence = unstable_cache(async () => {
  const sql = publicContentDatabase();
  if (!sql) throw new Error('tokyo_unavailable');
  // The public DB client aborts after three seconds. Cache only validated results;
  // errors remain retryable and never replace other cities' evidence.
  return normalizeTokyoPassport(await sql.query(TOKYO_PASSPORT_SQL,
    [TOKYO_CONDOMINIUM_TYPE, TOKYO_WARDS.map(([code]) => code)]));
}, ['passport-tokyo-condominium-v1'], { revalidate: 300 });

export async function tokyoPassportEvidence(): Promise<PassportMarketEvidence> {
  try { return await cachedTokyoEvidence(); }
  catch { return unavailableTokyoPassport(); }
}
