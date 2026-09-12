/** Shared by the website and editorial exports. Never rank building averages. */
export const CONTRACT_RANKING_SQL = `
WITH condo_projects AS (
 SELECT DISTINCT o.subject_entity_id FROM observations o
 JOIN source_records s ON s.id=o.source_record_id
 WHERE s.dataset_id='sg-private-sale' AND o.status IN ('active','corrected')
 AND s.raw_metadata->>'propertyType'='condominium'
), source_versions AS (
 SELECT o.*, s.dataset_id, s.business_key, s.raw_metadata,
 s.observed_at AS fetched_at, e.canonical_name AS name,
 e.local_attributes AS entity_attributes,
 row_number() OVER (PARTITION BY s.dataset_id,s.business_key ORDER BY s.observed_at DESC,o.updated_at DESC,o.id DESC) AS version
 FROM observations o JOIN source_records s ON s.id=o.source_record_id
 JOIN property_entities e ON e.id=o.subject_entity_id
 JOIN datasets d ON d.id=s.dataset_id JOIN rights_policies r ON r.id=d.rights_policy_id
 WHERE s.dataset_id IN ('kr-sale','kr-rent','sg-private-sale','sg-private-rent')
 AND r.can_display AND r.can_create_derived AND r.can_use_commercially AND r.can_index
), eligible AS (
 SELECT *, CASE WHEN dataset_id LIKE 'kr-%' THEN 'seoul' ELSE 'singapore' END AS city,
 CASE WHEN kind='sale' THEN amount_minor ELSE recurring_amount_minor END AS ranking_amount
 FROM source_versions
 WHERE version=1 AND status IN ('active','corrected')
 AND (kind <> 'sale' OR (
  name IS NOT NULL AND btrim(name) ~ '[A-Za-z가-힣]'
  AND regexp_replace(upper(btrim(name)), '[[:space:]()]', '', 'g') NOT IN
   ('다가구','다가구주택','단독','단독주택','공동주택','아파트','연립','다세대','다세대주택','빌라','미상','없음','건물명없음','기타','UNKNOWN','UNNAMED','N/A','APARTMENT','CONDOMINIUM','DETACHEDHOUSE')
 ))
 AND observed_at < date_trunc('month',CURRENT_DATE)
 AND (
  (dataset_id IN ('kr-sale','kr-rent') AND market_id='kr-seoul' AND currency_code='KRW'
   AND raw_metadata->>'sourceHousingType'='apartment'
   AND ((kind='sale' AND amount_minor>0) OR (kind='rent' AND recurring_amount_minor>0 AND deposit_minor IS NOT NULL)))
  OR (dataset_id='sg-private-sale' AND market_id='sg-singapore' AND currency_code='SGD'
   AND kind='sale' AND amount_minor>0 AND raw_metadata->>'propertyType'='condominium'
   AND COALESCE(local_attributes->>'units',raw_metadata->>'units')='1')
  OR (dataset_id='sg-private-rent' AND market_id='sg-singapore' AND currency_code='SGD'
   AND kind='rent' AND recurring_amount_minor>0 AND frequency='monthly'
   AND raw_metadata->>'propertyType'='Non-landed Properties'
   AND subject_entity_id IN (SELECT subject_entity_id FROM condo_projects))
 )
), months AS MATERIALIZED (
 SELECT dataset_id,date_trunc('month',max(observed_at)) AS month FROM eligible GROUP BY dataset_id
), ranked AS (
 SELECT e.*, rank() OVER (PARTITION BY e.dataset_id ORDER BY ranking_amount DESC) AS rank,
 row_number() OVER (PARTITION BY e.dataset_id ORDER BY ranking_amount DESC,observed_at DESC,id) AS position,
 count(*) OVER (PARTITION BY e.dataset_id) AS sample,
 max(fetched_at) OVER (PARTITION BY e.dataset_id) AS source_as_of
 FROM eligible e JOIN months m ON e.dataset_id=m.dataset_id AND date_trunc('month',e.observed_at)=m.month
)
SELECT dataset_id,city,kind,id::text,rank::integer,position::integer,sample::integer,name,
 to_char(observed_at,'YYYY-MM') AS month,source_as_of,
 CASE WHEN city='seoul' THEN to_char(observed_at,'YYYY-MM-DD') ELSE to_char(observed_at,'YYYY-MM') END AS contract_date,
 ranking_amount / CASE WHEN currency_code='SGD' THEN 100.0 ELSE 1 END AS amount,
 deposit_minor AS deposit,property_area_sqm AS area,
 local_attributes->>'areaRange' AS area_range,floor_value,floor_range,bedrooms,
 entity_attributes->>'districtSlug' AS district_slug,
 COALESCE(raw_metadata->>'district',entity_attributes->>'district') AS district,
 entity_attributes->>'marketSegment' AS segment,
 replace(replace(subject_entity_id,'kr-seoul:estate:',''),'sg-singapore:project:','') AS entity_id
FROM ranked WHERE position<=50 ORDER BY dataset_id,position
`;

export type RankingOrder = 'highest' | 'lowest';
export function contractRankingSql(order: RankingOrder = 'highest') {
 return order === 'lowest'
  ? CONTRACT_RANKING_SQL.replaceAll('ORDER BY ranking_amount DESC', 'ORDER BY ranking_amount ASC')
  : CONTRACT_RANKING_SQL;
}

export type ContractRankingRow = {
 dataset_id: string; city: 'seoul' | 'singapore'; kind: 'sale' | 'rent'; id: string;
 rank: number; position: number; sample: number; name: string; month: string; source_as_of: string | Date | number | null;
 contract_date: string; amount: string | number; deposit: string | number | null;
 area: string | number | null; area_range: string | null; floor_value: number | null;
 floor_range: string | null; bedrooms: number | null; district_slug: string | null;
 district: string | null; segment: string | null; entity_id: string;
};

export function formatRankingDate(value: unknown) {
 if (value instanceof Date) return value.toISOString().slice(0, 10);
 if (typeof value === 'string' || typeof value === 'number') return String(value).slice(0, 10);
 return '';
}

export function rankingHref(row: ContractRankingRow) {
 return row.city === 'seoul'
  ? `/kr/seoul/explore/${row.district_slug}/${row.entity_id}/`
  : `/sg/singapore/explore/${row.segment?.toLowerCase()}/${row.entity_id}/`;
}

export function rankingMoney(row: ContractRankingRow, value = row.amount) {
 return `${row.city === 'seoul' ? '₩' : 'S$'}${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function rankingMoneyCompact(row: ContractRankingRow, value = row.amount, deposit = false) {
 const amount = Number(value);
 if (row.city === 'seoul') {
  const divisor = row.kind === 'sale' && !deposit ? 1_000_000_000 : 1_000_000;
  const suffix = row.kind === 'sale' && !deposit ? 'bn' : 'm';
  return `₩${(amount / divisor).toLocaleString('en-US', { minimumFractionDigits: suffix === 'bn' ? 1 : 0, maximumFractionDigits: suffix === 'bn' ? 2 : 1 })}${suffix}`;
 }
 return row.kind === 'sale'
  ? `S$${(amount / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}m`
  : `S$${amount.toLocaleString('en-US')}`;
}
