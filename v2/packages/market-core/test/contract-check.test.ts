import { describe, expect, test } from 'vitest';

import {
  compareRentOffers,
  conversionRateAt,
  type ConversionCurve,
  type RentContractOffer,
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
