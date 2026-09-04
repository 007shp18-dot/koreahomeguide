import 'server-only';

import type { SingleQuoteCheckResult } from '@signedprice/market-core';

import { contractCheckEvidenceRepositoriesFromEnvironment } from '../contract-check/evidence-repositories.server';
import { contractCheckCurvesFromEnvironment } from '../contract-check/route-model.server';
import { GUIDES, type GuideDocument } from '../guide/guide-content';
import { listPublishedContentArticles } from '../insights/content-article-store.server';
import {
  editorialMarketLabel,
  type EditorialArticle,
} from '../insights/editorial-content';
import { buildPublicAreaExploreModel } from '../public-market/area-route-model.server';
import { buildSeoulLiveModel } from '../public-market/seoul-live-model.server';
import { buildSingleQuoteCheckRouteModel } from '../single-quote-check/route-model.server';
import type {
  EditorialGrowthReviewModel,
  ReviewArticle,
  ReviewCheck,
  ReviewExploreRow,
  ReviewGuideSummary,
  ReviewLocale,
  ReviewMapDistrict,
  ReviewQuery,
  ReviewState,
} from './editorial-growth-review-model';

export type EditorialGrowthReviewDependencies = Readonly<{
  articles: typeof listPublishedContentArticles;
  guides: () => readonly GuideDocument[];
  seoul: typeof buildSeoulLiveModel;
  check: (locale: ReviewLocale) => EditorialGrowthReviewModel['check'];
  explore: (locale: ReviewLocale) => Readonly<{
    rows: EditorialGrowthReviewModel['exploreRows'];
    districts: EditorialGrowthReviewModel['exploreDistricts'];
  }>;
}>;

const ZH_REVIEW_ARTICLE: ReviewArticle = Object.freeze({
  title: '在韩国租房前，先看真实成交依据',
  summary: '把房源报价放回同一地区、同类住宅和相近面积的成交记录中理解。',
  market: '韩国 · 首尔',
  published: '设计样稿',
  updated: '2026-09-04',
  readMinutes: 5,
  sections: Object.freeze([
    Object.freeze({
      heading: '先确认比较范围',
      body: '比较价格之前，先确认交易类型、住宅类型、面积范围和资料期间。',
    }),
    Object.freeze({
      heading: '再查看成交分布',
      body: '单一中位数不能说明某一套住宅的全部条件，样本数量和价格区间必须一起阅读。',
    }),
    Object.freeze({
      heading: '最后检查具体住宅',
      body: '楼层、朝向、房屋状态和合同条件仍需要单独核实。',
    }),
  ]),
});

const NON_NUMERIC_CHECK_STATES = Object.freeze({
  en: Object.freeze({
    insufficient: 'Not enough compatible reported contracts for a distribution.',
    error: 'Official evidence is temporarily unavailable.',
  }),
  'zh-CN': Object.freeze({
    insufficient: '可比的已申报成交记录不足，暂不显示价格分布。',
    error: '官方成交依据暂时不可用。',
  }),
});

function articleToReviewArticle(
  article: EditorialArticle,
  locale: ReviewLocale,
): ReviewArticle {
  const date = new Intl.DateTimeFormat(locale === 'zh-CN' ? 'zh-CN' : 'en-GB', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  });
  const sections = article.bodyMarkdown
    .split(/^## /mu)
    .map((section) => section.trim())
    .filter(Boolean)
    .map((section) => {
      const [heading, ...paragraphs] = section.split(/\n\n+/u);
      if (heading === undefined || paragraphs.length === 0) {
        throw new TypeError(`Editorial section is incomplete: ${article.slug}`);
      }
      return Object.freeze({ heading, body: paragraphs.join('\n\n') });
    });

  return Object.freeze({
    title: article.title,
    summary: article.summary,
    market: editorialMarketLabel(article.marketKey),
    published: date.format(new Date(article.publishedAt)),
    updated: date.format(new Date(article.updatedAt)),
    readMinutes: article.readMinutes,
    sections: Object.freeze(sections),
  });
}

function guideToReviewSummary(guide: GuideDocument): ReviewGuideSummary {
  return Object.freeze({
    title: guide.title,
    summary: guide.summary,
    stage: guide.stage,
    updated: guide.lastVerified,
    href: `/kr/seoul/guide/${guide.slug}/`,
  });
}

function nonNumericCheckState(
  state: Exclude<ReviewState, 'ready'>,
  locale: ReviewLocale,
): ReviewCheck {
  return Object.freeze({
    state,
    verdict: locale === 'zh-CN'
      ? state === 'insufficient' ? '依据不足' : '暂不可用'
      : state === 'insufficient' ? 'Insufficient evidence' : 'Unavailable',
    scope: locale === 'zh-CN' ? '首尔' : 'Seoul',
    metrics: Object.freeze([]),
    disclosure: NON_NUMERIC_CHECK_STATES[locale][state],
  });
}

function readyCheckToReviewCheck(
  result: Extract<SingleQuoteCheckResult, { status: 'ready' }>,
  locale: ReviewLocale,
): ReviewCheck {
  const won = new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  });
  const copy = locale === 'zh-CN'
    ? {
        verdict: { below: '低于同类成交', typical: '处于常见区间', above: '高于同类成交' },
        scope: { building: '同一建筑', neighborhood: '同一社区', district: '同一区' },
        median: '中位数',
        middle: '中间 50%',
        difference: '差额',
        contracts: '笔成交',
      }
    : {
        verdict: {
          below: 'Below comparable evidence',
          typical: 'Within the typical range',
          above: 'Above comparable evidence',
        },
        scope: { building: 'Same building', neighborhood: 'Same neighbourhood', district: 'Same district' },
        median: 'Median',
        middle: 'Middle 50%',
        difference: 'Difference',
        contracts: 'contracts',
      };
  const signedDifference = `${result.difference.won >= 0 ? '+' : '−'}${won.format(Math.abs(result.difference.won))}`;
  const evidenceWindow = `${result.evidenceWindow.startMonth}–${result.evidenceWindow.endMonth}`;

  return Object.freeze({
    state: 'ready',
    verdict: copy.verdict[result.verdict],
    scope: copy.scope[result.filters.scope],
    metrics: Object.freeze([
      Object.freeze({
        label: copy.median,
        value: won.format(result.distribution.medianWon),
        context: result.period,
      }),
      Object.freeze({
        label: copy.middle,
        value: `${won.format(result.distribution.p25Won)}–${won.format(result.distribution.p75Won)}`,
        context: `${result.sample.count} ${copy.contracts}`,
      }),
      Object.freeze({
        label: copy.difference,
        value: signedDifference,
        context: `${result.difference.pct}%`,
      }),
    ]),
    disclosure: [result.fallbackDisclosure, evidenceWindow].filter(Boolean).join(' · '),
  });
}

function buildReviewCheckFromCanonicalRoute(locale: ReviewLocale): ReviewCheck {
  const repositories = contractCheckEvidenceRepositoriesFromEnvironment();
  const observations = repositories.sale?.listBuildingRecords()
    .flatMap((building) => building.recentSales.map((sale) => ({ building, sale }))) ?? [];

  for (const observed of observations) {
    const canonical = buildSingleQuoteCheckRouteModel(repositories, {
      check: '1',
      transaction: 'sale',
      district: observed.building.districtSlug,
      housing: observed.building.housingType,
      area: String(observed.sale.areaSqm),
      building: observed.building.buildingId,
      price: String(observed.sale.priceWon),
    }, contractCheckCurvesFromEnvironment());
    if (canonical.result?.status === 'ready') {
      return readyCheckToReviewCheck(canonical.result, locale);
    }
  }

  return observations.length === 0
    ? nonNumericCheckState('error', locale)
    : nonNumericCheckState('insufficient', locale);
}

function buildReviewExploreFromCanonicalRoute(locale: ReviewLocale): Readonly<{
  rows: readonly ReviewExploreRow[];
  districts: readonly ReviewMapDistrict[];
}> {
  const canonical = buildPublicAreaExploreModel(undefined);
  if (canonical.status !== 'ready') {
    return Object.freeze({ rows: Object.freeze([]), districts: Object.freeze([]) });
  }

  const buildings = canonical.buildingAvailability.status === 'ready'
    ? canonical.buildingAvailability.buildings
    : canonical.buildingAvailability.fallbackBuildings;
  const districtNames = new Map(canonical.districts.map((district) => [
    district.slug,
    locale === 'zh-CN' ? district.nameKo : district.nameEn,
  ]));

  return Object.freeze({
    rows: Object.freeze(buildings.slice(0, 6).map((building, index) => Object.freeze({
      id: building.id,
      name: building.name,
      district: districtNames.get(building.districtSlug) ?? building.districtSlug,
      primaryValue: building.medianLabel
        ?? (locale === 'zh-CN' ? '依据未公开' : 'Evidence withheld'),
      sample: locale === 'zh-CN'
        ? `${building.observationCount} 笔成交`
        : building.sampleLabel,
      period: `${building.firstObservedMonth}–${building.lastObservedMonth}`,
      selected: index === 0,
    }))),
    districts: Object.freeze(canonical.districts.map((district) => Object.freeze({
      id: district.slug,
      name: locale === 'zh-CN' ? district.nameKo : district.nameEn,
      path: district.path,
      selected: district.slug === canonical.selectedSlug,
      evidenceState: district.state,
    }))),
  });
}

const DEFAULT_DEPENDENCIES: EditorialGrowthReviewDependencies = Object.freeze({
  articles: listPublishedContentArticles,
  guides: () => GUIDES,
  seoul: buildSeoulLiveModel,
  check: buildReviewCheckFromCanonicalRoute,
  explore: buildReviewExploreFromCanonicalRoute,
});

export async function buildEditorialGrowthReviewModel(
  query: ReviewQuery,
  dependencies: EditorialGrowthReviewDependencies = DEFAULT_DEPENDENCIES,
): Promise<EditorialGrowthReviewModel> {
  const publishedArticles = await dependencies.articles();
  if (publishedArticles.length === 0) {
    throw new TypeError('A published review article is required.');
  }
  const articles = query.locale === 'zh-CN'
    ? Object.freeze([ZH_REVIEW_ARTICLE])
    : Object.freeze(publishedArticles.map((article) => articleToReviewArticle(article, query.locale)));
  const article = articles[0]!;
  const seoul = dependencies.seoul();
  const copy = query.locale === 'zh-CN'
    ? { updated: '更新于', reportedContracts: '已申报成交' }
    : { updated: 'Updated', reportedContracts: 'Reported contracts' };
  const explore = query.state === 'ready'
    ? dependencies.explore(query.locale)
    : { rows: Object.freeze([]), districts: Object.freeze([]) };

  return Object.freeze({
    locale: query.locale,
    state: query.state,
    ad: query.ad,
    seoulStatus: seoul.status === 'ready'
      ? `${copy.updated} ${seoul.period}`
      : query.locale === 'zh-CN' ? '官方首尔成交依据暂时不可用。' : seoul.message,
    headlineMetric: seoul.status === 'ready'
      ? Object.freeze({
          label: copy.reportedContracts,
          value: new Intl.NumberFormat(query.locale === 'zh-CN' ? 'zh-CN' : 'en').format(seoul.totalCount),
          context: seoul.period,
        })
      : null,
    article,
    articles,
    guides: Object.freeze(dependencies.guides().slice(0, 5).map(guideToReviewSummary)),
    check: query.state === 'ready'
      ? dependencies.check(query.locale)
      : nonNumericCheckState(query.state, query.locale),
    exploreRows: explore.rows,
    exploreDistricts: explore.districts,
  });
}
