/** A quote expressed in the source market's native monetary unit. */
export type RentQuote<
  TRequestedHousingType extends string = string,
  TSourceHousingType extends string = string,
> = {
  readonly requestedHousingType: TRequestedHousingType;
  readonly sourceHousingType: TSourceHousingType;
  readonly deposit: number;
  readonly monthlyRent: number;
  readonly areaSqm: number;
};

/** A source contract suitable for use as a rent comparison. */
export type ComparableRentContract<TContractType extends string = string> = {
  readonly contractType: TContractType;
  readonly contractDate: string;
  readonly areaSqm: number;
  readonly deposit: number;
  readonly monthlyRent: number;
  readonly buildingLabel?: string;
  readonly sourceRecordId?: string;
};

export type RentComparisonRating = 'below' | 'fair' | 'above' | 'insufficient';

export type RentComparisonVerdictBasis = 'typical-range' | 'median-fallback' | null;

export type RentComparisonConfidence = 'high' | 'medium' | 'low' | null;

export type RentComparisonResult = {
  readonly rating: RentComparisonRating;
  readonly comparableCount: number;
  readonly askingValue: number;
  readonly medianValue: number | null;
  readonly p25Value: number | null;
  readonly p75Value: number | null;
  readonly differencePct: number | null;
  readonly percentileRank: number | null;
  readonly verdictBasis: RentComparisonVerdictBasis;
  readonly confidence: RentComparisonConfidence;
  readonly comparables: readonly ComparableRentContract[];
};

export type SourceRetrievalWindow<TInstant extends string = string> = {
  readonly earliest: TInstant;
  readonly latest: TInstant;
};

/** Generic coverage metadata shared by source-backed market adapters. */
export type SourceCoverage<
  TBasis extends string = string,
  TTimezone extends string = string,
  TMonthCount extends number = number,
  TMonth extends string = string,
  TInstant extends string = string,
> = {
  readonly basis: TBasis;
  readonly timezone: TTimezone;
  readonly coverageThroughMonth: TMonth;
  readonly latestContractMonth: TMonth | null;
  readonly sourceRetrievedAt: SourceRetrievalWindow<TInstant>;
  readonly responseGeneratedAt: TInstant;
  readonly monthsUsed: TMonthCount;
};

function finiteValues(values: readonly number[]): number[] {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new TypeError('Statistic values must be a non-empty finite list.');
  }

  return [...values].sort((left, right) => left - right);
}

function finiteValue(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${label} must be finite.`);
  }

  return value;
}

export function median(values: readonly number[]): number {
  const sorted = finiteValues(values);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 1
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function percentile(values: readonly number[], fraction: number): number {
  const sorted = finiteValues(values);
  const boundedFraction = Math.min(1, Math.max(0, finiteValue(fraction, 'Percentile fraction')));
  const index = (sorted.length - 1) * boundedFraction;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower]!;

  return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (index - lower);
}

export function percentileRank(values: readonly number[], asking: number): number {
  const sorted = finiteValues(values);
  const target = finiteValue(asking, 'Asking value');
  const atOrBelow = sorted.filter((value) => value <= target).length;

  return Math.round((atOrBelow / sorted.length) * 100);
}

/** Rounds a finite native-currency amount to the nearest whole unit. */
export function roundWon(value: number): number {
  return Math.round(finiteValue(value, 'Won value'));
}

export function roundDifferencePct(value: number): number {
  return Math.round(finiteValue(value, 'Difference percentage') * 10) / 10;
}
