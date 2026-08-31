type NumericInterval = {
  readonly lower: number;
  readonly lowerInclusive: boolean;
  readonly upper: number;
  readonly upperInclusive: boolean;
};

const INTERVAL_EPSILON = 1e-12;

function intervalsIntersect(intervals: readonly NumericInterval[]): boolean {
  let lower = Number.NEGATIVE_INFINITY;
  let lowerInclusive = false;
  let upper = Number.POSITIVE_INFINITY;
  let upperInclusive = false;
  for (const interval of intervals) {
    if (interval.lower > lower) {
      lower = interval.lower;
      lowerInclusive = interval.lowerInclusive;
    } else if (interval.lower === lower) {
      lowerInclusive = lowerInclusive && interval.lowerInclusive;
    }

    if (interval.upper < upper) {
      upper = interval.upper;
      upperInclusive = interval.upperInclusive;
    } else if (interval.upper === upper) {
      upperInclusive = upperInclusive && interval.upperInclusive;
    }
  }
  if (lower < upper) return true;
  if (lower === upper) return lowerInclusive && upperInclusive;
  return lower - upper <= INTERVAL_EPSILON && lowerInclusive && upperInclusive;
}

function rawDifferenceInterval(
  askingValueWon: number,
  medianValueWon: number,
): NumericInterval | null {
  if (!Number.isFinite(askingValueWon) || !Number.isFinite(medianValueWon) ||
    askingValueWon <= 0 || medianValueWon <= 0) return null;
  const minimumRawMedian = Math.max(Number.MIN_VALUE, medianValueWon - 0.5);
  const maximumRawMedian = medianValueWon + 0.5;
  return {
    lower: ((askingValueWon - maximumRawMedian) / maximumRawMedian) * 100,
    lowerInclusive: false,
    upper: ((askingValueWon - minimumRawMedian) / minimumRawMedian) * 100,
    upperInclusive: true,
  };
}

function typicalRangeRatingMatches(result: Readonly<Record<string, unknown>>): boolean {
  if (typeof result.askingValueWon !== 'number' ||
    typeof result.p25ValueWon !== 'number' || typeof result.p75ValueWon !== 'number') {
    return false;
  }
  if (result.rating === 'below') return result.askingValueWon < result.p25ValueWon + 0.5;
  if (result.rating === 'above') return result.askingValueWon > result.p75ValueWon - 0.5;
  return result.rating === 'fair' && result.askingValueWon >= result.p25ValueWon - 0.5 &&
    result.askingValueWon < result.p75ValueWon + 0.5;
}

function medianFallbackRatingInterval(rating: unknown): NumericInterval | null {
  if (rating === 'below') {
    return {
      lower: Number.NEGATIVE_INFINITY,
      lowerInclusive: false,
      upper: -10,
      upperInclusive: true,
    };
  }
  if (rating === 'fair') {
    return { lower: -10, lowerInclusive: false, upper: 10, upperInclusive: false };
  }
  if (rating === 'above') {
    return {
      lower: 10,
      lowerInclusive: true,
      upper: Number.POSITIVE_INFINITY,
      upperInclusive: false,
    };
  }
  return null;
}

/** Validates the jointly published, rounded verdict fields without server dependencies. */
export function isPublishedRentCheckResultTuplePossible(
  result: Readonly<Record<string, unknown>>,
): boolean {
  if (typeof result.differencePct !== 'number' || !Number.isFinite(result.differencePct) ||
    Math.round(result.differencePct * 10) / 10 !== result.differencePct ||
    typeof result.askingValueWon !== 'number' || typeof result.medianValueWon !== 'number') {
    return false;
  }
  const induced = rawDifferenceInterval(result.askingValueWon, result.medianValueWon);
  if (induced === null) return false;
  const published: NumericInterval = {
    lower: result.differencePct - 0.05,
    lowerInclusive: true,
    upper: result.differencePct + 0.05,
    upperInclusive: false,
  };
  if (result.verdictBasis === 'typical-range') {
    return Number.isSafeInteger(result.percentileRank) &&
      (result.percentileRank as number) >= 0 && (result.percentileRank as number) <= 100 &&
      intervalsIntersect([induced, published]) && typicalRangeRatingMatches(result);
  }
  if (result.verdictBasis === 'median-fallback') {
    const rating = medianFallbackRatingInterval(result.rating);
    return result.percentileRank === null && rating !== null &&
      intervalsIntersect([induced, published, rating]);
  }
  return false;
}
