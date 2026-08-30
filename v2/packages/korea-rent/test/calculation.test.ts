import { describe, expect, test } from 'vitest';

import {
  buildKoreaRentCheckResult,
  completedSeoulMonthKeys,
  restateMonthlyRentAtDeposit,
  type KoreaRentRecord,
  type RentCheckQuote,
} from '../src/index';

const REFERENCE_INSTANT = '2026-09-15T00:00:00.000Z';

function quote(overrides: Partial<RentCheckQuote> = {}): RentCheckQuote {
  return {
    lawdCd: '11590',
    requestedHousingType: 'apartment',
    sourceHousingType: 'apartment',
    depositWon: 10_000_000,
    monthlyRentWon: 950_000,
    areaSqm: 25,
    ...overrides,
  };
}

function record(overrides: Partial<KoreaRentRecord> = {}): KoreaRentRecord {
  return {
    buildingLabel: 'Sample',
    sourceHousingType: 'apartment',
    areaSqm: 25,
    depositWon: 10_000_000,
    monthlyRentWon: 900_000,
    contractDate: '2026-08-15',
    contractType: 'new',
    recordStatus: 'active',
    ...overrides,
  };
}

function monthlyRecords(
  rents: readonly number[],
  overrides: Partial<KoreaRentRecord> = {},
): KoreaRentRecord[] {
  return rents.map((monthlyRentWon, index) =>
    record({
      buildingLabel: `Building ${index + 1}`,
      contractDate: `2026-08-${String(index + 1).padStart(2, '0')}`,
      monthlyRentWon,
      ...overrides,
    }),
  );
}

describe('Seoul completed-month coverage', () => {
  test('uses the Asia/Seoul month boundary rather than UTC', () => {
    expect(completedSeoulMonthKeys('2026-08-31T15:30:00Z', 3)).toEqual([
      '2026-08',
      '2026-07',
      '2026-06',
    ]);
  });

  test.each([
    ['not-an-instant', 3],
    ['2026-08-31T15:30:00Z', 0],
    ['2026-08-31T15:30:00Z', 1.5],
  ] as const)('rejects invalid coverage input %s / %s', (instant, count) => {
    expect(() => completedSeoulMonthKeys(instant, count)).toThrow(TypeError);
  });
});

describe('Korea deposit normalization', () => {
  test('restates monthly rent at the user deposit with the exact five-percent policy', () => {
    expect(
      restateMonthlyRentAtDeposit(
        { monthlyRentWon: 900_000, depositWon: 20_000_000 },
        10_000_000,
      ),
    ).toBeCloseTo(941_666.6666666666);
  });

  test.each([
    [{ monthlyRentWon: -1, depositWon: 20_000_000 }, 10_000_000],
    [{ monthlyRentWon: 900_000, depositWon: 9_007_199_254_740_992 }, 10_000_000],
    [{ monthlyRentWon: 900_000, depositWon: 20_000_000 }, -1],
  ] as const)('rejects invalid raw KRW input', (comparable, userDepositWon) => {
    expect(() => restateMonthlyRentAtDeposit(comparable, userDepositWon)).toThrow(TypeError);
  });
});

describe('buildKoreaRentCheckResult', () => {
  test('uses P25/P75 for five values and exposes hand-derived public statistics', () => {
    const result = buildKoreaRentCheckResult(
      monthlyRecords([700_000, 800_000, 900_000, 1_000_000, 1_100_000]),
      quote(),
      REFERENCE_INSTANT,
    );

    expect(result).toMatchObject({
      rating: 'fair',
      verdictBasis: 'typical-range',
      comparableCount: 5,
      comparisonMode: 'monthly-rent',
      comparisonBasis: 'deposit-adjusted-monthly-rent',
      askingValueWon: 950_000,
      minValueWon: 700_000,
      p25ValueWon: 800_000,
      medianValueWon: 900_000,
      p75ValueWon: 1_000_000,
      maxValueWon: 1_100_000,
      differencePct: 5.6,
      percentileRank: 60,
      tier: 1,
      monthsUsed: 3,
      confidence: 'medium',
      policyId: 'kr-rent-check-quote-normalization',
      policyVersion: 1,
      annualDepositRate: 0.05,
    });
  });

  test('keeps the three-value median fallback limited and uses exact ten-percent edges', () => {
    const records = monthlyRecords([900, 1_000, 1_100]);
    const limited = buildKoreaRentCheckResult(
      records,
      quote({ monthlyRentWon: 900 }),
      REFERENCE_INSTANT,
    );
    const aroundMedian = buildKoreaRentCheckResult(
      records,
      quote({ monthlyRentWon: 901 }),
      REFERENCE_INSTANT,
    );

    expect(limited).toMatchObject({
      rating: 'below',
      verdictBasis: 'median-fallback',
      confidence: 'low',
      comparableCount: 3,
      medianValueWon: 1_000,
      differencePct: -10,
      p25ValueWon: null,
      p75ValueWon: null,
      percentileRank: null,
      tier: 3,
      monthsUsed: 12,
    });
    expect(aroundMedian).toMatchObject({ rating: 'fair', differencePct: -9.9 });
  });

  test('expands through exact Tier 1, Tier 2, and Tier 3 policies and stops early', () => {
    const tier1 = buildKoreaRentCheckResult(
      monthlyRecords([700_000, 800_000, 900_000, 1_000_000, 1_100_000]),
      quote(),
      REFERENCE_INSTANT,
    );
    const tier2 = buildKoreaRentCheckResult(
      [
        ...monthlyRecords([700_000, 800_000, 900_000, 1_000_000]),
        record({
          buildingLabel: 'Tier 2 only',
          areaSqm: 29,
          contractDate: '2026-05-15',
          monthlyRentWon: 1_100_000,
        }),
      ],
      quote(),
      REFERENCE_INSTANT,
    );
    const tier3 = buildKoreaRentCheckResult(
      monthlyRecords([800_000, 900_000, 1_000_000], {
        areaSqm: 31,
        depositWon: 14_000_000,
        contractDate: '2026-02-15',
      }),
      quote(),
      REFERENCE_INSTANT,
    );

    expect(tier1).toMatchObject({ tier: 1, monthsUsed: 3, comparableCount: 5 });
    expect(tier2).toMatchObject({ tier: 2, monthsUsed: 6, comparableCount: 5 });
    expect(tier3).toMatchObject({ tier: 3, monthsUsed: 12, comparableCount: 3 });
  });

  test('requires exact zero-deposit matches when the user deposit is zero', () => {
    const exact = monthlyRecords([700_000, 800_000, 900_000, 1_000_000, 1_100_000], {
      depositWon: 0,
    });
    const result = buildKoreaRentCheckResult(
      [...exact, record({ buildingLabel: 'Nonzero deposit', depositWon: 1 })],
      quote({ depositWon: 0 }),
      REFERENCE_INSTANT,
    );

    expect(result.comparableCount).toBe(5);
    expect(result.comparables.map((comparable) => comparable.buildingLabel)).not.toContain(
      'Nonzero deposit',
    );
  });

  test('compares jeonse only with reported zero-rent contracts and never applies a rate', () => {
    const jeonse = [80, 90, 100, 110, 120].map((depositMillions, index) =>
      record({
        buildingLabel: `Jeonse ${index + 1}`,
        depositWon: depositMillions * 1_000_000,
        monthlyRentWon: 0,
      }),
    );
    const result = buildKoreaRentCheckResult(
      [...jeonse, record({ buildingLabel: 'Monthly rent', depositWon: 100_000_000 })],
      quote({ depositWon: 105_000_000, monthlyRentWon: 0 }),
      REFERENCE_INSTANT,
    );

    expect(result).toMatchObject({
      comparisonMode: 'jeonse-deposit',
      comparisonBasis: 'jeonse-deposit',
      annualDepositRate: null,
      askingValueWon: 105_000_000,
      p25ValueWon: 90_000_000,
      medianValueWon: 100_000_000,
      p75ValueWon: 110_000_000,
      comparableCount: 5,
    });
    expect(result.comparables.map((comparable) => comparable.buildingLabel)).not.toContain(
      'Monthly rent',
    );
  });

  test('prefers enough new contracts and otherwise discloses a mixed selection', () => {
    const fiveNew = monthlyRecords([700_000, 800_000, 900_000, 1_000_000, 1_100_000]);
    const renewal = record({
      buildingLabel: 'Renewal',
      contractType: 'renewal',
      monthlyRentWon: 1_200_000,
    });
    const newOnly = buildKoreaRentCheckResult(
      [...fiveNew, renewal],
      quote(),
      REFERENCE_INSTANT,
    );
    const mixed = buildKoreaRentCheckResult(
      [...fiveNew.slice(0, 4), renewal],
      quote(),
      REFERENCE_INSTANT,
    );

    expect(newOnly).toMatchObject({
      contractSelection: 'new_only',
      comparableCount: 5,
      eligibleContractTypeCounts: { new: 5, renewal: 1, unknown: 0 },
      selectedContractTypeCounts: { new: 5, renewal: 0, unknown: 0 },
    });
    expect(mixed).toMatchObject({
      contractSelection: 'mixed',
      comparableCount: 5,
      eligibleContractTypeCounts: { new: 4, renewal: 1, unknown: 0 },
      selectedContractTypeCounts: { new: 4, renewal: 1, unknown: 0 },
    });
  });

  test('includes active and unknown records, excludes known cancellations, and reports pre-exclusion status counts', () => {
    const records = [
      record({ buildingLabel: 'A1', contractType: 'new' }),
      record({ buildingLabel: 'A2', contractType: 'new' }),
      record({ buildingLabel: 'A3', contractType: 'new' }),
      record({ buildingLabel: 'Renewal', contractType: 'renewal' }),
      record({ buildingLabel: 'Unknown status', contractType: 'unknown', recordStatus: 'unknown' }),
      record({ buildingLabel: 'Cancelled', contractType: 'renewal', recordStatus: 'cancelled' }),
    ];
    const result = buildKoreaRentCheckResult(records, quote(), REFERENCE_INSTANT);

    expect(result).toMatchObject({
      comparableCount: 5,
      contractSelection: 'mixed',
      eligibleContractTypeCounts: { new: 3, renewal: 1, unknown: 1 },
      selectedContractTypeCounts: { new: 3, renewal: 1, unknown: 1 },
      sourceRecordStatusCounts: { active: 4, cancelled: 1, unknown: 1 },
    });
    expect(result.comparables.map((comparable) => comparable.buildingLabel)).not.toContain(
      'Cancelled',
    );
  });

  test('fixes the verdict from unrounded values before rounding public whole-won amounts', () => {
    const halfWonRecords = monthlyRecords(
      [900_000, 900_000, 900_000, 900_000, 900_000],
      { depositWon: 10_000_120 },
    );
    const result = buildKoreaRentCheckResult(
      halfWonRecords,
      quote({ monthlyRentWon: 900_001 }),
      REFERENCE_INSTANT,
    );

    expect(result).toMatchObject({
      rating: 'above',
      medianValueWon: 900_001,
      p25ValueWon: 900_001,
      p75ValueWon: 900_001,
      differencePct: 0,
    });
  });

  test('returns at most ten newest evidence rows', () => {
    const records = Array.from({ length: 11 }, (_unused, index) =>
      record({
        buildingLabel: `Day ${index + 1}`,
        contractDate: `2026-08-${String(index + 1).padStart(2, '0')}`,
      }),
    );
    const result = buildKoreaRentCheckResult(records, quote(), REFERENCE_INSTANT);

    expect(result.comparableCount).toBe(11);
    expect(result.comparables).toHaveLength(10);
    expect(result.comparables[0]?.buildingLabel).toBe('Day 11');
    expect(result.comparables[9]?.buildingLabel).toBe('Day 2');
  });

  test('returns no intelligence or rows when fewer than three contracts remain', () => {
    const result = buildKoreaRentCheckResult(
      monthlyRecords([800_000, 900_000]),
      quote(),
      REFERENCE_INSTANT,
    );

    expect(result).toMatchObject({
      rating: 'insufficient',
      comparableCount: 2,
      medianValueWon: null,
      minValueWon: null,
      p25ValueWon: null,
      p75ValueWon: null,
      maxValueWon: null,
      differencePct: null,
      percentileRank: null,
      verdictBasis: null,
      confidence: null,
      tier: null,
      monthsUsed: 12,
      comparables: [],
    });
  });

  test.each([
    [[], null],
    [monthlyRecords([800_000]), '2026-08'],
    [monthlyRecords([800_000, 900_000]), '2026-08'],
  ] as const)(
    'carries the private latest selected-evidence month for an insufficient sample',
    (records, expectedLatestMonth) => {
      const result = buildKoreaRentCheckResult(records, quote(), REFERENCE_INSTANT);

      expect(result.comparableCount).toBe(records.length);
      expect(result.comparables).toEqual([]);
      expect(result.selectedLatestContractMonth).toBe(expectedLatestMonth);
    },
  );

  test('rejects invalid direct quote and source-record KRW before calculation', () => {
    expect(() =>
      buildKoreaRentCheckResult([], quote({ depositWon: -1 }), REFERENCE_INSTANT),
    ).toThrow(TypeError);
    expect(() =>
      buildKoreaRentCheckResult(
        [record({ monthlyRentWon: Number.MAX_SAFE_INTEGER + 1 })],
        quote(),
        REFERENCE_INSTANT,
      ),
    ).toThrow(TypeError);
  });
});
