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

  test('keeps money fields digit-only and clears a stale result after edits', () => {
    const calculated = contractCheckReducer(validDraft(), {
      type: 'CALCULATE',
      curve: apartmentCurve,
    });
    expect(calculated.result).not.toBeNull();

    const edited = edit(calculated, 'a', 'depositWon', '₩ 120,000,000 won');

    expect(edited.offers.a.depositWon).toBe('120000000');
    expect(edited.result).toBeNull();
    expect(edited.errors).toEqual({});
  });

  test('switches housing type without discarding drafts but requires recalculation', () => {
    const calculated = contractCheckReducer(validDraft(), {
      type: 'CALCULATE',
      curve: apartmentCurve,
    });
    const switched = contractCheckReducer(calculated, {
      type: 'SET_HOUSING_TYPE',
      housingType: 'officetel',
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
      referenceDeposit: 30_000_000,
      roundedMonthlyDifference: 33_333,
      offers: [
        {
          offer: { id: 'a', label: 'Near the station' },
          roundedNormalizedMonthlyCost: 333_333,
          appliedRate: { annualRate: 0.04, rangeState: 'observed' },
        },
        {
          offer: { id: 'b' },
          roundedNormalizedMonthlyCost: 300_000,
          appliedRate: { annualRate: 0.05, rangeState: 'observed' },
        },
      ],
    });
  });

  test('fails closed on missing, zero-only, and out-of-range money inputs', () => {
    const empty = contractCheckReducer(createContractCheckState(), {
      type: 'CALCULATE',
      curve: apartmentCurve,
    });
    expect(empty.result).toBeNull();
    expect(empty.errors).toMatchObject({
      a: { depositWon: 'Enter a deposit.', monthlyRentWon: 'Enter monthly rent.' },
      b: { depositWon: 'Enter a deposit.', monthlyRentWon: 'Enter monthly rent.' },
    });

    let zero = createContractCheckState();
    for (const offerId of ['a', 'b'] as const) {
      zero = edit(zero, offerId, 'depositWon', '0');
      zero = edit(zero, offerId, 'monthlyRentWon', '0');
    }
    zero = contractCheckReducer(zero, { type: 'CALCULATE', curve: apartmentCurve });
    expect(zero.errors).toMatchObject({
      a: { offer: 'Deposit and monthly rent cannot both be zero.' },
      b: { offer: 'Deposit and monthly rent cannot both be zero.' },
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

  test('rejects a curve for a different housing type and resets cleanly', () => {
    const mismatch = contractCheckReducer(
      contractCheckReducer(validDraft(), {
        type: 'SET_HOUSING_TYPE',
        housingType: 'officetel',
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
