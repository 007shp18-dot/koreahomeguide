import 'server-only';

import type {
  PublishedMarketSummary,
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
  PublicAreaRankingsModel,
  PublicDistrictRankingRow,
  RankingKind,
  SignedRankingBar,
} from './area-route-types';
import { createPublicAreaSummaryRepository } from './area-summary-repository.server';
import {
  changeReliability,
  evidencePeriod,
} from './evidence-interpretation';

const money = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
});

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
): PublicDistrictRankingRow {
  const identity = identityFor(summary.area);
  return Object.freeze({
    kind,
    rank,
    lawdCd: identity.lawdCd,
    slug: identity.slug,
    nameEn: identity.nameEn,
    nameKo: identity.nameKo,
    href: `/kr/seoul/explore/${identity.slug}/`,
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
): readonly PublicDistrictRankingRow[] {
  const sorted = [...summaries].sort(compare(metricFor, order));
  return Object.freeze(sorted.map((summary, index) => {
    const metric = metricFor(summary);
    return rowFor(kind, summary, index + 1, metric, labelFor(metric), null, plotAxis);
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
    return rowFor('change', summary, index + 1, metric, reliability.label, bar);
  }));
  const axis = maxAbs === 0
    ? Object.freeze({ minimum: '0.0%', maximum: '0.0%' })
    : Object.freeze({ minimum: `-${maxAbs.toFixed(1)}%`, maximum: `+${maxAbs.toFixed(1)}%` });
  return Object.freeze({ rows, axis });
}

export function buildPublicAreaRankingsModel(
  dependencies: PublicAreaRouteDependencies = environmentDependencies(),
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
    const period = evidencePeriod(
      citySummary.period,
      dependencies.referenceInstant ?? new Date(),
    );
    return Object.freeze({
      status: 'ready',
      cheapest: unsignedRows('cheapest', published, ({ med }) => med, 1, (value) => money.format(value)),
      change: change.rows,
      spread: unsignedRows(
        'spread',
        published,
        ({ p25, p75 }) => p75 - p25,
        -1,
        (value) => money.format(value),
        plotAxis,
      ),
      sample: unsignedRows('sample', published, ({ n }) => n, -1, (value) => String(value)),
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
