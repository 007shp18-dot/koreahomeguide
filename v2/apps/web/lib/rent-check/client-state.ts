import {
  canonicalAreaFromPyeong,
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
  RENT_CHECK_ANNUAL_DEPOSIT_RATE,
  RENT_CHECK_METHODOLOGY_POLICY_ID,
  RENT_CHECK_METHODOLOGY_VERSION,
  type RentCheckHousingType,
  type SeoulRentCheckEnvelope,
  type SeoulRentCheckErrorCode,
  isPublishedRentCheckResultTuplePossible,
} from '@signedprice/korea-rent/browser';

export type RentCheckCacheStatus = 'hit' | 'miss' | 'stale';
export type RentCheckAreaUnit = 'sqm' | 'pyeong';

export type RentCheckInput = {
  readonly lawdCd: string;
  readonly housingType: RentCheckHousingType;
  readonly areaSqm: string;
  readonly areaUnit: RentCheckAreaUnit;
  readonly depositWon: string;
  readonly monthlyRentWon: string;
};

export type RentCheckValidationErrors = Partial<Record<
  'areaSqm' | 'depositWon' | 'monthlyRentWon',
  string
>>;

export type RentCheckApiSuccess = {
  readonly envelope: SeoulRentCheckEnvelope;
  readonly cacheStatus: RentCheckCacheStatus;
};

export type RentCheckClientError = {
  readonly code: SeoulRentCheckErrorCode;
  readonly message: string;
  readonly retryable: boolean;
  readonly retryAfterSeconds: number | null;
};

export type RentCheckStatus = 'idle' | 'loading' | 'success' | 'insufficient' | 'error';

export type RentCheckState = {
  readonly status: RentCheckStatus;
  readonly draftInput: RentCheckInput;
  readonly areaDisplay: string;
  readonly checkedInput: RentCheckInput | null;
  readonly requestId: number;
  readonly abortController: AbortController | null;
  readonly envelope: SeoulRentCheckEnvelope | null;
  readonly cacheStatus: RentCheckCacheStatus | null;
  readonly error: RentCheckClientError | null;
};

export type RentCheckAction =
  | {
      readonly type: 'EDIT';
      readonly field: 'lawdCd' | 'housingType' | 'depositWon' | 'monthlyRentWon';
      readonly value: string;
    }
  | { readonly type: 'EDIT_AREA'; readonly value: string; readonly unit: RentCheckAreaUnit }
  | { readonly type: 'SET_AREA_UNIT'; readonly unit: RentCheckAreaUnit }
  | {
      readonly type: 'SUBMIT';
      readonly requestId: number;
      readonly controller: AbortController;
    }
  | {
      readonly type: 'RESOLVE';
      readonly requestId: number;
      readonly response: RentCheckApiSuccess;
    }
  | {
      readonly type: 'REJECT';
      readonly requestId: number;
      readonly error: RentCheckClientError;
    };

export const DEFAULT_RENT_CHECK_INPUT: RentCheckInput = {
  lawdCd: '11590',
  housingType: 'officetel',
  areaSqm: '',
  areaUnit: 'sqm',
  depositWon: '',
  monthlyRentWon: '',
};

export function createInitialRentCheckState(
  input: RentCheckInput = DEFAULT_RENT_CHECK_INPUT,
): RentCheckState {
  return {
    status: 'idle',
    draftInput: input,
    areaDisplay: derivedAreaDisplay(input.areaSqm, input.areaUnit),
    checkedInput: null,
    requestId: 0,
    abortController: null,
    envelope: null,
    cacheStatus: null,
    error: null,
  };
}

function idleAfterEdit(
  state: RentCheckState,
  draftInput: RentCheckInput,
  areaDisplay = state.areaDisplay,
): RentCheckState {
  return {
    status: 'idle',
    draftInput,
    areaDisplay,
    checkedInput: null,
    requestId: state.requestId,
    abortController: null,
    envelope: null,
    cacheStatus: null,
    error: null,
  };
}

export function abortOwnedRentCheckRequest(state: RentCheckState): void {
  state.abortController?.abort();
}

function canonicalNumber(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function derivedAreaDisplay(areaSqm: string, unit: RentCheckAreaUnit): string {
  if (unit === 'sqm' || areaSqm === '') return areaSqm;
  const squareMetres = Number(areaSqm);
  if (!Number.isFinite(squareMetres) || squareMetres <= 0) return '';
  return canonicalNumber(squareMetres / 3.3058);
}

export function areaDisplayValue(input: RentCheckInput | RentCheckState): string {
  if ('draftInput' in input) return input.areaDisplay;
  return derivedAreaDisplay(input.areaSqm, input.areaUnit);
}

function canonicalAreaFromDisplay(
  value: string,
  unit: RentCheckAreaUnit,
): string | null {
  if (!/^(?:0\.[0-9]{1,2}|[1-9][0-9]*(?:\.[0-9]{1,2})?)$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return unit === 'pyeong'
    ? canonicalNumber(canonicalAreaFromPyeong(parsed))
    : value;
}

function validWon(value: string, maximum: number): boolean {
  if (!/^(?:0|[1-9][0-9]*)$/.test(value)) return false;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= maximum;
}

export function validateRentCheckInput(
  input: RentCheckInput,
  displayValue = areaDisplayValue(input),
): RentCheckValidationErrors {
  const errors: RentCheckValidationErrors = {};
  const canonicalArea = canonicalAreaFromDisplay(displayValue, input.areaUnit);
  const area = canonicalArea === null ? Number.NaN : Number(canonicalArea);
  if (!Number.isFinite(area) || area <= 0 || area > 2_000) {
    errors.areaSqm = 'Enter an area greater than 0 and no more than 2,000 ㎡.';
  }
  if (!validWon(input.depositWon, 20_000_000_000)) {
    errors.depositWon = 'Enter a whole-won deposit from 0 to 20,000,000,000.';
  }
  if (!validWon(input.monthlyRentWon, 100_000_000)) {
    errors.monthlyRentWon = 'Enter whole-won monthly rent from 0 to 100,000,000.';
  }
  if (Object.keys(errors).length === 0 &&
    input.depositWon === '0' && input.monthlyRentWon === '0') {
    const message = 'Deposit and monthly rent cannot both be zero.';
    errors.depositWon = message;
    errors.monthlyRentWon = message;
  }
  return errors;
}

export type RentCheckFocusable = { focus: () => void };

export function focusFirstRentCheckError(
  errors: RentCheckValidationErrors,
  targets: Readonly<Record<keyof RentCheckValidationErrors, RentCheckFocusable | null>>,
): void {
  for (const field of ['areaSqm', 'depositWon', 'monthlyRentWon'] as const) {
    if (errors[field]) {
      targets[field]?.focus();
      return;
    }
  }
}

export function clearRentCheckErrorsForAction(
  errors: RentCheckValidationErrors,
  action: RentCheckAction,
): RentCheckValidationErrors {
  const next = { ...errors };
  if (action.type === 'EDIT_AREA' || action.type === 'SET_AREA_UNIT') delete next.areaSqm;
  if (action.type === 'EDIT' && action.field === 'depositWon') {
    delete next.depositWon;
    delete next.monthlyRentWon;
  }
  if (action.type === 'EDIT' && action.field === 'monthlyRentWon') {
    delete next.depositWon;
    delete next.monthlyRentWon;
  }
  return next;
}

export function isQuoteMutatingRentCheckAction(action: RentCheckAction): boolean {
  return action.type === 'EDIT' || action.type === 'EDIT_AREA';
}

export function rentCheckReducer(
  state: RentCheckState,
  action: RentCheckAction,
): RentCheckState {
  switch (action.type) {
    case 'EDIT': {
      const draftInput = action.field === 'housingType'
        ? { ...state.draftInput, housingType: action.value as RentCheckHousingType }
        : { ...state.draftInput, [action.field]: action.value };
      return idleAfterEdit(state, draftInput);
    }
    case 'EDIT_AREA': {
      const canonicalArea = canonicalAreaFromDisplay(action.value, action.unit);
      return idleAfterEdit(state, {
        ...state.draftInput,
        areaSqm: canonicalArea ?? state.draftInput.areaSqm,
        areaUnit: action.unit,
      }, action.value);
    }
    case 'SET_AREA_UNIT':
      if (state.draftInput.areaUnit === action.unit) return state;
      return {
        ...state,
        draftInput: { ...state.draftInput, areaUnit: action.unit },
        checkedInput: state.checkedInput === null
          ? null
          : { ...state.checkedInput, areaUnit: action.unit },
        areaDisplay: derivedAreaDisplay(state.draftInput.areaSqm, action.unit),
      };
    case 'SUBMIT':
      if (action.requestId <= state.requestId) return state;
      return {
        status: 'loading',
        draftInput: state.draftInput,
        areaDisplay: state.areaDisplay,
        checkedInput: state.draftInput,
        requestId: action.requestId,
        abortController: action.controller,
        envelope: null,
        cacheStatus: null,
        error: null,
      };
    case 'RESOLVE':
      if (state.status !== 'loading' || action.requestId !== state.requestId) return state;
      return {
        ...state,
        status: action.response.envelope.status,
        abortController: null,
        envelope: action.response.envelope,
        cacheStatus: action.response.cacheStatus,
        error: null,
      };
    case 'REJECT':
      if (state.status !== 'loading' || action.requestId !== state.requestId) return state;
      return {
        status: 'error',
        draftInput: state.draftInput,
        areaDisplay: state.areaDisplay,
        checkedInput: null,
        requestId: state.requestId,
        abortController: null,
        envelope: null,
        cacheStatus: null,
        error: action.error,
      };
    default:
      return state;
  }
}

const RETRYABILITY_BY_ERROR_CODE: Readonly<Record<SeoulRentCheckErrorCode, boolean>> = {
  invalid_request: false,
  untrusted_request: false,
  rate_limited: true,
  configuration_missing: false,
  rights_blocked: false,
  source_timeout: true,
  source_malformed: true,
  source_unavailable: true,
  internal_error: false,
};

function isRentCheckErrorCode(value: unknown): value is SeoulRentCheckErrorCode {
  return typeof value === 'string' && Object.hasOwn(RETRYABILITY_BY_ERROR_CODE, value);
}
const CACHE_STATUSES = new Set<RentCheckCacheStatus>(['hit', 'miss', 'stale']);
const HOUSING_TYPES = new Set<RentCheckHousingType>([
  'apartment', 'officetel', 'villa', 'detached', 'studio',
]);
const SOURCE_HOUSING_TYPES = new Set(['apartment', 'officetel', 'villa', 'detached']);
const SOURCE_TYPE_BY_REQUESTED: Readonly<Record<RentCheckHousingType, string>> = {
  apartment: 'apartment', officetel: 'officetel', villa: 'villa',
  detached: 'detached', studio: 'detached',
};
const DATASET_BY_SOURCE: Readonly<Record<string, string>> = {
  apartment: 'Apartment rental contracts',
  officetel: 'Officetel rental contracts',
  villa: 'Villa and row-house rental contracts',
  detached: 'Detached and multi-unit rental contracts',
};
const BASE_LIMITATIONS = [
  'Official reported contracts use contract dates and are not current asking listings.',
  'Records may later be corrected or cancelled; status coverage is incomplete.',
  'This result is a market reference, not an appraisal or legal advice.',
  '5.0%/year signedprice comparison assumption.',
  'Floor, condition, furnishings, maintenance fees, view, renovation, exact brokerage fees, and deposit-return risk require separate verification.',
] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function safeCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function safeWon(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function nullableSafeWon(value: unknown): boolean {
  return value === null || safeWon(value);
}

function nullableFinite(value: unknown): boolean {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function validIso(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value;
}

function monthIndex(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (match === null) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < 1900 || year > 2200 || month < 1 || month > 12) return null;
  return year * 12 + month - 1;
}

function validCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return year >= 1900 && year <= 2200 && date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

function hasCountShape(value: unknown): boolean {
  return isObject(value) && hasExactKeys(value, ['new', 'renewal', 'unknown']) &&
    ['new', 'renewal', 'unknown'].every((key) => safeCount(value[key]));
}

function hasStatusCountShape(value: unknown): boolean {
  return isObject(value) && hasExactKeys(value, ['active', 'cancelled', 'unknown']) &&
    ['active', 'cancelled', 'unknown'].every((key) => safeCount(value[key]));
}

function isComparable(value: unknown, throughMonth: number, monthsUsed: number): boolean {
  if (!isObject(value)) return false;
  const keys = [
    'areaSqm', 'depositWon', 'monthlyRentWon', 'contractDate', 'contractType',
    'recordStatus', ...(value.buildingLabel === undefined ? [] : ['buildingLabel']),
  ];
  if (!hasExactKeys(value, keys)) return false;
  const comparableMonth = typeof value.contractDate === 'string'
    ? monthIndex(value.contractDate.slice(0, 7))
    : null;
  return (value.buildingLabel === undefined || typeof value.buildingLabel === 'string') &&
    (value.buildingLabel === undefined || value.buildingLabel.trim().length > 0) &&
    typeof value.areaSqm === 'number' && Number.isFinite(value.areaSqm) && value.areaSqm > 0 &&
    value.areaSqm <= 2_000 && safeWon(value.depositWon) && safeWon(value.monthlyRentWon) &&
    validCalendarDate(value.contractDate) && comparableMonth !== null &&
    comparableMonth <= throughMonth && comparableMonth > throughMonth - monthsUsed &&
    ['new', 'renewal', 'unknown'].includes(String(value.contractType)) &&
    ['active', 'unknown'].includes(String(value.recordStatus));
}

function countTotal(value: Record<string, unknown>): number {
  return (value.new as number) + (value.renewal as number) + (value.unknown as number);
}

function exactStrings(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.length === expected.length &&
    value.every((entry, index) => entry === expected[index]);
}

function isRentCheckEnvelope(
  value: unknown,
  input: RentCheckInput,
): value is SeoulRentCheckEnvelope {
  if (!isObject(value) || !hasExactKeys(value, [
    'marketId', 'status', 'requestedHousingType', 'sourceHousingType', 'typeMapping',
    'source', 'coverage', 'methodology', 'result', 'comparables', 'limitations',
  ]) || value.marketId !== 'kr-seoul' ||
    (value.status !== 'success' && value.status !== 'insufficient') ||
    value.requestedHousingType !== input.housingType ||
    !HOUSING_TYPES.has(value.requestedHousingType as RentCheckHousingType)) return false;

  const expectedSource = SOURCE_TYPE_BY_REQUESTED[input.housingType];
  const studio = input.housingType === 'studio';
  if (!SOURCE_HOUSING_TYPES.has(String(value.sourceHousingType)) ||
    value.sourceHousingType !== expectedSource) return false;

  const mapping = value.typeMapping;
  const source = value.source;
  const coverage = value.coverage;
  const method = value.methodology;
  const result = value.result;
  if (!isObject(mapping) || !hasExactKeys(mapping, ['applied', 'explanation']) ||
    mapping.applied !== studio || mapping.explanation !== (studio
      ? 'Studio is compared with detached/multi-unit source records.'
      : null) || !isObject(source) || !hasExactKeys(source, [
      'provider', 'dataset', 'endpointVersion', 'parserVersion', 'rightsPolicyId', 'attribution',
    ]) || source.provider !== 'MOLIT' || source.dataset !== DATASET_BY_SOURCE[expectedSource] ||
    source.endpointVersion !== MOLIT_ENDPOINT_VERSION ||
    source.parserVersion !== MOLIT_PARSER_VERSION ||
    source.rightsPolicyId !== MOLIT_RIGHTS_POLICY_ID || !exactStrings(
      source.attribution, ['Ministry of Land, Infrastructure and Transport (MOLIT)'],
    ) || !isObject(coverage) || !hasExactKeys(coverage, [
      'basis', 'timezone', 'coverageThroughMonth', 'latestContractMonth',
      'sourceRetrievedAt', 'responseGeneratedAt', 'monthsUsed',
    ]) ||
    coverage.basis !== 'contract_date' || coverage.timezone !== 'Asia/Seoul' ||
    monthIndex(coverage.coverageThroughMonth) === null ||
    !(coverage.latestContractMonth === null || monthIndex(coverage.latestContractMonth) !== null) ||
    !isObject(coverage.sourceRetrievedAt) || !hasExactKeys(
      coverage.sourceRetrievedAt, ['earliest', 'latest'],
    ) || !validIso(coverage.sourceRetrievedAt.earliest) ||
    !validIso(coverage.sourceRetrievedAt.latest) || !validIso(coverage.responseGeneratedAt) ||
    Date.parse(coverage.sourceRetrievedAt.earliest) > Date.parse(coverage.sourceRetrievedAt.latest) ||
    Date.parse(coverage.sourceRetrievedAt.latest) > Date.parse(coverage.responseGeneratedAt) ||
    ![3, 6, 12].includes(coverage.monthsUsed as number) || !isObject(method) ||
    !hasExactKeys(method, [
      'policyId', 'version', 'annualDepositRate', 'verdictBasis', 'contractSelection',
      'eligibleContractTypeCounts', 'selectedContractTypeCounts', 'sourceRecordStatusCounts',
    ]) || method.policyId !== RENT_CHECK_METHODOLOGY_POLICY_ID ||
    method.version !== RENT_CHECK_METHODOLOGY_VERSION ||
    method.annualDepositRate !== (Number(input.monthlyRentWon) > 0
      ? RENT_CHECK_ANNUAL_DEPOSIT_RATE
      : null) ||
    !['typical-range', 'median-fallback', null].includes(
      method.verdictBasis as 'typical-range' | 'median-fallback' | null,
    ) ||
    !['new_only', 'mixed', null].includes(
      method.contractSelection as 'new_only' | 'mixed' | null,
    ) ||
    !hasCountShape(method.eligibleContractTypeCounts) ||
    !hasCountShape(method.selectedContractTypeCounts) ||
    !hasStatusCountShape(method.sourceRecordStatusCounts) || !isObject(result) ||
    !hasExactKeys(result, [
      'rating', 'comparableCount', 'comparisonMode', 'comparisonBasis', 'askingValueWon',
      'medianValueWon', 'minValueWon', 'p25ValueWon', 'p75ValueWon', 'maxValueWon',
      'differencePct', 'percentileRank', 'verdictBasis', 'confidence', 'monthsUsed', 'tier',
    ])) return false;

  const monthlyMode = Number(input.monthlyRentWon) > 0;
  if (result.comparisonMode !== (monthlyMode ? 'monthly-rent' : 'jeonse-deposit') ||
    result.comparisonBasis !== (monthlyMode ? 'deposit-adjusted-monthly-rent' : 'jeonse-deposit') ||
    result.askingValueWon !== Number(monthlyMode ? input.monthlyRentWon : input.depositWon) ||
    !safeCount(result.comparableCount) || !nullableSafeWon(result.medianValueWon) ||
    !nullableSafeWon(result.minValueWon) || !nullableSafeWon(result.p25ValueWon) ||
    !nullableSafeWon(result.p75ValueWon) || !nullableSafeWon(result.maxValueWon) ||
    !nullableFinite(result.differencePct) || !(result.percentileRank === null ||
      (Number.isSafeInteger(result.percentileRank) && (result.percentileRank as number) >= 0 &&
        (result.percentileRank as number) <= 100)) ||
    ![3, 6, 12].includes(result.monthsUsed as number) || result.monthsUsed !== coverage.monthsUsed ||
    ![1, 2, 3, null].includes(result.tier as 1 | 2 | 3 | null) ||
    ['typical-range', 'median-fallback', null].includes(
      result.verdictBasis as 'typical-range' | 'median-fallback' | null,
    ) === false || ['high', 'medium', 'low', null].includes(
      result.confidence as 'high' | 'medium' | 'low' | null,
    ) === false || result.verdictBasis !== method.verdictBasis || !Array.isArray(value.comparables) ||
    !isStringArray(value.limitations)) return false;

  const comparableCount = result.comparableCount as number;
  const selected = method.selectedContractTypeCounts as Record<string, unknown>;
  const eligible = method.eligibleContractTypeCounts as Record<string, unknown>;
  const statuses = method.sourceRecordStatusCounts as Record<string, unknown>;
  const expectedMonths = result.tier === 1 ? 3 : result.tier === 2 ? 6 : 12;
  const expectedConfidence = result.tier === 1
    ? comparableCount >= 7 ? 'high' : 'medium'
    : result.tier === 2 ? 'medium' : result.tier === 3 ? 'low' : null;
  if (result.monthsUsed !== expectedMonths || result.confidence !== expectedConfidence ||
    countTotal(selected) !== comparableCount ||
    (selected.new as number) > (eligible.new as number) ||
    (selected.renewal as number) > (eligible.renewal as number) ||
    (selected.unknown as number) > (eligible.unknown as number) ||
    (statuses.active as number) + (statuses.unknown as number) !== countTotal(eligible) ||
    (method.contractSelection === null) !== (comparableCount === 0) ||
    (method.contractSelection === 'new_only' &&
      (selected.new !== comparableCount || selected.renewal !== 0 || selected.unknown !== 0)) ||
    (method.contractSelection === 'mixed' && countTotal(selected) !== countTotal(eligible))) {
    return false;
  }

  const sufficient = result.tier !== null;
  if (sufficient) {
    const minimum = result.tier === 3 ? 3 : 5;
    const distribution = comparableCount >= 5;
    if (value.status !== 'success' || !['below', 'fair', 'above'].includes(String(result.rating)) ||
      comparableCount < minimum || result.medianValueWon === null || result.differencePct === null ||
      (result.verdictBasis !== 'typical-range' && result.verdictBasis !== 'median-fallback') ||
      !isPublishedRentCheckResultTuplePossible(result) ||
      value.comparables.length !== Math.min(comparableCount, 10) ||
      distribution !== (result.verdictBasis === 'typical-range') ||
      distribution !== (result.minValueWon !== null) ||
      distribution !== (result.p25ValueWon !== null) ||
      distribution !== (result.p75ValueWon !== null) ||
      distribution !== (result.maxValueWon !== null)) return false;
    if (distribution && !(
      (result.minValueWon as number) <= (result.p25ValueWon as number) &&
      (result.p25ValueWon as number) <= (result.medianValueWon as number) &&
      (result.medianValueWon as number) <= (result.p75ValueWon as number) &&
      (result.p75ValueWon as number) <= (result.maxValueWon as number)
    )) return false;
  } else if (value.status !== 'insufficient' || result.rating !== 'insufficient' ||
    comparableCount >= 3 || result.medianValueWon !== null || result.minValueWon !== null ||
    result.p25ValueWon !== null || result.p75ValueWon !== null || result.maxValueWon !== null ||
    result.differencePct !== null || result.percentileRank !== null || result.verdictBasis !== null ||
    value.comparables.length !== 0) return false;

  const throughMonth = monthIndex(coverage.coverageThroughMonth)!;
  if (!value.comparables.every((row) => isComparable(row, throughMonth, result.monthsUsed as number))) {
    return false;
  }
  for (let index = 1; index < value.comparables.length; index += 1) {
    if ((value.comparables[index - 1] as { contractDate: string }).contractDate <
      (value.comparables[index] as { contractDate: string }).contractDate) return false;
  }
  const visibleCounts = { new: 0, renewal: 0, unknown: 0 };
  for (const row of value.comparables as readonly { contractType: keyof typeof visibleCounts }[]) {
    visibleCounts[row.contractType] += 1;
  }
  if (visibleCounts.new > (selected.new as number) ||
    visibleCounts.renewal > (selected.renewal as number) ||
    visibleCounts.unknown > (selected.unknown as number) ||
    (sufficient && comparableCount <= 10 && (
      visibleCounts.new !== selected.new || visibleCounts.renewal !== selected.renewal ||
      visibleCounts.unknown !== selected.unknown
    ))) return false;
  const latestMonthIndex = monthIndex(coverage.latestContractMonth);
  if (comparableCount === 0) {
    if (coverage.latestContractMonth !== null) return false;
  } else if (latestMonthIndex === null || latestMonthIndex > throughMonth ||
    latestMonthIndex <= throughMonth - (result.monthsUsed as number)) {
    return false;
  } else if (sufficient && coverage.latestContractMonth !==
    (value.comparables[0] as { contractDate: string }).contractDate.slice(0, 7)) {
    return false;
  }
  const expectedLimitations = studio
    ? [...BASE_LIMITATIONS, 'MOLIT classifies the studio alias under detached and multi-unit source records.']
    : BASE_LIMITATIONS;
  return exactStrings(value.limitations, expectedLimitations);
}

function typedError(value: unknown): RentCheckClientError | null {
  if (!isObject(value) || value.status !== 'error' || !isObject(value.error)) return null;
  const error = value.error;
  if (!isRentCheckErrorCode(error.code) ||
    typeof error.message !== 'string' || typeof error.retryable !== 'boolean' ||
    !(error.retryAfterSeconds === null ||
      (Number.isInteger(error.retryAfterSeconds) && (error.retryAfterSeconds as number) >= 0))) {
    return null;
  }
  const code = error.code;
  const canonicalRetryable = RETRYABILITY_BY_ERROR_CODE[code];
  if (error.retryable !== canonicalRetryable ||
    (!canonicalRetryable && error.retryAfterSeconds !== null)) return null;
  return {
    code,
    message: error.message,
    retryable: error.retryable,
    retryAfterSeconds: error.retryAfterSeconds as number | null,
  };
}

export class RentCheckRequestError extends Error implements RentCheckClientError {
  constructor(
    readonly code: SeoulRentCheckErrorCode,
    message: string,
    readonly retryable: boolean,
    readonly retryAfterSeconds: number | null,
  ) {
    super(message);
    this.name = 'RentCheckRequestError';
  }
}

const GENERIC_UNAVAILABLE = {
  code: 'source_unavailable',
  message: 'Official rental evidence is unavailable. Try again later.',
  retryable: true,
  retryAfterSeconds: null,
} as const satisfies RentCheckClientError;

function requestError(error: RentCheckClientError): RentCheckRequestError {
  return new RentCheckRequestError(
    error.code,
    error.message,
    error.retryable,
    error.retryAfterSeconds,
  );
}

function retryAfterSeconds(value: string | null, nowMs: number): number {
  if (value !== null && /^(?:0|[1-9][0-9]*)$/.test(value)) {
    const seconds = Number(value);
    if (Number.isSafeInteger(seconds)) return seconds;
  }
  if (value !== null) {
    const dateMs = Date.parse(value);
    if (Number.isFinite(dateMs) && dateMs > nowMs) {
      return Math.ceil((dateMs - nowMs) / 1_000);
    }
  }
  return 60;
}

type FetchPort = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

export async function requestRentCheck(
  input: RentCheckInput,
  dependencies: {
    readonly fetch?: FetchPort;
    readonly signal?: AbortSignal;
    readonly now?: () => number;
  } = {},
): Promise<RentCheckApiSuccess> {
  const query = new URLSearchParams({
    lawdCd: input.lawdCd,
    type: input.housingType,
    deposit: input.depositWon,
    rent: input.monthlyRentWon,
    area: input.areaSqm,
  });
  const response = await (dependencies.fetch ?? globalThis.fetch)(
    `/api/markets/kr-seoul/rent-check/?${query.toString()}`,
    { method: 'GET', headers: { Accept: 'application/json' }, signal: dependencies.signal },
  );

  if (response.status === 429) {
    throw new RentCheckRequestError(
      'rate_limited',
      'Too many requests were made.',
      true,
      retryAfterSeconds(response.headers.get('Retry-After'), dependencies.now?.() ?? Date.now()),
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw requestError(GENERIC_UNAVAILABLE);
  }

  if (response.status !== 200) {
    throw requestError(typedError(body) ?? GENERIC_UNAVAILABLE);
  }

  const cacheStatus = response.headers.get('X-Signedprice-Cache');
  if (!CACHE_STATUSES.has(cacheStatus as RentCheckCacheStatus) ||
    !isRentCheckEnvelope(body, input)) {
    throw requestError(GENERIC_UNAVAILABLE);
  }

  return {
    envelope: body,
    cacheStatus: cacheStatus as RentCheckCacheStatus,
  };
}
