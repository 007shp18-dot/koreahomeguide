import type {
  KoreaConversionCurveProjection,
  KoreaConversionHousingType,
} from '@signedprice/korea-rent';
import {
  compareRentOffers,
  type RentContractComparison,
} from '@signedprice/market-core';

export type ContractOfferDraft = Readonly<{
  label: string;
  depositWon: string;
  monthlyRentWon: string;
}>;

export type ContractOfferErrors = Readonly<{
  depositWon?: string;
  monthlyRentWon?: string;
  offer?: string;
}>;

export type ContractCheckErrors = Readonly<{
  a?: ContractOfferErrors;
  b?: ContractOfferErrors;
  form?: string;
}>;

export type ContractCheckState = Readonly<{
  housingType: KoreaConversionHousingType;
  offers: Readonly<Record<'a' | 'b', ContractOfferDraft>>;
  errors: ContractCheckErrors;
  result: RentContractComparison<KoreaConversionHousingType> | null;
}>;

export type ContractCheckAction =
  | Readonly<{
      type: 'EDIT_OFFER_FIELD';
      offerId: 'a' | 'b';
      field: keyof ContractOfferDraft;
      value: string;
      curve?: KoreaConversionCurveProjection;
    }>
  | Readonly<{
      type: 'SET_HOUSING_TYPE';
      housingType: KoreaConversionHousingType;
      curve?: KoreaConversionCurveProjection;
    }>
  | Readonly<{ type: 'CALCULATE'; curve: KoreaConversionCurveProjection }>
  | Readonly<{ type: 'RESET' }>;

const MAX_DEPOSIT_WON = 20_000_000_000;
const MAX_MONTHLY_RENT_WON = 100_000_000;

function emptyDraft(): ContractOfferDraft {
  return { label: '', depositWon: '', monthlyRentWon: '' };
}

function wholeWonDigits(value: string): string | undefined {
  const match = /^(?:₩ ?)?([0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)(?: ?(?:원|won))?$/i
    .exec(value);
  return match?.[1]?.replaceAll(',', '');
}

export function createContractCheckState(): ContractCheckState {
  return {
    housingType: 'apartment',
    offers: { a: emptyDraft(), b: emptyDraft() },
    errors: {},
    result: null,
  };
}

function moneyValue(
  value: string,
  kind: 'deposit' | 'monthlyRent',
): Readonly<{ value?: number; error?: string }> {
  if (value === '') {
    return { error: kind === 'deposit' ? 'Enter a deposit.' : 'Enter monthly rent.' };
  }
  const digits = wholeWonDigits(value);
  if (digits === undefined) {
    return {
      error: kind === 'deposit'
        ? 'Deposit must be a positive whole-won amount.'
        : 'Monthly rent must be a positive whole-won amount.',
    };
  }
  const parsed = Number(digits);
  const maximum = kind === 'deposit' ? MAX_DEPOSIT_WON : MAX_MONTHLY_RENT_WON;
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return {
      error: kind === 'deposit'
        ? 'Deposit must be a positive whole-won amount.'
        : 'Monthly rent must be a positive whole-won amount.',
    };
  }
  if (parsed > maximum) {
    return {
      error: kind === 'deposit'
        ? 'Deposit must be ₩20,000,000,000 or less.'
        : 'Monthly rent must be ₩100,000,000 or less.',
    };
  }
  return { value: parsed };
}

function validateOffer(draft: ContractOfferDraft): Readonly<{
  deposit?: number;
  monthlyRent?: number;
  errors: ContractOfferErrors;
}> {
  const deposit = moneyValue(draft.depositWon, 'deposit');
  const monthlyRent = moneyValue(draft.monthlyRentWon, 'monthlyRent');
  const errors: {
    depositWon?: string;
    monthlyRentWon?: string;
    offer?: string;
  } = {};
  if (deposit.error !== undefined) errors.depositWon = deposit.error;
  if (monthlyRent.error !== undefined) errors.monthlyRentWon = monthlyRent.error;
  return { deposit: deposit.value, monthlyRent: monthlyRent.value, errors };
}

function calculate(
  state: ContractCheckState,
  curve: KoreaConversionCurveProjection,
): ContractCheckState {
  if (curve.housingType !== state.housingType) {
    return {
      ...state,
      errors: { form: 'Verified evidence for the selected housing type is unavailable.' },
      result: null,
    };
  }

  const a = validateOffer(state.offers.a);
  const b = validateOffer(state.offers.b);
  const errors: { a?: ContractOfferErrors; b?: ContractOfferErrors } = {};
  if (Object.keys(a.errors).length > 0) errors.a = a.errors;
  if (Object.keys(b.errors).length > 0) errors.b = b.errors;
  if (errors.a !== undefined || errors.b !== undefined) {
    return { ...state, errors, result: null };
  }

  try {
    const result = compareRentOffers({
      curve,
      offers: [
        {
          id: 'a',
          ...(state.offers.a.label.trim() === ''
            ? {}
            : { label: state.offers.a.label.trim() }),
          housingType: state.housingType,
          deposit: a.deposit!,
          monthlyRent: a.monthlyRent!,
        },
        {
          id: 'b',
          ...(state.offers.b.label.trim() === ''
            ? {}
            : { label: state.offers.b.label.trim() }),
          housingType: state.housingType,
          deposit: b.deposit!,
          monthlyRent: b.monthlyRent!,
        },
      ],
    });
    return { ...state, errors: {}, result };
  } catch {
    return {
      ...state,
      errors: { form: 'These offers could not be compared with verified evidence.' },
      result: null,
    };
  }
}

export function contractCheckReducer(
  state: ContractCheckState,
  action: ContractCheckAction,
): ContractCheckState {
  if (action.type === 'RESET') return createContractCheckState();

  if (action.type === 'SET_HOUSING_TYPE') {
    const next = {
      ...state,
      housingType: action.housingType,
      errors: {},
      result: null,
    };
    return action.curve === undefined ? next : calculate(next, action.curve);
  }

  if (action.type === 'EDIT_OFFER_FIELD') {
    const value = action.field === 'label'
      ? action.value.slice(0, 80)
      : wholeWonDigits(action.value) ?? action.value;
    const next = {
      ...state,
      offers: {
        ...state.offers,
        [action.offerId]: {
          ...state.offers[action.offerId],
          [action.field]: value,
        },
      },
      errors: {},
      result: null,
    };
    return action.curve === undefined ? next : calculate(next, action.curve);
  }

  return calculate(state, action.curve);
}
