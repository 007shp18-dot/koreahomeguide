import { roundDifferencePct } from './rent-check';
import type { PublishedMarketSummary } from './public-summary';

export type QuotePositionAxis = Readonly<{
  min: number;
  max: number;
}>;

export type QuotePositionVerdict =
  | 'below-typical'
  | 'within-typical'
  | 'above-typical';

export type QuotePosition = Readonly<{
  quote: number;
  clampedQuote: number;
  markerPct: number;
  percentile: number;
  differencePct: number | null;
  verdict: QuotePositionVerdict;
  verdictLabel: string;
}>;

const ANCHOR_PERCENTILES = [0, 25, 50, 75, 100] as const;

function summaryValues(summary: PublishedMarketSummary): readonly number[] {
  const values = [summary.min, summary.p25, summary.med, summary.p75, summary.max];
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new TypeError('summary anchors must be finite non-negative values');
  }
  for (let index = 1; index < values.length; index += 1) {
    if (values[index]! < values[index - 1]!) {
      throw new TypeError('summary anchors must be ordered');
    }
  }
  return values;
}

function interpolatePercentile(values: readonly number[], quote: number): number {
  if (quote < values[0]!) return 0;
  if (quote > values[values.length - 1]!) return 100;

  const exactIndices = values
    .map((value, index) => value === quote ? index : -1)
    .filter((index) => index !== -1);
  if (exactIndices.length > 0) {
    const total = exactIndices.reduce(
      (sum, index) => sum + ANCHOR_PERCENTILES[index]!,
      0,
    );
    return total / exactIndices.length;
  }

  const upperIndex = values.findIndex((value) => value > quote);
  const lowerIndex = upperIndex - 1;
  const lowerValue = values[lowerIndex]!;
  const upperValue = values[upperIndex]!;
  const fraction = (quote - lowerValue) / (upperValue - lowerValue);
  const lowerPercentile = ANCHOR_PERCENTILES[lowerIndex]!;
  const upperPercentile = ANCHOR_PERCENTILES[upperIndex]!;
  return lowerPercentile + fraction * (upperPercentile - lowerPercentile);
}

function verdictFor(summary: PublishedMarketSummary, quote: number): Pick<
  QuotePosition,
  'verdict' | 'verdictLabel'
> {
  if (quote < summary.p25) {
    return { verdict: 'below-typical', verdictLabel: 'Below the typical range' };
  }
  if (quote > summary.p75) {
    return { verdict: 'above-typical', verdictLabel: 'Above the typical range' };
  }
  return { verdict: 'within-typical', verdictLabel: 'Within the typical range' };
}

export function positionQuote(
  summary: PublishedMarketSummary,
  quote: number,
  axis: QuotePositionAxis,
): QuotePosition {
  if (!Number.isFinite(quote) || quote < 0) {
    throw new TypeError('quote must be a finite non-negative value');
  }
  if (
    !Number.isFinite(axis.min) ||
    !Number.isFinite(axis.max) ||
    axis.min < 0 ||
    axis.max <= axis.min
  ) {
    throw new TypeError('axis must be a finite increasing non-negative range');
  }

  const values = summaryValues(summary);
  const clampedQuote = Math.min(axis.max, Math.max(axis.min, quote));
  const differencePct = summary.med === 0
    ? quote === 0 ? 0 : null
    : roundDifferencePct(((quote - summary.med) / summary.med) * 100);

  return Object.freeze({
    quote,
    clampedQuote,
    markerPct: ((clampedQuote - axis.min) / (axis.max - axis.min)) * 100,
    percentile: interpolatePercentile(values, quote),
    differencePct,
    ...verdictFor(summary, quote),
  });
}
