import 'server-only';

import {
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

import {
  createPublicAreaSummaryRepository,
} from './area-summary-repository.server';
import type {
  ExploreDistrictModel,
  PublicAreaExploreModel,
  PublicAreaLegendBucket,
  PublicAreaSourceBoundaryModel,
  PublicDistrictDisplayModel,
  PublicDistrictFaq,
  PublicDistrictModel,
  PublicSourceBoundaryModel,
} from './area-route-types';
import {
  listAdjacentDistrictSlugs,
  listSeoulDistrictGeometry,
} from './seoul-district-geometry.server';

export type PublicAreaRouteDependencies = Readonly<{
  source: unknown;
  period: string;
}>;

const money = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
});

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

export function buildPublicSourceBoundary(
  period: string,
): PublicSourceBoundaryModel;
export function buildPublicSourceBoundary(
  period: string,
  includeGeometry: true,
): PublicAreaSourceBoundaryModel;
export function buildPublicSourceBoundary(
  period: string,
  includeGeometry = false,
): PublicSourceBoundaryModel | PublicAreaSourceBoundaryModel {
  const common = {
    provider: 'MOLIT',
    period,
    attribution: Object.freeze([...KR_MOLIT_RENT_RIGHTS.attribution]),
    band: '45–55㎡',
    publicationMinimum: 5,
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
  let source: unknown;
  try {
    source = serialized === undefined ? undefined : JSON.parse(serialized);
  } catch {
    source = undefined;
  }
  return Object.freeze({
    source,
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

export function buildPublicAreaExploreModel(
  selectedSlug: string | undefined,
  dependencies: PublicAreaRouteDependencies = environmentDependencies(),
): PublicAreaExploreModel {
  const unavailableSource = buildPublicSourceBoundary(dependencies.period, true);
  try {
    const repository = createPublicAreaSummaryRepository({
      source: dependencies.source,
      expected: { marketId: 'kr-seoul', period: dependencies.period },
    });
    const citySummary = repository.getCitySummary();
    const source = buildPublicSourceBoundary(citySummary.period, true);
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
      return Object.freeze({
        ...identity,
        href: `/kr/seoul/${identity.slug}/` as const,
        path: geometry.path,
        summary,
        state: summary.published ? 'published' : 'withheld',
        bucket: summary.published ? buckets.get(identity.slug) ?? null : null,
        sampleLabel: sampleLabel(summary.n),
        medianLabel: summary.published ? formatMoney(summary.med) : null,
        changeLabel: summary.published ? changeLabel(summary.chg3m) : null,
      } satisfies ExploreDistrictModel);
    }));
    const selected = getSeoulDistrictBySlug(selectedSlug ?? '')?.slug ?? 'jongno-gu';
    return Object.freeze({
      status: 'ready',
      selectedSlug: selected,
      citySummary,
      districts,
      legend: legendFor(districts),
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
): PublicDistrictModel | null {
  const identity = getSeoulDistrictBySlug(slug);
  if (identity === null) return null;
  const nearby = nearbyDistricts(identity.slug);
  const source = buildPublicSourceBoundary(dependencies.period, true);
  try {
    const config = getPublicMarketConfig('kr-seoul');
    if (config.availability !== 'ready') throw new TypeError('Market unavailable.');
    const repository = createPublicAreaSummaryRepository({
      source: dependencies.source,
      expected: { marketId: 'kr-seoul', period: dependencies.period },
    });
    const summary = repository.getDistrictSummary(identity.slug);
    const faq = faqFor(identity, summary);
    const common = {
      identity,
      display: displayFor(identity, summary),
      nearby,
      faq,
      datasetJsonLd: datasetFor(identity, summary),
      faqJsonLd: faqJsonLdFor(faq),
      source,
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
      message: 'Verified district summary unavailable',
    });
  }
}

export type {
  ExploreDistrictModel,
  PublicAreaExploreModel,
  PublicAreaLegendBucket,
  PublicAreaSourceBoundaryModel,
  PublicDistrictDisplayModel,
  PublicDistrictFaq,
  PublicDistrictModel,
} from './area-route-types';
