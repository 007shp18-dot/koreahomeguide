import 'server-only';

import {
  createEvidenceDescriptor,
  createPublicMarketSummary,
  type PublicMarketSummary,
} from '@signedprice/market-core';
import {
  KR_MOLIT_RENT_RIGHTS,
  KR_MOLIT_SALE_RIGHTS,
  SEOUL_RENT_CHECK_DISTRICTS,
  getSeoulDistrictBySlug,
  type KoreaEvidenceDistribution,
  type SeoulDistrictSlug,
} from '@signedprice/korea-rent';

import {
  changeReliability,
  spreadVerdict,
} from './evidence-interpretation';
import type {
  ContractGroupEvidenceModel,
  ExploreBuildingModel,
  ExploreDistrictModel,
  PublicAreaExploreModel,
  PublicAreaLegendBucket,
  PublicContractGroup,
  PublicDistrictEvidenceSummaryModel,
} from './area-route-types';
import type { KoreaProximityRepositoryState } from './korea-proximity-repository.server';
import { koreaBuildingProximityModel } from './korea-proximity-display.server';
import type { KoreaExploreProximityModel } from './area-route-types';
import type {
  KoreaExplorerEvidenceProjection,
  KoreaExplorerProjectedArea,
} from './korea-explorer-evidence.server';
import { listSeoulDistrictGeometry } from './seoul-district-geometry.server';

const money = new Intl.NumberFormat('ko-KR', {
  style: 'currency', currency: 'KRW', maximumFractionDigits: 0,
});
const GROUPS = Object.freeze(['all', 'new', 'renewal'] as const);
const GROUP_LABELS = Object.freeze({
  all: 'All contracts', new: 'New contracts', renewal: 'Renewal contracts',
} as const);

function formatMoney(value: number): string {
  return money.format(value);
}

function sampleLabel(n: number): string {
  return `${n} reported contract${n === 1 ? '' : 's'}`;
}

function summaryFor(
  area: string,
  parent: string,
  projection: Extract<KoreaExplorerEvidenceProjection, { status: 'ready' }>,
  distribution: KoreaEvidenceDistribution,
): PublicMarketSummary {
  return createPublicMarketSummary({
    marketId: 'kr-seoul',
    area,
    parent,
    deal: projection.selection.transaction,
    band: projection.selection.areaBand,
    period: projection.period,
    n: distribution.n,
    ...(distribution.published ? {
      min: distribution.min,
      p25: distribution.p25,
      med: distribution.med,
      p75: distribution.p75,
      max: distribution.max,
      chg3m: distribution.chg3m,
    } : {}),
  });
}

function evidenceSummaryFor(
  identity: NonNullable<ReturnType<typeof getSeoulDistrictBySlug>>,
  summary: PublicMarketSummary,
  contractGroup: PublicContractGroup,
): PublicDistrictEvidenceSummaryModel {
  const common = {
    nameEn: identity.nameEn,
    nameKo: identity.nameKo,
    href: `/kr/seoul/explore/${identity.slug}/` as const,
    period: summary.period,
    publicationMinimum: 5 as const,
    contractGroup,
    groupLabel: GROUP_LABELS[contractGroup],
  };
  if (!summary.published) {
    return Object.freeze({ ...common, status: 'withheld' as const, sampleLabel: sampleLabel(summary.n) });
  }
  const change = changeReliability({ pct: summary.chg3m, nPrior: null, nLatest: null });
  return Object.freeze({
    ...common,
    status: 'published' as const,
    sampleLabel: sampleLabel(summary.n),
    medianValue: summary.med,
    medianLabel: formatMoney(summary.med),
    middleHalfLabel: `${formatMoney(summary.p25)}–${formatMoney(summary.p75)}`,
    rangeLabel: `${formatMoney(summary.min)}–${formatMoney(summary.max)}`,
    changeLabel: change.label,
    spread: spreadVerdict(summary),
    change,
  });
}

function contractEvidenceFor(
  identity: NonNullable<ReturnType<typeof getSeoulDistrictBySlug>>,
  area: KoreaExplorerProjectedArea,
  projection: Extract<KoreaExplorerEvidenceProjection, { status: 'ready' }>,
): ContractGroupEvidenceModel {
  if (area.contractGroups === null || projection.selection.contractGroup === 'not-applicable') {
    const all = evidenceSummaryFor(
      identity,
      summaryFor(identity.slug, 'seoul', projection, area.primary),
      'all',
    );
    const unavailable = (group: Exclude<PublicContractGroup, 'all'>) => Object.freeze({
      status: 'snapshot_unavailable' as const,
      nameEn: identity.nameEn,
      nameKo: identity.nameKo,
      href: `/kr/seoul/explore/${identity.slug}/` as const,
      period: projection.period,
      publicationMinimum: 5 as const,
      contractGroup: group,
      groupLabel: GROUP_LABELS[group],
      message: 'New/renewal split not available in this snapshot' as const,
    });
    return Object.freeze({
      scopeId: identity.slug,
      selected: 'all',
      splitStatus: 'snapshot_v1',
      unknownContractCount: null,
      allLowerThanNew: false,
      groups: Object.freeze({ all, new: unavailable('new'), renewal: unavailable('renewal') }),
    });
  }
  const groups = Object.freeze(Object.fromEntries(GROUPS.map((group) => [
    group,
    evidenceSummaryFor(
      identity,
      summaryFor(identity.slug, 'seoul', projection, area.contractGroups![group].primary),
      group,
    ),
  ])) as Record<PublicContractGroup, PublicDistrictEvidenceSummaryModel>);
  const selected = projection.selection.contractGroup === 'unknown'
    ? 'all'
    : projection.selection.contractGroup;
  return Object.freeze({
    scopeId: identity.slug,
    selected,
    splitStatus: 'ready',
    unknownContractCount: area.contractGroups.unknown.primary.n,
    allLowerThanNew: groups.all.status === 'published'
      && groups.new.status === 'published'
      && groups.all.medianValue < groups.new.medianValue,
    groups,
  });
}

function bucketAssignments(
  summaries: readonly PublicMarketSummary[],
): ReadonlyMap<string, 0 | 1 | 2 | 3 | 4> {
  const published = summaries.filter((summary) => summary.published).sort((left, right) => (
    left.med - right.med || left.area.localeCompare(right.area)
  ));
  return new Map(published.map((summary, index) => [
    summary.area,
    Math.min(4, Math.floor(index * 5 / published.length)) as 0 | 1 | 2 | 3 | 4,
  ]));
}

function legendFor(districts: readonly ExploreDistrictModel[]): readonly PublicAreaLegendBucket[] {
  return Object.freeze(([0, 1, 2, 3, 4] as const).flatMap((bucket) => {
    const values = districts.flatMap((district) => (
      district.bucket === bucket && district.summary.published ? [district.summary.med] : []
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

function areaBandLabel(
  projection: Extract<KoreaExplorerEvidenceProjection, { status: 'ready' }>,
): string {
  const area = {
    all: 'All filed areas',
    'under-40': 'Under 40㎡',
    '40-60': '40–60㎡',
    '60-85': '60–85㎡',
    '85-plus': '85㎡ and above',
  }[projection.selection.areaBand];
  const transaction = {
    jeonse: 'jeonse', monthly: 'monthly rent', sale: 'sale',
  }[projection.selection.transaction];
  return `${area} · ${transaction}`;
}

function buildingsFor(
  projection: Extract<KoreaExplorerEvidenceProjection, { status: 'ready' }>,
  proximityRepository?: KoreaProximityRepositoryState,
): readonly ExploreBuildingModel[] {
  const [firstObservedMonth, lastObservedMonth] = projection.period.split('/');
  return Object.freeze((projection.buildingPage?.buildings ?? []).map((building) => {
    const selected = building.primary;
    const group = (name: PublicContractGroup | 'unknown') => building.contractGroups?.[name].primary;
    const groupLabel = (name: PublicContractGroup): string | null => {
      const distribution = group(name);
      return distribution?.published === true ? formatMoney(distribution.med) : null;
    };
    return Object.freeze({
      id: building.buildingId,
      districtSlug: building.districtSlug as SeoulDistrictSlug,
      neighborhoodId: building.neighborhoodId,
      neighborhoodName: building.neighborhoodName,
      name: building.officialName,
      housingType: building.housingType,
      latitude: null,
      longitude: null,
      evidenceStatus: selected.n === 0
        ? 'unavailable' as const
        : selected.published ? 'published' as const : 'withheld' as const,
      transaction: building.transaction,
      primaryMetric: building.primaryMetric,
      observationCount: selected.n,
      jeonseObservationCount: building.transaction === 'jeonse' ? selected.n : 0,
      monthlyObservationCount: building.transaction === 'monthly' ? selected.n : 0,
      firstObservedMonth: firstObservedMonth ?? '',
      lastObservedMonth: lastObservedMonth ?? '',
      sampleLabel: sampleLabel(selected.n),
      medianLabel: selected.published ? formatMoney(selected.med) : null,
      filedDepositMedianLabel: building.filedDeposit?.published === true
        ? formatMoney(building.filedDeposit.med)
        : null,
      newSampleLabel: sampleLabel(group('new')?.n ?? 0),
      newMedianLabel: groupLabel('new'),
      renewalSampleLabel: sampleLabel(group('renewal')?.n ?? 0),
      renewalMedianLabel: groupLabel('renewal'),
      unknownContractCount: group('all') === undefined ? 0 : group('unknown')?.n ?? 0,
      proximity: koreaBuildingProximityModel(building.buildingId, proximityRepository),
      href: `/kr/seoul/explore/${building.districtSlug}/${building.buildingId}/` as const,
    });
  }));
}

export function buildKoreaEvidenceAreaExploreModel(
  selectedSlug: string | undefined,
  projection: Extract<KoreaExplorerEvidenceProjection, { status: 'ready' }>,
  proximity: KoreaExploreProximityModel = Object.freeze({
    status: 'missing', selection: Object.freeze({ station: null, school: null }),
  }),
  proximityRepository?: KoreaProximityRepositoryState,
): Extract<PublicAreaExploreModel, { status: 'ready' }> {
  const areaByDistrict = new Map(projection.districts.map((area) => [
    area.districtSlug, area,
  ] as const));
  const geometryBySlug = new Map(listSeoulDistrictGeometry().map((geometry) => [
    geometry.slug, geometry,
  ] as const));
  const summaries = SEOUL_RENT_CHECK_DISTRICTS.map((identity) => {
    const area = areaByDistrict.get(identity.slug);
    if (area === undefined) throw new TypeError('Complete district evidence is required.');
    return summaryFor(identity.slug, 'seoul', projection, area.primary);
  });
  const buckets = bucketAssignments(summaries);
  const districts = Object.freeze(SEOUL_RENT_CHECK_DISTRICTS.map((identity, index) => {
    const summary = summaries[index]!;
    const area = areaByDistrict.get(identity.slug)!;
    const geometry = geometryBySlug.get(identity.slug);
    if (geometry === undefined) throw new TypeError('Complete district geometry is required.');
    const contractEvidence = contractEvidenceFor(identity, area, projection);
    return Object.freeze({
      ...identity,
      href: `/kr/seoul/explore/${identity.slug}/` as const,
      path: geometry.path,
      latitude: geometry.latitude,
      longitude: geometry.longitude,
      summary,
      state: summary.published ? 'published' as const : 'withheld' as const,
      bucket: summary.published ? buckets.get(identity.slug) ?? null : null,
      sampleLabel: sampleLabel(summary.n),
      medianLabel: summary.published ? formatMoney(summary.med) : null,
      changeLabel: summary.published
        ? changeReliability({ pct: summary.chg3m, nPrior: null, nLatest: null }).label
        : null,
      evidenceSummary: contractEvidence.groups[contractEvidence.selected],
      contractEvidence,
    });
  }));
  const selected = projection.buildingPage?.districtSlug
    ?? getSeoulDistrictBySlug(selectedSlug ?? '')?.slug
    ?? 'jongno-gu';
  const buildings = buildingsFor(projection, proximityRepository);
  const priceReady = projection.buildingStats?.priceReady ?? 0;
  const transactionCovered = projection.buildingStats?.transactionCovered ?? 0;
  const observed = projection.buildingStats?.observed ?? 0;
  const publishedDistricts = summaries.filter(({ published }) => published).length;
  const rights = projection.selection.transaction === 'sale'
    ? KR_MOLIT_SALE_RIGHTS
    : KR_MOLIT_RENT_RIGHTS;
  const dataset = projection.selection.transaction === 'sale'
    ? 'reported sale contracts'
    : 'reported rent contracts';
  const evidence = createEvidenceDescriptor({
    marketId: 'kr-seoul',
    provider: 'MOLIT',
    dataset,
    period: projection.period,
    generatedAt: projection.generatedAt,
    state: 'ready',
    publicationMinimum: 5,
    methodologyId: 'kr-exact-cohort-evidence-v2',
    rightsPolicyId: rights.id,
  });
  return Object.freeze({
    status: 'ready',
    evidenceSelection: projection.selection,
    transactionAvailability: projection.availability,
    selectedSlug: selected,
    citySummary: summaryFor('seoul', 'kr', projection, projection.city.primary),
    districts,
    legend: legendFor(districts),
    coverage: Object.freeze({
      districts: Object.freeze({ published: publishedDistricts, retained: districts.length }),
      buildings: projection.buildingStats === null
        ? Object.freeze({
            status: 'inventory_unavailable' as const,
            transactionCovered: null,
            priceReady: null,
            reason: 'Verified observed building inventory is not loaded.' as const,
          })
        : Object.freeze({
            status: 'ready' as const,
            observed,
            transactionCovered,
            priceReady,
          }),
      eligibleContracts: projection.city.primary.n,
      unpublished: Object.freeze({
        districtsBelowMinimum: districts.length - publishedDistricts,
        retainedBuildingsBelowMinimum: transactionCovered - priceReady,
        sourceBuildingCandidates: Object.freeze({
          status: 'unavailable' as const,
          reason: 'Source candidate building counts are not retained in this verified artifact.' as const,
        }),
      }),
    }),
    buildingAvailability: Object.freeze({
      status: 'ready' as const,
      buildings,
      total: projection.buildingPage?.total ?? 0,
      page: projection.buildingPage?.page ?? 1,
      pageSize: projection.buildingPage?.pageSize ?? 0,
    }),
    proximity,
    source: Object.freeze({
      evidence,
      provider: 'MOLIT' as const,
      period: projection.period,
      attribution: Object.freeze([...rights.attribution]),
      band: areaBandLabel(projection),
      publicationMinimum: 5 as const,
      includesNewAndRenewal: true as const,
      includesUnknownContractType: true as const,
      includesUnknownRecordStatus: true as const,
      nextUpdate: null,
      geometryAttribution: 'KOSTAT census boundaries via southkorea/seoul-maps (Apache-2.0)' as const,
    }),
  });
}
