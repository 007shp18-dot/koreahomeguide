import type {
  KoreaRentRecord,
  RentCheckQuote,
  SeoulRentCheckEnvelope,
  SourceHousingType,
} from './input';
import { KR_MOLIT_RENT_RIGHTS } from './rights';
import { isPublishedRentCheckResultTuplePossible } from './result-validation';
import { MOLIT_RENT_ENDPOINTS, isValidDealYmd, type MolitRentalMonth } from './xml';
import {
  DERIVED_RENT_CHECK_CACHE_KIND,
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
  RENT_CHECK_COVERAGE_NAMESPACE_VERSION,
  RENT_CHECK_ANNUAL_DEPOSIT_RATE,
  RENT_CHECK_METHODOLOGY_POLICY_ID,
  RENT_CHECK_METHODOLOGY_VERSION,
  SOURCE_MANIFEST_CACHE_KIND,
  SOURCE_PAGE_CACHE_KIND,
} from './versions';

const DERIVED_FRESH_SECONDS = 15 * 60;
const DERIVED_STALE_SECONDS = 60 * 60;

export type SourcePageEntry = {
  readonly kind: typeof SOURCE_PAGE_CACHE_KIND;
  readonly parserVersion: typeof MOLIT_PARSER_VERSION;
  readonly rightsPolicyId: typeof MOLIT_RIGHTS_POLICY_ID;
  readonly pageNo: number;
  readonly rows: MolitRentalMonth['records'];
  readonly rowFingerprintDigests: readonly string[];
};

export type SourceManifestEntry = {
  readonly kind: typeof SOURCE_MANIFEST_CACHE_KIND;
  readonly parserVersion: typeof MOLIT_PARSER_VERSION;
  readonly rightsPolicyId: typeof MOLIT_RIGHTS_POLICY_ID;
  readonly sourceHousingType: SourceHousingType;
  readonly lawdCd: string;
  readonly dealYmd: string;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly retrievedAt: string;
  readonly generation: string;
  readonly chunkKeys: readonly string[];
};

export type DerivedRentCheckCachePayload = {
  readonly kind: typeof DERIVED_RENT_CHECK_CACHE_KIND;
  readonly parserVersion: typeof MOLIT_PARSER_VERSION;
  readonly methodologyPolicyId: typeof RENT_CHECK_METHODOLOGY_POLICY_ID;
  readonly methodologyVersion: typeof RENT_CHECK_METHODOLOGY_VERSION;
  readonly rightsPolicyId: typeof MOLIT_RIGHTS_POLICY_ID;
  readonly coverageNamespace: string;
  readonly canonicalQuote: RentCheckQuote;
  readonly freshUntil: string;
  readonly staleUntil: string;
  readonly envelope: SeoulRentCheckEnvelope;
};

export type DerivedRentCheckCacheEntry = DerivedRentCheckCachePayload & {
  readonly contentDigest: string;
};

function isObject(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null;
}

function validIso(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value;
}

function hasExactKeys(value: Readonly<Record<string, unknown>>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isSourceHousingType(value: unknown): value is SourceHousingType {
  return value === 'apartment' || value === 'officetel' || value === 'villa' || value === 'detached';
}

function validCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const instant = new Date(Date.UTC(year, month - 1, day));
  return (
    year >= 1900 &&
    year <= 2200 &&
    instant.getUTCFullYear() === year &&
    instant.getUTCMonth() + 1 === month &&
    instant.getUTCDate() === day
  );
}

function validContractDate(value: unknown, dealYmd: string): value is string {
  return validCalendarDate(value) && value.slice(0, 7).replace('-', '') === dealYmd;
}

function isSourceRecord(
  value: unknown,
  sourceHousingType: SourceHousingType,
  dealYmd: string,
): value is KoreaRentRecord {
  if (!isObject(value)) return false;
  const keys = [
    'sourceHousingType',
    'areaSqm',
    'depositWon',
    'monthlyRentWon',
    'contractDate',
    'contractType',
    'recordStatus',
    ...(value.buildingLabel === undefined ? [] : ['buildingLabel']),
    ...(value.legalDong === undefined ? [] : ['legalDong']),
    ...(value.sourceRecordId === undefined ? [] : ['sourceRecordId']),
  ];
  return (
    hasExactKeys(value, keys) &&
    value.sourceHousingType === sourceHousingType &&
    typeof value.areaSqm === 'number' &&
    Number.isFinite(value.areaSqm) &&
    value.areaSqm > 0 &&
    value.areaSqm <= 2_000 &&
    Number.isSafeInteger(value.depositWon) &&
    (value.depositWon as number) >= 0 &&
    Number.isSafeInteger(value.monthlyRentWon) &&
    (value.monthlyRentWon as number) >= 0 &&
    validContractDate(value.contractDate, dealYmd) &&
    (value.contractType === 'new' ||
      value.contractType === 'renewal' ||
      value.contractType === 'unknown') &&
    (value.recordStatus === 'active' ||
      value.recordStatus === 'cancelled' ||
      value.recordStatus === 'unknown') &&
    (value.buildingLabel === undefined ||
      (typeof value.buildingLabel === 'string' && value.buildingLabel.trim().length > 0)) &&
    (value.legalDong === undefined ||
      (typeof value.legalDong === 'string' && value.legalDong.trim().length > 0)) &&
    (value.sourceRecordId === undefined ||
      (typeof value.sourceRecordId === 'string' && value.sourceRecordId.trim().length > 0))
  );
}

export function isSourceManifest(
  value: unknown,
  namespace: string,
): value is SourceManifestEntry {
  if (!isObject(value)) return false;
  return (
    hasExactKeys(value, [
      'kind',
      'parserVersion',
      'rightsPolicyId',
      'sourceHousingType',
      'lawdCd',
      'dealYmd',
      'pageSize',
      'totalCount',
      'retrievedAt',
      'generation',
      'chunkKeys',
    ]) &&
    value.kind === SOURCE_MANIFEST_CACHE_KIND &&
    value.parserVersion === MOLIT_PARSER_VERSION &&
    value.rightsPolicyId === MOLIT_RIGHTS_POLICY_ID &&
    isSourceHousingType(value.sourceHousingType) &&
    typeof value.lawdCd === 'string' && /^\d{5}$/.test(value.lawdCd) &&
    typeof value.dealYmd === 'string' && isValidDealYmd(value.dealYmd) &&
    Number.isSafeInteger(value.pageSize) &&
    (value.pageSize as number) > 0 &&
    (value.pageSize as number) <= 1_000 &&
    Number.isSafeInteger(value.totalCount) &&
    (value.totalCount as number) >= 0 &&
    validIso(value.retrievedAt) &&
    typeof value.generation === 'string' &&
    /^[0-9a-f]{64}$/.test(value.generation) &&
    Array.isArray(value.chunkKeys) &&
    value.chunkKeys.length === Math.max(1, Math.ceil(
      (value.totalCount as number) / (value.pageSize as number),
    )) &&
    value.chunkKeys.every(
      (key, index) => key === `${namespace}:generation=${value.generation}:page=${index + 1}`,
    )
  );
}

export function isSourcePage(
  value: unknown,
  pageNo: number,
  manifest: SourceManifestEntry,
): value is SourcePageEntry {
  if (!isObject(value)) return false;
  const expectedRows = pageNo < manifest.chunkKeys.length
    ? manifest.pageSize
    : manifest.totalCount - manifest.pageSize * (manifest.chunkKeys.length - 1);
  return (
    hasExactKeys(value, [
      'kind',
      'parserVersion',
      'rightsPolicyId',
      'pageNo',
      'rows',
      'rowFingerprintDigests',
    ]) &&
    value.kind === SOURCE_PAGE_CACHE_KIND &&
    value.parserVersion === MOLIT_PARSER_VERSION &&
    value.rightsPolicyId === MOLIT_RIGHTS_POLICY_ID &&
    value.pageNo === pageNo &&
    Array.isArray(value.rows) &&
    value.rows.length === expectedRows &&
    Array.isArray(value.rowFingerprintDigests) &&
    value.rowFingerprintDigests.length === value.rows.length &&
    value.rowFingerprintDigests.every((digest) =>
      typeof digest === 'string' && /^[0-9a-f]{64}$/.test(digest)) &&
    value.rows.every((record) =>
      isSourceRecord(record, manifest.sourceHousingType, manifest.dealYmd))
  );
}

function equalCanonicalQuote(value: unknown, expected: RentCheckQuote): value is RentCheckQuote {
  if (!isObject(value)) return false;
  return (
    hasExactKeys(value, [
      'lawdCd',
      'requestedHousingType',
      'sourceHousingType',
      'depositWon',
      'monthlyRentWon',
      'areaSqm',
    ]) &&
    value.lawdCd === expected.lawdCd &&
    value.requestedHousingType === expected.requestedHousingType &&
    value.sourceHousingType === expected.sourceHousingType &&
    value.depositWon === expected.depositWon &&
    value.monthlyRentWon === expected.monthlyRentWon &&
    value.areaSqm === expected.areaSqm
  );
}

function safeCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function safeWon(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function monthIndex(month: string): number | null {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (match === null) return null;
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (year < 1900 || year > 2200 || monthNumber < 1 || monthNumber > 12) return null;
  return year * 12 + monthNumber - 1;
}

type CountRecord = Readonly<Record<'new' | 'renewal' | 'unknown', number>>;
type StatusCountRecord = Readonly<Record<'active' | 'cancelled' | 'unknown', number>>;

function countRecord(value: unknown): CountRecord | null {
  if (
    !isObject(value) ||
    !hasExactKeys(value, ['new', 'renewal', 'unknown']) ||
    !safeCount(value.new) ||
    !safeCount(value.renewal) ||
    !safeCount(value.unknown)
  ) {
    return null;
  }
  return value as CountRecord;
}

function statusCountRecord(value: unknown): StatusCountRecord | null {
  if (
    !isObject(value) ||
    !hasExactKeys(value, ['active', 'cancelled', 'unknown']) ||
    !safeCount(value.active) ||
    !safeCount(value.cancelled) ||
    !safeCount(value.unknown)
  ) {
    return null;
  }
  return value as StatusCountRecord;
}

function sumCounts(value: CountRecord): number {
  return value.new + value.renewal + value.unknown;
}

function isComparable(
  value: unknown,
  throughMonthIndex: number,
  monthsUsed: number,
): value is SeoulRentCheckEnvelope['comparables'][number] {
  if (!isObject(value)) return false;
  const keys = [
    'areaSqm',
    'depositWon',
    'monthlyRentWon',
    'contractDate',
    'contractType',
    'recordStatus',
    ...(value.buildingLabel === undefined ? [] : ['buildingLabel']),
  ];
  if (
    !hasExactKeys(value, keys) ||
    typeof value.areaSqm !== 'number' ||
    !Number.isFinite(value.areaSqm) ||
    value.areaSqm <= 0 ||
    value.areaSqm > 2_000 ||
    !safeWon(value.depositWon) ||
    !safeWon(value.monthlyRentWon) ||
    !validCalendarDate(value.contractDate) ||
    (value.contractType !== 'new' &&
      value.contractType !== 'renewal' &&
      value.contractType !== 'unknown') ||
    (value.recordStatus !== 'active' && value.recordStatus !== 'unknown') ||
    (value.buildingLabel !== undefined &&
      (typeof value.buildingLabel !== 'string' || value.buildingLabel.trim().length === 0))
  ) {
    return false;
  }
  const comparableMonth = monthIndex(value.contractDate.slice(0, 7));
  return comparableMonth !== null &&
    comparableMonth <= throughMonthIndex &&
    comparableMonth > throughMonthIndex - monthsUsed;
}

function nullableSafeWon(value: unknown): boolean {
  return value === null || safeWon(value);
}

function nullableFinite(value: unknown): boolean {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function exactStringArray(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) &&
    value.length === expected.length &&
    value.every((item, index) => item === expected[index]);
}

function expectedLimitations(quote: RentCheckQuote): readonly string[] {
  return [
    'Official reported contracts use contract dates and are not current asking listings.',
    'Records may later be corrected or cancelled; status coverage is incomplete.',
    'This result is a market reference, not an appraisal or legal advice.',
    '5.0%/year signedprice comparison assumption.',
    'Floor, condition, furnishings, maintenance fees, view, renovation, exact brokerage fees, and deposit-return risk require separate verification.',
    ...(quote.requestedHousingType === 'studio'
      ? ['MOLIT classifies the studio alias under detached and multi-unit source records.']
      : []),
  ];
}

function isDerivedEnvelope(
  value: unknown,
  quote: RentCheckQuote,
  coverageNamespace: string,
  freshUntil: string,
  staleUntil: string,
): value is SeoulRentCheckEnvelope {
  if (!isObject(value) || !hasExactKeys(value, [
    'marketId',
    'status',
    'requestedHousingType',
    'sourceHousingType',
    'typeMapping',
    'source',
    'coverage',
    'methodology',
    'result',
    'comparables',
    'limitations',
  ])) return false;

  const namespaceMatch = new RegExp(
    `^${RENT_CHECK_COVERAGE_NAMESPACE_VERSION}:through=(\\d{4}-\\d{2}):months=12$`,
  ).exec(coverageNamespace);
  if (namespaceMatch === null) return false;
  const throughMonth = namespaceMatch[1]!;
  const throughIndex = monthIndex(throughMonth);
  if (throughIndex === null) return false;

  const mapping = value.typeMapping;
  const source = value.source;
  const coverage = value.coverage;
  const methodology = value.methodology;
  const result = value.result;
  if (!isObject(mapping) || !isObject(source) || !isObject(coverage) ||
    !isObject(methodology) || !isObject(result)) return false;

  const expectedStudio = quote.requestedHousingType === 'studio';
  if (
    value.marketId !== 'kr-seoul' ||
    (value.status !== 'success' && value.status !== 'insufficient') ||
    value.requestedHousingType !== quote.requestedHousingType ||
    value.sourceHousingType !== quote.sourceHousingType ||
    !hasExactKeys(mapping, ['applied', 'explanation']) ||
    mapping.applied !== expectedStudio ||
    mapping.explanation !== (expectedStudio
      ? 'Studio is compared with detached/multi-unit source records.'
      : null) ||
    !hasExactKeys(source, [
      'provider',
      'dataset',
      'endpointVersion',
      'parserVersion',
      'rightsPolicyId',
      'attribution',
    ]) ||
    source.provider !== 'MOLIT' ||
    source.dataset !== MOLIT_RENT_ENDPOINTS[quote.sourceHousingType].dataset ||
    source.endpointVersion !== MOLIT_ENDPOINT_VERSION ||
    source.parserVersion !== MOLIT_PARSER_VERSION ||
    source.rightsPolicyId !== MOLIT_RIGHTS_POLICY_ID ||
    !exactStringArray(source.attribution, KR_MOLIT_RENT_RIGHTS.attribution)
  ) {
    return false;
  }

  if (!hasExactKeys(coverage, [
    'basis',
    'timezone',
    'coverageThroughMonth',
    'latestContractMonth',
    'sourceRetrievedAt',
    'responseGeneratedAt',
    'monthsUsed',
  ]) || !isObject(coverage.sourceRetrievedAt) ||
    !hasExactKeys(coverage.sourceRetrievedAt, ['earliest', 'latest']) ||
    coverage.basis !== 'contract_date' ||
    coverage.timezone !== 'Asia/Seoul' ||
    coverage.coverageThroughMonth !== throughMonth ||
    (coverage.latestContractMonth !== null && monthIndex(String(coverage.latestContractMonth)) === null) ||
    !validIso(coverage.sourceRetrievedAt.earliest) ||
    !validIso(coverage.sourceRetrievedAt.latest) ||
    !validIso(coverage.responseGeneratedAt) ||
    ![3, 6, 12].includes(coverage.monthsUsed as number)) {
    return false;
  }
  const generatedMs = Date.parse(coverage.responseGeneratedAt as string);
  if (
    Date.parse(coverage.sourceRetrievedAt.earliest) > Date.parse(coverage.sourceRetrievedAt.latest) ||
    Date.parse(coverage.sourceRetrievedAt.latest) > generatedMs ||
    Date.parse(freshUntil) !== generatedMs + DERIVED_FRESH_SECONDS * 1_000 ||
    Date.parse(staleUntil) !== generatedMs + DERIVED_STALE_SECONDS * 1_000
  ) {
    return false;
  }

  const eligible = countRecord(methodology.eligibleContractTypeCounts);
  const selected = countRecord(methodology.selectedContractTypeCounts);
  const statuses = statusCountRecord(methodology.sourceRecordStatusCounts);
  if (
    !hasExactKeys(methodology, [
      'policyId',
      'version',
      'annualDepositRate',
      'verdictBasis',
      'contractSelection',
      'eligibleContractTypeCounts',
      'selectedContractTypeCounts',
      'sourceRecordStatusCounts',
    ]) ||
    methodology.policyId !== RENT_CHECK_METHODOLOGY_POLICY_ID ||
    methodology.version !== RENT_CHECK_METHODOLOGY_VERSION ||
    methodology.annualDepositRate !== (quote.monthlyRentWon > 0
      ? RENT_CHECK_ANNUAL_DEPOSIT_RATE
      : null) ||
    (methodology.verdictBasis !== null &&
      methodology.verdictBasis !== 'typical-range' &&
      methodology.verdictBasis !== 'median-fallback') ||
    (methodology.contractSelection !== null &&
      methodology.contractSelection !== 'new_only' &&
      methodology.contractSelection !== 'mixed') ||
    eligible === null || selected === null || statuses === null
  ) {
    return false;
  }

  if (!hasExactKeys(result, [
    'rating',
    'comparableCount',
    'comparisonMode',
    'comparisonBasis',
    'askingValueWon',
    'medianValueWon',
    'minValueWon',
    'p25ValueWon',
    'p75ValueWon',
    'maxValueWon',
    'differencePct',
    'percentileRank',
    'verdictBasis',
    'confidence',
    'monthsUsed',
    'tier',
  ]) ||
    !safeCount(result.comparableCount) ||
    result.comparisonMode !== (quote.monthlyRentWon > 0 ? 'monthly-rent' : 'jeonse-deposit') ||
    result.comparisonBasis !== (quote.monthlyRentWon > 0
      ? 'deposit-adjusted-monthly-rent'
      : 'jeonse-deposit') ||
    result.askingValueWon !== (quote.monthlyRentWon > 0 ? quote.monthlyRentWon : quote.depositWon) ||
    !nullableSafeWon(result.medianValueWon) ||
    !nullableSafeWon(result.minValueWon) ||
    !nullableSafeWon(result.p25ValueWon) ||
    !nullableSafeWon(result.p75ValueWon) ||
    !nullableSafeWon(result.maxValueWon) ||
    !nullableFinite(result.differencePct) ||
    !(result.percentileRank === null ||
      (Number.isSafeInteger(result.percentileRank) &&
        (result.percentileRank as number) >= 0 &&
        (result.percentileRank as number) <= 100)) ||
    result.verdictBasis !== methodology.verdictBasis ||
    result.monthsUsed !== coverage.monthsUsed ||
    (result.tier !== null && result.tier !== 1 && result.tier !== 2 && result.tier !== 3)) {
    return false;
  }

  const comparableCount = result.comparableCount as number;
  const expectedMonths = result.tier === 1 ? 3 : result.tier === 2 ? 6 : 12;
  const expectedConfidence = result.tier === 1
    ? comparableCount >= 7 ? 'high' : 'medium'
    : result.tier === 2 ? 'medium'
      : result.tier === 3 ? 'low' : null;
  const sufficient = result.tier !== null;
  if (
    result.monthsUsed !== expectedMonths ||
    result.confidence !== expectedConfidence ||
    sumCounts(selected) !== comparableCount ||
    selected.new > eligible.new ||
    selected.renewal > eligible.renewal ||
    selected.unknown > eligible.unknown ||
    statuses.active + statuses.unknown !== sumCounts(eligible) ||
    (methodology.contractSelection === null) !== (comparableCount === 0) ||
    (methodology.contractSelection === 'new_only' &&
      (selected.new !== comparableCount || selected.renewal !== 0 || selected.unknown !== 0)) ||
    (methodology.contractSelection === 'mixed' && sumCounts(selected) !== sumCounts(eligible)) ||
    !Array.isArray(value.comparables) ||
    !exactStringArray(value.limitations, expectedLimitations(quote))
  ) {
    return false;
  }

  if (sufficient) {
    const minimum = result.tier === 3 ? 3 : 5;
    if (
      value.status !== 'success' ||
      result.rating === 'insufficient' ||
      (result.rating !== 'below' && result.rating !== 'fair' && result.rating !== 'above') ||
      comparableCount < minimum ||
      result.medianValueWon === null ||
      result.differencePct === null ||
      (result.verdictBasis !== 'typical-range' && result.verdictBasis !== 'median-fallback') ||
      !isPublishedRentCheckResultTuplePossible(result) ||
      value.comparables.length !== Math.min(comparableCount, 10)
    ) {
      return false;
    }
    const distribution = comparableCount >= 5;
    if (distribution !== (result.verdictBasis === 'typical-range') ||
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
  } else if (
    value.status !== 'insufficient' ||
    result.rating !== 'insufficient' ||
    comparableCount >= 3 ||
    result.medianValueWon !== null ||
    result.minValueWon !== null ||
    result.p25ValueWon !== null ||
    result.p75ValueWon !== null ||
    result.maxValueWon !== null ||
    result.differencePct !== null ||
    result.percentileRank !== null ||
    result.verdictBasis !== null ||
    value.comparables.length !== 0
  ) {
    return false;
  }

  if (!value.comparables.every((comparable) =>
    isComparable(comparable, throughIndex, result.monthsUsed as number))) return false;
  const visibleTypes = { new: 0, renewal: 0, unknown: 0 };
  for (let index = 0; index < value.comparables.length; index += 1) {
    const comparable = value.comparables[index]!;
    visibleTypes[comparable.contractType] += 1;
    if (index > 0 && value.comparables[index - 1]!.contractDate < comparable.contractDate) {
      return false;
    }
  }
  if (
    visibleTypes.new > selected.new ||
    visibleTypes.renewal > selected.renewal ||
    visibleTypes.unknown > selected.unknown ||
    (sufficient && comparableCount <= 10 && (
      visibleTypes.new !== selected.new ||
      visibleTypes.renewal !== selected.renewal ||
      visibleTypes.unknown !== selected.unknown
    ))
  ) {
    return false;
  }
  const latestContractMonthIndex = monthIndex(String(coverage.latestContractMonth));
  if (comparableCount === 0) return coverage.latestContractMonth === null;
  if (coverage.latestContractMonth === null || latestContractMonthIndex === null ||
    latestContractMonthIndex > throughIndex ||
    latestContractMonthIndex <= throughIndex - (result.monthsUsed as number)) {
    return false;
  }
  if (!sufficient) return true;
  const newestVisibleMonth = value.comparables[0]!.contractDate.slice(0, 7);
  return coverage.latestContractMonth === newestVisibleMonth;
}

export function isDerivedCacheEntry(
  value: unknown,
  quote: RentCheckQuote,
  coverageNamespace: string,
): value is DerivedRentCheckCacheEntry {
  if (!isObject(value)) return false;
  return (
    hasExactKeys(value, [
      'kind',
      'parserVersion',
      'methodologyPolicyId',
      'methodologyVersion',
      'rightsPolicyId',
      'coverageNamespace',
      'canonicalQuote',
      'freshUntil',
      'staleUntil',
      'envelope',
      'contentDigest',
    ]) &&
    value.kind === DERIVED_RENT_CHECK_CACHE_KIND &&
    value.parserVersion === MOLIT_PARSER_VERSION &&
    value.methodologyPolicyId === RENT_CHECK_METHODOLOGY_POLICY_ID &&
    value.methodologyVersion === RENT_CHECK_METHODOLOGY_VERSION &&
    value.rightsPolicyId === MOLIT_RIGHTS_POLICY_ID &&
    value.coverageNamespace === coverageNamespace &&
    typeof value.contentDigest === 'string' &&
    /^[0-9a-f]{64}$/.test(value.contentDigest) &&
    equalCanonicalQuote(value.canonicalQuote, quote) &&
    validIso(value.freshUntil) &&
    validIso(value.staleUntil) &&
    isDerivedEnvelope(
      value.envelope,
      quote,
      coverageNamespace,
      value.freshUntil,
      value.staleUntil,
    )
  );
}
