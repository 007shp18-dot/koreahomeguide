
import 'server-only';

import dubaiProjectEvidence from '../../data/dubai-project-evidence.json';
import { TOKYO_CONDOMINIUM_TYPE, TOKYO_WARDS } from '../japan/query';
import { japanSqlPort } from '../japan/repository.server';
import { JAPAN_SOURCE } from '../japan/source.server';
import {
  rankDubaiProjects,
  rankTokyoTransactions,
  type DubaiProjectSnapshot,
  type RankedDubaiProject,
  type RankedTokyoTransaction,
  type TokyoTransactionSnapshot,
} from './top-ten';

const DLD_SOURCE_URL = 'https://dubailand.gov.ae/en/open-data/real-estate-data/';

type DubaiProjectEvidence = Readonly<{
  comparisonPeriod: Readonly<{ from: string; to: string }>;
  publicationMinimum: number;
  projects: readonly DubaiProjectSnapshot[];
}>;

const DUBAI_EVIDENCE = dubaiProjectEvidence as unknown as DubaiProjectEvidence;

export type DubaiTopTenResult = Readonly<{
  comparisonPeriod: Readonly<{ from: string; to: string }>;
  minimumSample: number;
  projectCount: number;
  sourceUrl: string;
  rows: readonly RankedDubaiProject[];
}>;

export function readDubaiTopTen(): DubaiTopTenResult {
  return {
    comparisonPeriod: DUBAI_EVIDENCE.comparisonPeriod,
    minimumSample: DUBAI_EVIDENCE.publicationMinimum,
    projectCount: DUBAI_EVIDENCE.projects.length,
    sourceUrl: DLD_SOURCE_URL,
    rows: rankDubaiProjects(DUBAI_EVIDENCE.projects, {
      minimumSample: DUBAI_EVIDENCE.publicationMinimum,
    }),
  };
}

const TOKYO_TOP_TEN_SQL = [
  "WITH common_period AS (",
  "  SELECT p.year, p.quarter",
  "  FROM japan_area_publications p",
  "  JOIN unnest($1::text[]) AS ward(city) ON ward.city = p.city",
  "  GROUP BY p.year, p.quarter",
  "  HAVING count(DISTINCT p.city) = $2::integer",
  "  ORDER BY p.year DESC, p.quarter DESC",
  "  LIMIT 1",
  "), published_releases AS (",
  "  SELECT p.city, p.year, p.quarter, p.release_id, r.source_url, r.retrieved_at",
  "  FROM japan_area_publications p",
  "  JOIN common_period c ON c.year = p.year AND c.quarter = p.quarter",
  "  JOIN japan_area_releases r ON r.id = p.release_id AND r.state = 'published'",
  "), ranked AS (",
  "  SELECT a.record->>'recordReference' AS record_reference,",
  "    a.record->>'type' AS type,",
  "    a.record->>'municipality' AS municipality,",
  "    a.record->>'district' AS district,",
  "    a.record->>'price' AS price_jpy,",
  "    a.record->>'areaSqm' AS area_sqm,",
  "    a.record->>'floorPlan' AS floor_plan,",
  "    a.record->>'buildingYear' AS building_year,",
  "    a.record->>'structure' AS structure,",
  "    a.record->>'period' AS period,",
  "    p.year, p.quarter, p.source_url, p.retrieved_at,",
  "    count(*) OVER ()::integer AS sample_count",
  "  FROM japan_area_records a",
  "  JOIN published_releases p ON p.release_id = a.release_id",
  "  WHERE a.record->>'type' = $3",
  "    AND NULLIF(a.record->>'price', '')::numeric > 0",
  "  ORDER BY NULLIF(a.record->>'price', '')::numeric DESC, a.record->>'recordReference'",
  "  LIMIT 10",
  ")",
  "SELECT * FROM ranked",
  "ORDER BY NULLIF(price_jpy, '')::numeric DESC, record_reference",
].join('\n');

export type TokyoTopTenResult = Readonly<{
  year: number;
  quarter: number;
  period: string;
  sampleCount: number;
  sourceUrl: string;
  retrievedAt: string;
  rows: readonly RankedTokyoTransaction[];
}>;

export async function readTokyoTopTen(
  port = japanSqlPort(true),
): Promise<TokyoTopTenResult | null> {
  if (port === null) return null;

  try {
    const wardCodes = TOKYO_WARDS.map(([code]) => code);
    const rows = await port.query(TOKYO_TOP_TEN_SQL, [
      wardCodes,
      wardCodes.length,
      TOKYO_CONDOMINIUM_TYPE,
    ]);
    if (rows.length === 0) return null;

    const transactions: TokyoTransactionSnapshot[] = rows.map((row) => ({
      recordReference: String(row.record_reference),
      type: String(row.type),
      municipality: String(row.municipality),
      district: String(row.district),
      price: Number(row.price_jpy),
      areaSqm: row.area_sqm === null || row.area_sqm === undefined ? null : Number(row.area_sqm),
      floorPlan: String(row.floor_plan),
      buildingYear: String(row.building_year),
      structure: String(row.structure),
      period: String(row.period),
    }));
    const first = rows[0]!;
    const retrievedAt = rows.reduce((latest, row) => {
      const value = String(row.retrieved_at);
      return value > latest ? value : latest;
    }, String(first.retrieved_at));

    return {
      year: Number(first.year),
      quarter: Number(first.quarter),
      period: transactions[0]?.period ?? 'Latest common quarter',
      sampleCount: Number(first.sample_count),
      sourceUrl: String(first.source_url || JAPAN_SOURCE),
      retrievedAt,
      rows: rankTokyoTransactions(transactions),
    };
  } catch {
    return null;
  }
}
