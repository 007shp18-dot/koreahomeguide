import {
  KOREA_EVIDENCE_AREA_BANDS,
  buildRentEvidenceDistribution,
  selectRentEvidenceRecords,
  type KoreaEvidenceAreaBand,
  type KoreaEvidenceContractGroup,
  type KoreaEvidenceDistribution,
  type KoreaEvidenceTransaction,
} from './evidence-cohorts';
import {
  buildKoreaBuildingIdentity,
  type KoreaBuildingHousingType,
  type KoreaBuildingIdentity,
} from './building-identity';
import {
  SEOUL_RENT_CHECK_DISTRICTS,
  type SeoulDistrictSlug,
} from './districts';
import type { KoreaRentRecord } from './input';

export const KOREA_RENT_EVIDENCE_PUBLICATION_MINIMUM = 5 as const;

export type KoreaRentEvidenceHousingType = KoreaBuildingHousingType | 'all';

export type KoreaRentEvidenceCohort = Readonly<{
  transaction: KoreaEvidenceTransaction;
  areaBand: KoreaEvidenceAreaBand;
  contractGroup: KoreaEvidenceContractGroup;
  primaryMetric: 'deposit' | 'monthly-rent';
  primary: KoreaEvidenceDistribution;
  filedDeposit: KoreaEvidenceDistribution | null;
}>;

export type KoreaRentEvidenceAreaRecord = Readonly<{
  scope: 'city' | 'district';
  areaId: string;
  districtSlug: SeoulDistrictSlug | null;
  housingType: KoreaRentEvidenceHousingType;
  cohorts: readonly KoreaRentEvidenceCohort[];
}>;

export type KoreaRentEvidenceRecentTransaction = Readonly<{
  filedMonth: string;
  areaSqm: number;
  transaction: KoreaEvidenceTransaction;
  depositWon: number;
  monthlyRentWon: number;
  contractType: Exclude<KoreaEvidenceContractGroup, 'all'>;
}>;

export type KoreaRentEvidenceBuildingRecord = Readonly<{
  buildingId: string;
  districtSlug: SeoulDistrictSlug;
  neighborhoodId: string;
  neighborhoodName: string;
  officialName: string;
  housingType: KoreaBuildingHousingType;
  cohorts: readonly KoreaRentEvidenceCohort[];
  recentTransactions: readonly KoreaRentEvidenceRecentTransaction[];
}>;

export type KoreaRentEvidenceStats = Readonly<{
  sourceRecordCount: number;
  eligibleRecordCount: number;
  jeonseRecordCount: number;
  monthlyRecordCount: number;
  cancelledRecordCount: number;
  invalidPaymentRecordCount: number;
  missingIdentityRecordCount: number;
  observedBuildingCount: number;
  areaCohortCount: number;
  buildingCohortCount: number;
  publishedCohortCount: number;
  withheldCohortCount: number;
}>;

export type KoreaRentEvidence = Readonly<{
  marketId: 'kr-seoul';
  period: string;
  generatedAt: string;
  publicationMinimum: typeof KOREA_RENT_EVIDENCE_PUBLICATION_MINIMUM;
  areaRecords: readonly KoreaRentEvidenceAreaRecord[];
  buildingRecords: readonly KoreaRentEvidenceBuildingRecord[];
  stats: KoreaRentEvidenceStats;
}>;

export type KoreaRentEvidenceSourceRecord = Readonly<{
  districtSlug: SeoulDistrictSlug;
  record: KoreaRentRecord;
}>;

export type KoreaRentEvidenceInput = Readonly<{
  period: string;
  completedMonths: readonly string[];
  generatedAt: string;
  records: readonly KoreaRentEvidenceSourceRecord[];
}>;

const TRANSACTIONS = Object.freeze(['jeonse', 'monthly'] as const);
const CONTRACT_GROUPS = Object.freeze(['all', 'new', 'renewal', 'unknown'] as const);
const HOUSING_TYPES = Object.freeze([
  'all', 'apartment', 'officetel', 'villa_multifamily', 'detached',
] as const satisfies readonly KoreaRentEvidenceHousingType[]);
const RECENT_TRANSACTION_LIMIT = 20;
const DISTRICT_SLUGS = new Set(SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => slug));

function invalid(message: string): never {
  throw new TypeError(message);
}

function canonicalHousingType(record: KoreaRentRecord): KoreaBuildingHousingType {
  return record.sourceHousingType === 'villa'
    ? 'villa_multifamily'
    : record.sourceHousingType;
}

function transactionFor(record: KoreaRentRecord): KoreaEvidenceTransaction {
  return record.monthlyRentWon > 0 ? 'monthly' : 'jeonse';
}

function hasPositiveFiledPayment(record: KoreaRentRecord): boolean {
  if (
    !Number.isSafeInteger(record.depositWon)
    || record.depositWon < 0
    || !Number.isSafeInteger(record.monthlyRentWon)
    || record.monthlyRentWon < 0
  ) {
    invalid('Korea rent evidence money is invalid.');
  }
  return record.depositWon > 0 || record.monthlyRentWon > 0;
}

function buildCohorts(
  records: readonly KoreaRentRecord[],
  completedMonths: readonly string[],
  includeEmpty: boolean,
): readonly KoreaRentEvidenceCohort[] {
  const cohorts: KoreaRentEvidenceCohort[] = [];
  for (const transaction of TRANSACTIONS) {
    for (const areaBand of KOREA_EVIDENCE_AREA_BANDS) {
      for (const contractGroup of CONTRACT_GROUPS) {
        const primary = buildRentEvidenceDistribution({
          records,
          completedMonths,
          transaction,
          areaBand,
          contractGroup,
          metric: 'primary',
        });
        if (!includeEmpty && primary.n === 0) continue;
        cohorts.push(Object.freeze({
          transaction,
          areaBand,
          contractGroup,
          primaryMetric: transaction === 'jeonse' ? 'deposit' : 'monthly-rent',
          primary,
          filedDeposit: transaction === 'monthly'
            ? buildRentEvidenceDistribution({
                records,
                completedMonths,
                transaction,
                areaBand,
                contractGroup,
                metric: 'filed-deposit',
              })
            : null,
        }));
      }
    }
  }
  return Object.freeze(cohorts);
}

function validateInput(input: KoreaRentEvidenceInput): void {
  const validationRecords = input.records.map(({ record }) => (
    hasPositiveFiledPayment(record)
      ? record
      : { ...record, depositWon: 1 }
  ));
  buildRentEvidenceDistribution({
    records: validationRecords,
    completedMonths: input.completedMonths,
    transaction: 'jeonse',
    areaBand: 'all',
    contractGroup: 'all',
    metric: 'primary',
  });
  const expectedPeriod = `${input.completedMonths[0]}/${input.completedMonths.at(-1)}`;
  if (input.period !== expectedPeriod) invalid('Korea rent evidence period is invalid.');
  const generatedAt = new Date(input.generatedAt);
  if (!Number.isFinite(generatedAt.getTime()) || generatedAt.toISOString() !== input.generatedAt) {
    invalid('Korea rent evidence generation time is invalid.');
  }
  if (input.records.some(({ districtSlug }) => !DISTRICT_SLUGS.has(districtSlug))) {
    invalid('Korea rent evidence district is invalid.');
  }
}

function recordsForHousingType(
  sources: readonly KoreaRentEvidenceSourceRecord[],
  housingType: KoreaRentEvidenceHousingType,
): readonly KoreaRentRecord[] {
  return sources
    .filter(({ record }) => (
      housingType === 'all' || canonicalHousingType(record) === housingType
    ))
    .map(({ record }) => record);
}

function buildAreaRecords(
  input: KoreaRentEvidenceInput,
): readonly KoreaRentEvidenceAreaRecord[] {
  const records: KoreaRentEvidenceAreaRecord[] = [];
  for (const housingType of HOUSING_TYPES) {
    records.push(Object.freeze({
      scope: 'city',
      areaId: `seoul:${housingType}`,
      districtSlug: null,
      housingType,
      cohorts: buildCohorts(
        recordsForHousingType(input.records, housingType),
        input.completedMonths,
        true,
      ),
    }));
  }
  for (const district of SEOUL_RENT_CHECK_DISTRICTS) {
    const districtSources = input.records.filter(({ districtSlug }) => (
      districtSlug === district.slug
    ));
    for (const housingType of HOUSING_TYPES) {
      records.push(Object.freeze({
        scope: 'district',
        areaId: `${district.slug}:${housingType}`,
        districtSlug: district.slug,
        housingType,
        cohorts: buildCohorts(
          recordsForHousingType(districtSources, housingType),
          input.completedMonths,
          true,
        ),
      }));
    }
  }
  return Object.freeze(records);
}

type BuildingGroup = KoreaBuildingIdentity & {
  records: KoreaRentRecord[];
};

function buildBuildingGroups(
  sources: readonly KoreaRentEvidenceSourceRecord[],
): Readonly<{
  groups: readonly BuildingGroup[];
  missingIdentityRecordCount: number;
}> {
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
    groups: Object.freeze([...groups.values()].sort((left, right) => (
      left.districtSlug.localeCompare(right.districtSlug)
      || left.neighborhoodName.localeCompare(right.neighborhoodName, 'ko-KR')
      || left.buildingName.localeCompare(right.buildingName, 'ko-KR')
      || left.buildingId.localeCompare(right.buildingId)
    ))),
    missingIdentityRecordCount,
  });
}

function recentTransactions(
  records: readonly KoreaRentRecord[],
): readonly KoreaRentEvidenceRecentTransaction[] {
  return Object.freeze([...records]
    .filter(({ recordStatus }) => recordStatus !== 'cancelled')
    .sort((left, right) => (
      right.contractDate.localeCompare(left.contractDate)
      || right.monthlyRentWon - left.monthlyRentWon
      || right.depositWon - left.depositWon
    ))
    .slice(0, RECENT_TRANSACTION_LIMIT)
    .map((record) => Object.freeze({
      filedMonth: record.contractDate.slice(0, 7),
      areaSqm: Math.round(record.areaSqm * 100) / 100,
      transaction: transactionFor(record),
      depositWon: record.depositWon,
      monthlyRentWon: record.monthlyRentWon,
      contractType: record.contractType,
    })));
}

function buildBuildingRecords(
  input: KoreaRentEvidenceInput,
  groups: readonly BuildingGroup[],
): readonly KoreaRentEvidenceBuildingRecord[] {
  return Object.freeze(groups.map((group) => Object.freeze({
    buildingId: group.buildingId,
    districtSlug: group.districtSlug,
    neighborhoodId: group.neighborhoodId,
    neighborhoodName: group.neighborhoodName,
    officialName: group.buildingName,
    housingType: group.housingType,
    cohorts: buildCohorts(group.records, input.completedMonths, false),
    recentTransactions: recentTransactions(group.records),
  })));
}

function countCohorts(
  areaRecords: readonly KoreaRentEvidenceAreaRecord[],
  buildingRecords: readonly KoreaRentEvidenceBuildingRecord[],
): Readonly<{
  areaCohortCount: number;
  buildingCohortCount: number;
  publishedCohortCount: number;
  withheldCohortCount: number;
}> {
  const areaCohortCount = areaRecords.reduce((sum, record) => sum + record.cohorts.length, 0);
  const buildingCohortCount = buildingRecords.reduce(
    (sum, record) => sum + record.cohorts.length,
    0,
  );
  const cohorts = [
    ...areaRecords.flatMap(({ cohorts: values }) => values),
    ...buildingRecords.flatMap(({ cohorts: values }) => values),
  ];
  const publishedCohortCount = cohorts.filter(({ primary }) => primary.published).length;
  return Object.freeze({
    areaCohortCount,
    buildingCohortCount,
    publishedCohortCount,
    withheldCohortCount: cohorts.length - publishedCohortCount,
  });
}

export function buildKoreaRentEvidence(input: KoreaRentEvidenceInput): KoreaRentEvidence {
  validateInput(input);
  const sourceRecords = input.records.map(({ record }) => record);
  const eligibleSources = input.records.filter(({ record }) => (
    record.recordStatus !== 'cancelled' && hasPositiveFiledPayment(record)
  ));
  const eligibleInput = Object.freeze({ ...input, records: Object.freeze(eligibleSources) });
  const eligibleRecords = eligibleSources.map(({ record }) => record);
  const jeonseRecords = selectRentEvidenceRecords({
    records: eligibleRecords,
    transaction: 'jeonse',
    areaBand: 'all',
    contractGroup: 'all',
  });
  const monthlyRecords = selectRentEvidenceRecords({
    records: eligibleRecords,
    transaction: 'monthly',
    areaBand: 'all',
    contractGroup: 'all',
  });
  const areaRecords = buildAreaRecords(eligibleInput);
  const grouped = buildBuildingGroups(eligibleSources);
  const buildingRecords = buildBuildingRecords(eligibleInput, grouped.groups);
  const cohortCounts = countCohorts(areaRecords, buildingRecords);
  return Object.freeze({
    marketId: 'kr-seoul',
    period: input.period,
    generatedAt: input.generatedAt,
    publicationMinimum: KOREA_RENT_EVIDENCE_PUBLICATION_MINIMUM,
    areaRecords,
    buildingRecords,
    stats: Object.freeze({
      sourceRecordCount: sourceRecords.length,
      eligibleRecordCount: jeonseRecords.length + monthlyRecords.length,
      jeonseRecordCount: jeonseRecords.length,
      monthlyRecordCount: monthlyRecords.length,
      cancelledRecordCount: sourceRecords.filter(({ recordStatus }) => (
        recordStatus === 'cancelled'
      )).length,
      invalidPaymentRecordCount: sourceRecords.filter((record) => (
        record.recordStatus !== 'cancelled' && !hasPositiveFiledPayment(record)
      )).length,
      missingIdentityRecordCount: grouped.missingIdentityRecordCount,
      observedBuildingCount: buildingRecords.length,
      ...cohortCounts,
    }),
  });
}
