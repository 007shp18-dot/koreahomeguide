import type {
  ComparableRentContract,
  RentComparisonResult,
  RentQuote,
  SourceCoverage,
} from '@signedprice/market-core';

import type { SeoulLawdCd } from './districts';
import {
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
  RENT_CHECK_ANNUAL_DEPOSIT_RATE,
  RENT_CHECK_METHODOLOGY_POLICY_ID,
  RENT_CHECK_METHODOLOGY_VERSION,
} from './public-versions';

export {
  getSeoulDistrictBySlug,
  SEOUL_RENT_CHECK_DISTRICTS,
  type SeoulDistrictSlug,
  type SeoulLawdCd,
  type SeoulRentCheckDistrict,
} from './districts';
export {
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
  RENT_CHECK_ANNUAL_DEPOSIT_RATE,
  RENT_CHECK_METHODOLOGY_POLICY_ID,
  RENT_CHECK_METHODOLOGY_VERSION,
} from './public-versions';

export type RentCheckHousingType =
  | 'apartment'
  | 'officetel'
  | 'villa'
  | 'detached'
  | 'studio';

export type SourceHousingType = Exclude<RentCheckHousingType, 'studio'>;
export type {
  KoreaConversionCurveProjection,
  KoreaConversionHousingType,
} from './conversion-artifact';
export type KoreaContractType = 'new' | 'renewal' | 'unknown';
export type KoreaRecordStatus = 'active' | 'cancelled' | 'unknown';
export type RentCheckTier = 1 | 2 | 3;
export type RentCheckMonths = 3 | 6 | 12;

export const HOUSING_TYPE_PRESETS = {
  apartment: [35, 60, 85],
  officetel: [15, 20, 30],
  villa: [20, 35, 60],
  detached: [20, 35, 50],
  studio: [15, 20, 25],
} as const satisfies Readonly<Record<RentCheckHousingType, readonly number[]>>;

type PortableKoreaQuote = RentQuote<RentCheckHousingType, SourceHousingType>;

/** Korea specialization of the portable quote with explicit KRW field names. */
export type RentCheckQuote = Omit<PortableKoreaQuote, 'deposit' | 'monthlyRent'> & {
  readonly lawdCd: SeoulLawdCd;
  readonly depositWon: number;
  readonly monthlyRentWon: number;
};

type PortableKoreaComparable = ComparableRentContract<KoreaContractType>;

/** Narrow public evidence row; provider-only fields stay on KoreaRentRecord. */
export type ComparableContract = Omit<
  PortableKoreaComparable,
  'deposit' | 'monthlyRent' | 'sourceRecordId'
> & {
  readonly depositWon: number;
  readonly monthlyRentWon: number;
  readonly recordStatus: Exclude<KoreaRecordStatus, 'cancelled'>;
};

type PortableKoreaResult = Omit<
  RentComparisonResult,
  'askingValue' | 'medianValue' | 'p25Value' | 'p75Value' | 'comparables'
>;

export type SeoulRentCheckResult = PortableKoreaResult & {
  readonly comparisonMode: 'monthly-rent' | 'jeonse-deposit';
  readonly comparisonBasis: 'deposit-adjusted-monthly-rent' | 'jeonse-deposit';
  readonly askingValueWon: number;
  readonly medianValueWon: number | null;
  readonly minValueWon: number | null;
  readonly p25ValueWon: number | null;
  readonly p75ValueWon: number | null;
  readonly maxValueWon: number | null;
  readonly monthsUsed: RentCheckMonths;
  readonly tier: RentCheckTier | null;
};

export type ContractTypeCounts = Readonly<Record<KoreaContractType, number>>;
export type SourceRecordStatusCounts = Readonly<Record<KoreaRecordStatus, number>>;

export type SeoulRentCheckEnvelope = {
  readonly marketId: 'kr-seoul';
  readonly status: 'success' | 'insufficient';
  readonly requestedHousingType: RentCheckHousingType;
  readonly sourceHousingType: SourceHousingType;
  readonly typeMapping: {
    readonly applied: boolean;
    readonly explanation: string | null;
  };
  readonly source: {
    readonly provider: 'MOLIT';
    readonly dataset: string;
    readonly endpointVersion: string;
    readonly parserVersion: string;
    readonly rightsPolicyId: string;
    readonly attribution: readonly string[];
  };
  readonly coverage: SourceCoverage<
    'contract_date',
    'Asia/Seoul',
    RentCheckMonths,
    string,
    string
  >;
  readonly methodology: {
    readonly policyId: typeof RENT_CHECK_METHODOLOGY_POLICY_ID;
    readonly version: typeof RENT_CHECK_METHODOLOGY_VERSION;
    readonly annualDepositRate: typeof RENT_CHECK_ANNUAL_DEPOSIT_RATE | null;
    readonly verdictBasis: SeoulRentCheckResult['verdictBasis'];
    readonly contractSelection: 'new_only' | 'mixed' | null;
    readonly eligibleContractTypeCounts: ContractTypeCounts;
    readonly selectedContractTypeCounts: ContractTypeCounts;
    readonly sourceRecordStatusCounts: SourceRecordStatusCounts;
  };
  readonly result: SeoulRentCheckResult;
  readonly comparables: readonly ComparableContract[];
  readonly limitations: readonly string[];
};

export type SeoulRentCheckErrorCode =
  | 'invalid_request'
  | 'untrusted_request'
  | 'rate_limited'
  | 'configuration_missing'
  | 'rights_blocked'
  | 'source_timeout'
  | 'source_malformed'
  | 'source_unavailable'
  | 'internal_error';

export type SeoulRentCheckErrorEnvelope = {
  readonly status: 'error';
  readonly error: {
    readonly code: SeoulRentCheckErrorCode;
    readonly message: string;
    readonly retryable: boolean;
    readonly retryAfterSeconds: number | null;
  };
};

export function canonicalAreaFromPyeong(pyeong: number): number {
  if (!Number.isFinite(pyeong) || pyeong <= 0) {
    throw new TypeError('Pyeong must be a positive finite number.');
  }
  return Math.round(pyeong * 3.3058 * 100) / 100;
}

export { isPublishedRentCheckResultTuplePossible } from './result-validation';
