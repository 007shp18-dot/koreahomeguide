import type { KoreaConversionCurveProjection } from '@signedprice/korea-rent';
import { describe, expect, test } from 'vitest';

import {
  contractCheckReducer,
  createContractCheckState,
} from '../lib/contract-check/client-state';

const apartmentCurve: KoreaConversionCurveProjection = Object.freeze({
  housingType: 'apartment',
  period: '2026-03/2026-08',
  generatedAt: '2026-08-31T00:00:00.000Z',
  anchors: Object.freeze([
    Object.freeze({ deposit: 30_000_000, annualRate: 0.05, pairCount: 140 }),
    Object.freeze({ deposit: 100_000_000, annualRate: 0.04, pairCount: 160 }),
  ]),
});

function edit(
  state: ReturnType<typeof createContractCheckState>,
  offerId: 'a' | 'b',
  field: 'label' | 'depositWon' | 'monthlyRentWon',
  value: string,
) {
  return contractCheckReducer(state, {
    type: 'EDIT_OFFER_FIELD',
    offerId,
    field,
    value,
    curve: apartmentCurve,
  });
}

function validDraft() {
  let state = createContractCheckState();
  state = edit(state, 'a', 'label', 'Near the station');
  state = edit(state, 'a', 'depositWon', '100000000');
  state = edit(state, 'a', 'monthlyRentWon', '100000');
  state = edit(state, 'b', 'depositWon', '30000000');
  state = edit(state, 'b', 'monthlyRentWon', '300000');
  return state;
}

describe('contract check client state', () => {
  test('starts with two independent apartment offers and no result', () => {
    const state = createContractCheckState();

    expect(state).toMatchObject({
      housingType: 'apartment',
      offers: {
        a: { label: '', depositWon: '', monthlyRentWon: '' },
        b: { label: '', depositWon: '', monthlyRentWon: '' },
      },
      errors: {},
      result: null,
    });
    expect(state.offers.a).not.toBe(state.offers.b);
  });

  test('normalizes valid grouped whole-won input and recalculates after every valid edit', () => {
    const calculated = contractCheckReducer(validDraft(), {
      type: 'CALCULATE',
      curve: apartmentCurve,
    });
    expect(calculated.result).not.toBeNull();

    const edited = edit(calculated, 'a', 'depositWon', '90,000,000');

    expect(edited.offers.a.depositWon).toBe('90000000');
    expect(edited.result).not.toBeNull();
    expect(edited.errors).toEqual({});
  });

  test.each([
    '₩30,000,000',
    '₩ 30,000,000',
    '30,000,000원',
    '30,000,000 원',
    '30,000,000won',
    '30,000,000 won',
    '30,000,000 WON',
    '₩ 30,000,000 원',
    '₩30,000,000won',
  ])('normalizes strict decorated whole-won syntax %s', (draft) => {
    const state = edit(validDraft(), 'a', 'depositWon', draft);

    expect(state.offers.a.depositWon).toBe('30000000');
    expect(state.errors).toEqual({});
    expect(state.result).not.toBeNull();
  });

  test('switches housing type without discarding drafts but requires recalculation', () => {
    const calculated = contractCheckReducer(validDraft(), {
      type: 'CALCULATE',
      curve: apartmentCurve,
    });
    const switched = contractCheckReducer(calculated, {
      type: 'SET_HOUSING_TYPE',
      housingType: 'officetel',
      curve: undefined,
    });

    expect(switched.housingType).toBe('officetel');
    expect(switched.offers).toEqual(calculated.offers);
    expect(switched.result).toBeNull();
  });

  test('calculates the normalized winner and identifies a raw-rent ranking flip', () => {
    const calculated = contractCheckReducer(validDraft(), {
      type: 'CALCULATE',
      curve: apartmentCurve,
    });

    expect(calculated.errors).toEqual({});
    expect(calculated.result).toMatchObject({
      winner: 'b',
      rankingFlipped: true,
      roundedMonthlyDifference: 8_333,
      offers: [
        {
          offer: { id: 'a', label: 'Near the station' },
          roundedNormalizedMonthlyCost: 433_333,
          appliedRate: { annualRate: 0.04, rangeState: 'observed' },
        },
        {
          offer: { id: 'b' },
          roundedNormalizedMonthlyCost: 425_000,
          appliedRate: { annualRate: 0.05, rangeState: 'observed' },
        },
      ],
    });
  });

  test('accepts empty or zero monthly rent but fails closed on missing deposits and limits', () => {
    const empty = contractCheckReducer(createContractCheckState(), {
      type: 'CALCULATE',
      curve: apartmentCurve,
    });
    expect(empty.result).toBeNull();
    expect(empty.errors).toMatchObject({
      a: { depositWon: 'Enter a deposit.' },
      b: { depositWon: 'Enter a deposit.' },
    });
    expect(empty.errors.a).not.toHaveProperty('monthlyRentWon');
    expect(empty.errors.b).not.toHaveProperty('monthlyRentWon');

    let jeonse = createContractCheckState();
    jeonse = edit(jeonse, 'a', 'depositWon', '30000000');
    jeonse = edit(jeonse, 'b', 'depositWon', '100000000');
    jeonse = edit(jeonse, 'b', 'monthlyRentWon', '0');
    expect(jeonse.errors).toEqual({});
    expect(jeonse.result).toMatchObject({
      offers: [
        { offer: { monthlyRent: 0 }, roundedNormalizedMonthlyCost: 125_000 },
        { offer: { monthlyRent: 0 }, roundedNormalizedMonthlyCost: 333_333 },
      ],
    });

    let zero = createContractCheckState();
    for (const offerId of ['a', 'b'] as const) {
      zero = edit(zero, offerId, 'depositWon', '0');
      zero = edit(zero, offerId, 'monthlyRentWon', '0');
    }
    zero = contractCheckReducer(zero, { type: 'CALCULATE', curve: apartmentCurve });
    expect(zero.errors).toMatchObject({
      a: {
        depositWon: 'Deposit must be a positive whole-won amount.',
      },
      b: {
        depositWon: 'Deposit must be a positive whole-won amount.',
      },
    });

    let excessive = validDraft();
    excessive = edit(excessive, 'a', 'depositWon', '20000000001');
    excessive = edit(excessive, 'b', 'monthlyRentWon', '100000001');
    excessive = contractCheckReducer(excessive, {
      type: 'CALCULATE',
      curve: apartmentCurve,
    });
    expect(excessive.errors).toMatchObject({
      a: { depositWon: 'Deposit must be ₩20,000,000,000 or less.' },
      b: { monthlyRentWon: 'Monthly rent must be ₩100,000,000 or less.' },
    });
  });

  test('holds the comparison when either deposit is outside the measured range', () => {
    let below = validDraft();
    below = edit(below, 'a', 'depositWon', '20000000');
    expect(below.result).toBeNull();
    expect(below.errors.a?.offer).toBe('Deposit falls outside the measured range. No comparison is produced.');

    let above = validDraft();
    above = edit(above, 'b', 'depositWon', '120000000');
    expect(above.result).toBeNull();
    expect(above.errors.b?.offer).toBe('Deposit falls outside the measured range. No comparison is produced.');
  });

  test('rejects every non-decimal whole-won syntax without throwing', () => {
    const invalidDrafts = [
      '',
      '0',
      '-1',
      '+1',
      '1.0',
      '1.5',
      '1e8',
      '1E8',
      '0x10',
      '0b10',
      '0o10',
      ' 1000',
      '1000 ',
      '1 000',
      '1,00',
      '12,34',
      '1,0000',
      '1,,000',
      ',1000',
      '1000,',
      '１０００',
      '₩',
      '원',
      'won',
      '₩ 원',
      '원1000',
      'won1000',
      '1000₩',
      '₩₩1000',
      '1000원원',
      '1000won원',
      '₩  1000',
      '1000  원',
      '1₩000',
      '1000원 won',
      '₩ 1.0 원',
      '₩ 1,00 원',
    ] as const;

    for (const invalid of invalidDrafts) {
      expect(() => edit(validDraft(), 'a', 'depositWon', invalid)).not.toThrow();
      const state = edit(validDraft(), 'a', 'depositWon', invalid);
      expect(state.result).toBeNull();
      expect(state.errors.a?.depositWon).toBeDefined();
    }
  });

  test('rejects a curve for a different housing type and resets cleanly', () => {
    const mismatch = contractCheckReducer(
      contractCheckReducer(validDraft(), {
        type: 'SET_HOUSING_TYPE',
        housingType: 'officetel',
        curve: undefined,
      }),
      { type: 'CALCULATE', curve: apartmentCurve },
    );
    expect(mismatch.result).toBeNull();
    expect(mismatch.errors).toEqual({
      form: 'Verified evidence for the selected housing type is unavailable.',
    });

    expect(contractCheckReducer(validDraft(), { type: 'RESET' })).toEqual(
      createContractCheckState(),
    );
  });
});
