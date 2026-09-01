import { describe, expect, it } from 'vitest';
import {
  compareAtSameDeposit,
  conversionCurves,
  conversionRateAt,
  EOK,
  MAN,
  restateRent,
} from '../lib/signed-conversion';

describe('measured conversion curve', () => {
  it('holds the nearest anchor flat outside the measured range', () => {
    // The measurement does not extend past its anchors, so extrapolating there
    // would invent data. Both ends must clamp, not continue the slope.
    expect(conversionRateAt(0, 'apartment')).toBe(conversionCurves.apartment[0].rate);
    expect(conversionRateAt(50 * EOK, 'apartment')).toBe(conversionCurves.apartment[1].rate);
    expect(conversionRateAt(0, 'officetel')).toBe(conversionCurves.officetel[0].rate);
    expect(conversionRateAt(20 * EOK, 'officetel')).toBe(conversionCurves.officetel[1].rate);
  });

  it('falls as the deposit rises', () => {
    const low = conversionRateAt(1 * EOK, 'apartment');
    const high = conversionRateAt(4 * EOK, 'apartment');
    expect(high).toBeLessThan(low);
  });

  it('differs by asset type at the same deposit', () => {
    // Applying the officetel curve to apartments pushed estimation error to
    // 33.9%, so the two curves must never collapse into one.
    expect(conversionRateAt(1 * EOK, 'officetel')).not.toBeCloseTo(
      conversionRateAt(1 * EOK, 'apartment'),
      4,
    );
  });

  it('interpolates linearly between anchors', () => {
    const midpoint = conversionRateAt(2.75 * EOK, 'apartment');
    const expected =
      (conversionCurves.apartment[0].rate + conversionCurves.apartment[1].rate) / 2;
    expect(midpoint).toBeCloseTo(expected, 6);
  });
});

describe('restating a rent at another deposit', () => {
  it('reads the rate at the contract deposit, not the target', () => {
    // Using the target's rate would price a trade that never happened.
    const restated = restateRent(600_000, 2 * EOK, 5_000 * MAN, 'apartment');
    expect(restated.rate).toBeCloseTo(conversionRateAt(2 * EOK, 'apartment'), 10);
    expect(restated.rate).not.toBeCloseTo(conversionRateAt(5_000 * MAN, 'apartment'), 6);
  });

  it('returns the rent unchanged when the basis already matches', () => {
    const restated = restateRent(900_000, 5_000 * MAN, 5_000 * MAN, 'apartment');
    expect(restated.monthlyWon).toBeCloseTo(900_000, 6);
  });

  it('can go below zero, which the caller must clamp', () => {
    const restated = restateRent(100_000, 1_000 * MAN, 5 * EOK, 'apartment');
    expect(restated.monthlyWon).toBeLessThan(0);
  });
});

describe('comparing two conditions at one deposit', () => {
  const target = 5_000 * MAN;

  it('reverses the order in the worked case', () => {
    // Written: A is 30만 cheaper. Restated at 5,000만: B is cheaper.
    const result = compareAtSameDeposit(
      { depositWon: 2 * EOK, monthlyRentWon: 60 * MAN },
      { depositWon: 5_000 * MAN, monthlyRentWon: 90 * MAN },
      target,
      'apartment',
    );

    expect(result.cheaperAsWritten).toBe('a');
    expect(result.cheaperRestated).toBe('b');
    expect(result.orderReversed).toBe(true);
    expect(result.aMonthlyWon).toBeCloseTo(1_187_083, 0);
    expect(result.bMonthlyWon).toBeCloseTo(900_000, 0);
    expect(result.clamped).toBe(false);
  });

  it('leaves the order alone when the basis already matches', () => {
    const result = compareAtSameDeposit(
      { depositWon: target, monthlyRentWon: 80 * MAN },
      { depositWon: target, monthlyRentWon: 95 * MAN },
      target,
      'apartment',
    );

    expect(result.orderReversed).toBe(false);
    expect(result.cheaperAsWritten).toBe('a');
    expect(result.cheaperRestated).toBe('a');
  });

  it('reports equal conditions as neither side cheaper', () => {
    const result = compareAtSameDeposit(
      { depositWon: target, monthlyRentWon: 80 * MAN },
      { depositWon: target, monthlyRentWon: 80 * MAN },
      target,
      'apartment',
    );

    expect(result.cheaperAsWritten).toBeNull();
    expect(result.cheaperRestated).toBeNull();
    expect(result.orderReversed).toBe(false);
  });

  it('clamps a negative restatement to zero and says so', () => {
    const result = compareAtSameDeposit(
      { depositWon: 1_000 * MAN, monthlyRentWon: 10 * MAN },
      { depositWon: target, monthlyRentWon: 80 * MAN },
      5 * EOK,
      'apartment',
    );

    expect(result.clamped).toBe(true);
    expect(result.aMonthlyWon).toBe(0);
  });
});
