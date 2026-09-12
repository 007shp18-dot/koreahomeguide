import { CONTRACT_RANKING_SQL, type RankingOrder } from './contract-ranking-query';

export type RentCohort = { city: 'seoul' | 'singapore'; area: string; deposit: string; beds: string };
export const RENT_AREAS = {
 seoul: { '40-60': '40–60 m²', '60-85': '60–85 m²' },
 singapore: { '40-60': '40–60 m²', '60-90': '60–90 m²', '90-120': '90–120 m²' },
};
export function resolveRentCohort(city: 'seoul' | 'singapore', query: Record<string, string | string[] | undefined>): RentCohort {
 const area = typeof query.area === 'string' && Object.hasOwn(RENT_AREAS[city], query.area) ? query.area : city === 'seoul' ? '40-60' : '60-90';
 const deposit = typeof query.deposit === 'string' && ['under-100m','100-300m','300m-plus'].includes(query.deposit) ? query.deposit : '100-300m';
 const beds = typeof query.beds === 'string' && ['1','2','3'].includes(query.beds) ? query.beds : '2';
 return { city, area, deposit, beds };
}
export function rentCohortLabel(c: RentCohort) {
 const deposit = c.deposit === 'under-100m' ? 'deposit below ₩100 million' : c.deposit === '300m-plus' ? 'deposit ₩300 million or more' : 'deposit ₩100–300 million (upper limit excluded)';
 return `${c.area.replace('-','–')} m² · ${c.city === 'seoul' ? deposit : `${c.beds} bedrooms`}`;
}
export function regionalRentSql(input: RentCohort) {
 const c=resolveRentCohort(input.city,input);
 const area = c.city === 'seoul'
  ? c.area === '60-85' ? 'property_area_sqm > 60 AND property_area_sqm <= 85' : 'property_area_sqm > 40 AND property_area_sqm <= 60'
  : `local_attributes->>'areaRange' IN (${(c.area === '40-60' ? ['40-50','50-60'] : c.area === '90-120' ? ['90-100','100-110','110-120'] : ['60-70','70-80','80-90']).map(x=>`'${x}'`).join(',')}) AND bedrooms=${Number(c.beds)}`;
 const deposit = c.deposit === 'under-100m' ? 'deposit_minor >= 0 AND deposit_minor < 100000000' : c.deposit === '300m-plus' ? 'deposit_minor >= 300000000' : 'deposit_minor >= 100000000 AND deposit_minor < 300000000';
 const base = CONTRACT_RANKING_SQL.split('), ranked AS (')[0]!.replace("s.dataset_id IN ('kr-sale','kr-rent','sg-private-sale','sg-private-rent')", `s.dataset_id='${c.city === 'seoul' ? 'kr-rent' : 'sg-private-rent'}'`);
 return base + `), grouped AS (
 SELECT city, to_char(m.month,'YYYY-MM') AS month,
 CASE WHEN city='seoul' THEN entity_attributes->>'districtSlug' ELSE COALESCE(raw_metadata->>'district',entity_attributes->>'district') END AS region,
 count(*)::integer AS n,
 percentile_cont(0.5) WITHIN GROUP (ORDER BY recurring_amount_minor / CASE WHEN currency_code='SGD' THEN 100.0 ELSE 1 END) AS amount,
 percentile_cont(0.25) WITHIN GROUP (ORDER BY recurring_amount_minor / CASE WHEN currency_code='SGD' THEN 100.0 ELSE 1 END) AS p25,
 percentile_cont(0.75) WITHIN GROUP (ORDER BY recurring_amount_minor / CASE WHEN currency_code='SGD' THEN 100.0 ELSE 1 END) AS p75,
 percentile_cont(0.5) WITHIN GROUP (ORDER BY deposit_minor) AS median_deposit,
 max(fetched_at) AS source_as_of
 FROM eligible e JOIN months m ON e.dataset_id=m.dataset_id AND date_trunc('month',e.observed_at)=m.month
 WHERE e.dataset_id='${c.city === 'seoul' ? 'kr-rent' : 'sg-private-rent'}' AND (${area}) ${c.city === 'seoul' ? `AND ${deposit}` : ''}
 GROUP BY city,m.month,region HAVING count(*)>=10
 ) SELECT * FROM grouped WHERE region IS NOT NULL ORDER BY amount DESC,region`;
}
export type RegionalRentRow = { city: 'seoul' | 'singapore'; month: string; region: string; n: number; amount: number; p25: number; p75: number; median_deposit: number | null; source_as_of: string };
export function rankRegions(rows: RegionalRentRow[], order: RankingOrder) {
 const sorted=[...rows].sort((a,b)=>(order==='lowest'?a.amount-b.amount:b.amount-a.amount)||a.region.localeCompare(b.region));
 let rank=1;
 return sorted.map((row,i)=>{ if(i===0 || row.amount!==sorted[i-1]?.amount) rank=i+1; return {...row,rank}; });
}
export function regionName(row: RegionalRentRow) { return row.city === 'seoul' ? row.region.replace(/\b\w/g,c=>c.toUpperCase()) : `District ${row.region}`; }
