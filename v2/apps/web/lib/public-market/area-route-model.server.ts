import 'server-only';

import {
  type EvidenceDescriptor,
  getPublicMarketConfig,
  type PublicMarketSummary,
} from '@signedprice/market-core';
import {
  SEOUL_RENT_CHECK_DISTRICTS,
  getSeoulDistrictBySlug,
  type SeoulDistrictSlug,
  type SeoulRentCheckDistrict,
} from '@signedprice/korea-rent/browser';
import { KR_MOLIT_RENT_RIGHTS } from '@signedprice/korea-rent';
import installedBuildingArtifact from '../../data/public-building-summary.json';

import {
  buildCommunitySignalModel,
  unavailableCommunitySignalModel,
} from '../community/community-signal-model.server';
import { buildNewsCardModels } from '../news/news-card-model.server';
import {
  createPublicAreaSummaryRepository,
  type PublicAreaSummaryRepository,
} from './area-summary-repository.server';
import { createPublicBuildingRepository } from './building-summary-repository.server';
import type {
  PublicBuildingDistribution,
  PublicBuildingRecord,
} from './building-summary-schema';
import {
  createObservedBuildingRepository,
  observedBuildingRepositoryFromEnvironment,
  type ObservedBuildingRepository,
} from './observed-building-repository.server';
import {
  changeReliability,
  evidencePeriod,
  spreadVerdict,
} from './evidence-interpretation';
import type {
  ContractGroupEvidenceModel,
  DistrictBuildingAvailability,
  ExploreBuildingAvailability,
  ExploreDistrictModel,
  KoreaExploreProximityModel,
  KoreaExploreProximityPair,
  KoreaExploreProximitySelection,
  PublicAreaExploreModel,
  PublicAreaLegendBucket,
  PublicAreaCoverageModel,
  PublicAreaSourceBoundaryModel,
  PublicDistrictDisplayModel,
  PublicDistrictEvidenceSummaryModel,
  PublicDistrictFaq,
  PublicDistrictModel,
  PublicContractGroup,
  PublicMonthlyUpdateSchedule,
  PublicNextUpdateModel,
  PublicSourceBoundaryModel,
} from './area-route-types';
import {
  listAdjacentDistrictSlugs,
  listSeoulDistrictGeometry,
} from './seoul-district-geometry.server';
import {
  buildKoreaExplorerEvidenceProjection,
  type KoreaExplorerEvidenceSelectionInput,
} from './korea-explorer-evidence.server';
import { buildKoreaEvidenceAreaExploreModel } from './korea-explorer-area-route.server';
import {
  koreaEvidenceRepositoriesFromEnvironment,
  type KoreaEvidenceRepositories,
} from './korea-evidence-repositories.server';
import type { KoreaProximityRepositoryState } from './korea-proximity-repository.server';
import { koreaProximityRepositoryFromEnvironment } from './korea-proximity-repository.server';
import {
  koreaBuildingMatchesProximity,
  koreaBuildingProximityModel,
} from './korea-proximity-display.server';
import {
  publicEntityProjectionReaderFromEnvironment,
  type PublicEntityProjection,
} from '../public-data/entity-location-projection.server';

export type PublicAreaRouteDependencies = Readonly<{
  source: unknown;
  period: string;
  buildingSource?: unknown;
  observedBuildingSource?: unknown;
  evidenceRepositories?: KoreaEvidenceRepositories;
  proximityRepository?: KoreaProximityRepositoryState;
  referenceInstant?: string | Date;
  updateSchedule?: PublicMonthlyUpdateSchedule;
}>;

export type PublicAreaEntityProjectionReader = Readonly<{
  listBuildings(entityIds: readonly string[]): Promise<ReadonlyMap<string, PublicEntityProjection> | null>;
}>;

function projectExploreBuilding(
  building: import('./area-route-types').ExploreBuildingModel,
  projection: PublicEntityProjection | undefined,
): import('./area-route-types').ExploreBuildingModel {
  if (projection === undefined || projection.state === 'unavailable') return building;
  const directMedia = projection.media.find((media) => media.displayUrl !== null);
  return Object.freeze({
    ...building,
    latitude: projection.location?.latitude ?? null,
    longitude: projection.location?.longitude ?? null,
    media: directMedia?.displayUrl === null || directMedia === undefined
      ? undefined
      : Object.freeze({
          displayUrl: directMedia.displayUrl,
          width: directMedia.width,
          height: directMedia.height,
          focalX: directMedia.focalX,
          focalY: directMedia.focalY,
          attributionName: directMedia.attributionName,
          attributionUrl: directMedia.attributionUrl,
        }),
  });
}

/**
 * Replaces artifact coordinates with the rights-checked public DB projection.
 * A missing database/read keeps the installed signed artifact as the last-good fallback.
 */
export async function hydratePublicAreaExploreModelWithProjections(
  model: PublicAreaExploreModel,
  reader: PublicAreaEntityProjectionReader | null = publicEntityProjectionReaderFromEnvironment(),
): Promise<PublicAreaExploreModel> {
  if (model.status !== 'ready' || reader === null) return model;
  const buildings = model.buildingAvailability.status === 'ready'
    ? model.buildingAvailability.buildings
    : model.buildingAvailability.fallbackBuildings;
  const projections = await reader.listBuildings(buildings.map(({ id }) => id));
  if (projections === null) return model;
  if (model.buildingAvailability.status === 'ready') {
    return Object.freeze({
      ...model,
      buildingAvailability: Object.freeze({
        ...model.buildingAvailability,
        buildings: Object.freeze(model.buildingAvailability.buildings.map((building) => (
          projectExploreBuilding(building, projections.get(building.id))
        ))),
      }),
    });
  }
  return Object.freeze({
    ...model,
    buildingAvailability: Object.freeze({
      ...model.buildingAvailability,
      fallbackBuildings: Object.freeze(model.buildingAvailability.fallbackBuildings.map((building) => (
        projectExploreBuilding(building, projections.get(building.id))
      ))),
    }),
  });
}

const money = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
});

const PUBLICATION_MINIMUM = 5 as const;
const CONTRACT_GROUPS = ['all', 'new', 'renewal'] as const;
const proximityDistances = new Set(['250', '500', '750', '1000']);
const GROUP_LABELS = Object.freeze({
  all: 'All contracts',
  new: 'New contracts',
  renewal: 'Renewal contracts',
} as const);

function scalar(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function proximityPairFor(
  source: Readonly<Record<string, unknown>>,
  kind: 'station' | 'school',
  repository: KoreaProximityRepositoryState,
): KoreaExploreProximityPair | null {
  if (repository.state !== 'ready') return null;
  const sourceId = scalar(source[kind]);
  const rawDistance = scalar(source[`${kind}Distance`]);
  if (sourceId === undefined || rawDistance === undefined || !proximityDistances.has(rawDistance)) return null;
  const distance = Number(rawDistance) as 250 | 500 | 750 | 1000;
  const catalog = kind === 'station'
    ? repository.repository.getArtifact().stations
    : repository.repository.getArtifact().schools;
  return catalog.some((item) => item.sourceId === sourceId)
    ? Object.freeze({ sourceId, distanceMeters: distance })
    : null;
}

export function normalizeKoreaExploreProximitySelection(
  input: unknown,
  repository: KoreaProximityRepositoryState,
): KoreaExploreProximitySelection {
  const source = input !== null && typeof input === 'object' && !Array.isArray(input)
    ? input as Readonly<Record<string, unknown>>
    : Object.freeze({});
  return Object.freeze({
    station: proximityPairFor(source, 'station', repository),
    school: proximityPairFor(source, 'school', repository),
  });
}

function proximityModelFor(repository: KoreaProximityRepositoryState | undefined, input: unknown): KoreaExploreProximityModel {
  const state = repository ?? Object.freeze({ state: 'missing' as const });
  const selection = normalizeKoreaExploreProximitySelection(input, state);
  if (state.state !== 'ready') return Object.freeze({ status: state.state, selection });
  const artifact = state.repository.getArtifact();
  return Object.freeze({
    status: 'ready' as const,
    selection,
    stations: Object.freeze(artifact.stations.map((station) => Object.freeze({
      sourceId: station.sourceId, name: station.name, lines: Object.freeze([...station.lines]),
    }))),
    schools: Object.freeze(artifact.schools.map((school) => Object.freeze({ sourceId: school.sourceId, name: school.name }))),
    provenance: Object.freeze({
      stationSource: artifact.provenance.stationSource,
      schoolSource: artifact.provenance.schoolSource,
      coordinateSource: artifact.provenance.coordinateSource,
      methodology: artifact.provenance.methodology.distance,
    }),
  });
}

function formatMoney(value: number): string {
  return money.format(value);
}

function sampleLabel(n: number): string {
  return `${n} reported contract${n === 1 ? '' : 's'}`;
}

function districtEvidenceSummaryFor(
  identity: SeoulRentCheckDistrict,
  summary: PublicMarketSummary,
  contractGroup: PublicContractGroup,
): PublicDistrictEvidenceSummaryModel {
  const common = {
    nameEn: identity.nameEn,
    nameKo: identity.nameKo,
    href: `/kr/seoul/explore/${identity.slug}/` as const,
    period: summary.period,
    publicationMinimum: PUBLICATION_MINIMUM,
    contractGroup,
    groupLabel: GROUP_LABELS[contractGroup],
  } as const;
  if (!summary.published) {
    return Object.freeze({
      ...common,
      status: 'withheld',
      sampleLabel: sampleLabel(summary.n),
    });
  }
  const spread = spreadVerdict(summary);
  const change = changeReliability({
    pct: summary.chg3m,
    nPrior: null,
    nLatest: null,
  });
  return Object.freeze({
    ...common,
    status: 'published',
    sampleLabel: sampleLabel(summary.n),
    medianValue: summary.med,
    medianLabel: formatMoney(summary.med),
    middleHalfLabel: `${formatMoney(summary.p25)}–${formatMoney(summary.p75)}`,
    rangeLabel: `${formatMoney(summary.min)}–${formatMoney(summary.max)}`,
    changeLabel: change.label,
    spread,
    change,
  });
}

function unavailableDistrictEvidenceSummaryFor(
  identity: SeoulRentCheckDistrict,
  period: string,
  contractGroup: PublicContractGroup,
): PublicDistrictEvidenceSummaryModel {
  return Object.freeze({
    status: 'unavailable',
    nameEn: identity.nameEn,
    nameKo: identity.nameKo,
    href: `/kr/seoul/explore/${identity.slug}/`,
    period,
    publicationMinimum: PUBLICATION_MINIMUM,
    contractGroup,
    groupLabel: GROUP_LABELS[contractGroup],
    message: 'Verified district summary unavailable',
  });
}

function snapshotUnavailableDistrictEvidenceSummaryFor(
  identity: SeoulRentCheckDistrict,
  period: string,
  contractGroup: Exclude<PublicContractGroup, 'all'>,
): PublicDistrictEvidenceSummaryModel {
  return Object.freeze({
    status: 'snapshot_unavailable',
    nameEn: identity.nameEn,
    nameKo: identity.nameKo,
    href: `/kr/seoul/explore/${identity.slug}/`,
    period,
    publicationMinimum: PUBLICATION_MINIMUM,
    contractGroup,
    groupLabel: GROUP_LABELS[contractGroup],
    message: 'New/renewal split not available in this snapshot',
  });
}

export function normalizePublicContractGroup(value: unknown): PublicContractGroup {
  if (value === undefined) return 'new';
  return value === 'new' || value === 'renewal' ? value : 'all';
}

function contractEvidenceFor(
  repository: PublicAreaSummaryRepository,
  identity: SeoulRentCheckDistrict,
  requestedGroup: unknown,
): ContractGroupEvidenceModel {
  const availability = repository.getContractSplitAvailability();
  const all = districtEvidenceSummaryFor(
    identity,
    repository.getDistrictSummary(identity.slug, 'all'),
    'all',
  );
  if (availability.status === 'snapshot_v1') {
    const selected = normalizePublicContractGroup(requestedGroup);
    return Object.freeze({
      scopeId: identity.slug,
      selected,
      splitStatus: 'snapshot_v1',
      unknownContractCount: null,
      allLowerThanNew: false,
      groups: Object.freeze({
        all,
        new: snapshotUnavailableDistrictEvidenceSummaryFor(
          identity, all.period, 'new',
        ),
        renewal: snapshotUnavailableDistrictEvidenceSummaryFor(
          identity, all.period, 'renewal',
        ),
      }),
    });
  }
  const selected = normalizePublicContractGroup(requestedGroup);
  const groups = Object.freeze(Object.fromEntries(CONTRACT_GROUPS.map((contractGroup) => [
    contractGroup,
    districtEvidenceSummaryFor(
      identity,
      repository.getDistrictSummary(identity.slug, contractGroup),
      contractGroup,
    ),
  ])) as Record<PublicContractGroup, PublicDistrictEvidenceSummaryModel>);
  return Object.freeze({
    scopeId: identity.slug,
    selected,
    splitStatus: 'ready',
    unknownContractCount: repository.getDistrictUnknownContractCount(identity.slug),
    allLowerThanNew: groups.all.status === 'published'
      && groups.new.status === 'published'
      && groups.all.medianValue < groups.new.medianValue,
    groups,
  });
}

function unavailableContractEvidenceFor(
  identity: SeoulRentCheckDistrict,
  period: string,
): ContractGroupEvidenceModel {
  return Object.freeze({
    scopeId: identity.slug,
    selected: 'all',
    splitStatus: 'unavailable',
    unknownContractCount: null,
    allLowerThanNew: false,
    groups: Object.freeze(Object.fromEntries(CONTRACT_GROUPS.map((contractGroup) => [
      contractGroup,
      unavailableDistrictEvidenceSummaryFor(identity, period, contractGroup),
    ])) as Record<PublicContractGroup, PublicDistrictEvidenceSummaryModel>),
  });
}

export function buildPublicSourceBoundary(
  period: string,
  evidence: EvidenceDescriptor | null,
  includeGeometry?: false,
  nextUpdate?: PublicNextUpdateModel | null,
): PublicSourceBoundaryModel;
export function buildPublicSourceBoundary(
  period: string,
  evidence: EvidenceDescriptor | null,
  includeGeometry: true,
  nextUpdate?: PublicNextUpdateModel | null,
): PublicAreaSourceBoundaryModel;
export function buildPublicSourceBoundary(
  period: string,
  evidence: EvidenceDescriptor | null,
  includeGeometry = false,
  nextUpdate: PublicNextUpdateModel | null = null,
): PublicSourceBoundaryModel | PublicAreaSourceBoundaryModel {
  const common = {
    evidence,
    provider: 'MOLIT',
    period,
    attribution: Object.freeze([...KR_MOLIT_RENT_RIGHTS.attribution]),
    band: '45–55㎡',
    publicationMinimum: PUBLICATION_MINIMUM,
    includesNewAndRenewal: true,
    includesUnknownContractType: true,
    includesUnknownRecordStatus: true,
    nextUpdate,
  } as const;
  return includeGeometry
    ? Object.freeze({
        ...common,
        geometryAttribution:
          'KOSTAT census boundaries via southkorea/seoul-maps (Apache-2.0)',
      })
    : Object.freeze(common);
}

function environmentDependencies(includeEvidenceRepositories = true): PublicAreaRouteDependencies {
  const serialized = process.env.SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT;
  const serializedBuildings = process.env.SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT;
  let source: unknown;
  let buildingSource: unknown;
  let updateSchedule: PublicMonthlyUpdateSchedule | undefined;
  try {
    source = serialized === undefined ? undefined : JSON.parse(serialized);
  } catch {
    source = undefined;
  }
  try {
    buildingSource = serializedBuildings === undefined ? undefined : JSON.parse(serializedBuildings);
  } catch {
    buildingSource = undefined;
  }
  try {
    updateSchedule = process.env.SIGNEDPRICE_PUBLIC_UPDATE_SCHEDULE === undefined
      ? undefined
      : JSON.parse(process.env.SIGNEDPRICE_PUBLIC_UPDATE_SCHEDULE) as PublicMonthlyUpdateSchedule;
  } catch {
    updateSchedule = undefined;
  }
  if (
    process.env.NODE_ENV !== 'test'
    && (
      typeof buildingSource !== 'object' || buildingSource === null
      || (buildingSource as { artifactVersion?: unknown }).artifactVersion
        !== 'signedprice-public-building-summary-v2'
    )
  ) buildingSource = installedBuildingArtifact;
  return Object.freeze({
    source,
    buildingSource,
    period: process.env.SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD ?? '',
    referenceInstant: new Date().toISOString(),
    updateSchedule,
    evidenceRepositories: includeEvidenceRepositories
      ? koreaEvidenceRepositoriesFromEnvironment()
      : undefined,
    proximityRepository: koreaProximityRepositoryFromEnvironment(),
  });
}

function nextUpdateFor(
  referenceInstant: string | Date | undefined,
  schedule: PublicMonthlyUpdateSchedule | undefined,
): PublicNextUpdateModel | null {
  if (
    schedule === undefined
    || schedule.cadence !== 'monthly'
    || !Number.isInteger(schedule.dayOfMonth)
    || schedule.dayOfMonth < 1
    || schedule.dayOfMonth > 28
    || !Number.isInteger(schedule.hourUtc)
    || schedule.hourUtc < 0
    || schedule.hourUtc > 23
    || !Number.isInteger(schedule.minuteUtc)
    || schedule.minuteUtc < 0
    || schedule.minuteUtc > 59
  ) return null;
  const reference = referenceInstant instanceof Date
    ? new Date(referenceInstant.getTime())
    : new Date(referenceInstant ?? '');
  if (!Number.isFinite(reference.getTime())) return null;
  let year = reference.getUTCFullYear();
  let month = reference.getUTCMonth();
  let candidate = new Date(Date.UTC(
    year, month, schedule.dayOfMonth, schedule.hourUtc, schedule.minuteUtc,
  ));
  if (candidate.getTime() <= reference.getTime()) {
    month += 1;
    if (month === 12) {
      year += 1;
      month = 0;
    }
    candidate = new Date(Date.UTC(
      year, month, schedule.dayOfMonth, schedule.hourUtc, schedule.minuteUtc,
    ));
  }
  return Object.freeze({ cadence: 'monthly', instant: candidate.toISOString() });
}

function coverageFor(
  summaries: readonly PublicMarketSummary[],
  citySummary: PublicMarketSummary,
  dependencies: PublicAreaRouteDependencies,
): PublicAreaCoverageModel {
  const publishedDistricts = summaries.filter(({ published }) => published).length;
  let buildings: PublicAreaCoverageModel['buildings'];
  let retainedBuildingsBelowMinimum: number | null = null;
  let transactionCovered: number | null = null;
  let priceReady: number | null = null;
  let retainedBuildingIds = new Set<string>();
  let publishedBuildingIds = new Set<string>();
  try {
    const repository = createPublicBuildingRepository({
      source: dependencies.buildingSource,
      expected: { marketId: 'kr-seoul', period: dependencies.period },
    });
    const retained = repository.listRetainedRecords();
    const published = retained.filter(({ groups }) => groups.all.published).length;
    retainedBuildingIds = new Set(retained.map(({ districtSlug, buildingId }) => (
      `${districtSlug}/${buildingId}`
    )));
    publishedBuildingIds = new Set(retained
      .filter(({ groups }) => groups.all.published)
      .map(({ districtSlug, buildingId }) => `${districtSlug}/${buildingId}`));
    transactionCovered = retained.length;
    priceReady = published;
    retainedBuildingsBelowMinimum = retained.length - published;
  } catch {}
  const observedRepository = observedBuildingRepositoryFor(dependencies);
  if (observedRepository === null) {
    buildings = Object.freeze({
      status: 'inventory_unavailable',
      transactionCovered,
      priceReady,
      reason: 'Verified observed building inventory is not loaded.',
    });
  } else {
    const observed = observedRepository.listRecords();
    buildings = Object.freeze({
      status: 'ready',
      observed: observed.length,
      transactionCovered: observed.filter(({ districtSlug, buildingId }) => (
        retainedBuildingIds.has(`${districtSlug}/${buildingId}`)
      )).length,
      priceReady: observed.filter(({ districtSlug, buildingId }) => (
        publishedBuildingIds.has(`${districtSlug}/${buildingId}`)
      )).length,
    });
  }
  return Object.freeze({
    districts: Object.freeze({ published: publishedDistricts, retained: summaries.length }),
    buildings,
    eligibleContracts: citySummary.n,
    unpublished: Object.freeze({
      districtsBelowMinimum: summaries.length - publishedDistricts,
      retainedBuildingsBelowMinimum,
      sourceBuildingCandidates: Object.freeze({
        status: 'unavailable',
        reason: 'Source candidate building counts are not retained in this verified artifact.',
      }),
    }),
  });
}

function observedBuildingRepositoryFor(
  dependencies: PublicAreaRouteDependencies,
): ObservedBuildingRepository | null {
  if (dependencies.observedBuildingSource !== undefined) {
    try {
      return createObservedBuildingRepository({
        source: dependencies.observedBuildingSource,
        expected: { marketId: 'kr-seoul', period: dependencies.period },
      });
    } catch {
      return null;
    }
  }
  return observedBuildingRepositoryFromEnvironment();
}

function bucketAssignments(
  summaries: readonly PublicMarketSummary[],
): ReadonlyMap<string, 0 | 1 | 2 | 3 | 4> {
  const published = summaries
    .filter((summary) => summary.published)
    .sort((left, right) => {
      const medianOrder = left.med - right.med;
      if (medianOrder !== 0) return medianOrder;
      const leftDistrict = getSeoulDistrictBySlug(left.area);
      const rightDistrict = getSeoulDistrictBySlug(right.area);
      if (leftDistrict === null || rightDistrict === null) {
        throw new TypeError('Invalid district summary identity.');
      }
      return leftDistrict.lawdCd.localeCompare(rightDistrict.lawdCd);
    });
  return new Map(published.map((summary, rank) => [
    summary.area,
    Math.min(4, Math.floor(rank * 5 / published.length)) as 0 | 1 | 2 | 3 | 4,
  ]));
}

function legendFor(
  districts: readonly ExploreDistrictModel[],
): readonly PublicAreaLegendBucket[] {
  const buckets = [0, 1, 2, 3, 4] as const;
  return Object.freeze(buckets.flatMap((bucket) => {
    const values = districts.flatMap((district) => (
      district.bucket === bucket && district.summary.published
        ? [district.summary.med]
        : []
    ));
    if (values.length === 0) return [];
    const minimumMedian = Math.min(...values);
    const maximumMedian = Math.max(...values);
    return [Object.freeze({
      bucket,
      count: values.length,
      minimumMedian,
      maximumMedian,
      label: minimumMedian === maximumMedian
        ? formatMoney(minimumMedian)
        : `${formatMoney(minimumMedian)}–${formatMoney(maximumMedian)}`,
    })];
  }));
}

function priceBuildingRecordsFor(
  dependencies: PublicAreaRouteDependencies,
): ReadonlyMap<string, PublicBuildingRecord> {
  let priceRecords = new Map<string, PublicBuildingRecord>();
  try {
    const repository = createPublicBuildingRepository({
      source: dependencies.buildingSource,
      expected: { marketId: 'kr-seoul', period: dependencies.period },
    });
    priceRecords = new Map(repository.listRetainedRecords().map((building) => [
      `${building.districtSlug}/${building.buildingId}`,
      building,
    ] as const));
  } catch {}
  return priceRecords;
}

const housingTypeSearchAliases = Object.freeze({
  apartment: Object.freeze(['아파트']),
  officetel: Object.freeze(['오피스텔']),
  villa_multifamily: Object.freeze(['빌라', '연립', '다세대']),
  detached: Object.freeze(['단독', '다가구']),
} as const);

function includesExploreQuery(values: readonly string[], normalizedQuery: string): boolean {
  return values.some((value) => value.toLocaleLowerCase('en-US').includes(normalizedQuery));
}

function resolveExploreDistrictFromInventory(
  districts: readonly ExploreDistrictModel[],
  observedRepository: ObservedBuildingRepository | null,
  priceRecords: ReadonlyMap<string, PublicBuildingRecord>,
  query: string,
  fallback: SeoulDistrictSlug,
): SeoulDistrictSlug {
  const normalizedQuery = query.trim().toLocaleLowerCase('en-US');
  if (normalizedQuery.length === 0) return fallback;
  const district = districts.find(({ slug, nameEn, nameKo }) => (
    includesExploreQuery([slug, nameEn, nameKo], normalizedQuery)
  ));
  if (district !== undefined) return district.slug;
  const observed = observedRepository?.listRecords().find((building) => {
    const aliases = housingTypeSearchAliases[
      building.housingType as keyof typeof housingTypeSearchAliases
    ] ?? [];
    return includesExploreQuery([
      building.buildingId,
      building.neighborhoodId,
      building.neighborhoodName,
      building.officialName,
      building.housingType,
      ...aliases,
      ...(building.jeonseObservationCount > 0 ? ['jeonse', '전세'] : []),
      ...(building.monthlyObservationCount > 0 ? ['monthly', 'monthly rent', '월세'] : []),
    ], normalizedQuery);
  });
  if (observed !== undefined) return observed.districtSlug;
  const priced = [...priceRecords.values()].find((building) => {
    const aliases = housingTypeSearchAliases[
      building.housingType.toLocaleLowerCase('en-US') as keyof typeof housingTypeSearchAliases
    ] ?? [];
    return includesExploreQuery([
      building.buildingId,
      building.neighborhoodId,
      building.neighborhoodName,
      building.name,
      building.housingType,
      ...aliases,
      'jeonse',
      '전세',
    ], normalizedQuery);
  });
  return priced?.districtSlug ?? fallback;
}

function exploreBuildingsFor(
  districtSlug: SeoulDistrictSlug,
  observedRepository: ObservedBuildingRepository | null,
  priceRecords: ReadonlyMap<string, PublicBuildingRecord>,
  proximityRepository: KoreaProximityRepositoryState | undefined,
  proximitySelection: KoreaExploreProximitySelection,
): ExploreBuildingAvailability {
  if (observedRepository !== null) {
    const buildings = Object.freeze(observedRepository.listByDistrict(districtSlug)
      .filter((observed) => koreaBuildingMatchesProximity(observed.buildingId, proximityRepository, proximitySelection))
      .map((observed) => {
      const building = priceRecords.get(`${observed.districtSlug}/${observed.buildingId}`);
      const groupLabel = (group: PublicBuildingDistribution) => (
        group.published ? formatMoney(group.med) : null
      );
      const evidenceStatus = building === undefined
        ? 'unavailable'
        : building.groups.all.published ? 'published' : 'withheld';
      return Object.freeze({
        id: observed.buildingId,
        districtSlug: observed.districtSlug,
        neighborhoodId: observed.neighborhoodId,
        neighborhoodName: observed.neighborhoodName,
        name: observed.officialName,
        housingType: observed.housingType,
        latitude: observed.coordinate.state === 'ready' ? observed.coordinate.latitude : null,
        longitude: observed.coordinate.state === 'ready' ? observed.coordinate.longitude : null,
        evidenceStatus,
        transaction: 'jeonse' as const,
        primaryMetric: 'deposit' as const,
        observationCount: observed.observationCount,
        jeonseObservationCount: observed.jeonseObservationCount,
        monthlyObservationCount: observed.monthlyObservationCount,
        firstObservedMonth: observed.firstObservedMonth,
        lastObservedMonth: observed.lastObservedMonth,
        sampleLabel: building === undefined
          ? `${observed.observationCount} observed contract${observed.observationCount === 1 ? '' : 's'}`
          : sampleLabel(building.groups.all.n),
        medianLabel: building?.groups.all.published === true
          ? formatMoney(building.groups.all.med)
          : null,
        filedDepositMedianLabel: null,
        newSampleLabel: building === undefined
          ? 'Price sample unavailable'
          : sampleLabel(building.groups.new.n),
        newMedianLabel: building === undefined ? null : groupLabel(building.groups.new),
        renewalSampleLabel: building === undefined
          ? 'Price sample unavailable'
          : sampleLabel(building.groups.renewal.n),
        renewalMedianLabel: building === undefined ? null : groupLabel(building.groups.renewal),
        unknownContractCount: building?.unknownContractCount ?? 0,
        proximity: koreaBuildingProximityModel(observed.buildingId, proximityRepository),
        href: `/kr/seoul/explore/${observed.districtSlug}/${observed.buildingId}/` as const,
      });
    }));
    return Object.freeze({
      status: 'ready',
      buildings,
      total: buildings.length,
      page: 1,
      pageSize: buildings.length,
    });
  }
  const fallbackBuildings = Object.freeze([...priceRecords.values()]
    .filter((building) => (
      building.districtSlug === districtSlug && building.groups.all.published
    ))
    .filter((building) => koreaBuildingMatchesProximity(building.buildingId, proximityRepository, proximitySelection))
    .map((building) => {
      if (!building.groups.all.published) {
        throw new TypeError('Published fallback building required.');
      }
      return Object.freeze({
      id: building.buildingId,
      districtSlug: building.districtSlug,
      neighborhoodId: building.neighborhoodId,
      neighborhoodName: building.neighborhoodName,
      name: building.name,
      housingType: building.housingType,
      latitude: building.latitude,
      longitude: building.longitude,
      evidenceStatus: 'published' as const,
      transaction: 'jeonse' as const,
      primaryMetric: 'deposit' as const,
      observationCount: building.groups.all.n,
      jeonseObservationCount: building.groups.all.n,
      monthlyObservationCount: 0,
      firstObservedMonth: building.period.split('/')[0]!,
      lastObservedMonth: building.period.split('/')[1]!,
      sampleLabel: sampleLabel(building.groups.all.n),
      medianLabel: formatMoney(building.groups.all.med),
      filedDepositMedianLabel: null,
      newSampleLabel: sampleLabel(building.groups.new.n),
      newMedianLabel: building.groups.new.published ? formatMoney(building.groups.new.med) : null,
      renewalSampleLabel: sampleLabel(building.groups.renewal.n),
      renewalMedianLabel: building.groups.renewal.published
        ? formatMoney(building.groups.renewal.med)
        : null,
      unknownContractCount: building.unknownContractCount,
      proximity: koreaBuildingProximityModel(building.buildingId, proximityRepository),
      href: `/kr/seoul/explore/${building.districtSlug}/${building.buildingId}/` as const,
      });
    }));
  return Object.freeze({ status: 'not_loaded', fallbackBuildings });
}

export function buildPublicAreaExploreModel(
  selectedSlug: string | undefined,
  dependencies: PublicAreaRouteDependencies = environmentDependencies(),
  requestedContractGroup?: unknown,
  requestedBuildingQuery = '',
  requestedEvidence: KoreaExplorerEvidenceSelectionInput = Object.freeze({}),
  requestedBuildingPage: unknown = 1,
  requestedBuildingId?: unknown,
  requestedProximity: unknown = Object.freeze({}),
): PublicAreaExploreModel {
  const proximityRepository = dependencies.proximityRepository;
  const proximity = proximityModelFor(proximityRepository, requestedProximity);
  if (dependencies.evidenceRepositories !== undefined) {
    const projection = buildKoreaExplorerEvidenceProjection(
      dependencies.evidenceRepositories,
      {
        ...requestedEvidence,
        contractGroup: requestedEvidence.contractGroup ?? requestedContractGroup,
      },
      {
        includeBuildings: true,
        includeBuildingStats: true,
        districtSlug: selectedSlug,
        buildingQuery: requestedBuildingQuery,
        buildingPage: requestedBuildingPage,
        selectedBuildingId: requestedBuildingId,
        proximityRepository,
        proximitySelection: proximity.selection,
      },
    );
    if (projection.status === 'ready') {
      return buildKoreaEvidenceAreaExploreModel(selectedSlug, projection, proximity, proximityRepository);
    }
  }
  const unavailableSource = buildPublicSourceBoundary(dependencies.period, null, true);
  try {
    const repository = createPublicAreaSummaryRepository({
      source: dependencies.source,
      expected: { marketId: 'kr-seoul', period: dependencies.period },
    });
    const citySummary = repository.getCitySummary();
    const source = buildPublicSourceBoundary(
      citySummary.period,
      repository.getEvidenceDescriptor(),
      true,
      nextUpdateFor(dependencies.referenceInstant, dependencies.updateSchedule),
    );
    const summaries = repository.listDistrictSummaries();
    const buckets = bucketAssignments(summaries);
    const geometryBySlug = new Map(
      listSeoulDistrictGeometry().map((geometry) => [geometry.slug, geometry] as const),
    );
    const summaryBySlug = new Map(
      summaries.map((summary) => [summary.area, summary] as const),
    );
    const districts = Object.freeze(SEOUL_RENT_CHECK_DISTRICTS.map((identity) => {
      const summary = summaryBySlug.get(identity.slug);
      const geometry = geometryBySlug.get(identity.slug);
      if (summary === undefined || geometry === undefined) {
        throw new TypeError('Incomplete public district model.');
      }
      const contractEvidence = contractEvidenceFor(
        repository,
        identity,
        requestedContractGroup,
      );
      return Object.freeze({
        ...identity,
        href: `/kr/seoul/explore/${identity.slug}/` as const,
        path: geometry.path,
        latitude: geometry.latitude,
        longitude: geometry.longitude,
        summary,
        state: summary.published ? 'published' : 'withheld',
        bucket: summary.published ? buckets.get(identity.slug) ?? null : null,
        sampleLabel: sampleLabel(summary.n),
        medianLabel: summary.published ? formatMoney(summary.med) : null,
        changeLabel: summary.published
          ? changeReliability({ pct: summary.chg3m, nPrior: null, nLatest: null }).label
          : null,
        evidenceSummary: contractEvidence.groups[contractEvidence.selected],
        contractEvidence,
      } satisfies ExploreDistrictModel);
    }));
    const requestedDistrict = getSeoulDistrictBySlug(selectedSlug ?? '')?.slug ?? 'jongno-gu';
    const observedRepository = observedBuildingRepositoryFor(dependencies);
    const priceRecords = priceBuildingRecordsFor(dependencies);
    const selected = resolveExploreDistrictFromInventory(
      districts,
      observedRepository,
      priceRecords,
      requestedBuildingQuery,
      requestedDistrict,
    );
    return Object.freeze({
      status: 'ready',
      evidenceSelection: Object.freeze({
        transaction: 'jeonse' as const,
        areaBand: 'legacy-45-55' as const,
        housingType: 'all' as const,
        contractGroup: normalizePublicContractGroup(requestedContractGroup),
      }),
      transactionAvailability: Object.freeze({
        jeonse: true,
        monthly: false,
        sale: false,
      }),
      selectedSlug: selected,
      citySummary,
      districts,
      legend: legendFor(districts),
      coverage: coverageFor(summaries, citySummary, dependencies),
      buildingAvailability: exploreBuildingsFor(selected, observedRepository, priceRecords, proximityRepository, proximity.selection),
      proximity,
      source,
    });
  } catch {
    return Object.freeze({
      status: 'unavailable',
      selectedSlug: null,
      districts: Object.freeze([] as []),
      source: unavailableSource,
      message: 'Verified district summary unavailable',
    });
  }
}

function nearbyDistricts(slug: SeoulDistrictSlug): readonly SeoulRentCheckDistrict[] {
  return Object.freeze(listAdjacentDistrictSlugs(slug).map((nearbySlug) => {
    const district = getSeoulDistrictBySlug(nearbySlug);
    if (district === null) throw new TypeError('Invalid adjacent district identity.');
    return district;
  }));
}

const buildingNotLoadedAvailability = Object.freeze({
  status: 'not_loaded',
  empty: Object.freeze({
    title: 'Building evidence is not loaded',
    reason: 'The verified district artifact does not contain building records',
    nextAction: 'Use district evidence or return after a verified building snapshot is installed',
    detail: Object.freeze({ code: 'NOT_LOADED', market: 'Seoul buildings' }),
  }),
} as const);

function buildingAvailabilityFor(
  slug: SeoulDistrictSlug,
  dependencies: PublicAreaRouteDependencies,
): DistrictBuildingAvailability {
  try {
    const repository = createPublicBuildingRepository({
      source: dependencies.buildingSource,
      expected: { marketId: 'kr-seoul', period: dependencies.period },
    });
    const buildings = Object.freeze(repository.listByDistrict(slug).map((building) => Object.freeze({
      id: building.buildingId,
      name: building.name,
      housingType: building.housingType,
      sampleLabel: sampleLabel(building.overall.n),
      href: `/kr/seoul/explore/${slug}/${building.buildingId}/` as const,
    })));
    return buildings.length === 0
      ? buildingNotLoadedAvailability
      : Object.freeze({ status: 'ready', buildings });
  } catch {
    return buildingNotLoadedAvailability;
  }
}

function displayFor(
  identity: SeoulRentCheckDistrict,
  summary: PublicMarketSummary,
): PublicDistrictDisplayModel {
  const spread = summary.published ? spreadVerdict(summary) : null;
  const change = summary.published
    ? changeReliability({ pct: summary.chg3m, nPrior: null, nLatest: null })
    : null;
  return Object.freeze({
    heading: `${identity.nameEn} refundable jeonse deposit evidence`,
    sampleLabel: sampleLabel(summary.n),
    medianLabel: summary.published ? formatMoney(summary.med) : null,
    rangeLabel: summary.published
      ? `${formatMoney(summary.min)}–${formatMoney(summary.max)}`
      : null,
    middleHalfLabel: summary.published
      ? `${formatMoney(summary.p25)}–${formatMoney(summary.p75)}`
      : null,
    changeLabel: change?.label ?? null,
    spread,
    change,
  });
}

function faqFor(
  identity: SeoulRentCheckDistrict,
  summary: PublicMarketSummary,
): readonly PublicDistrictFaq[] {
  const count = sampleLabel(summary.n);
  const medianAnswer = summary.published
    ? `The median refundable jeonse deposit for ${identity.nameEn} was ${formatMoney(summary.med)}, based on ${count}.`
    : `A median is not published for ${identity.nameEn} because only ${count} met the fixed filter.`;
  const middleHalfAnswer = summary.published
    ? `The middle half of qualifying deposits ran from ${formatMoney(summary.p25)} to ${formatMoney(summary.p75)}. It describes reported contracts, not an appraisal.`
    : 'The middle half is not calculated when fewer than 5 qualifying contracts are available.';
  return Object.freeze([
    Object.freeze({
      question: `What was the median refundable jeonse deposit in ${identity.nameEn}?`,
      answer: medianAnswer,
    }),
    Object.freeze({
      question: 'How is a typed deposit compared with the district median?',
      answer: summary.published
        ? 'A typed deposit is described only as below, equal to, or above the reported median. This is descriptive only and not an appraisal.'
        : 'A typed deposit cannot be compared because the district median is not published.',
    }),
    Object.freeze({
      question: 'What does the middle half mean?',
      answer: middleHalfAnswer,
    }),
    Object.freeze({
      question: 'Why can district figures be withheld?',
      answer: `Money is not published when fewer than 5 contracts qualify. ${identity.nameEn} has ${count} in this period.`,
    }),
    Object.freeze({
      question: 'What source and period does this use?',
      answer: `MOLIT reported rental contracts for ${summary.period}, limited to zero-rent jeonse contracts with 45–55㎡ filed area. New and renewal contracts are combined; this is general evidence, not legal or valuation advice.`,
    }),
  ]);
}

function deepFreeze<Value>(value: Value): Value {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested);
    }
    Object.freeze(value);
  }
  return value;
}

function datasetFor(
  identity: SeoulRentCheckDistrict,
  summary: PublicMarketSummary,
): Readonly<Record<string, unknown>> {
  if (!summary.published) {
    return deepFreeze({
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: `${identity.nameEn} jeonse evidence availability`,
      description: `${sampleLabel(summary.n)} qualified; monetary publication is withheld.`,
      temporalCoverage: summary.period,
      spatialCoverage: identity.nameEn,
      creator: { '@type': 'Organization', name: 'MOLIT' },
      variableMeasured: [{ name: 'Qualified contract count', value: summary.n }],
      measurementTechnique:
        'Publication withheld because fewer than 5 contracts qualified.',
    });
  }
  return deepFreeze({
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${identity.nameEn} refundable jeonse deposit evidence`,
    description: `Five-number refundable-deposit distribution from ${sampleLabel(summary.n)} for 45–55㎡ homes.`,
    temporalCoverage: summary.period,
    spatialCoverage: identity.nameEn,
    creator: { '@type': 'Organization', name: 'MOLIT' },
    variableMeasured: [
      { name: 'Qualified contract count', value: summary.n },
      { name: 'Minimum refundable deposit', value: summary.min, unitCode: 'KRW' },
      { name: '25th percentile refundable deposit', value: summary.p25, unitCode: 'KRW' },
      { name: 'Median refundable deposit', value: summary.med, unitCode: 'KRW' },
      { name: '75th percentile refundable deposit', value: summary.p75, unitCode: 'KRW' },
      { name: 'Maximum refundable deposit', value: summary.max, unitCode: 'KRW' },
    ],
    measurementTechnique:
      'MOLIT reported zero-rent jeonse contracts with 45–55㎡ filed area.',
  });
}

function faqJsonLdFor(faq: readonly PublicDistrictFaq[]): Readonly<Record<string, unknown>> {
  return deepFreeze({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  });
}

export function buildPublicDistrictModel(
  slug: string,
  dependencies: PublicAreaRouteDependencies = environmentDependencies(false),
  requestedContractGroup?: unknown,
): PublicDistrictModel | null {
  const identity = getSeoulDistrictBySlug(slug);
  if (identity === null) return null;
  const nearby = nearbyDistricts(identity.slug);
  let source = buildPublicSourceBoundary(dependencies.period, null, true);
  try {
    const config = getPublicMarketConfig('kr-seoul');
    if (config.availability !== 'ready') throw new TypeError('Market unavailable.');
    const repository = createPublicAreaSummaryRepository({
      source: dependencies.source,
      expected: { marketId: 'kr-seoul', period: dependencies.period },
    });
    const summary = repository.getDistrictSummary(identity.slug);
    const period = evidencePeriod(
      summary.period,
      dependencies.referenceInstant ?? new Date(),
    );
    source = buildPublicSourceBoundary(
      summary.period,
      repository.getEvidenceDescriptor(),
      true,
    );
    const faq = faqFor(identity, summary);
    const buildingAvailability = buildingAvailabilityFor(identity.slug, dependencies);
    const contractEvidence = contractEvidenceFor(
      repository,
      identity,
      requestedContractGroup,
    );
    const communitySignal = buildCommunitySignalModel(Object.freeze({
      marketId: 'kr-seoul',
      scopeType: 'district',
      scopeId: identity.slug,
      evidenceId: `kr-seoul:${summary.period}:area:${repository.getArtifactVersion()}:${contractEvidence.selected}`,
    }));
    const common = {
      identity,
      display: displayFor(identity, summary),
      period,
      nearby,
      faq,
      datasetJsonLd: datasetFor(identity, summary),
      faqJsonLd: faqJsonLdFor(faq),
      source,
      buildingAvailability,
      evidenceSummary: contractEvidence.groups[contractEvidence.selected],
      contractEvidence,
      communitySignal,
      news: buildNewsCardModels({
        areaSource: dependencies.source,
        period: dependencies.period,
      }),
    } as const;
    if (summary.published) {
      return Object.freeze({ status: 'published', summary, ...common });
    }
    return Object.freeze({ status: 'withheld', summary, ...common });
  } catch {
    return Object.freeze({
      status: 'unavailable',
      identity,
      nearby,
      source,
      buildingAvailability: buildingNotLoadedAvailability,
      message: 'Verified district summary unavailable',
      evidenceSummary: unavailableDistrictEvidenceSummaryFor(
        identity,
        dependencies.period,
        'all',
      ),
      contractEvidence: unavailableContractEvidenceFor(identity, dependencies.period),
      communitySignal: unavailableCommunitySignalModel(),
      news: buildNewsCardModels({
        areaSource: dependencies.source,
        period: dependencies.period,
      }),
    });
  }
}

export type {
  ContractGroupEvidenceModel,
  ExploreDistrictModel,
  PublicAreaExploreModel,
  PublicAreaLegendBucket,
  PublicAreaSourceBoundaryModel,
  PublicDistrictDisplayModel,
  PublicDistrictEvidenceSummaryModel,
  PublicDistrictFaq,
  PublicDistrictModel,
  PublicContractGroup,
} from './area-route-types';
