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
    }>
  | Readonly<{
      type: 'SET_HOUSING_TYPE';
      housingType: KoreaConversionHousingType;
    }>
  | Readonly<{ type: 'CALCULATE'; curve: KoreaConversionCurveProjection }>
  | Readonly<{ type: 'RESET' }>;

const MAX_DEPOSIT_WON = 20_000_000_000;
const MAX_MONTHLY_RENT_WON = 100_000_000;

function emptyDraft(): ContractOfferDraft {
  return { label: '', depositWon: '', monthlyRentWon: '' };
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
  const parsed = Number(value);
  const maximum = kind === 'deposit' ? MAX_DEPOSIT_WON : MAX_MONTHLY_RENT_WON;
  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
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
  if (
    deposit.value !== undefined
    && monthlyRent.value !== undefined
    && deposit.value === 0
    && monthlyRent.value === 0
  ) {
    errors.offer = 'Deposit and monthly rent cannot both be zero.';
  }
  return { deposit: deposit.value, monthlyRent: monthlyRent.value, errors };
}

export function contractCheckReducer(
  state: ContractCheckState,
  action: ContractCheckAction,
): ContractCheckState {
  if (action.type === 'RESET') return createContractCheckState();

  if (action.type === 'SET_HOUSING_TYPE') {
    return {
      ...state,
      housingType: action.housingType,
      errors: {},
      result: null,
    };
  }

  if (action.type === 'EDIT_OFFER_FIELD') {
    const value = action.field === 'label'
      ? action.value.slice(0, 80)
      : action.value.replace(/\D/g, '');
    return {
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
  }

  if (action.curve.housingType !== state.housingType) {
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
      curve: action.curve,
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
