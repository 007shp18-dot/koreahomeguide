import 'server-only';

import {
  KOREA_EVIDENCE_AREA_BANDS,
  SEOUL_RENT_CHECK_DISTRICTS,
  classifyAreaBand,
  getSeoulDistrictBySlug,
  type KoreaEvidenceAreaBand,
  type KoreaEvidenceDistribution,
  type KoreaRentEvidenceBuildingRecord,
  type KoreaSaleEvidenceBuildingRecord,
} from '@signedprice/korea-rent';

import type { KoreaEvidenceRepositories } from './korea-evidence-repositories.server';
import type { SeoulDistrictSlug } from '@signedprice/korea-rent/browser';

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
      buildingPage: KoreaExplorerBuildingPage | null;
      buildingStats: KoreaExplorerBuildingStats | null;
    }>
  | Readonly<{
      status: 'unavailable';
      availability: Readonly<{ jeonse: boolean; monthly: boolean; sale: boolean }>;
      selection: KoreaExplorerEvidenceSelection;
    }>;

export type KoreaExplorerBuildingPage = Readonly<{
  districtSlug: SeoulDistrictSlug;
  query: string;
  page: number;
  pageSize: number;
  total: number;
  buildings: readonly KoreaExplorerProjectedBuilding[];
}>;

export type KoreaExplorerBuildingStats = Readonly<{
  observed: number;
  transactionCovered: number;
  priceReady: number;
}>;

export type KoreaExplorerProjectionOptions = Readonly<{
  includeBuildings?: boolean;
  includeBuildingStats?: boolean;
  districtSlug?: unknown;
  buildingQuery?: unknown;
  buildingPage?: unknown;
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
export const KOREA_EXPLORER_BUILDING_PAGE_SIZE = 50 as const;
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

type KoreaExplorerBuildingIndex = Readonly<{
  identities: readonly IdentityRecord[];
  identitiesByDistrict: ReadonlyMap<SeoulDistrictSlug, readonly IdentityRecord[]>;
  rentById: ReadonlyMap<string, KoreaRentEvidenceBuildingRecord>;
  saleById: ReadonlyMap<string, KoreaSaleEvidenceBuildingRecord>;
  statsBySelection: Map<string, KoreaExplorerBuildingStats>;
}>;

const buildingIndexCache = new WeakMap<KoreaEvidenceRepositories, KoreaExplorerBuildingIndex>();

function buildingIndexFor(repositories: KoreaEvidenceRepositories): KoreaExplorerBuildingIndex {
  const cached = buildingIndexCache.get(repositories);
  if (cached !== undefined) return cached;
  const rentRecords = repositories.rent?.listBuildingRecords() ?? [];
  const saleRecords = repositories.sale?.listBuildingRecords() ?? [];
  const records = [...rentRecords, ...saleRecords];
  const identities = Object.freeze([...new Map(records.map((record) => [
    `${record.districtSlug}/${record.buildingId}`, record,
  ] as const)).values()]);
  const byDistrict = new Map<SeoulDistrictSlug, IdentityRecord[]>();
  for (const identity of identities) {
    const district = byDistrict.get(identity.districtSlug) ?? [];
    district.push(identity);
    byDistrict.set(identity.districtSlug, district);
  }
  const index = Object.freeze({
    identities,
    identitiesByDistrict: new Map([...byDistrict].map(([slug, district]) => [
      slug, Object.freeze(district),
    ] as const)),
    rentById: new Map<string, KoreaRentEvidenceBuildingRecord>(rentRecords.map((record) => [
      `${record.districtSlug}/${record.buildingId}`, record,
    ] as const)),
    saleById: new Map<string, KoreaSaleEvidenceBuildingRecord>(saleRecords.map((record) => [
      `${record.districtSlug}/${record.buildingId}`, record,
    ] as const)),
    statsBySelection: new Map<string, KoreaExplorerBuildingStats>(),
  });
  buildingIndexCache.set(repositories, index);
  return index;
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

function projectedBuilding(
  identity: IdentityRecord,
  rent: KoreaRentEvidenceBuildingRecord | undefined,
  sale: KoreaSaleEvidenceBuildingRecord | undefined,
  selection: KoreaExplorerEvidenceSelection,
): KoreaExplorerProjectedBuilding {
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
}

function normalizedBuildingPage(value: unknown): number {
  const parsed = typeof value === 'number' ? value
    : typeof value === 'string' ? Number.parseInt(value, 10) : 1;
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

function buildingMatchesQuery(
  building: IdentityRecord,
  query: string,
  districtAliases: readonly string[],
): boolean {
  if (query.length === 0 || districtAliases.some((alias) => (
    alias.toLocaleLowerCase('en-US').includes(query)
  ))) return true;
  const housingAliases = {
    apartment: ['아파트'],
    officetel: ['오피스텔'],
    villa_multifamily: ['빌라', '연립', '다세대'],
    detached: ['단독', '다가구'],
  }[building.housingType] ?? [];
  return [
    building.districtSlug,
    building.neighborhoodId,
    building.neighborhoodName,
    building.officialName,
    building.housingType,
    ...housingAliases,
  ].some((value) => value.toLocaleLowerCase('en-US').includes(query));
}

function projectedBuildingData(
  repositories: KoreaEvidenceRepositories,
  selection: KoreaExplorerEvidenceSelection,
  options: KoreaExplorerProjectionOptions,
): Readonly<{
  buildingPage: KoreaExplorerBuildingPage | null;
  buildingStats: KoreaExplorerBuildingStats | null;
}> {
  if (options.includeBuildings !== true && options.includeBuildingStats !== true) {
    return Object.freeze({ buildingPage: null, buildingStats: null });
  }
  const index = buildingIndexFor(repositories);
  const housingMatches = ({ housingType }: IdentityRecord) => (
    selection.housingType === 'all' || housingType === selection.housingType
  );
  const selectedPrimary = (identity: IdentityRecord): KoreaEvidenceDistribution => {
    const key = `${identity.districtSlug}/${identity.buildingId}`;
    if (selection.transaction === 'sale') {
      return index.saleById.get(key)?.cohorts.find(({ areaBand }) => (
        areaBand === selection.areaBand
      ))?.price ?? ZERO_DISTRIBUTION;
    }
    return selectedRentBuilding(index.rentById.get(key), selection)?.primary ?? ZERO_DISTRIBUTION;
  };
  const statsKey = [
    selection.transaction,
    selection.areaBand,
    selection.housingType,
    selection.contractGroup,
  ].join(':');
  let buildingStats = options.includeBuildingStats === true
    ? index.statsBySelection.get(statsKey) ?? null
    : null;
  if (options.includeBuildingStats === true && buildingStats === null) {
    buildingStats = Object.freeze(index.identities.reduce((stats, identity) => {
        if (!housingMatches(identity)) return stats;
        const primary = selectedPrimary(identity);
        stats.observed += 1;
        if (primary.n > 0) stats.transactionCovered += 1;
        if (primary.published) stats.priceReady += 1;
        return stats;
      }, { observed: 0, transactionCovered: 0, priceReady: 0 }));
    index.statsBySelection.set(statsKey, buildingStats);
  }
  if (options.includeBuildings !== true) {
    return Object.freeze({ buildingPage: null, buildingStats });
  }

  const query = typeof options.buildingQuery === 'string'
    ? options.buildingQuery.trim().toLocaleLowerCase('en-US')
    : '';
  const requestedDistrict = getSeoulDistrictBySlug(
    typeof options.districtSlug === 'string' ? options.districtSlug : '',
  )?.slug ?? 'jongno-gu';
  const districtFromQuery = query.length === 0 ? undefined : SEOUL_RENT_CHECK_DISTRICTS.find(
    ({ slug, nameEn, nameKo }) => [slug, nameEn, nameKo].some((value) => (
      value.toLocaleLowerCase('en-US').includes(query)
    )),
  )?.slug;
  const requestedIdentities = index.identitiesByDistrict.get(requestedDistrict) ?? [];
  const requestedIdentityMatches = requestedIdentities.some((identity) => {
    if (!housingMatches(identity)) return false;
    const district = getSeoulDistrictBySlug(requestedDistrict)!;
    return buildingMatchesQuery(identity, query, [district.slug, district.nameEn, district.nameKo]);
  });
  const firstGlobalMatch = requestedIdentityMatches || query.length === 0
    ? undefined
    : index.identities.find((identity) => {
        if (!housingMatches(identity)) return false;
        const district = getSeoulDistrictBySlug(identity.districtSlug);
        return district !== null && buildingMatchesQuery(
          identity,
          query,
          [district.slug, district.nameEn, district.nameKo],
        );
      })?.districtSlug;
  const districtSlug = districtFromQuery ?? firstGlobalMatch ?? requestedDistrict;
  const district = getSeoulDistrictBySlug(districtSlug)!;
  const matches = (index.identitiesByDistrict.get(districtSlug) ?? []).filter((identity) => (
    housingMatches(identity)
    && buildingMatchesQuery(identity, query, [district.slug, district.nameEn, district.nameKo])
  ));
  const requestedPage = normalizedBuildingPage(options.buildingPage);
  const maximumPage = Math.max(1, Math.ceil(matches.length / KOREA_EXPLORER_BUILDING_PAGE_SIZE));
  const page = Math.min(requestedPage, maximumPage);
  const start = (page - 1) * KOREA_EXPLORER_BUILDING_PAGE_SIZE;
  const buildings = matches.slice(start, start + KOREA_EXPLORER_BUILDING_PAGE_SIZE).map((identity) => {
    const key = `${identity.districtSlug}/${identity.buildingId}`;
    return projectedBuilding(
      identity,
      index.rentById.get(key),
      index.saleById.get(key),
      selection,
    );
  });
  return Object.freeze({
    buildingStats,
    buildingPage: Object.freeze({
      districtSlug,
      query,
      page,
      pageSize: KOREA_EXPLORER_BUILDING_PAGE_SIZE,
      total: matches.length,
      buildings: Object.freeze(buildings),
    }),
  });
}

export function buildKoreaExplorerEvidenceProjection(
  repositories: KoreaEvidenceRepositories,
  input: KoreaExplorerEvidenceSelectionInput,
  options: KoreaExplorerProjectionOptions = Object.freeze({}),
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
    const buildingData = projectedBuildingData(repositories, selection, options);
    return Object.freeze({
      status: 'ready',
      availability,
      selection,
      period: artifact.period,
      generatedAt: artifact.generatedAt,
      city,
      districts: Object.freeze(areas.filter(({ districtSlug }) => districtSlug !== null)),
      ...buildingData,
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
  const district = getSeoulDistrictBySlug(districtSlug);
  if (district === null) return null;
  const rent = (() => {
    try { return repositories.rent?.getBuilding(district.slug, buildingId); } catch { return undefined; }
  })();
  const sale = (() => {
    try { return repositories.sale?.getBuilding(district.slug, buildingId); } catch { return undefined; }
  })();
  const identity = rent ?? sale;
  const selectedRepository = requested.transaction === 'sale' ? repositories.sale : repositories.rent;
  if (identity === undefined || selectedRepository === null) return null;
  const artifact = selectedRepository.getArtifact();
  const building = projectedBuilding(identity, rent, sale, requested);

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
    period: artifact.period,
    generatedAt: artifact.generatedAt,
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
