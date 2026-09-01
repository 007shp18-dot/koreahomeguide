import { median, percentile, roundWon } from '@signedprice/market-core';

import {
  KOREA_EVIDENCE_AREA_BANDS,
  classifyAreaBand,
  type KoreaEvidenceAreaBand,
  type KoreaEvidenceDistribution,
} from './evidence-cohorts';
import {
  buildKoreaBuildingIdentity,
  type KoreaBuildingHousingType,
  type KoreaBuildingIdentity,
} from './building-identity';
import { SEOUL_RENT_CHECK_DISTRICTS, type SeoulDistrictSlug } from './districts';
import type { KoreaSaleRecord } from './sale';

export const KOREA_SALE_EVIDENCE_PUBLICATION_MINIMUM = 5 as const;

export type KoreaSaleEvidenceHousingType = KoreaBuildingHousingType | 'all';
export type KoreaSaleEvidenceCohort = Readonly<{
  areaBand: KoreaEvidenceAreaBand;
  price: KoreaEvidenceDistribution;
}>;
export type KoreaSaleEvidenceAreaRecord = Readonly<{
  scope: 'city' | 'district';
  areaId: string;
  districtSlug: SeoulDistrictSlug | null;
  housingType: KoreaSaleEvidenceHousingType;
  cohorts: readonly KoreaSaleEvidenceCohort[];
}>;
export type KoreaSaleEvidenceRecentSale = Readonly<{
  filedMonth: string;
  areaSqm: number;
  priceWon: number;
  floor?: number;
  buildYear?: number;
}>;
export type KoreaSaleEvidenceBuildingRecord = Readonly<{
  buildingId: string;
  districtSlug: SeoulDistrictSlug;
  neighborhoodId: string;
  neighborhoodName: string;
  officialName: string;
  housingType: KoreaBuildingHousingType;
  cohorts: readonly KoreaSaleEvidenceCohort[];
  recentSales: readonly KoreaSaleEvidenceRecentSale[];
}>;
export type KoreaSaleEvidenceStats = Readonly<{
  sourceRecordCount: number;
  eligibleRecordCount: number;
  cancelledRecordCount: number;
  missingIdentityRecordCount: number;
  observedBuildingCount: number;
  areaCohortCount: number;
  buildingCohortCount: number;
  publishedCohortCount: number;
  withheldCohortCount: number;
}>;
export type KoreaSaleEvidence = Readonly<{
  marketId: 'kr-seoul';
  period: string;
  generatedAt: string;
  publicationMinimum: typeof KOREA_SALE_EVIDENCE_PUBLICATION_MINIMUM;
  areaRecords: readonly KoreaSaleEvidenceAreaRecord[];
  buildingRecords: readonly KoreaSaleEvidenceBuildingRecord[];
  stats: KoreaSaleEvidenceStats;
}>;
export type KoreaSaleEvidenceSourceRecord = Readonly<{
  districtSlug: SeoulDistrictSlug;
  record: KoreaSaleRecord;
}>;
export type KoreaSaleEvidenceInput = Readonly<{
  period: string;
  completedMonths: readonly string[];
  generatedAt: string;
  records: readonly KoreaSaleEvidenceSourceRecord[];
}>;

const HOUSING_TYPES = Object.freeze([
  'all', 'apartment', 'officetel', 'villa_multifamily', 'detached',
] as const satisfies readonly KoreaSaleEvidenceHousingType[]);
const MONTH_PATTERN = /^\d{4}-(?:0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^(\d{4})-((?:0[1-9]|1[0-2]))-((?:0[1-9]|[12]\d|3[01]))$/;
const DISTRICT_SLUGS = new Set(SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => slug));
const RECENT_SALE_LIMIT = 20;

function invalid(message: string): never {
  throw new TypeError(message);
}

function monthIndex(month: string): number {
  const [year, value] = month.split('-').map(Number);
  return year! * 12 + value! - 1;
}

function isRealDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (match === null) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const instant = new Date(Date.UTC(year, month - 1, day));
  return instant.getUTCFullYear() === year &&
    instant.getUTCMonth() + 1 === month &&
    instant.getUTCDate() === day;
}

function assertInput(input: KoreaSaleEvidenceInput): void {
  if (input.completedMonths.length !== 7 ||
    input.completedMonths.some((month) => !MONTH_PATTERN.test(month))) {
    invalid('Sale evidence requires seven valid completed source months.');
  }
  for (let index = 1; index < input.completedMonths.length; index += 1) {
    if (monthIndex(input.completedMonths[index]!) !==
      monthIndex(input.completedMonths[index - 1]!) + 1) {
      invalid('Sale evidence completed source months must be contiguous.');
    }
  }
  const expectedPeriod = `${input.completedMonths[0]}/${input.completedMonths.at(-1)}`;
  if (input.period !== expectedPeriod) invalid('Korea sale evidence period is invalid.');
  const generatedAt = new Date(input.generatedAt);
  if (!Number.isFinite(generatedAt.getTime()) || generatedAt.toISOString() !== input.generatedAt) {
    invalid('Korea sale evidence generation time is invalid.');
  }
  const completed = new Set(input.completedMonths);
  for (const source of input.records) {
    const record = source.record;
    if (!DISTRICT_SLUGS.has(source.districtSlug)) invalid('Korea sale evidence district is invalid.');
    if (!Number.isFinite(record.areaSqm) || record.areaSqm <= 0 || record.areaSqm > 2_000) {
      invalid('Korea sale evidence area is invalid.');
    }
    if (!Number.isSafeInteger(record.priceWon) || record.priceWon <= 0) {
      invalid('Korea sale evidence price is invalid.');
    }
    if (!isRealDate(record.contractDate) || !completed.has(record.contractDate.slice(0, 7))) {
      invalid('Every sale evidence record must belong to the completed source period.');
    }
    if (!['active', 'cancelled', 'unknown'].includes(record.recordStatus)) {
      invalid('Korea sale evidence status is invalid.');
    }
  }
}

function canonicalHousingType(record: KoreaSaleRecord): KoreaBuildingHousingType {
  return record.sourceHousingType === 'villa' ? 'villa_multifamily' : record.sourceHousingType;
}

function selected(records: readonly KoreaSaleRecord[], areaBand: KoreaEvidenceAreaBand) {
  return records.filter((record) => record.recordStatus !== 'cancelled' &&
    (areaBand === 'all' || classifyAreaBand(record.areaSqm) === areaBand));
}

function change3m(records: readonly KoreaSaleRecord[], completedMonths: readonly string[]) {
  const precedingMonths = new Set(completedMonths.slice(-6, -3));
  const latestMonths = new Set(completedMonths.slice(-3));
  const valuesFor = (months: ReadonlySet<string>) => records
    .filter((record) => months.has(record.contractDate.slice(0, 7)))
    .map((record) => record.priceWon);
  const preceding = valuesFor(precedingMonths);
  const latest = valuesFor(latestMonths);
  if (preceding.length < KOREA_SALE_EVIDENCE_PUBLICATION_MINIMUM ||
    latest.length < KOREA_SALE_EVIDENCE_PUBLICATION_MINIMUM) return null;
  const before = median(preceding);
  if (before === 0) return null;
  return Math.round(((median(latest) - before) / before) * 1_000) / 10;
}

function distribution(
  records: readonly KoreaSaleRecord[],
  completedMonths: readonly string[],
  areaBand: KoreaEvidenceAreaBand,
): KoreaEvidenceDistribution {
  const matching = selected(records, areaBand);
  if (matching.length < KOREA_SALE_EVIDENCE_PUBLICATION_MINIMUM) {
    return Object.freeze({ n: matching.length, published: false });
  }
  const values = matching.map(({ priceWon }) => priceWon);
  return Object.freeze({
    n: values.length,
    published: true,
    min: roundWon(Math.min(...values)),
    p25: roundWon(percentile(values, 0.25)),
    med: roundWon(median(values)),
    p75: roundWon(percentile(values, 0.75)),
    max: roundWon(Math.max(...values)),
    chg3m: change3m(matching, completedMonths),
  });
}

function buildCohorts(
  records: readonly KoreaSaleRecord[],
  completedMonths: readonly string[],
  includeEmpty: boolean,
) {
  return Object.freeze(KOREA_EVIDENCE_AREA_BANDS
    .map((areaBand) => Object.freeze({
      areaBand,
      price: distribution(records, completedMonths, areaBand),
    }))
    .filter(({ price }) => includeEmpty || price.n > 0));
}

function recordsForHousingType(
  sources: readonly KoreaSaleEvidenceSourceRecord[],
  housingType: KoreaSaleEvidenceHousingType,
) {
  return sources
    .filter(({ record }) => housingType === 'all' || canonicalHousingType(record) === housingType)
    .map(({ record }) => record);
}

function buildAreaRecords(input: KoreaSaleEvidenceInput) {
  const records: KoreaSaleEvidenceAreaRecord[] = [];
  for (const housingType of HOUSING_TYPES) {
    records.push(Object.freeze({
      scope: 'city', areaId: `seoul:${housingType}`, districtSlug: null, housingType,
      cohorts: buildCohorts(recordsForHousingType(input.records, housingType), input.completedMonths, true),
    }));
  }
  for (const district of SEOUL_RENT_CHECK_DISTRICTS) {
    const districtSources = input.records.filter(({ districtSlug }) => districtSlug === district.slug);
    for (const housingType of HOUSING_TYPES) {
      records.push(Object.freeze({
        scope: 'district', areaId: `${district.slug}:${housingType}`,
        districtSlug: district.slug, housingType,
        cohorts: buildCohorts(recordsForHousingType(districtSources, housingType), input.completedMonths, true),
      }));
    }
  }
  return Object.freeze(records);
}

type BuildingGroup = KoreaBuildingIdentity & { records: KoreaSaleRecord[] };

function buildBuildingGroups(sources: readonly KoreaSaleEvidenceSourceRecord[]) {
  const groups = new Map<string, BuildingGroup>();
  let missingIdentityRecordCount = 0;
  for (const source of sources) {
    if (source.record.recordStatus === 'cancelled') continue;
    const identity = buildKoreaBuildingIdentity({
      districtSlug: source.districtSlug,
      legalDong: source.record.legalDong,
      buildingLabel: source.record.buildingLabel,
      sourceHousingType: source.record.sourceHousingType,
    });
    if (identity === null) {
      missingIdentityRecordCount += 1;
      continue;
    }
    const group = groups.get(identity.buildingId) ?? { ...identity, records: [] };
    group.records.push(source.record);
    groups.set(identity.buildingId, group);
  }
  return Object.freeze({
    groups: Object.freeze([...groups.values()].sort((left, right) =>
      left.districtSlug.localeCompare(right.districtSlug) ||
      left.neighborhoodName.localeCompare(right.neighborhoodName, 'ko-KR') ||
      left.buildingName.localeCompare(right.buildingName, 'ko-KR') ||
      left.buildingId.localeCompare(right.buildingId))),
    missingIdentityRecordCount,
  });
}

function recentSales(records: readonly KoreaSaleRecord[]) {
  return Object.freeze([...records]
    .filter(({ recordStatus }) => recordStatus !== 'cancelled')
    .sort((left, right) =>
      right.contractDate.localeCompare(left.contractDate) || right.priceWon - left.priceWon)
    .slice(0, RECENT_SALE_LIMIT)
    .map((record) => Object.freeze({
      filedMonth: record.contractDate.slice(0, 7),
      areaSqm: Math.round(record.areaSqm * 100) / 100,
      priceWon: record.priceWon,
      ...(record.floor === undefined ? {} : { floor: record.floor }),
      ...(record.buildYear === undefined ? {} : { buildYear: record.buildYear }),
    })));
}

function buildBuildingRecords(input: KoreaSaleEvidenceInput, groups: readonly BuildingGroup[]) {
  return Object.freeze(groups.map((group) => Object.freeze({
    buildingId: group.buildingId,
    districtSlug: group.districtSlug,
    neighborhoodId: group.neighborhoodId,
    neighborhoodName: group.neighborhoodName,
    officialName: group.buildingName,
    housingType: group.housingType,
    cohorts: buildCohorts(group.records, input.completedMonths, false),
    recentSales: recentSales(group.records),
  })));
}

function cohortCounts(
  areaRecords: readonly KoreaSaleEvidenceAreaRecord[],
  buildingRecords: readonly KoreaSaleEvidenceBuildingRecord[],
) {
  const areaCohortCount = areaRecords.reduce((sum, record) => sum + record.cohorts.length, 0);
  const buildingCohortCount = buildingRecords.reduce((sum, record) => sum + record.cohorts.length, 0);
  const cohorts = [
    ...areaRecords.flatMap(({ cohorts: values }) => values),
    ...buildingRecords.flatMap(({ cohorts: values }) => values),
  ];
  const publishedCohortCount = cohorts.filter(({ price }) => price.published).length;
  return {
    areaCohortCount,
    buildingCohortCount,
    publishedCohortCount,
    withheldCohortCount: cohorts.length - publishedCohortCount,
  } as const;
}

export function buildKoreaSaleEvidence(input: KoreaSaleEvidenceInput): KoreaSaleEvidence {
  assertInput(input);
  const sourceRecords = input.records.map(({ record }) => record);
  const eligibleRecords = sourceRecords.filter(({ recordStatus }) => recordStatus !== 'cancelled');
  const areaRecords = buildAreaRecords(input);
  const grouped = buildBuildingGroups(input.records);
  const buildingRecords = buildBuildingRecords(input, grouped.groups);
  const counts = cohortCounts(areaRecords, buildingRecords);
  return Object.freeze({
    marketId: 'kr-seoul', period: input.period, generatedAt: input.generatedAt,
    publicationMinimum: KOREA_SALE_EVIDENCE_PUBLICATION_MINIMUM,
    areaRecords, buildingRecords,
    stats: Object.freeze({
      sourceRecordCount: sourceRecords.length,
      eligibleRecordCount: eligibleRecords.length,
      cancelledRecordCount: sourceRecords.length - eligibleRecords.length,
      missingIdentityRecordCount: grouped.missingIdentityRecordCount,
      observedBuildingCount: buildingRecords.length,
      ...counts,
    }),
  });
}
