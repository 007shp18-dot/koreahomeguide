import { describe, expect, it } from 'vitest';
import {
  median,
  percentile,
  percentileRank,
  roundDifferencePct,
  roundWon,
  type ComparableRentContract,
  type RentComparisonResult,
  type RentQuote,
  type SourceCoverage,
  type SourceRetrievalWindow,
} from '../src';

describe('portable rent-check statistics', () => {
  it('computes a median from a finite set without mutating the input', () => {
    const values = [100, 200, 900, 1_000];

    expect(median(values)).toBe(550);
    expect(values).toEqual([100, 200, 900, 1_000]);
  });

  it('computes a linearly interpolated percentile', () => {
    expect(percentile([100, 200, 900, 1_000], 0.25)).toBe(175);
  });

  it('computes a whole-percent percentile rank', () => {
    expect(percentileRank([100, 200, 900, 1_000], 200)).toBe(50);
  });

  it('rounds won amounts and percentage differences at their public precision', () => {
    expect(roundWon(1000.5)).toBe(1001);
    expect(roundWon(0)).toBe(0);
    expect(roundDifferencePct(12.349)).toBe(12.3);
  });

  it('rejects empty and non-finite statistic inputs', () => {
    expect(() => median([])).toThrow(TypeError);
    expect(() => percentile([100, Number.NaN], 0.5)).toThrow(TypeError);
    expect(() => percentileRank([100], Number.POSITIVE_INFINITY)).toThrow(TypeError);
  });
});

describe('portable rent-check contracts', () => {
  it('constructs quote, comparable, result, and source coverage primitives', () => {
    type AdapterInstant = `${number}-${number}-${number}T${string}`;
    type AdapterMonth = `${number}-${number}`;
    type AdapterCoverage = SourceCoverage<
      'contract_date',
      'Asia/Seoul',
      3 | 6 | 12,
      AdapterMonth,
      AdapterInstant
    >;

    const quote: RentQuote<'apartment', 'residential'> = {
      requestedHousingType: 'apartment',
      sourceHousingType: 'residential',
      deposit: 10_000,
      monthlyRent: 900,
      areaSqm: 28,
    };
    const comparable: ComparableRentContract<'new'> = {
      contractType: 'new',
      contractDate: '2026-07-15',
      areaSqm: 27.5,
      deposit: 10_500,
      monthlyRent: 880,
    };
    const retrieval: SourceRetrievalWindow<AdapterInstant> = {
      earliest: '2026-08-01T00:00:00.000Z',
      latest: '2026-08-30T00:00:00.000Z',
    };
    const coverage: AdapterCoverage = {
      basis: 'contract_date',
      timezone: 'Asia/Seoul',
      coverageThroughMonth: '2026-07',
      latestContractMonth: '2026-07',
      sourceRetrievedAt: retrieval,
      responseGeneratedAt: '2026-08-30T00:00:00.000Z',
      monthsUsed: 3,
    };
    const result: RentComparisonResult = {
      rating: 'fair',
      comparableCount: 1,
      askingValue: 900,
      medianValue: 880,
      p25Value: null,
      p75Value: null,
      differencePct: 2.3,
      percentileRank: 100,
      verdictBasis: 'median-fallback',
      confidence: 'low',
      comparables: [comparable],
    };

    expect({ quote, comparable, coverage, result }).toBeDefined();
  });
});
