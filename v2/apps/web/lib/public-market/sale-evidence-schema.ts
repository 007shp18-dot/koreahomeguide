import 'server-only';

import { createHash } from 'node:crypto';

import {
  KOREA_EVIDENCE_AREA_BANDS,
  KOREA_SALE_EVIDENCE_PUBLICATION_MINIMUM,
  MOLIT_SALE_ENDPOINT_VERSION,
  MOLIT_SALE_PARSER_VERSION,
  MOLIT_SALE_RIGHTS_POLICY_ID,
  SEOUL_RENT_CHECK_DISTRICTS,
  type KoreaEvidenceDistribution,
  type KoreaSaleEvidenceAreaRecord,
  type KoreaSaleEvidenceBuildingRecord,
  type KoreaSaleEvidenceCohort,
  type KoreaSaleEvidenceStats,
} from '@signedprice/korea-rent';

export const KOREA_SALE_EVIDENCE_ARTIFACT_VERSION =
  'signedprice-korea-sale-evidence-v1' as const;

export type KoreaSaleEvidenceArtifactExpectation = Readonly<{
  marketId: 'kr-seoul';
  period: string;
  outerDigestVerified?: boolean;
}>;

export type VerifiedKoreaSaleEvidenceArtifact = Readonly<{
  artifactVersion: typeof KOREA_SALE_EVIDENCE_ARTIFACT_VERSION;
  generatedAt: string;
  marketId: 'kr-seoul';
  period: string;
  publicationMinimum: typeof KOREA_SALE_EVIDENCE_PUBLICATION_MINIMUM;
  stats: KoreaSaleEvidenceStats;
  areaRecords: readonly KoreaSaleEvidenceAreaRecord[];
  buildingRecords: readonly KoreaSaleEvidenceBuildingRecord[];
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
  'sourceRecordCount', 'eligibleRecordCount', 'cancelledRecordCount',
  'missingIdentityRecordCount', 'observedBuildingCount', 'areaCohortCount',
  'buildingCohortCount', 'publishedCohortCount', 'withheldCohortCount',
] as const;
const AREA_RECORD_KEYS = ['scope', 'areaId', 'districtSlug', 'housingType', 'cohorts'] as const;
const BUILDING_RECORD_KEYS = [
  'buildingId', 'districtSlug', 'neighborhoodId', 'neighborhoodName',
  'officialName', 'housingType', 'cohorts', 'recentSales',
] as const;
const COHORT_KEYS = ['areaBand', 'price'] as const;
const WITHHELD_DISTRIBUTION_KEYS = ['n', 'published'] as const;
const PUBLISHED_DISTRIBUTION_KEYS = [
  ...WITHHELD_DISTRIBUTION_KEYS, 'min', 'p25', 'med', 'p75', 'max', 'chg3m',
] as const;
const RECENT_REQUIRED_KEYS = ['filedMonth', 'areaSqm', 'priceWon'] as const;
const AREA_HOUSING_TYPES = [
  'all', 'apartment', 'officetel', 'villa_multifamily', 'detached',
] as const;
const BUILDING_HOUSING_TYPES = AREA_HOUSING_TYPES.slice(1);
const DISTRICT_SLUGS = new Set(SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => slug));
const REQUIRED_EXCLUSIONS = [
  'Canceled records',
  'Records without a stable building identity',
  'Provider-only fields',
] as const;

function invalid(): never {
  throw new TypeError('Invalid Korea sale evidence artifact.');
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

function isSafePositiveInteger(value: unknown): value is number {
  return isSafeNonNegativeInteger(value) && value > 0;
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
  return `{${Object.keys(object).sort().map((key) =>
    `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(',')}}`;
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
    if (value.n >= KOREA_SALE_EVIDENCE_PUBLICATION_MINIMUM) invalid();
    return value as unknown as KoreaEvidenceDistribution;
  }
  const measures = [value.min, value.p25, value.med, value.p75, value.max];
  if (
    value.n < KOREA_SALE_EVIDENCE_PUBLICATION_MINIMUM ||
    !measures.every(isSafePositiveInteger) ||
    !measures.every((item, index) => index === 0 ||
      (measures[index - 1] as number) <= item) ||
    !(value.chg3m === null || (
      typeof value.chg3m === 'number' && Number.isFinite(value.chg3m) &&
      value.chg3m > -100 && Number.isInteger(value.chg3m * 10)
    ))
  ) invalid();
  return value as unknown as KoreaEvidenceDistribution;
}

function parseCohort(value: unknown): KoreaSaleEvidenceCohort {
  if (!isRecord(value) || !hasExactKeys(value, COHORT_KEYS) ||
    !KOREA_EVIDENCE_AREA_BANDS.includes(
      value.areaBand as typeof KOREA_EVIDENCE_AREA_BANDS[number],
    )) invalid();
  parseDistribution(value.price);
  return value as unknown as KoreaSaleEvidenceCohort;
}

function parseCohorts(value: unknown, complete: boolean) {
  if (!Array.isArray(value)) invalid();
  const cohorts = value.map(parseCohort);
  const keys = cohorts.map(({ areaBand }) => areaBand);
  if (new Set(keys).size !== keys.length) invalid();
  if (complete) {
    if (keys.length !== KOREA_EVIDENCE_AREA_BANDS.length ||
      KOREA_EVIDENCE_AREA_BANDS.some((key) => !keys.includes(key))) invalid();
  } else if (cohorts.length === 0 || cohorts.some(({ price }) => price.n === 0)) {
    invalid();
  }
  return cohorts;
}

function parseAreaRecord(value: unknown): KoreaSaleEvidenceAreaRecord {
  if (!isRecord(value) || !hasExactKeys(value, AREA_RECORD_KEYS) ||
    !['city', 'district'].includes(value.scope as string) ||
    !isTrimmedText(value.areaId) ||
    !AREA_HOUSING_TYPES.includes(value.housingType as typeof AREA_HOUSING_TYPES[number])) invalid();
  if (value.scope === 'city') {
    if (value.districtSlug !== null || value.areaId !== `seoul:${value.housingType}`) invalid();
  } else if (
    typeof value.districtSlug !== 'string' ||
    !DISTRICT_SLUGS.has(value.districtSlug as typeof SEOUL_RENT_CHECK_DISTRICTS[number]['slug']) ||
    value.areaId !== `${value.districtSlug}:${value.housingType}`
  ) invalid();
  parseCohorts(value.cohorts, true);
  return value as unknown as KoreaSaleEvidenceAreaRecord;
}

function parseRecent(value: unknown, period: string): void {
  if (!isRecord(value)) invalid();
  const keys = [
    ...RECENT_REQUIRED_KEYS,
    ...(value.floor === undefined ? [] : ['floor']),
    ...(value.buildYear === undefined ? [] : ['buildYear']),
  ];
  if (!hasExactKeys(value, keys) || !isMonth(value.filedMonth) ||
    !monthWithinPeriod(value.filedMonth, period) ||
    typeof value.areaSqm !== 'number' || !Number.isFinite(value.areaSqm) ||
    value.areaSqm <= 0 || value.areaSqm > 2_000 ||
    !isSafePositiveInteger(value.priceWon) ||
    (value.floor !== undefined && !Number.isSafeInteger(value.floor)) ||
    (value.buildYear !== undefined && (!Number.isSafeInteger(value.buildYear) ||
      (value.buildYear as number) < 1800 || (value.buildYear as number) > 2200))) invalid();
}

function parseBuildingRecord(value: unknown, period: string): KoreaSaleEvidenceBuildingRecord {
  if (!isRecord(value) || !hasExactKeys(value, BUILDING_RECORD_KEYS) ||
    !isTrimmedText(value.buildingId) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.buildingId) ||
    typeof value.districtSlug !== 'string' ||
    !DISTRICT_SLUGS.has(value.districtSlug as typeof SEOUL_RENT_CHECK_DISTRICTS[number]['slug']) ||
    !value.buildingId.startsWith(`${value.districtSlug}-`) ||
    !isTrimmedText(value.neighborhoodId) || !isTrimmedText(value.neighborhoodName) ||
    !isTrimmedText(value.officialName) ||
    !BUILDING_HOUSING_TYPES.includes(
      value.housingType as typeof BUILDING_HOUSING_TYPES[number],
    )) invalid();
  parseCohorts(value.cohorts, false);
  if (!Array.isArray(value.recentSales) || value.recentSales.length > 20) invalid();
  value.recentSales.forEach((item) => parseRecent(item, period));
  return value as unknown as KoreaSaleEvidenceBuildingRecord;
}

function parseStats(value: unknown): KoreaSaleEvidenceStats {
  if (!isRecord(value) || !hasExactKeys(value, STATS_KEYS) ||
    !Object.values(value).every(isSafeNonNegativeInteger)) invalid();
  return value as unknown as KoreaSaleEvidenceStats;
}

function assertProvenance(value: unknown, expected: KoreaSaleEvidenceArtifactExpectation): void {
  if (!isRecord(value) || !hasExactKeys(value, PROVENANCE_KEYS) ||
    value.marketId !== expected.marketId || value.period !== expected.period ||
    value.provider !== 'MOLIT' || value.dataset !== 'reported sale contracts' ||
    value.endpointVersion !== MOLIT_SALE_ENDPOINT_VERSION ||
    value.parserVersion !== MOLIT_SALE_PARSER_VERSION ||
    value.rightsPolicyId !== MOLIT_SALE_RIGHTS_POLICY_ID ||
    value.sourceComplete !== true || value.displayRights !== true ||
    !Array.isArray(value.exclusions) ||
    value.exclusions.length !== REQUIRED_EXCLUSIONS.length ||
    REQUIRED_EXCLUSIONS.some((item, index) =>
      (value.exclusions as unknown[])[index] !== item)) invalid();
}

function unsignedArtifact(value: Record<string, unknown>) {
  const unsigned = { ...value };
  delete unsigned.sha256;
  return unsigned;
}

export function parseKoreaSaleEvidenceArtifact(
  value: unknown,
  expected: KoreaSaleEvidenceArtifactExpectation,
): VerifiedKoreaSaleEvidenceArtifact {
  if (!isRecord(value) || !hasExactKeys(value, ROOT_KEYS) ||
    value.artifactVersion !== KOREA_SALE_EVIDENCE_ARTIFACT_VERSION ||
    !isCanonicalInstant(value.generatedAt) ||
    value.publicationMinimum !== KOREA_SALE_EVIDENCE_PUBLICATION_MINIMUM ||
    typeof value.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(value.sha256) ||
    (expected.outerDigestVerified !== true
      && digest(unsignedArtifact(value)) !== value.sha256)) invalid();
  assertProvenance(value.provenance, expected);
  const stats = parseStats(value.stats);
  if (!Array.isArray(value.areaRecords) || !Array.isArray(value.buildingRecords)) invalid();
  const areaRecords = value.areaRecords.map(parseAreaRecord);
  const buildingRecords = value.buildingRecords.map((item) =>
    parseBuildingRecord(item, expected.period));
  if (areaRecords.length !== (SEOUL_RENT_CHECK_DISTRICTS.length + 1) * AREA_HOUSING_TYPES.length ||
    new Set(areaRecords.map(({ areaId }) => areaId)).size !== areaRecords.length ||
    new Set(buildingRecords.map(({ buildingId }) => buildingId)).size !== buildingRecords.length) invalid();
  const areaCohortCount = areaRecords.reduce((sum, record) => sum + record.cohorts.length, 0);
  const buildingCohortCount = buildingRecords.reduce((sum, record) => sum + record.cohorts.length, 0);
  const cohorts = [
    ...areaRecords.flatMap(({ cohorts: items }) => items),
    ...buildingRecords.flatMap(({ cohorts: items }) => items),
  ];
  const published = cohorts.filter(({ price }) => price.published).length;
  if (stats.sourceRecordCount !== stats.eligibleRecordCount + stats.cancelledRecordCount ||
    stats.missingIdentityRecordCount > stats.eligibleRecordCount ||
    stats.observedBuildingCount !== buildingRecords.length ||
    stats.areaCohortCount !== areaCohortCount ||
    stats.buildingCohortCount !== buildingCohortCount ||
    stats.publishedCohortCount !== published ||
    stats.withheldCohortCount !== cohorts.length - published) invalid();
  return deepFreeze({
    artifactVersion: KOREA_SALE_EVIDENCE_ARTIFACT_VERSION,
    generatedAt: value.generatedAt,
    marketId: expected.marketId,
    period: expected.period,
    publicationMinimum: KOREA_SALE_EVIDENCE_PUBLICATION_MINIMUM,
    stats,
    areaRecords,
    buildingRecords,
    sha256: value.sha256,
  });
}
