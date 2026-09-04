import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  REVIEW_SURFACES,
  resolveReviewQuery,
} from '../lib/design-review/editorial-growth-review-model';
import {
  buildEditorialGrowthReviewModel,
  isReviewableExploreBuilding,
  localizeReviewFallbackDisclosure,
  reviewDistrictName,
  type EditorialGrowthReviewDependencies,
} from '../lib/design-review/editorial-growth-review-model.server';
import { GUIDES } from '../lib/guide/guide-content';
import { STARTER_EDITORIAL_ARTICLES } from '../lib/insights/editorial-content';

describe('editorial growth review URL contract', () => {
  it('publishes the four approved review surfaces', () => {
    expect(REVIEW_SURFACES).toEqual(['home', 'content', 'check', 'explore']);
  });

  it('accepts Simplified Chinese and explicit evidence and ad states', () => {
    expect(resolveReviewQuery({
      locale: 'zh-CN',
      state: 'insufficient',
      ad: 'loaded',
    })).toEqual({ locale: 'zh-CN', state: 'insufficient', ad: 'loaded' });
  });

  it('rejects arrays and unknown values instead of guessing intent', () => {
    expect(resolveReviewQuery({
      locale: ['zh-CN'],
      state: 'unknown',
      ad: 'unknown',
    })).toEqual({ locale: 'en', state: 'ready', ad: 'empty' });
  });
});

describe('editorial growth review data boundary', () => {
  const readyDependencies: EditorialGrowthReviewDependencies = {
    articles: async () => [STARTER_EDITORIAL_ARTICLES[0]!],
    guides: () => [GUIDES[0]!],
    seoul: () => ({
      status: 'ready',
      period: '2026-08',
      totalCount: 120,
      newCount: 80,
      renewalCount: 40,
      unknownCount: 0,
      links: [],
    }),
    check: () => ({
      state: 'ready',
      verdict: 'Within the typical range',
      scope: 'Same building',
      metrics: [],
      disclosure: 'Five compatible reported contracts.',
    }),
    explore: () => ({
      rows: [{
        id: 'verified-1',
        name: 'Verified building',
        district: 'Gangnam-gu',
        primaryValue: '₩1,000,000,000',
        sample: '8 contracts',
        period: '2026-08',
        selected: true,
      }],
      districts: [{
        id: 'gangnam-gu',
        name: 'Gangnam-gu',
        path: 'M0 0L10 0L10 10Z',
        selected: true,
        evidenceState: 'published',
      }],
    }),
  };

  it('adapts canonical editorial and evidence values without inventing numbers', async () => {
    const model = await buildEditorialGrowthReviewModel(
      { locale: 'en', state: 'ready', ad: 'empty' },
      readyDependencies,
    );

    expect(model.article.title).toBe(STARTER_EDITORIAL_ARTICLES[0]!.title);
    expect(model.articles).toHaveLength(1);
    expect(model.guides[0]?.href).toBe('/kr/seoul/guide/read-seoul-apartment-sale-prices/');
    expect(model.headlineMetric).toEqual({
      label: 'Reported contracts',
      value: '120',
      context: '2026-08',
    });
    expect(JSON.stringify(model)).not.toMatch(/undefined|null contracts|NaN/);
  });

  it('uses independent Chinese copy and localized evidence labels', async () => {
    const model = await buildEditorialGrowthReviewModel(
      { locale: 'zh-CN', state: 'ready', ad: 'empty' },
      readyDependencies,
    );

    expect(model.article.title).toBe('在韩国租房前，先看真实成交依据');
    expect(model.article.published).toBe('设计样稿');
    expect(model.headlineMetric?.label).toBe('已申报成交');
    expect(model.seoulStatus).toBe('更新于 2026-08');
    expect(model.guides[0]).toMatchObject({
      title: '如何阅读首尔公寓实际成交价格',
      stage: '市场研究',
      href: '/kr/seoul/guide/read-seoul-apartment-sale-prices/',
    });
    expect(model.guides[0]?.summary).not.toMatch(/[A-Za-z]{4}/);
  });

  it('localizes canonical Seoul districts and fallback evidence for Chinese readers', () => {
    expect(reviewDistrictName({ slug: 'jongno-gu', nameEn: 'Jongno-gu', nameKo: '종로구' }, 'zh-CN'))
      .toBe('钟路区');
    expect(localizeReviewFallbackDisclosure(
      'district',
      'Same-building and same-neighborhood evidence were below five records; district evidence is shown.',
      'zh-CN',
    )).toBe('同一建筑和同一社区的样本不足，当前显示同一区数据。');
  });

  it('uses words instead of fabricated zeroes when evidence is unavailable', async () => {
    const unavailableDependencies: EditorialGrowthReviewDependencies = {
      ...readyDependencies,
      seoul: () => ({
        status: 'unavailable',
        message: 'Official Seoul evidence is temporarily unavailable.',
        links: [],
      }),
    };
    const model = await buildEditorialGrowthReviewModel(
      { locale: 'en', state: 'error', ad: 'empty' },
      unavailableDependencies,
    );

    expect(model.headlineMetric).toBeNull();
    expect(model.check.metrics).toEqual([]);
    expect(model.exploreRows).toEqual([]);
    expect(JSON.stringify(model)).not.toMatch(/₩0|0 contracts/);
  });

  it('keeps zero-sample, withheld, and parcel-only buildings out of the review list', () => {
    expect(isReviewableExploreBuilding({
      name: 'Raemian One Bailey',
      observationCount: 8,
      evidenceStatus: 'published',
      medianLabel: '₩3,100,000,000',
    })).toBe(true);
    expect(isReviewableExploreBuilding({
      name: '(11-2)',
      observationCount: 8,
      evidenceStatus: 'published',
      medianLabel: '₩3,100,000,000',
    })).toBe(false);
    expect(isReviewableExploreBuilding({
      name: 'Example Residence',
      observationCount: 0,
      evidenceStatus: 'published',
      medianLabel: '₩3,100,000,000',
    })).toBe(false);
    expect(isReviewableExploreBuilding({
      name: 'Example Residence',
      observationCount: 8,
      evidenceStatus: 'withheld',
      medianLabel: null,
    })).toBe(false);
  });
});
