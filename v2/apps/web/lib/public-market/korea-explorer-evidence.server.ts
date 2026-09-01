import 'server-only';

import {
  KOREA_EVIDENCE_AREA_BANDS,
  classifyAreaBand,
  getSeoulDistrictBySlug,
  type KoreaEvidenceAreaBand,
  type KoreaEvidenceDistribution,
  type KoreaRentEvidenceBuildingRecord,
  type KoreaSaleEvidenceBuildingRecord,
} from '@signedprice/korea-rent';

import type { KoreaEvidenceRepositories } from './korea-evidence-repositories.server';

export const KOREA_EXPLORER_HOUSING_TYPES = Object.freeze([
  'all', 'apartment', 'officetel', 'villa_multifamily', 'detached',
] as const);

export type KoreaExplorerTransaction = 'jeonse' | 'monthly' | 'sale';
export type KoreaExplorerHousingType = typeof KOREA_EXPLORER_HOUSING_TYPES[number];
export type KoreaExplorerContractGroup = 'all' | 'new' | 'renewal' | 'unknown';
export type KoreaExplorerEffectiveContractGroup = KoreaExplorerContractGroup | 'not-applicable';

export type KoreaExplorerEvidenceSelectionInput = Readonly<{
  transaction?: unknown;
  areaBand?: unknown;
  housingType?: unknown;
  contractGroup?: unknown;
}>;

export type KoreaExplorerEvidenceSelection = Readonly<{
  transaction: KoreaExplorerTransaction;
  areaBand: KoreaEvidenceAreaBand;
  housingType: KoreaExplorerHousingType;
  contractGroup: KoreaExplorerEffectiveContractGroup;
}>;

export type KoreaExplorerProjectedArea = Readonly<{
  areaId: string;
  districtSlug: string | null;
  primary: KoreaEvidenceDistribution;
  filedDeposit: KoreaEvidenceDistribution | null;
  contractGroups: Readonly<Record<KoreaExplorerContractGroup, Readonly<{
    primary: KoreaEvidenceDistribution;
    filedDeposit: KoreaEvidenceDistribution | null;
  }>>> | null;
}>;

export type KoreaExplorerProjectedBuilding = Readonly<{
  buildingId: string;
  districtSlug: string;
  neighborhoodId: string;
  neighborhoodName: string;
  officialName: string;
  housingType: Exclude<KoreaExplorerHousingType, 'all'>;
  transaction: KoreaExplorerTransaction;
  primaryMetric: 'deposit' | 'monthly-rent' | 'sale-price';
  primary: KoreaEvidenceDistribution;
  filedDeposit: KoreaEvidenceDistribution | null;
  contractGroups: Readonly<Record<KoreaExplorerContractGroup, Readonly<{
    primary: KoreaEvidenceDistribution;
    filedDeposit: KoreaEvidenceDistribution | null;
  }>>> | null;
  recentTransactions: readonly Readonly<Record<string, unknown>>[];
}>;

export type KoreaExplorerEvidenceProjection =
  | Readonly<{
      status: 'ready';
      availability: Readonly<{ jeonse: boolean; monthly: boolean; sale: boolean }>;
      selection: KoreaExplorerEvidenceSelection;
      period: string;
      generatedAt: string;
      city: KoreaExplorerProjectedArea;
      districts: readonly KoreaExplorerProjectedArea[];
      buildings: readonly KoreaExplorerProjectedBuilding[];
    }>
  | Readonly<{
      status: 'unavailable';
      availability: Readonly<{ jeonse: boolean; monthly: boolean; sale: boolean }>;
      selection: KoreaExplorerEvidenceSelection;
    }>;

export type KoreaExplorerBuildingDetailModel = Readonly<{
  status: 'ready';
  period: string;
  generatedAt: string;
  district: Readonly<{ slug: string; nameEn: string; nameKo: string }>;
  building: Readonly<{
    buildingId: string;
    officialName: string;
    neighborhoodId: string;
    neighborhoodName: string;
    housingType: Exclude<KoreaExplorerHousingType, 'all'>;
  }>;
  selection: KoreaExplorerEvidenceSelection;
  evidence: Readonly<{
    state: 'published' | 'withheld' | 'unavailable';
    primaryMetric: 'deposit' | 'monthly-rent' | 'sale-price';
    sampleLabel: string;
    medianWon: number | null;
    medianLabel: string | null;
    middleHalfLabel: string | null;
    rangeLabel: string | null;
    filedDepositMedianWon: number | null;
    filedDepositMedianLabel: string | null;
  }>;
  recentTransactions: readonly Readonly<{
    filedMonth: string;
    areaSqm: number;
    areaLabel: string;
    transaction: KoreaExplorerTransaction;
    primaryWon: number;
    primaryLabel: string;
    filedDepositWon: number | null;
    filedDepositLabel: string | null;
    contractType: string | null;
    floor: number | null;
    buildYear: number | null;
  }>[];
}>;

const TRANSACTIONS = new Set<KoreaExplorerTransaction>(['jeonse', 'monthly', 'sale']);
const CONTRACT_GROUPS = new Set<KoreaExplorerContractGroup>([
  'all', 'new', 'renewal', 'unknown',
]);
const ZERO_DISTRIBUTION = Object.freeze({ n: 0, published: false } as const);
const RENT_GROUP_ORDER = Object.freeze(['all', 'new', 'renewal', 'unknown'] as const);
const money = new Intl.NumberFormat('ko-KR', {
  style: 'currency', currency: 'KRW', maximumFractionDigits: 0,
});

function formatMoney(value: number): string {
  return money.format(value);
}

function normalizeSelection(
  input: KoreaExplorerEvidenceSelectionInput,
): KoreaExplorerEvidenceSelection {
  const transaction = TRANSACTIONS.has(input.transaction as KoreaExplorerTransaction)
    ? input.transaction as KoreaExplorerTransaction
    : 'jeonse';
  const areaBand = KOREA_EVIDENCE_AREA_BANDS.includes(
    input.areaBand as KoreaEvidenceAreaBand,
  ) ? input.areaBand as KoreaEvidenceAreaBand : 'all';
  const housingType = KOREA_EXPLORER_HOUSING_TYPES.includes(
    input.housingType as KoreaExplorerHousingType,
  ) ? input.housingType as KoreaExplorerHousingType : 'all';
  const contractGroup = transaction === 'sale'
    ? 'not-applicable'
    : CONTRACT_GROUPS.has(input.contractGroup as KoreaExplorerContractGroup)
      ? input.contractGroup as KoreaExplorerContractGroup
      : 'all';
  return Object.freeze({ transaction, areaBand, housingType, contractGroup });
}

function availabilityFor(repositories: KoreaEvidenceRepositories) {
  return Object.freeze({
    jeonse: repositories.rent !== null,
    monthly: repositories.rent !== null,
    sale: repositories.sale !== null,
  });
}

function rentAreaProjection(
  repositories: KoreaEvidenceRepositories,
  selection: KoreaExplorerEvidenceSelection,
): readonly KoreaExplorerProjectedArea[] {
  const rent = repositories.rent;
  if (rent === null || selection.contractGroup === 'not-applicable') return Object.freeze([]);
  return Object.freeze(rent.listAreaRecords()
    .filter(({ housingType }) => housingType === selection.housingType)
    .map((record) => {
      const cohort = record.cohorts.find((candidate) => (
        candidate.transaction === selection.transaction
        && candidate.areaBand === selection.areaBand
        && candidate.contractGroup === selection.contractGroup
      ));
      if (cohort === undefined) throw new TypeError('Selected rental evidence cohort is missing.');
      return Object.freeze({
        areaId: record.areaId,
        districtSlug: record.districtSlug,
        primary: cohort.primary,
        filedDeposit: cohort.filedDeposit,
        contractGroups: Object.freeze(Object.fromEntries(RENT_GROUP_ORDER.map((group) => {
          const selected = record.cohorts.find((candidate) => (
            candidate.transaction === selection.transaction
            && candidate.areaBand === selection.areaBand
            && candidate.contractGroup === group
          ));
          if (selected === undefined) throw new TypeError('Rental contract group is missing.');
          return [group, Object.freeze({
            primary: selected.primary,
            filedDeposit: selected.filedDeposit,
          })];
        })) as Record<KoreaExplorerContractGroup, Readonly<{
          primary: KoreaEvidenceDistribution;
          filedDeposit: KoreaEvidenceDistribution | null;
        }>>),
      });
    }));
}

function saleAreaProjection(
  repositories: KoreaEvidenceRepositories,
  selection: KoreaExplorerEvidenceSelection,
): readonly KoreaExplorerProjectedArea[] {
  const sale = repositories.sale;
  if (sale === null) return Object.freeze([]);
  return Object.freeze(sale.listAreaRecords()
    .filter(({ housingType }) => housingType === selection.housingType)
    .map((record) => {
      const cohort = record.cohorts.find(({ areaBand }) => areaBand === selection.areaBand);
      if (cohort === undefined) throw new TypeError('Selected sale evidence cohort is missing.');
      return Object.freeze({
        areaId: record.areaId,
        districtSlug: record.districtSlug,
        primary: cohort.price,
        filedDeposit: null,
        contractGroups: null,
      });
    }));
}

type IdentityRecord = KoreaRentEvidenceBuildingRecord | KoreaSaleEvidenceBuildingRecord;

function identityRecords(repositories: KoreaEvidenceRepositories): readonly IdentityRecord[] {
  const records = [
    ...(repositories.rent?.listBuildingRecords() ?? []),
    ...(repositories.sale?.listBuildingRecords() ?? []),
  ];
  return Object.freeze([...new Map(records.map((record) => [
    `${record.districtSlug}/${record.buildingId}`, record,
  ] as const)).values()]);
}

function areaMatches(areaSqm: number, areaBand: KoreaEvidenceAreaBand): boolean {
  return areaBand === 'all' || classifyAreaBand(areaSqm) === areaBand;
}

function selectedRentBuilding(
  record: KoreaRentEvidenceBuildingRecord | undefined,
  selection: KoreaExplorerEvidenceSelection,
) {
  if (record === undefined || selection.contractGroup === 'not-applicable') return null;
  return record.cohorts.find((cohort) => (
    cohort.transaction === selection.transaction
    && cohort.areaBand === selection.areaBand
    && cohort.contractGroup === selection.contractGroup
  )) ?? null;
}

function projectedBuildings(
  repositories: KoreaEvidenceRepositories,
  selection: KoreaExplorerEvidenceSelection,
): readonly KoreaExplorerProjectedBuilding[] {
  const rentById = new Map<string, KoreaRentEvidenceBuildingRecord>((repositories.rent?.listBuildingRecords() ?? []).map((record) => [
    `${record.districtSlug}/${record.buildingId}`, record,
  ] as const));
  const saleById = new Map<string, KoreaSaleEvidenceBuildingRecord>((repositories.sale?.listBuildingRecords() ?? []).map((record) => [
    `${record.districtSlug}/${record.buildingId}`, record,
  ] as const));
  return Object.freeze(identityRecords(repositories)
    .filter(({ housingType }) => (
      selection.housingType === 'all' || housingType === selection.housingType
    ))
    .map((identity) => {
      const key = `${identity.districtSlug}/${identity.buildingId}`;
      const rent = rentById.get(key);
      const sale = saleById.get(key);
      if (selection.transaction === 'sale') {
        const cohort = sale?.cohorts.find(({ areaBand }) => areaBand === selection.areaBand);
        const recentTransactions = sale?.recentSales.filter(({ areaSqm }) => (
          areaMatches(areaSqm, selection.areaBand)
        )) ?? [];
        return Object.freeze({
          buildingId: identity.buildingId,
          districtSlug: identity.districtSlug,
          neighborhoodId: identity.neighborhoodId,
          neighborhoodName: identity.neighborhoodName,
          officialName: identity.officialName,
          housingType: identity.housingType,
          transaction: selection.transaction,
          primaryMetric: 'sale-price' as const,
          primary: cohort?.price ?? ZERO_DISTRIBUTION,
          filedDeposit: null,
          contractGroups: null,
          recentTransactions: Object.freeze(recentTransactions),
        });
      }
      const cohort = selectedRentBuilding(rent, selection);
      const contractGroups = Object.freeze(Object.fromEntries(RENT_GROUP_ORDER.map((group) => {
        const selected = rent?.cohorts.find((candidate) => (
          candidate.transaction === selection.transaction
          && candidate.areaBand === selection.areaBand
          && candidate.contractGroup === group
        ));
        return [group, Object.freeze({
          primary: selected?.primary ?? ZERO_DISTRIBUTION,
          filedDeposit: selected?.filedDeposit ?? null,
        })];
      }))) as Record<KoreaExplorerContractGroup, Readonly<{
        primary: KoreaEvidenceDistribution;
        filedDeposit: KoreaEvidenceDistribution | null;
      }>>;
      const recentTransactions = rent?.recentTransactions.filter((recent) => (
        recent.transaction === selection.transaction
        && areaMatches(recent.areaSqm, selection.areaBand)
        && (selection.contractGroup === 'all'
          || recent.contractType === selection.contractGroup)
      )) ?? [];
      return Object.freeze({
        buildingId: identity.buildingId,
        districtSlug: identity.districtSlug,
        neighborhoodId: identity.neighborhoodId,
        neighborhoodName: identity.neighborhoodName,
        officialName: identity.officialName,
        housingType: identity.housingType,
        transaction: selection.transaction,
        primaryMetric: selection.transaction === 'jeonse' ? 'deposit' as const : 'monthly-rent' as const,
        primary: cohort?.primary ?? ZERO_DISTRIBUTION,
        filedDeposit: cohort?.filedDeposit ?? null,
        contractGroups,
        recentTransactions: Object.freeze(recentTransactions),
      });
    }));
}

export function buildKoreaExplorerEvidenceProjection(
  repositories: KoreaEvidenceRepositories,
  input: KoreaExplorerEvidenceSelectionInput,
): KoreaExplorerEvidenceProjection {
  const selection = normalizeSelection(input);
  const availability = availabilityFor(repositories);
  const selectedRepository = selection.transaction === 'sale'
    ? repositories.sale
    : repositories.rent;
  if (selectedRepository === null) {
    return Object.freeze({ status: 'unavailable', availability, selection });
  }
  try {
    const artifact = selectedRepository.getArtifact();
    const areas = selection.transaction === 'sale'
      ? saleAreaProjection(repositories, selection)
      : rentAreaProjection(repositories, selection);
    const city = areas.find(({ districtSlug }) => districtSlug === null);
    if (city === undefined) throw new TypeError('Selected city evidence is missing.');
    return Object.freeze({
      status: 'ready',
      availability,
      selection,
      period: artifact.period,
      generatedAt: artifact.generatedAt,
      city,
      districts: Object.freeze(areas.filter(({ districtSlug }) => districtSlug !== null)),
      buildings: projectedBuildings(repositories, selection),
    });
  } catch {
    return Object.freeze({ status: 'unavailable', availability, selection });
  }
}

export function buildKoreaExplorerBuildingDetailModel(
  repositories: KoreaEvidenceRepositories,
  districtSlug: string,
  buildingId: string,
  input: KoreaExplorerEvidenceSelectionInput,
): KoreaExplorerBuildingDetailModel | null {
  const requested = normalizeSelection(input);
  const projection = buildKoreaExplorerEvidenceProjection(repositories, {
    ...input,
    housingType: 'all',
  });
  if (projection.status !== 'ready') return null;
  const building = projection.buildings.find((candidate) => (
    candidate.districtSlug === districtSlug && candidate.buildingId === buildingId
  ));
  const district = getSeoulDistrictBySlug(districtSlug);
  if (building === undefined || district === null) return null;

  const normalizedRecent = building.recentTransactions.flatMap((source) => {
    const record = source as Readonly<Record<string, unknown>>;
    const filedMonth = record.filedMonth;
    const areaSqm = record.areaSqm;
    const primaryWon = building.primaryMetric === 'sale-price'
      ? record.priceWon
      : building.primaryMetric === 'monthly-rent'
        ? record.monthlyRentWon
        : record.depositWon;
    if (typeof filedMonth !== 'string'
      || typeof areaSqm !== 'number'
      || typeof primaryWon !== 'number') return [];
    const filedDepositWon = building.primaryMetric === 'monthly-rent'
      && typeof record.depositWon === 'number'
      ? record.depositWon
      : null;
    return [Object.freeze({
      filedMonth,
      areaSqm,
      areaLabel: `${areaSqm.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}㎡`,
      transaction: building.transaction,
      primaryWon,
      primaryLabel: formatMoney(primaryWon),
      filedDepositWon,
      filedDepositLabel: filedDepositWon === null ? null : formatMoney(filedDepositWon),
      contractType: typeof record.contractType === 'string' ? record.contractType : null,
      floor: typeof record.floor === 'number' ? record.floor : null,
      buildYear: typeof record.buildYear === 'number' ? record.buildYear : null,
    })];
  });
  const primary = building.primary;
  const filedDeposit = building.filedDeposit;
  return Object.freeze({
    status: 'ready' as const,
    period: projection.period,
    generatedAt: projection.generatedAt,
    district: Object.freeze({ slug: district.slug, nameEn: district.nameEn, nameKo: district.nameKo }),
    building: Object.freeze({
      buildingId: building.buildingId,
      officialName: building.officialName,
      neighborhoodId: building.neighborhoodId,
      neighborhoodName: building.neighborhoodName,
      housingType: building.housingType,
    }),
    selection: Object.freeze({ ...requested, housingType: building.housingType }),
    evidence: Object.freeze({
      state: primary.n === 0 ? 'unavailable' as const
        : primary.published ? 'published' as const : 'withheld' as const,
      primaryMetric: building.primaryMetric,
      sampleLabel: `${primary.n} reported contract${primary.n === 1 ? '' : 's'}`,
      medianWon: primary.published ? primary.med : null,
      medianLabel: primary.published ? formatMoney(primary.med) : null,
      middleHalfLabel: primary.published
        ? `${formatMoney(primary.p25)}–${formatMoney(primary.p75)}`
        : null,
      rangeLabel: primary.published
        ? `${formatMoney(primary.min)}–${formatMoney(primary.max)}`
        : null,
      filedDepositMedianWon: filedDeposit?.published === true ? filedDeposit.med : null,
      filedDepositMedianLabel: filedDeposit?.published === true
        ? formatMoney(filedDeposit.med)
        : null,
    }),
    recentTransactions: Object.freeze(normalizedRecent),
  });
}
