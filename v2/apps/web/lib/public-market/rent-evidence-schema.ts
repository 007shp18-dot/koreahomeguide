import 'server-only';

import { createHash } from 'node:crypto';

import {
  KOREA_EVIDENCE_AREA_BANDS,
  KOREA_RENT_EVIDENCE_PUBLICATION_MINIMUM,
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
  SEOUL_RENT_CHECK_DISTRICTS,
  type KoreaEvidenceDistribution,
  type KoreaRentEvidenceAreaRecord,
  type KoreaRentEvidenceBuildingRecord,
  type KoreaRentEvidenceCohort,
  type KoreaRentEvidenceStats,
} from '@signedprice/korea-rent';

export const KOREA_RENT_EVIDENCE_ARTIFACT_VERSION =
  'signedprice-korea-rent-evidence-v2' as const;

export type KoreaRentEvidenceArtifactExpectation = Readonly<{
  marketId: 'kr-seoul';
  period: string;
}>;

export type VerifiedKoreaRentEvidenceArtifact = Readonly<{
  artifactVersion: typeof KOREA_RENT_EVIDENCE_ARTIFACT_VERSION;
  generatedAt: string;
  marketId: 'kr-seoul';
  period: string;
  publicationMinimum: typeof KOREA_RENT_EVIDENCE_PUBLICATION_MINIMUM;
  stats: KoreaRentEvidenceStats;
  areaRecords: readonly KoreaRentEvidenceAreaRecord[];
  buildingRecords: readonly KoreaRentEvidenceBuildingRecord[];
  sha256: string;
}>;

const ROOT_KEYS = [
  'artifactVersion', 'generatedAt', 'provenance', 'publicationMinimum',
  'stats', 'areaRecords', 'buildingRecords', 'sha256',
] as const;
const PROVENANCE_KEYS = [
  'marketId', 'period', 'provider', 'dataset', 'endpointVersion', 'parserVersion',
  'rightsPolicyId', 'sourceComplete', 'displayRights', 'exclusions',
] as const;
const STATS_KEYS = [
  'sourceRecordCount', 'eligibleRecordCount', 'jeonseRecordCount',
  'monthlyRecordCount', 'cancelledRecordCount', 'invalidPaymentRecordCount',
  'missingIdentityRecordCount',
  'observedBuildingCount', 'areaCohortCount', 'buildingCohortCount',
  'publishedCohortCount', 'withheldCohortCount',
] as const;
const AREA_RECORD_KEYS = [
  'scope', 'areaId', 'districtSlug', 'housingType', 'cohorts',
] as const;
const BUILDING_RECORD_KEYS = [
  'buildingId', 'districtSlug', 'neighborhoodId', 'neighborhoodName',
  'officialName', 'housingType', 'cohorts', 'recentTransactions',
] as const;
const COHORT_KEYS = [
  'transaction', 'areaBand', 'contractGroup', 'primaryMetric', 'primary',
  'filedDeposit',
] as const;
const WITHHELD_DISTRIBUTION_KEYS = ['n', 'published'] as const;
const PUBLISHED_DISTRIBUTION_KEYS = [
  ...WITHHELD_DISTRIBUTION_KEYS, 'min', 'p25', 'med', 'p75', 'max', 'chg3m',
] as const;
const RECENT_KEYS = [
  'filedMonth', 'areaSqm', 'transaction', 'depositWon', 'monthlyRentWon',
  'contractType',
] as const;
const TRANSACTIONS = ['jeonse', 'monthly'] as const;
const CONTRACT_GROUPS = ['all', 'new', 'renewal', 'unknown'] as const;
const AREA_HOUSING_TYPES = [
  'all', 'apartment', 'officetel', 'villa_multifamily', 'detached',
] as const;
const BUILDING_HOUSING_TYPES = AREA_HOUSING_TYPES.slice(1);
const DISTRICT_SLUGS = new Set(SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => slug));
const REQUIRED_EXCLUSIONS = [
  'Canceled records',
  'Active records with no filed payment',
  'Records without a stable building identity',
  'Provider-only fields',
] as const;

function invalid(): never {
  throw new TypeError('Invalid Korea rent evidence artifact.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

function isSafeNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isCanonicalInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const instant = new Date(value);
  return Number.isFinite(instant.getTime()) && instant.toISOString() === value;
}

function isTrimmedText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.trim() === value;
}

function isMonth(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-(?:0[1-9]|1[0-2])$/.test(value);
}

function monthWithinPeriod(month: string, period: string): boolean {
  const [from, to] = period.split('/');
  return from !== undefined && to !== undefined && month >= from && month <= to;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) invalid();
    return serialized;
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const object = value as Readonly<Record<string, unknown>>;
  return `{${Object.keys(object).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalJson(object[key])}`
  )).join(',')}}`;
}

function digest(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function parseDistribution(value: unknown): KoreaEvidenceDistribution {
  if (!isRecord(value) || typeof value.published !== 'boolean') invalid();
  const keys = value.published ? PUBLISHED_DISTRIBUTION_KEYS : WITHHELD_DISTRIBUTION_KEYS;
  if (!hasExactKeys(value, keys) || !isSafeNonNegativeInteger(value.n)) invalid();
  if (!value.published) {
    if (value.n >= KOREA_RENT_EVIDENCE_PUBLICATION_MINIMUM) invalid();
    return value as unknown as KoreaEvidenceDistribution;
  }
  const measures = [value.min, value.p25, value.med, value.p75, value.max];
  if (
    value.n < KOREA_RENT_EVIDENCE_PUBLICATION_MINIMUM
    || !measures.every(isSafeNonNegativeInteger)
    || !measures.every((item, index) => (
      index === 0 || (measures[index - 1] as number) <= item
    ))
    || !(value.chg3m === null || (
      typeof value.chg3m === 'number'
      && Number.isFinite(value.chg3m)
      && value.chg3m >= -100
      && Number.isInteger(value.chg3m * 10)
    ))
  ) invalid();
  return value as unknown as KoreaEvidenceDistribution;
}

function cohortKey(value: Pick<
  KoreaRentEvidenceCohort,
  'transaction' | 'areaBand' | 'contractGroup'
>): string {
  return `${value.transaction}:${value.areaBand}:${value.contractGroup}`;
}

function parseCohort(value: unknown): KoreaRentEvidenceCohort {
  if (!isRecord(value) || !hasExactKeys(value, COHORT_KEYS)) invalid();
  if (
    !TRANSACTIONS.includes(value.transaction as typeof TRANSACTIONS[number])
    || !KOREA_EVIDENCE_AREA_BANDS.includes(
      value.areaBand as typeof KOREA_EVIDENCE_AREA_BANDS[number],
    )
    || !CONTRACT_GROUPS.includes(value.contractGroup as typeof CONTRACT_GROUPS[number])
  ) invalid();
  const transaction = value.transaction as KoreaRentEvidenceCohort['transaction'];
  if (value.primaryMetric !== (transaction === 'jeonse' ? 'deposit' : 'monthly-rent')) {
    invalid();
  }
  const primary = parseDistribution(value.primary);
  if (transaction === 'jeonse') {
    if (value.filedDeposit !== null) invalid();
  } else {
    const filedDeposit = parseDistribution(value.filedDeposit);
    if (filedDeposit.n !== primary.n) invalid();
  }
  return value as unknown as KoreaRentEvidenceCohort;
}

function parseCohorts(value: unknown, complete: boolean): readonly KoreaRentEvidenceCohort[] {
  if (!Array.isArray(value)) invalid();
  const cohorts = value.map(parseCohort);
  const keys = cohorts.map(cohortKey);
  if (new Set(keys).size !== keys.length) invalid();
  if (complete) {
    const expected = TRANSACTIONS.flatMap((transaction) => (
      KOREA_EVIDENCE_AREA_BANDS.flatMap((areaBand) => (
        CONTRACT_GROUPS.map((contractGroup) => `${transaction}:${areaBand}:${contractGroup}`)
      ))
    ));
    if (keys.length !== expected.length || expected.some((key) => !keys.includes(key))) invalid();
  } else if (cohorts.some(({ primary }) => primary.n === 0)) {
    invalid();
  }
  return cohorts;
}

function parseAreaRecord(value: unknown): KoreaRentEvidenceAreaRecord {
  if (!isRecord(value) || !hasExactKeys(value, AREA_RECORD_KEYS)) invalid();
  if (
    !['city', 'district'].includes(value.scope as string)
    || !isTrimmedText(value.areaId)
    || !AREA_HOUSING_TYPES.includes(value.housingType as typeof AREA_HOUSING_TYPES[number])
  ) invalid();
  if (value.scope === 'city') {
    if (value.districtSlug !== null || value.areaId !== `seoul:${value.housingType}`) invalid();
  } else if (
    typeof value.districtSlug !== 'string'
    || !DISTRICT_SLUGS.has(value.districtSlug as typeof SEOUL_RENT_CHECK_DISTRICTS[number]['slug'])
    || value.areaId !== `${value.districtSlug}:${value.housingType}`
  ) invalid();
  parseCohorts(value.cohorts, true);
  return value as unknown as KoreaRentEvidenceAreaRecord;
}

function parseRecent(value: unknown, period: string): void {
  if (!isRecord(value) || !hasExactKeys(value, RECENT_KEYS)) invalid();
  if (
    !isMonth(value.filedMonth)
    || !monthWithinPeriod(value.filedMonth, period)
    || typeof value.areaSqm !== 'number'
    || !Number.isFinite(value.areaSqm)
    || value.areaSqm <= 0
    || !TRANSACTIONS.includes(value.transaction as typeof TRANSACTIONS[number])
    || !isSafeNonNegativeInteger(value.depositWon)
    || !isSafeNonNegativeInteger(value.monthlyRentWon)
    || !['new', 'renewal', 'unknown'].includes(value.contractType as string)
    || (value.transaction === 'jeonse'
      ? value.depositWon === 0 || value.monthlyRentWon !== 0
      : value.monthlyRentWon === 0)
  ) invalid();
}

function parseBuildingRecord(
  value: unknown,
  period: string,
): KoreaRentEvidenceBuildingRecord {
  if (!isRecord(value) || !hasExactKeys(value, BUILDING_RECORD_KEYS)) invalid();
  if (
    !isTrimmedText(value.buildingId)
    || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.buildingId)
    || typeof value.districtSlug !== 'string'
    || !DISTRICT_SLUGS.has(value.districtSlug as typeof SEOUL_RENT_CHECK_DISTRICTS[number]['slug'])
    || !value.buildingId.startsWith(`${value.districtSlug}-`)
    || !isTrimmedText(value.neighborhoodId)
    || !isTrimmedText(value.neighborhoodName)
    || !isTrimmedText(value.officialName)
    || !BUILDING_HOUSING_TYPES.includes(
      value.housingType as typeof BUILDING_HOUSING_TYPES[number],
    )
  ) invalid();
  const cohorts = parseCohorts(value.cohorts, false);
  if (cohorts.length === 0) invalid();
  if (!Array.isArray(value.recentTransactions) || value.recentTransactions.length > 20) invalid();
  value.recentTransactions.forEach((item) => parseRecent(item, period));
  return value as unknown as KoreaRentEvidenceBuildingRecord;
}

function parseStats(value: unknown): KoreaRentEvidenceStats {
  if (
    !isRecord(value)
    || !hasExactKeys(value, STATS_KEYS)
    || !Object.values(value).every(isSafeNonNegativeInteger)
  ) invalid();
  return value as unknown as KoreaRentEvidenceStats;
}

function assertProvenance(
  value: unknown,
  expected: KoreaRentEvidenceArtifactExpectation,
): void {
  if (!isRecord(value) || !hasExactKeys(value, PROVENANCE_KEYS)) invalid();
  if (
    value.marketId !== expected.marketId
    || value.period !== expected.period
    || value.provider !== 'MOLIT'
    || value.dataset !== 'reported rent contracts'
    || value.endpointVersion !== MOLIT_ENDPOINT_VERSION
    || value.parserVersion !== MOLIT_PARSER_VERSION
    || value.rightsPolicyId !== MOLIT_RIGHTS_POLICY_ID
    || value.sourceComplete !== true
    || value.displayRights !== true
    || !Array.isArray(value.exclusions)
    || value.exclusions.length !== REQUIRED_EXCLUSIONS.length
    || REQUIRED_EXCLUSIONS.some((item, index) => (
      (value.exclusions as unknown[])[index] !== item
    ))
  ) invalid();
}

function unsignedArtifact(value: Record<string, unknown>): Readonly<Record<string, unknown>> {
  const { sha256: _sha256, ...unsigned } = value;
  return unsigned;
}

export function parseKoreaRentEvidenceArtifact(
  value: unknown,
  expected: KoreaRentEvidenceArtifactExpectation,
): VerifiedKoreaRentEvidenceArtifact {
  if (!isRecord(value) || !hasExactKeys(value, ROOT_KEYS)) invalid();
  if (
    value.artifactVersion !== KOREA_RENT_EVIDENCE_ARTIFACT_VERSION
    || !isCanonicalInstant(value.generatedAt)
    || value.publicationMinimum !== KOREA_RENT_EVIDENCE_PUBLICATION_MINIMUM
    || typeof value.sha256 !== 'string'
    || !/^[0-9a-f]{64}$/.test(value.sha256)
    || digest(unsignedArtifact(value)) !== value.sha256
  ) invalid();
  assertProvenance(value.provenance, expected);
  const stats = parseStats(value.stats);
  if (!Array.isArray(value.areaRecords) || !Array.isArray(value.buildingRecords)) invalid();
  const areaRecords = value.areaRecords.map(parseAreaRecord);
  const buildingRecords = value.buildingRecords.map((item) => (
    parseBuildingRecord(item, expected.period)
  ));
  if (
    areaRecords.length !== (SEOUL_RENT_CHECK_DISTRICTS.length + 1) * AREA_HOUSING_TYPES.length
    || new Set(areaRecords.map(({ areaId }) => areaId)).size !== areaRecords.length
    || new Set(buildingRecords.map(({ buildingId }) => buildingId)).size !== buildingRecords.length
  ) invalid();
  const areaCohortCount = areaRecords.reduce((sum, record) => sum + record.cohorts.length, 0);
  const buildingCohortCount = buildingRecords.reduce(
    (sum, record) => sum + record.cohorts.length,
    0,
  );
  const cohorts = [
    ...areaRecords.flatMap(({ cohorts: items }) => items),
    ...buildingRecords.flatMap(({ cohorts: items }) => items),
  ];
  const published = cohorts.filter(({ primary }) => primary.published).length;
  if (
    stats.sourceRecordCount !== stats.eligibleRecordCount
      + stats.cancelledRecordCount
      + stats.invalidPaymentRecordCount
    || stats.eligibleRecordCount !== stats.jeonseRecordCount + stats.monthlyRecordCount
    || stats.missingIdentityRecordCount > stats.eligibleRecordCount
    || stats.observedBuildingCount !== buildingRecords.length
    || stats.areaCohortCount !== areaCohortCount
    || stats.buildingCohortCount !== buildingCohortCount
    || stats.publishedCohortCount !== published
    || stats.withheldCohortCount !== cohorts.length - published
  ) invalid();
  return deepFreeze({
    artifactVersion: KOREA_RENT_EVIDENCE_ARTIFACT_VERSION,
    generatedAt: value.generatedAt,
    marketId: expected.marketId,
    period: expected.period,
    publicationMinimum: KOREA_RENT_EVIDENCE_PUBLICATION_MINIMUM,
    stats,
    areaRecords,
    buildingRecords,
    sha256: value.sha256,
  });
}
