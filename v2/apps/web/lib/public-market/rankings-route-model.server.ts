import 'server-only';

import type {
  PublishedMarketSummary,
  PublicMarketSummary,
  QuotePositionAxis,
} from '@signedprice/market-core';
import {
  getSeoulDistrictBySlug,
  type SeoulRentCheckDistrict,
} from '@signedprice/korea-rent/browser';

import {
  buildPublicSourceBoundary,
  type PublicAreaRouteDependencies,
} from './area-route-model.server';
import type {
  PublicBuildingRankingsModel,
  PublicAreaRankingsModel,
  PublicDistrictRankingRow,
  RankingKind,
  SignedRankingBar,
  UnavailableRankingDistrict,
} from './area-route-types';
import type { KoreaEvidenceRepositories } from './korea-evidence-repositories.server';
import { createSelectionHref } from '../navigation/explorer-selection';
import { createPublicAreaSummaryRepository } from './area-summary-repository.server';
import { buildKoreaEvidenceAreaExploreModel } from './korea-explorer-area-route.server';
import type {
  KoreaExplorerEvidenceProjection,
  KoreaExplorerEvidenceSelection,
} from './korea-explorer-evidence.server';
import {
  changeReliability,
  evidencePeriod,
} from './evidence-interpretation';

type RankingsRouteDependencies = PublicAreaRouteDependencies & Readonly<{
  page?: number;
  pageSize?: number;
}>;

const money = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
});

function environmentDependencies(): RankingsRouteDependencies {
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
    referenceInstant: new Date().toISOString(),
  });
}

function identityFor(area: string): SeoulRentCheckDistrict {
  const identity = getSeoulDistrictBySlug(area);
  if (identity === null) throw new TypeError('Invalid district summary identity.');
  return identity;
}

function compare(
  primary: (summary: PublishedMarketSummary) => number,
  order: 1 | -1,
) {
  return (left: PublishedMarketSummary, right: PublishedMarketSummary): number => {
    const delta = (primary(left) - primary(right)) * order;
    if (delta !== 0) return delta;
    return identityFor(left.area).lawdCd.localeCompare(identityFor(right.area).lawdCd);
  };
}

function rowFor(
  kind: RankingKind,
  summary: PublishedMarketSummary,
  rank: number,
  metric: number,
  valueLabel: string,
  bar: SignedRankingBar | null = null,
  plotAxis: QuotePositionAxis | null = null,
  href?: `/kr/seoul/explore/${string}/` | `/kr/seoul/explore/${string}/?${string}`,
): PublicDistrictRankingRow {
  const identity = identityFor(summary.area);
  return Object.freeze({
    kind,
    rank,
    lawdCd: identity.lawdCd,
    slug: identity.slug,
    nameEn: identity.nameEn,
    nameKo: identity.nameKo,
    href: href ?? `/kr/seoul/explore/${identity.slug}/`,
    metric,
    valueLabel,
    bar,
    distribution: kind === 'spread'
      ? Object.freeze({ ...summary, chg3m: null })
      : null,
    plotAxis: kind === 'spread' ? plotAxis : null,
  });
}

function unsignedRows(
  kind: Exclude<RankingKind, 'change'>,
  summaries: readonly PublishedMarketSummary[],
  metricFor: (summary: PublishedMarketSummary) => number,
  order: 1 | -1,
  labelFor: (value: number) => string,
  plotAxis: QuotePositionAxis | null = null,
  hrefFor?: (summary: PublishedMarketSummary) => PublicDistrictRankingRow['href'],
): readonly PublicDistrictRankingRow[] {
  const sorted = [...summaries].sort(compare(metricFor, order));
  return Object.freeze(sorted.map((summary, index) => {
    const metric = metricFor(summary);
    return rowFor(
      kind,
      summary,
      index + 1,
      metric,
      labelFor(metric),
      null,
      plotAxis,
      hrefFor?.(summary),
    );
  }));
}

function distributionAxis(
  summaries: readonly PublishedMarketSummary[],
): QuotePositionAxis | null {
  if (summaries.length === 0) return null;
  const min = Math.min(...summaries.map((summary) => summary.min));
  const observedMax = Math.max(...summaries.map((summary) => summary.max));
  return Object.freeze({ min, max: observedMax > min ? observedMax : observedMax + 1 });
}

function changeRows(
  summaries: readonly PublishedMarketSummary[],
  hrefFor?: (summary: PublishedMarketSummary) => PublicDistrictRankingRow['href'],
): Readonly<{
  rows: readonly PublicDistrictRankingRow[];
  axis: Readonly<{ minimum: string; maximum: string }>;
}> {
  const eligible = summaries.flatMap((summary) => {
    const reliability = changeReliability({
      pct: summary.chg3m,
      nPrior: null,
      nLatest: null,
    });
    return reliability.status === 'not_assessable' || summary.chg3m === null
      ? []
      : [{ summary, reliability, chg3m: summary.chg3m }];
  }).sort((left, right) => compare(
    (summary) => summary.chg3m ?? 0,
    1,
  )(left.summary, right.summary));
  const maxAbs = Math.max(0, ...eligible.map(({ chg3m }) => Math.abs(chg3m)));
  const rows = Object.freeze(eligible.map(({ summary, reliability, chg3m }, index) => {
    const metric = chg3m;
    const extentPct = maxAbs === 0 ? 0 : Math.abs(metric) / maxAbs * 50;
    const direction = metric < 0 ? 'negative' : metric > 0 ? 'positive' : 'zero';
    const bar = Object.freeze({
      direction,
      startPct: metric < 0 ? 50 - extentPct : 50,
      endPct: metric > 0 ? 50 + extentPct : 50,
      extentPct,
    } satisfies SignedRankingBar);
    return rowFor(
      'change', summary, index + 1, metric, reliability.label, bar, null,
      hrefFor?.(summary),
    );
  }));
  const axis = maxAbs === 0
    ? Object.freeze({ minimum: '0.0%', maximum: '0.0%' })
    : Object.freeze({ minimum: `-${maxAbs.toFixed(1)}%`, maximum: `+${maxAbs.toFixed(1)}%` });
  return Object.freeze({ rows, axis });
}

export function buildPublicAreaRankingsModel(
  dependencies: RankingsRouteDependencies = environmentDependencies(),
): PublicAreaRankingsModel {
  const unavailableSource = buildPublicSourceBoundary(dependencies.period, null);
  try {
    const repository = createPublicAreaSummaryRepository({
      source: dependencies.source,
      expected: { marketId: 'kr-seoul', period: dependencies.period },
    });
    const citySummary = repository.getCitySummary();
    const allDistricts = repository.listDistrictSummaries();
    const published = allDistricts.filter(
      (summary): summary is PublishedMarketSummary => summary.published,
    );
    const change = changeRows(published);
    const plotAxis = distributionAxis(published);
    const page = pagination(published.length, dependencies.page, dependencies.pageSize);
    const median = unsignedRows(
      'median', published, ({ med }) => med, -1, (value) => money.format(value),
    );
    const spread = unsignedRows(
      'spread', published, ({ p25, p75 }) => p75 - p25, -1,
      (value) => money.format(value), plotAxis,
    );
    const sample = unsignedRows(
      'sample', published, ({ n }) => n, -1, (value) => String(value),
    );
    const period = evidencePeriod(
      citySummary.period,
      dependencies.referenceInstant ?? new Date(),
    );
    return Object.freeze({
      status: 'ready',
      evidenceSelection: Object.freeze({
        transaction: 'jeonse' as const,
        areaBand: 'legacy-45-55' as const,
        housingType: 'all' as const,
        contractGroup: 'all' as const,
      }),
      transactionAvailability: Object.freeze({ jeonse: true, monthly: false, sale: false }),
      citySummary,
      buildingRankings: Object.freeze({ status: 'unavailable', rows: Object.freeze([]) }),
      median: pageRows(median, page),
      change: pageRows(change.rows, page),
      spread: pageRows(spread, page),
      sample: pageRows(sample, page),
      pagination: page,
      unavailableDistricts: unavailableDistricts(allDistricts),
      withheldDistrictCount: allDistricts.length - published.length,
      changeExcludedDistrictCount: allDistricts.length - change.rows.length,
      hasNegativeChange: change.rows.some(({ metric }) => metric < 0),
      changeAxisLabel: change.axis,
      changeInterpretation: Object.freeze({
        status: 'not_assessable',
        title: 'Three-month change not assessable',
        definition: 'Prior/latest sample counts were not retained in this snapshot.',
        note: 'Stored change values are excluded from rankings until both comparison counts are retained.',
      }),
      period,
      source: buildPublicSourceBoundary(
        citySummary.period,
        repository.getEvidenceDescriptor(),
      ),
    });
  } catch {
    return Object.freeze({
      status: 'unavailable',
      message: 'Verified district summary unavailable',
      source: unavailableSource,
    });
  }
}

function exactRankingHref(
  summary: Readonly<{ area: string }>,
  selection: KoreaExplorerEvidenceSelection,
): PublicDistrictRankingRow['href'] {
  return createSelectionHref(
    `/kr/seoul/explore/${summary.area}/`,
    {
      market: 'kr',
      transaction: selection.transaction,
      area: selection.areaBand,
      propertyType: selection.housingType === 'all' ? undefined : selection.housingType,
      district: summary.area,
      contractType: selection.contractGroup === 'not-applicable'
        || selection.contractGroup === 'unknown'
        ? undefined
        : selection.contractGroup,
    },
    { market: 'kr', transaction: 'sale' },
  ) as PublicDistrictRankingRow['href'];
}

function pagination(total: number, requestedPage = 1, requestedPageSize = 20) {
  const pageSize = Number.isSafeInteger(requestedPageSize) && requestedPageSize > 0
    ? requestedPageSize
    : 20;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, pageCount)
    : 1;
  return Object.freeze({
    page,
    pageSize,
    total,
    pageCount,
    previousPage: page > 1 ? page - 1 : null,
    nextPage: page < pageCount ? page + 1 : null,
  });
}

function pageRows(
  rows: readonly PublicDistrictRankingRow[],
  model: ReturnType<typeof pagination>,
) {
  const start = (model.page - 1) * model.pageSize;
  return Object.freeze(rows.slice(start, start + model.pageSize));
}

function buildingRankingHref(
  building: Readonly<{
    buildingId: string;
    districtSlug: string;
    housingType: string;
  }>,
  selection: KoreaExplorerEvidenceSelection,
): `/kr/seoul/explore/${string}/${string}/?${string}` {
  const query = new URLSearchParams({
    transaction: selection.transaction,
    area: selection.areaBand,
    propertyType: building.housingType,
  });
  if (selection.transaction !== 'sale'
    && selection.contractGroup !== 'not-applicable'
    && selection.contractGroup !== 'unknown') {
    query.set('contractType', selection.contractGroup);
  }
  return `/kr/seoul/explore/${building.districtSlug}/${building.buildingId}/?${query.toString()}`;
}

export function buildKoreaBuildingRankings(
  repositories: KoreaEvidenceRepositories,
  selection: KoreaExplorerEvidenceSelection,
  requestedPage = 1,
  requestedPageSize = 20,
): PublicBuildingRankingsModel {
  const source = selection.transaction === 'sale'
    ? repositories.sale?.listBuildingRecords()
    : repositories.rent?.listBuildingRecords();
  if (source === undefined) return Object.freeze({ status: 'unavailable', rows: Object.freeze([]) });
  const selected = source.filter(({ housingType }) => (
    selection.housingType === 'all' || housingType === selection.housingType
  )).map((building) => {
    const distribution = selection.transaction === 'sale'
      ? 'recentSales' in building
        ? building.cohorts.find(({ areaBand }) => areaBand === selection.areaBand)?.price
        : undefined
      : 'recentTransactions' in building
        ? building.cohorts.find((cohort) => (
            cohort.transaction === selection.transaction
            && cohort.areaBand === selection.areaBand
            && cohort.contractGroup === selection.contractGroup
          ))?.primary
        : undefined;
    return { building, distribution };
  });
  const published = selected.flatMap(({ building, distribution }) => {
    if (distribution?.published !== true) return [];
    const district = getSeoulDistrictBySlug(building.districtSlug);
    if (district === null) return [];
    return [{ building, distribution, district }];
  }).sort((left, right) => (
    right.distribution.med - left.distribution.med
    || left.building.buildingId.localeCompare(right.building.buildingId)
    || left.building.districtSlug.localeCompare(right.building.districtSlug)
  ));
  const ranked = Object.freeze(published.map(({ building, distribution, district }, index) => Object.freeze({
    rank: index + 1,
    buildingId: building.buildingId,
    officialName: building.officialName,
    districtSlug: building.districtSlug,
    districtNameEn: district.nameEn,
    districtNameKo: district.nameKo,
    neighborhoodName: building.neighborhoodName,
    housingType: building.housingType,
    medianWon: distribution.med,
    medianLabel: money.format(distribution.med),
    sampleCount: distribution.n,
    href: buildingRankingHref(building, selection),
  })));
  const page = pagination(ranked.length, requestedPage, requestedPageSize);
  const start = (page.page - 1) * page.pageSize;
  return Object.freeze({
    status: 'ready',
    rows: Object.freeze(ranked.slice(start, start + page.pageSize)),
    withheldBuildingCount: selected.length - ranked.length,
    pagination: page,
  });
}

export type SingaporeRankingMetric = 'price' | 'psf' | 'sample';
export type SingaporeRankingSourceRow = Readonly<{
  id: string;
  name: string;
  segment: 'CCR' | 'RCR' | 'OCR';
  district: string;
  street: string;
  sample: number;
  medianPriceSgd: number | null;
  medianPsf: number | null;
  href: string;
}>;
export type SingaporeRankingRow = SingaporeRankingSourceRow & Readonly<{ rank: number }>;
export type SingaporeRankingsModel = Readonly<{
  metric: SingaporeRankingMetric;
  rows: readonly SingaporeRankingRow[];
  pagination: Readonly<{
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
    previousPage: number | null;
    nextPage: number | null;
  }>;
}>;

function singaporeMetricValue(row: SingaporeRankingSourceRow, metric: SingaporeRankingMetric) {
  if (metric === 'price') return row.medianPriceSgd;
  if (metric === 'psf') return row.medianPsf;
  return row.sample;
}

export function buildSingaporeRankingsModel(
  sourceRows: readonly SingaporeRankingSourceRow[],
  metric: SingaporeRankingMetric = 'price',
  requestedPage = 1,
  requestedPageSize = 20,
): SingaporeRankingsModel {
  const ranked = sourceRows
    .filter((row) => {
      const value = singaporeMetricValue(row, metric);
      return value !== null && Number.isFinite(value) && value > 0;
    })
    .sort((left, right) => (
      singaporeMetricValue(right, metric)! - singaporeMetricValue(left, metric)!
      || left.id.localeCompare(right.id, 'en')
    ))
    .map((row, index) => Object.freeze({ ...row, rank: index + 1 }));
  const page = pagination(ranked.length, requestedPage, requestedPageSize);
  const start = (page.page - 1) * page.pageSize;
  return Object.freeze({
    metric,
    rows: Object.freeze(ranked.slice(start, start + page.pageSize)),
    pagination: page,
  });
}

function unavailableDistricts(
  summaries: readonly PublicMarketSummary[],
  hrefFor?: (summary: Readonly<{ area: string }>) => UnavailableRankingDistrict['href'],
): readonly UnavailableRankingDistrict[] {
  return Object.freeze(summaries.filter((summary) => !summary.published).map((summary) => {
    const identity = identityFor(summary.area);
    return Object.freeze({
      slug: identity.slug,
      nameEn: identity.nameEn,
      nameKo: identity.nameKo,
      href: hrefFor?.(summary) ?? `/kr/seoul/explore/${identity.slug}/`,
    });
  }));
}

export function buildKoreaEvidenceAreaRankingsModel(
  projection: Extract<KoreaExplorerEvidenceProjection, { status: 'ready' }>,
  referenceInstant: string | Date = new Date(),
  requestedPage = 1,
  requestedPageSize = 20,
  repositories?: KoreaEvidenceRepositories,
  requestedBuildingPage = 1,
): PublicAreaRankingsModel {
  const explore = buildKoreaEvidenceAreaExploreModel(undefined, projection);
  const allDistricts = explore.districts.map(({ summary }) => summary);
  const published = allDistricts.filter(
    (summary): summary is PublishedMarketSummary => summary.published,
  );
  const hrefFor = (summary: PublishedMarketSummary) => exactRankingHref(
    summary,
    projection.selection,
  );
  const change = changeRows(published, hrefFor);
  const plotAxis = distributionAxis(published);
  const page = pagination(published.length, requestedPage, requestedPageSize);
  const median = unsignedRows(
    'median', published, ({ med }) => med, -1, (value) => money.format(value), null, hrefFor,
  );
  const spread = unsignedRows(
    'spread', published, ({ p25, p75 }) => p75 - p25, -1,
    (value) => money.format(value), plotAxis, hrefFor,
  );
  const sample = unsignedRows(
    'sample', published, ({ n }) => n, -1, (value) => String(value), null, hrefFor,
  );
  return Object.freeze({
    status: 'ready' as const,
    evidenceSelection: projection.selection,
    transactionAvailability: projection.availability,
    citySummary: explore.citySummary,
    buildingRankings: repositories === undefined
      ? Object.freeze({ status: 'unavailable' as const, rows: Object.freeze([]) })
      : buildKoreaBuildingRankings(
          repositories,
          projection.selection,
          requestedBuildingPage,
          requestedPageSize,
        ),
    median: pageRows(median, page),
    change: pageRows(change.rows, page),
    spread: pageRows(spread, page),
    sample: pageRows(sample, page),
    pagination: page,
    unavailableDistricts: unavailableDistricts(
      allDistricts,
      (summary) => exactRankingHref(summary, projection.selection),
    ),
    withheldDistrictCount: allDistricts.length - published.length,
    changeExcludedDistrictCount: allDistricts.length - change.rows.length,
    hasNegativeChange: change.rows.some(({ metric }) => metric < 0),
    changeAxisLabel: change.axis,
    changeInterpretation: Object.freeze({
      status: 'not_assessable' as const,
      title: 'Three-month change not assessable' as const,
      definition: 'Prior/latest sample counts were not retained in this snapshot.' as const,
      note: 'Stored change values are excluded from rankings until both comparison counts are retained.' as const,
    }),
    period: evidencePeriod(projection.period, referenceInstant),
    source: explore.source,
  });
}
