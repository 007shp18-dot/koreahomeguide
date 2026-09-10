import 'server-only';
import { createHash } from 'node:crypto';
import { japanSqlPort } from '../japan/repository.server';
import { TOKYO_CONDOMINIUM_TYPE, TOKYO_WARDS } from '../japan/query';
import { createPropertyScenarioHref } from '../tools/property-scenario-context';
import type { BudgetFilters, BudgetItem, BudgetResult } from './model';

// Aggregate in Postgres: no full transaction payload crosses into the browser.
// Each ward uses its latest activated quarter and retains that period in the card.
export async function tokyoBudget(filters: BudgetFilters, saved: string[], page: number, port = japanSqlPort(true)): Promise<BudgetResult | null> {
  if (!port) return null;
  const rows = await port.query(`/* japan:budget */
    WITH latest AS (
      SELECT DISTINCT ON (p.city) p.city, p.year, p.quarter, r.id, r.retrieved_at
      FROM japan_area_publications p JOIN japan_area_releases r ON r.id=p.release_id
      WHERE r.state='published' AND p.city=ANY($1::text[])
      ORDER BY p.city, p.year DESC, p.quarter DESC
    ), homes AS (
      SELECT l.*, a.record->>'district' AS district,
        (a.record->>'price')::numeric AS price, (a.record->>'areaSqm')::numeric AS area
      FROM latest l JOIN japan_area_records a ON a.release_id=l.id
      WHERE a.record->>'type'=$2 AND (a.record->>'price')::numeric>0
        AND (a.record->>'areaSqm')::numeric BETWEEN $3 AND $4
        AND coalesce(a.record->>'district','')<>''
    ) SELECT city, year, quarter, district, max(retrieved_at)::text AS updated,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY price)::float8 AS median,
      count(*)::integer AS count, md5(district) AS district_key
    FROM homes GROUP BY city,year,quarter,district ORDER BY city,district`,
  [TOKYO_WARDS.map(([code]) => code), TOKYO_CONDOMINIUM_TYPE, filters.minArea, filters.maxArea]);
  if (!rows.length) {
    const coverage = await port.query("SELECT 1 FROM japan_area_publications LIMIT 1");
    if (!coverage.length) return null;
  }
  const all: BudgetItem[] = rows.map(row => {
    const city = String(row.city), district = String(row.district), period = `${row.year} Q${row.quarter}`;
    const ward = TOKYO_WARDS.find(([code]) => code === city)?.[1] ?? city;
    const params = new URLSearchParams({city,year:String(row.year),quarter:String(row.quarter),neighbourhood:district,type:TOKYO_CONDOMINIUM_TYPE,minArea:String(filters.minArea),maxArea:String(filters.maxArea)});
    const evidenceHref = `/jp/tokyo/explore/?${params}`;
    return { key: `${city}/${row.district_key}`, name: `${district} · ${ward}`, region: ward,
      price: Number(row.median), count: Number(row.count), description: `${period} · ${filters.minArea}–${filters.maxArea} m² · pre-owned condominiums`, evidenceHref,
      checkHref: createPropertyScenarioHref({locale:'en',market:'jp-tokyo',currency:'JPY',price:Number(row.median),returnTo:evidenceHref}),
      signature: createHash('sha256').update(JSON.stringify([city,district,period,row.median,row.count,filters.minArea,filters.maxArea])).digest('hex') };
  });
  const items = all.filter(item => item.price <= filters.budget && (filters.region === 'all' || item.key.startsWith(`${filters.region}/`))).sort((a,b) => a.price-b.price || a.key.localeCompare(b.key));
  const pageSize = 24, actualPage = Math.min(page, Math.max(1,Math.ceil(items.length/pageSize)));
  const savedItems = all.filter(item => saved.includes(item.key));
  const periods = [...new Set(rows.map(row => `${row.year} Q${row.quarter}`))].sort();
  return { items:items.slice((actualPage-1)*pageSize,actualPage*pageSize), saved:savedItems, missing:saved.filter(key => !savedItems.some(item => item.key===key)), total:items.length,page:actualPage,pageSize,
    period:periods.join(' · ') || 'No matching records', updated:rows.map(row=>String(row.updated)).sort().at(-1) ?? '', source:'MLIT Real Estate Information Library · latest published quarter per ward', regions:TOKYO_WARDS.map(([value,label])=>({value,label})) };
}
