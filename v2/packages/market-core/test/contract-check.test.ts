import { describe, expect, test } from 'vitest';

import {
  compareContractOffers,
  compareRentOffers,
  conversionRateAt,
  evaluateSingleQuoteCheck,
  type CheckTransaction,
  type ConversionCurve,
  type RentContractOffer,
  type SingleQuoteCheckInput,
  type SingleQuoteComparable,
} from '../src';

const curve = Object.freeze({
  housingType: 'apartment',
  period: '2026-03/2026-08',
  anchors: Object.freeze([
    Object.freeze({ deposit: 30_000_000, annualRate: 0.05, pairCount: 140 }),
    Object.freeze({ deposit: 100_000_000, annualRate: 0.04, pairCount: 160 }),
  ]),
} as const satisfies ConversionCurve<'apartment'>);

const v5ApartmentCurve = Object.freeze({
  housingType: 'apartment',
  period: 'v5-contract-fixture',
  anchors: Object.freeze([
    Object.freeze({ deposit: 30_000_000, annualRate: 0.0495, pairCount: 1 }),
    Object.freeze({ deposit: 50_000_000, annualRate: 0.0481, pairCount: 1 }),
    Object.freeze({ deposit: 100_000_000, annualRate: 0.0472, pairCount: 1 }),
    Object.freeze({ deposit: 150_000_000, annualRate: 0.0466, pairCount: 1 }),
    Object.freeze({ deposit: 200_000_000, annualRate: 0.0461, pairCount: 1 }),
    Object.freeze({ deposit: 300_000_000, annualRate: 0.0455, pairCount: 1 }),
    Object.freeze({ deposit: 400_000_000, annualRate: 0.0450, pairCount: 1 }),
    Object.freeze({ deposit: 500_000_000, annualRate: 0.0447, pairCount: 1 }),
  ]),
} as const satisfies ConversionCurve<'apartment'>);

const v5OfficetelCurve = Object.freeze({
  housingType: 'officetel',
  period: 'v5-contract-fixture',
  anchors: Object.freeze([
    Object.freeze({ deposit: 30_000_000, annualRate: 0.0600, pairCount: 1 }),
    Object.freeze({ deposit: 50_000_000, annualRate: 0.0572, pairCount: 1 }),
    Object.freeze({ deposit: 75_000_000, annualRate: 0.0545, pairCount: 1 }),
    Object.freeze({ deposit: 100_000_000, annualRate: 0.0524, pairCount: 1 }),
    Object.freeze({ deposit: 150_000_000, annualRate: 0.0500, pairCount: 1 }),
    Object.freeze({ deposit: 200_000_000, annualRate: 0.0480, pairCount: 1 }),
  ]),
} as const satisfies ConversionCurve<'officetel'>);

function offer(
  id: 'a' | 'b',
  overrides: Partial<RentContractOffer<'apartment'>> = {},
): RentContractOffer<'apartment'> {
  return {
    id,
    housingType: 'apartment',
    deposit: id === 'a' ? 30_000_000 : 100_000_000,
    monthlyRent: id === 'a' ? 1_000_000 : 800_000,
    ...overrides,
  };
}

describe('conversionRateAt', () => {
  test('honors the exact v5 filed-deposit anchors and held boundaries', () => {
    expect(conversionRateAt(v5ApartmentCurve, 50_000_000)).toMatchObject({
      annualRate: 0.0481,
      rangeState: 'observed',
    });
    expect(conversionRateAt(v5ApartmentCurve, 500_000_000)).toMatchObject({
      annualRate: 0.0447,
      rangeState: 'observed',
    });
    expect(conversionRateAt(v5OfficetelCurve, 300_000_000)).toMatchObject({
      annualRate: 0.0480,
      rangeState: 'held-above',
    });
    expect(conversionRateAt(v5ApartmentCurve, 20_000_000)).toMatchObject({
      annualRate: 0.0495,
      rangeState: 'held-below',
    });
  });

  test('interpolates between verified anchors without mutating evidence', () => {
    const anchorsBefore = curve.anchors.map((anchor) => ({ ...anchor }));

    expect(conversionRateAt(curve, 65_000_000)).toEqual({
      annualRate: 0.045,
      rangeState: 'observed',
      evidencePairCount: 140,
    });
    expect(curve.anchors).toEqual(anchorsBefore);
  });

  test('uses exact anchor evidence and holds the nearest verified boundary', () => {
    expect(conversionRateAt(curve, 30_000_000)).toEqual({
      annualRate: 0.05,
      rangeState: 'observed',
      evidencePairCount: 140,
    });
    expect(conversionRateAt(curve, 10_000_000)).toEqual({
      annualRate: 0.05,
      rangeState: 'held-below',
      evidencePairCount: 140,
    });
    expect(conversionRateAt(curve, 200_000_000)).toEqual({
      annualRate: 0.04,
      rangeState: 'held-above',
      evidencePairCount: 160,
    });
  });

  test.each([
    [{ ...curve, anchors: [curve.anchors[0]!] }, 'at least two'],
    [{ ...curve, anchors: [curve.anchors[1]!, curve.anchors[0]!] }, 'strictly increasing'],
    [{ ...curve, anchors: [curve.anchors[0]!, { ...curve.anchors[1]!, deposit: 30_000_000 }] }, 'strictly increasing'],
    [{ ...curve, anchors: [{ ...curve.anchors[0]!, annualRate: 0 }, curve.anchors[1]!] }, 'between zero and one'],
    [{ ...curve, anchors: [{ ...curve.anchors[0]!, annualRate: 1 }, curve.anchors[1]!] }, 'between zero and one'],
    [{ ...curve, anchors: [{ ...curve.anchors[0]!, pairCount: 0 }, curve.anchors[1]!] }, 'positive integer'],
    [{ ...curve, period: '' }, 'period'],
  ] as const)('rejects malformed curve evidence %#', (candidate, message) => {
    expect(() => conversionRateAt(candidate, 50_000_000)).toThrow(message);
  });

  test.each([Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5])(
    'rejects an invalid contract deposit %s',
    (deposit) => {
      expect(() => conversionRateAt(curve, deposit)).toThrow('Deposit');
    },
  );
});

describe('compareRentOffers', () => {
  test('converts each full refundable deposit into its own monthly opportunity cost', () => {
    const result = compareRentOffers({
      curve: v5ApartmentCurve,
      offers: [
        {
          id: 'a', housingType: 'apartment',
          deposit: 50_000_000, monthlyRent: 1_000_000,
        },
        {
          id: 'b', housingType: 'apartment',
          deposit: 150_000_000, monthlyRent: 620_000,
        },
      ],
    });

    expect(result).not.toHaveProperty('referenceDeposit');
    expect(result.offers[0]?.normalizedMonthlyCost).toBeCloseTo(1_200_416.6666666667);
    expect(result.offers[1]?.normalizedMonthlyCost).toBeCloseTo(1_202_500);
    expect(result.offers[1]?.normalizedMonthlyCost).toBeLessThan(2_000_000);
    expect(result).toMatchObject({
      winner: 'a',
      rankingFlipped: true,
      roundedMonthlyDifference: 2_083,
    });
  });

  test('normalizes both full deposits and detects a flipped rent ranking', () => {
    const result = compareRentOffers({
      curve,
      offers: [offer('a'), offer('b')],
    });

    expect(result).toMatchObject({
      housingType: 'apartment',
      winner: 'a',
      roundedMonthlyDifference: 8_333,
      effectivelyEqual: false,
      rankingFlipped: true,
    });
    expect(result.monthlyDifference).toBeCloseTo(8_333.3333333333);
    expect(result.offers[0]).toMatchObject({
      roundedNormalizedMonthlyCost: 1_125_000,
      appliedRate: { annualRate: 0.05, rangeState: 'observed' },
    });
    expect(result.offers[1]).toMatchObject({
      roundedNormalizedMonthlyCost: 1_133_333,
      appliedRate: { annualRate: 0.04, rangeState: 'observed' },
    });
  });

  test('rejects a comparison when either deposit is outside the measured curve', () => {
    expect(() => compareRentOffers({
      curve,
      offers: [offer('a', { deposit: 20_000_000 }), offer('b')],
    })).toThrow('outside the measured range');
    expect(() => compareRentOffers({
      curve,
      offers: [offer('a'), offer('b', { deposit: 120_000_000 })],
    })).toThrow('outside the measured range');
  });

  test('is independent of offer tuple order while preserving offer IDs', () => {
    const forward = compareRentOffers({ curve, offers: [offer('a'), offer('b')] });
    const reverse = compareRentOffers({ curve, offers: [offer('b'), offer('a')] });

    expect(reverse).toMatchObject({
      winner: forward.winner,
      roundedMonthlyDifference: forward.roundedMonthlyDifference,
      rankingFlipped: forward.rankingFlipped,
    });
    expect(reverse.offers.map(({ offer: item }) => item.id)).toEqual(['b', 'a']);
  });

  test('does not call equal raw rent or equal normalized cost a ranking flip', () => {
    const rawTie = compareRentOffers({
      curve,
      offers: [offer('a', { monthlyRent: 800_000 }), offer('b')],
    });
    const flatCurve = {
      housingType: 'apartment',
      period: '2026-03/2026-08',
      anchors: [
        { deposit: 30_000_000, annualRate: 0.06, pairCount: 140 },
        { deposit: 50_000_000, annualRate: 0.06, pairCount: 160 },
      ],
    } as const;
    const normalizedTie = compareRentOffers({
      curve: flatCurve,
      offers: [
        offer('a', { deposit: 30_000_000, monthlyRent: 900_000 }),
        offer('b', { deposit: 50_000_000, monthlyRent: 800_000 }),
      ],
    });

    expect(rawTie.rankingFlipped).toBe(false);
    expect(normalizedTie.winner).toBe('equal');
    expect(normalizedTie.rankingFlipped).toBe(false);
  });

  test('uses public whole-won precision for effectively equal results', () => {
    const equalAtDisplayPrecision = compareRentOffers({
      curve,
      offers: [
        offer('a', { deposit: 30_000_000, monthlyRent: 1_000_000 }),
        offer('b', { deposit: 30_000_006, monthlyRent: 1_000_000 }),
      ],
    });

    expect(equalAtDisplayPrecision.monthlyDifference).toBeCloseTo(0.0228571428);
    expect(equalAtDisplayPrecision.roundedMonthlyDifference).toBe(0);
    expect(equalAtDisplayPrecision.effectivelyEqual).toBe(true);
    expect(equalAtDisplayPrecision.winner).toBe('equal');
  });

  test('returns a deeply immutable comparison without mutating offers', () => {
    const offers = [offer('a'), offer('b')] as const;
    const before = offers.map((item) => ({ ...item }));
    const result = compareRentOffers({ curve, offers });

    expect(offers).toEqual(before);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.offers)).toBe(true);
    expect(result.offers.every((item) => Object.isFrozen(item))).toBe(true);
    expect(result.offers.every((item) => Object.isFrozen(item.offer))).toBe(true);
    expect(result.offers.every((item) => Object.isFrozen(item.appliedRate))).toBe(true);
  });

  test('rejects cross-type comparisons, duplicate IDs, and invalid money', () => {
    expect(() => compareRentOffers({
      curve,
      offers: [offer('a'), { ...offer('b'), housingType: 'officetel' }],
    })).toThrow('same housing type');
    expect(() => compareRentOffers({
      curve,
      offers: [offer('a'), { ...offer('b'), id: 'a' }],
    })).toThrow('distinct IDs');

    for (const invalid of [-1, Number.NaN, Number.POSITIVE_INFINITY, 1.5]) {
      expect(() => compareRentOffers({
        curve,
        offers: [offer('a', { deposit: invalid }), offer('b')],
      })).toThrow('Deposit');
    }
    expect(() => compareRentOffers({
      curve,
      offers: [offer('a', { deposit: 0, monthlyRent: 0 }), offer('b')],
    })).toThrow('cannot both be zero');
  });
});

const allTypeRecords: readonly SingleQuoteComparable[] = Object.freeze([
  ...(['sale', 'jeonse', 'monthly'] as const).flatMap((transaction) => (
    [0, 1, 2, 3, 4, 5].map((index) => Object.freeze({
      transaction,
      districtSlug: 'gangnam-gu',
      neighborhoodId: 'yeoksam',
      buildingId: 'gangnam-gu-stable-building',
      housingType: 'apartment',
      areaSqm: 84 + index / 10,
      filedMonth: `2026-0${index + 2}`,
      salePriceWon: transaction === 'sale' ? 1_000_000_000 + index * 100_000_000 : null,
      depositWon: transaction === 'sale' ? null : 100_000_000 + index * 10_000_000,
      monthlyRentWon: transaction === 'monthly' ? 2_000_000 - index * 40_000 : null,
    } satisfies SingleQuoteComparable))
  )),
]);

function checkInput(
  transaction: CheckTransaction,
  overrides: Partial<SingleQuoteCheckInput> = {},
): SingleQuoteCheckInput {
  return {
    transaction,
    districtSlug: 'gangnam-gu',
    buildingId: 'gangnam-gu-stable-building',
    neighborhoodId: null,
    housingType: 'apartment',
    areaSqm: 84,
    salePriceWon: transaction === 'sale' ? 1_200_000_000 : null,
    depositWon: transaction === 'sale' ? null : 100_000_000,
    monthlyRentWon: transaction === 'monthly' ? 2_000_000 : null,
    ...overrides,
  };
}

function readyCheck(transaction: CheckTransaction, overrides: Partial<SingleQuoteCheckInput> = {}) {
  const result = evaluateSingleQuoteCheck({
    input: checkInput(transaction, overrides),
    records: allTypeRecords,
    period: '2026-02/2026-08',
    conversionCurve: transaction === 'monthly' ? curve : undefined,
  });
  if (result.status !== 'ready') throw new Error(`Expected ${transaction} evidence to be ready.`);
  return result;
}

describe('all-type Check engine', () => {
  test.each([
    ['sale', 'reported-sale-price', 'typical', null, null],
    ['jeonse', 'reported-jeonse-deposit', 'below', 100_000_000, null],
    ['monthly', 'verified-deposit-adjusted-monthly-rent', 'above', 100_000_000, 2_000_000],
  ] as const)(
    'evaluates %s with transaction-specific filed values and an exact public sample gate',
    (transaction, basis, verdict, depositWon, monthlyRentWon) => {
      const result = readyCheck(transaction);

      expect(result).toMatchObject({
        comparisonBasis: basis,
        verdict,
        distribution: { sampleCount: 6 },
        sample: { count: 6, minimum: 5 },
        period: '2026-02/2026-08',
        evidenceWindow: {
          startMonth: '2026-02',
          endMonth: '2026-08',
          completedMonthCount: 7,
          maximumMonthCount: 12,
        },
        filters: {
          scope: 'building', districtSlug: 'gangnam-gu', housingType: 'apartment',
          areaTolerancePct: 15,
        },
        quote: { depositWon, monthlyRentWon },
      });
      expect(result.comparableRows).toHaveLength(6);
      expect(result.difference).toEqual(expect.objectContaining({ pct: expect.any(Number) }));
      expect(result.pricePercentile).toEqual(expect.any(Number));
    },
  );

  test('fails closed for missing transaction inputs and unavailable conversion evidence', () => {
    expect(evaluateSingleQuoteCheck({
      input: checkInput('sale', { salePriceWon: null }),
      records: allTypeRecords,
      period: '2026-02/2026-08',
    })).toMatchObject({ status: 'unavailable', reason: 'missing-input' });
    expect(evaluateSingleQuoteCheck({
      input: checkInput('monthly'),
      records: allTypeRecords,
      period: '2026-02/2026-08',
    })).toMatchObject({ status: 'unavailable', reason: 'conversion-unavailable' });
  });

  test('publishes at exactly five compatible records and withholds at four', () => {
    const saleRecords = allTypeRecords.filter(({ transaction }) => transaction === 'sale');
    const five = evaluateSingleQuoteCheck({
      input: checkInput('sale'),
      records: saleRecords.slice(0, 5),
      period: '2026-02/2026-08',
    });
    const four = evaluateSingleQuoteCheck({
      input: checkInput('sale'),
      records: saleRecords.slice(0, 4),
      period: '2026-02/2026-08',
    });

    expect(five).toMatchObject({
      status: 'ready',
      sample: { count: 5, minimum: 5 },
    });
    expect(four).toMatchObject({
      status: 'insufficient',
      sample: { count: 4, minimum: 5 },
    });
  });

  test('anchors a long artifact to its latest verified month and excludes older records', () => {
    const saleRecords = allTypeRecords.filter(({ transaction }) => transaction === 'sale');
    const result = evaluateSingleQuoteCheck({
      input: checkInput('sale'),
      records: [
        ...saleRecords,
        { ...saleRecords[0]!, filedMonth: '2025-08', salePriceWon: 9_000_000_000 },
      ],
      period: '2024-01/2026-08',
    });

    expect(result).toMatchObject({
      status: 'ready',
      period: '2025-09/2026-08',
      evidenceWindow: {
        startMonth: '2025-09',
        endMonth: '2026-08',
        completedMonthCount: 12,
        maximumMonthCount: 12,
      },
      sample: { count: 6 },
      distribution: { maxWon: 1_500_000_000 },
    });
    if (result.status !== 'ready') throw new Error('Expected a ready recent-window result.');
    expect(result.comparableRows.every(({ filedMonth }) => filedMonth >= '2025-09')).toBe(true);
  });

  test('does not expand the time window to rescue an insufficient recent sample', () => {
    const saleRecords = allTypeRecords.filter(({ transaction }) => transaction === 'sale');
    const result = evaluateSingleQuoteCheck({
      input: checkInput('sale'),
      records: [
        ...saleRecords.slice(0, 4),
        { ...saleRecords[4]!, filedMonth: '2025-08' },
        { ...saleRecords[5]!, filedMonth: '2025-07' },
      ],
      period: '2024-01/2026-08',
    });

    expect(result).toMatchObject({
      status: 'insufficient',
      period: '2025-09/2026-08',
      evidenceWindow: {
        startMonth: '2025-09',
        endMonth: '2026-08',
        completedMonthCount: 12,
      },
      sample: { count: 4, minimum: 5 },
    });
  });

  test('widens same-building to neighborhood to district and discloses the selected fallback', () => {
    const records = allTypeRecords.map((record, index) => record.transaction === 'sale' && index < 4
      ? { ...record, buildingId: 'gangnam-gu-sparse-building' }
      : record);
    const neighborhood = evaluateSingleQuoteCheck({
      input: checkInput('sale', { buildingId: 'gangnam-gu-sparse-building' }),
      records,
      period: '2026-02/2026-08',
    });
    const district = evaluateSingleQuoteCheck({
      input: checkInput('sale', { buildingId: 'gangnam-gu-missing-building' }),
      records,
      period: '2026-02/2026-08',
    });

    expect(neighborhood).toMatchObject({
      status: 'ready', filters: { scope: 'neighborhood' },
      fallbackDisclosure: 'Same-building evidence was below five records; same-neighborhood evidence is shown.',
    });
    expect(district).toMatchObject({
      status: 'ready', filters: { scope: 'district' },
      fallbackDisclosure: 'Same-building and same-neighborhood evidence were below five records; district evidence is shown.',
    });
  });

  test('uses a verified building neighborhood when the selected transaction has no building row', () => {
    const records = allTypeRecords.map((record) => record.transaction === 'jeonse'
      ? { ...record, buildingId: 'gangnam-gu-other-building' }
      : record);
    const result = evaluateSingleQuoteCheck({
      input: {
        ...checkInput('jeonse'),
        neighborhoodId: 'yeoksam',
      },
      records,
      period: '2026-02/2026-08',
    });

    expect(result).toMatchObject({
      status: 'ready',
      filters: { scope: 'neighborhood' },
      fallbackDisclosure: 'Same-building evidence was below five records; same-neighborhood evidence is shown.',
    });
  });

  test.each([
    ['sale', 'sale', 'market-position'],
    ['sale', 'jeonse', 'tradeoff'],
    ['sale', 'monthly', 'tradeoff'],
    ['jeonse', 'sale', 'tradeoff'],
    ['jeonse', 'jeonse', 'market-position'],
    ['jeonse', 'monthly', 'equivalent-monthly-cost'],
    ['monthly', 'sale', 'tradeoff'],
    ['monthly', 'jeonse', 'equivalent-monthly-cost'],
    ['monthly', 'monthly', 'market-position'],
  ] as const)(
    'handles ordered %s to %s comparisons with %s semantics',
    (leftType, rightType, basis) => {
      const result = compareContractOffers({
        offers: [
          { id: 'a', check: readyCheck(leftType) },
          { id: 'b', check: readyCheck(rightType, rightType === 'sale'
            ? { salePriceWon: 1_300_000_000 }
            : rightType === 'monthly'
              ? { depositWon: 90_000_000, monthlyRentWon: 2_100_000 }
              : { depositWon: 90_000_000 }) },
        ],
        conversionCurve: curve,
      });

      expect(result).toMatchObject({ status: 'ready', basis });
      if (result.status !== 'ready') throw new Error('Expected comparison to be ready.');
      expect(result.offers.map(({ id }) => id)).toEqual(['a', 'b']);
      if (basis === 'tradeoff') {
        expect(result).toMatchObject({ winner: null, verdict: 'tradeoff' });
      }
    },
  );

  test('returns an equal verdict for tied own-market positions', () => {
    const sale = readyCheck('sale');
    expect(compareContractOffers({
      offers: [{ id: 'a', check: sale }, { id: 'b', check: sale }],
      conversionCurve: curve,
    })).toMatchObject({ status: 'ready', winner: 'equal', verdict: 'equal' });
  });

  test('retains unknown recurring cash flow as null for sale and jeonse offers', () => {
    const result = compareContractOffers({
      offers: [
        { id: 'a', check: readyCheck('sale') },
        { id: 'b', check: readyCheck('jeonse') },
      ],
      conversionCurve: curve,
    });

    expect(result).toMatchObject({
      status: 'ready',
      offers: [
        { transaction: 'sale', recurringCashFlowWon: null },
        { transaction: 'jeonse', recurringCashFlowWon: null },
      ],
    });
  });

  test('propagates unsupported cohorts and unavailable conversion without fabricating a winner', () => {
    const unsupported = evaluateSingleQuoteCheck({
      input: checkInput('sale', { districtSlug: 'jongno-gu' }),
      records: allTypeRecords,
      period: '2026-02/2026-08',
    });
    expect(unsupported).toMatchObject({ status: 'insufficient', sample: { count: 0, minimum: 5 } });
    expect(compareContractOffers({
      offers: [{ id: 'a', check: unsupported }, { id: 'b', check: readyCheck('sale') }],
      conversionCurve: curve,
    })).toMatchObject({ status: 'unavailable', reason: 'offer-evidence-unavailable' });
    expect(compareContractOffers({
      offers: [{ id: 'a', check: readyCheck('jeonse') }, { id: 'b', check: readyCheck('monthly') }],
    })).toMatchObject({ status: 'unavailable', reason: 'conversion-unavailable' });
  });
});
