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
  ContractGroupEvidenceModel,
  DistrictBuildingAvailability,
  ExploreBuildingAvailability,
  ExploreDistrictModel,
  PublicAreaExploreModel,
  PublicAreaLegendBucket,
  PublicAreaSourceBoundaryModel,
  PublicDistrictDisplayModel,
  PublicDistrictEvidenceSummaryModel,
  PublicDistrictFaq,
  PublicDistrictModel,
  PublicContractGroup,
  PublicSourceBoundaryModel,
} from './area-route-types';
import {
  listAdjacentDistrictSlugs,
  listSeoulDistrictGeometry,
} from './seoul-district-geometry.server';

export type PublicAreaRouteDependencies = Readonly<{
  source: unknown;
  period: string;
  buildingSource?: unknown;
}>;

const money = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
});

const PUBLICATION_MINIMUM = 5 as const;
const CONTRACT_GROUPS = ['all', 'new', 'renewal'] as const;
const GROUP_LABELS = Object.freeze({
  all: 'All contracts',
  new: 'New contracts',
  renewal: 'Renewal contracts',
} as const);

function formatMoney(value: number): string {
  return money.format(value);
}

function sampleLabel(n: number): string {
  return `${n} reported contract${n === 1 ? '' : 's'}`;
}

function changeLabel(chg3m: number | null): string {
  if (chg3m === null) return '3-month change unavailable';
  return `${chg3m > 0 ? '+' : ''}${chg3m.toFixed(1)}% over the prior 3 months`;
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
  return Object.freeze({
    ...common,
    status: 'published',
    sampleLabel: sampleLabel(summary.n),
    medianLabel: formatMoney(summary.med),
    middleHalfLabel: `${formatMoney(summary.p25)}–${formatMoney(summary.p75)}`,
    rangeLabel: `${formatMoney(summary.min)}–${formatMoney(summary.max)}`,
    changeLabel: changeLabel(summary.chg3m),
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
    return Object.freeze({
      scopeId: identity.slug,
      selected: 'all',
      splitStatus: 'snapshot_v1',
      unknownContractCount: null,
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
  return Object.freeze({
    scopeId: identity.slug,
    selected,
    splitStatus: 'ready',
    unknownContractCount: repository.getDistrictUnknownContractCount(identity.slug),
    groups: Object.freeze(Object.fromEntries(CONTRACT_GROUPS.map((contractGroup) => [
      contractGroup,
      districtEvidenceSummaryFor(
        identity,
        repository.getDistrictSummary(identity.slug, contractGroup),
        contractGroup,
      ),
    ])) as Record<PublicContractGroup, PublicDistrictEvidenceSummaryModel>),
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
    groups: Object.freeze(Object.fromEntries(CONTRACT_GROUPS.map((contractGroup) => [
      contractGroup,
      unavailableDistrictEvidenceSummaryFor(identity, period, contractGroup),
    ])) as Record<PublicContractGroup, PublicDistrictEvidenceSummaryModel>),
  });
}

export function buildPublicSourceBoundary(
  period: string,
  evidence: EvidenceDescriptor | null,
): PublicSourceBoundaryModel;
export function buildPublicSourceBoundary(
  period: string,
  evidence: EvidenceDescriptor | null,
  includeGeometry: true,
): PublicAreaSourceBoundaryModel;
export function buildPublicSourceBoundary(
  period: string,
  evidence: EvidenceDescriptor | null,
  includeGeometry = false,
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
  } as const;
  return includeGeometry
    ? Object.freeze({
        ...common,
        geometryAttribution:
          'KOSTAT census boundaries via southkorea/seoul-maps (Apache-2.0)',
      })
    : Object.freeze(common);
}

function environmentDependencies(): PublicAreaRouteDependencies {
  const serialized = process.env.SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT;
  const serializedBuildings = process.env.SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT;
  let source: unknown;
  let buildingSource: unknown;
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
  });
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

function exploreBuildingsFor(
  dependencies: PublicAreaRouteDependencies,
): ExploreBuildingAvailability {
  try {
    const repository = createPublicBuildingRepository({
      source: dependencies.buildingSource,
      expected: { marketId: 'kr-seoul', period: dependencies.period },
    });
    const buildings = Object.freeze(repository.listRouteParams().map(({ district, buildingId }) => {
      const building = repository.getById(district, buildingId);
      if (!building.groups.all.published) throw new TypeError('Unpublished building route.');
      const groupLabel = (group: typeof building.groups.new) => (
        group.published ? formatMoney(group.med) : null
      );
      return Object.freeze({
        id: building.buildingId,
        districtSlug: building.districtSlug,
        neighborhoodId: building.neighborhoodId,
        neighborhoodName: building.neighborhoodName,
        name: building.name,
        housingType: building.housingType,
        latitude: building.latitude,
        longitude: building.longitude,
        sampleLabel: sampleLabel(building.groups.all.n),
        medianLabel: formatMoney(building.groups.all.med),
        newSampleLabel: sampleLabel(building.groups.new.n),
        newMedianLabel: groupLabel(building.groups.new),
        renewalSampleLabel: sampleLabel(building.groups.renewal.n),
        renewalMedianLabel: groupLabel(building.groups.renewal),
        unknownContractCount: building.unknownContractCount,
        href: `/kr/seoul/explore/${building.districtSlug}/${building.buildingId}/` as const,
      });
    }));
    return Object.freeze({ status: 'ready', buildings });
  } catch {
    return Object.freeze({ status: 'not_loaded' });
  }
}

export function buildPublicAreaExploreModel(
  selectedSlug: string | undefined,
  dependencies: PublicAreaRouteDependencies = environmentDependencies(),
  requestedContractGroup?: unknown,
): PublicAreaExploreModel {
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
        changeLabel: summary.published ? changeLabel(summary.chg3m) : null,
        evidenceSummary: contractEvidence.groups[contractEvidence.selected],
        contractEvidence,
      } satisfies ExploreDistrictModel);
    }));
    const selected = getSeoulDistrictBySlug(selectedSlug ?? '')?.slug ?? 'jongno-gu';
    return Object.freeze({
      status: 'ready',
      selectedSlug: selected,
      citySummary,
      districts,
      legend: legendFor(districts),
      buildingAvailability: exploreBuildingsFor(dependencies),
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
    changeLabel: summary.published ? changeLabel(summary.chg3m) : null,
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
  dependencies: PublicAreaRouteDependencies = environmentDependencies(),
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
