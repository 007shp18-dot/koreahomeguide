import { SEOUL_RENT_CHECK_DISTRICTS, type SeoulLawdCd } from './districts';
import {
  HOUSING_TYPE_PRESETS,
  type ComparableContract,
  type KoreaRecordStatus,
  type RentCheckHousingType,
  type RentCheckQuote,
  type SourceHousingType,
} from './browser';

export {
  HOUSING_TYPE_PRESETS,
  canonicalAreaFromPyeong,
  type ComparableContract,
  type ContractTypeCounts,
  type KoreaContractType,
  type KoreaRecordStatus,
  type RentCheckHousingType,
  type RentCheckMonths,
  type RentCheckQuote,
  type RentCheckTier,
  type SeoulRentCheckEnvelope,
  type SeoulRentCheckErrorCode,
  type SeoulRentCheckErrorEnvelope,
  type SeoulRentCheckResult,
  type SourceHousingType,
  type SourceRecordStatusCounts,
} from './browser';

/** Provider-only record. This type is intentionally absent from the browser subpath. */
export type KoreaRentRecord = Omit<ComparableContract, 'recordStatus'> & {
  readonly sourceHousingType: SourceHousingType;
  readonly recordStatus: KoreaRecordStatus;
  readonly sourceRecordId?: string;
};

type QueryParams = Pick<URLSearchParams, 'forEach' | 'getAll'>;

const QUERY_NAMES = new Set(['lawdCd', 'type', 'deposit', 'rent', 'area']);
const SEOUL_LAWD_CODES = new Set<string>(
  SEOUL_RENT_CHECK_DISTRICTS.map((district) => district.lawdCd),
);
const HOUSING_TYPES = new Set<string>(Object.keys(HOUSING_TYPE_PRESETS));
const SOURCE_TYPE_BY_REQUESTED: Readonly<Record<RentCheckHousingType, SourceHousingType>> = {
  apartment: 'apartment',
  officetel: 'officetel',
  villa: 'villa',
  detached: 'detached',
  studio: 'detached',
};

function invalidInput(message: string): never {
  throw new TypeError(message);
}

function singleValue(params: QueryParams, name: string): string {
  const values = params.getAll(name);
  if (values.length !== 1) invalidInput(`Query parameter ${name} must occur exactly once.`);
  return values[0]!;
}

function parseWon(value: string, field: string, maximum: number): number {
  if (!/^(?:0|[1-9][0-9]*)$/.test(value)) {
    invalidInput(`${field} must use canonical integer KRW syntax.`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > maximum) {
    invalidInput(`${field} is outside the supported KRW range.`);
  }
  return parsed;
}

function parseArea(value: string): number {
  if (!/^(?:0\.[0-9]{1,2}|[1-9][0-9]*(?:\.[0-9]{1,2})?)$/.test(value)) {
    invalidInput('Area must be a positive canonical decimal with at most two decimals.');
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 2_000) {
    invalidInput('Area must be greater than zero and no more than 2,000 square metres.');
  }
  return parsed;
}

export function parseSeoulRentCheckQuery(params: QueryParams): RentCheckQuote {
  params.forEach((_value, name) => {
    if (!QUERY_NAMES.has(name)) invalidInput(`Unexpected query parameter ${name}.`);
  });

  const lawdCd = singleValue(params, 'lawdCd');
  const requestedHousingType = singleValue(params, 'type');
  const depositWon = parseWon(singleValue(params, 'deposit'), 'Deposit', 20_000_000_000);
  const monthlyRentWon = parseWon(singleValue(params, 'rent'), 'Monthly rent', 100_000_000);
  const areaSqm = parseArea(singleValue(params, 'area'));

  if (!/^\d{5}$/.test(lawdCd) || !SEOUL_LAWD_CODES.has(lawdCd)) {
    invalidInput('lawdCd must identify a verified Seoul district.');
  }
  if (!HOUSING_TYPES.has(requestedHousingType)) {
    invalidInput('Housing type is not supported.');
  }
  if (depositWon === 0 && monthlyRentWon === 0) {
    invalidInput('Deposit and monthly rent cannot both be zero.');
  }

  const typedLawdCd = lawdCd as SeoulLawdCd;
  const typedRequestedHousingType = requestedHousingType as RentCheckHousingType;
  return {
    lawdCd: typedLawdCd,
    requestedHousingType: typedRequestedHousingType,
    sourceHousingType: SOURCE_TYPE_BY_REQUESTED[typedRequestedHousingType],
    depositWon,
    monthlyRentWon,
    areaSqm,
  };
}
