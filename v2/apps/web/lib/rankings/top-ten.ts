
export type DubaiProjectSnapshot = Readonly<{
  id: string;
  projectNumber: string;
  areaSlug: string;
  name: string;
  housing: string;
  stage: string;
  n: number;
  medianPriceAed: number;
  medianPricePerSqmAed: number;
}>;

export type RankedDubaiProject = DubaiProjectSnapshot & Readonly<{ rank: number }>;

export type TokyoTransactionSnapshot = Readonly<{
  recordReference: string;
  type: string;
  municipality: string;
  district: string;
  price: number;
  areaSqm: number | null;
  floorPlan: string;
  buildingYear: string;
  structure: string;
  period: string;
}>;

export type RankedTokyoTransaction = TokyoTransactionSnapshot & Readonly<{ rank: number }>;

export type TopTenRankingOptions = Readonly<{
  limit?: number;
  minimumSample?: number;
}>;

export function rankDubaiProjects(
  rows: readonly DubaiProjectSnapshot[],
  options: TopTenRankingOptions = {},
): RankedDubaiProject[] {
  const minimumSample = options.minimumSample ?? 30;
  const limit = options.limit ?? 10;

  return rows
    .filter((row) => Number.isInteger(row.n)
      && row.n >= minimumSample
      && Number.isFinite(row.medianPriceAed)
      && row.medianPriceAed > 0)
    .slice()
    .sort((left, right) => right.medianPriceAed - left.medianPriceAed
      || left.name.localeCompare(right.name, 'en')
      || left.id.localeCompare(right.id, 'en'))
    .slice(0, limit)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function rankTokyoTransactions(
  rows: readonly TokyoTransactionSnapshot[],
  options: TopTenRankingOptions = {},
): RankedTokyoTransaction[] {
  const limit = options.limit ?? 10;

  return rows
    .filter((row) => row.type === 'Pre-owned Condominiums, etc.'
      && Number.isFinite(row.price)
      && row.price > 0)
    .slice()
    .sort((left, right) => right.price - left.price
      || left.recordReference.localeCompare(right.recordReference, 'en'))
    .slice(0, limit)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}
