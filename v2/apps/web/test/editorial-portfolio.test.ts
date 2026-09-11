import { describe, expect, it } from 'vitest';
import { RESEARCH_FIGURES } from '../content/en/research-figures';
import { KOREAN_RESEARCH_FIGURES } from '../content/ko/research-figures';
import type { InfographicSpec } from '../lib/infographics/infographic-types';

import {
  EDITORIAL_PORTFOLIO,
  validateEditorialPortfolio,
  validatePortfolioRecord,
} from '../content/portfolio-manifest';

describe('launch editorial portfolio', () => {
  it('labels Seoul charts with the public building release rather than the newer raw rent release', () => {
    const charts = EDITORIAL_PORTFOLIO.flatMap(({ infographic }) => infographic ? [infographic] : [])
      .filter(({ id }) => id.replace(/^ko-/, '').startsWith('seoul-'));
    expect(charts).toHaveLength(5);
    for (const chart of charts) {
      expect(chart.period).toEqual({ start: '2026-01-01', end: '2026-07-31' });
      expect(chart.evidenceReleaseIds).toEqual(['public-kr-building-summary-2026-09-01']);
    }
  });

  it('uses both middle observations for even-sized published building cohorts in all three languages', () => {
    // Independently recalculated from public-building-summary.json: 22/5/10/17/41 buildings.
    const charts = EDITORIAL_PORTFOLIO.flatMap(({ infographic }) => infographic ? [infographic] : [])
      .filter(({ id }) => id.replace(/^ko-/, '').startsWith('seoul-district-price-distribution-chart'));
    expect(charts).toHaveLength(3);
    for (const chart of charts) {
      expect(chart.series[0]?.values.map(({ value }) => value)).toEqual([5.375, 5.475, 4.8, 4.5, 2.6]);
    }
  });

  it('preserves the five-year Singapore source period and the even-sized CCR project median', () => {
    const charts = EDITORIAL_PORTFOLIO.flatMap(({ infographic }) => infographic ? [infographic] : [])
      .filter(({ id }) => id.replace(/^ko-/, '').startsWith('singapore-region-comparison-chart'));
    expect(charts).toHaveLength(3);
    for (const chart of charts) {
      expect(chart.period).toEqual({ start: '2021-08-01', end: '2026-08-31' });
      // 614 published CCR projects: average of the two middle project medians.
      expect(chart.series[0]?.values.map(({ value }) => value)).toEqual([2167, 1716, 1462]);
    }
  });

  it('publishes the 91-item portfolio including four Chinese investment and monthly translations', () => {
    expect(EDITORIAL_PORTFOLIO).toHaveLength(91);
    expect(Object.isFrozen(EDITORIAL_PORTFOLIO)).toBe(true);
    expect(EDITORIAL_PORTFOLIO.filter(({ locale }) => locale === 'en')).toHaveLength(39);
    expect(EDITORIAL_PORTFOLIO.filter(({ locale }) => locale === 'ko')).toHaveLength(39);
    expect(EDITORIAL_PORTFOLIO.filter(({ locale }) => locale === 'zh-CN')).toHaveLength(13);
    expect(Object.fromEntries(['news-brief', 'policy-update', 'market-brief', 'data-story', 'guide'].map((type) => [
      type,
      EDITORIAL_PORTFOLIO.filter((record) => record.type === type).length,
    ]))).toEqual({
      'news-brief': 6,
      'policy-update': 14,
      'market-brief': 34,
      'data-story': 16,
      guide: 21,
    });
  });

  it('keeps every published claim attached to review, evidence and an internal next step', () => {
    expect(validateEditorialPortfolio(EDITORIAL_PORTFOLIO)).toBe(EDITORIAL_PORTFOLIO);
    expect(new Set(EDITORIAL_PORTFOLIO.map(({ id }) => id)).size).toBe(91);
    expect(new Set(EDITORIAL_PORTFOLIO.map(({ canonicalHref }) => canonicalHref)).size).toBe(91);
    for (const record of EDITORIAL_PORTFOLIO) {
      expect(record.status).toBe('published');
      expect(record.readerQuestion.length).toBeGreaterThan(record.locale === 'zh-CN' ? 8 : 20);
      expect(record.reviewedBy).toBeTruthy();
      expect(record.reviewedAt).toMatch(/^2026-\d{2}-\d{2}T/);
      expect(record.revisionNote.length).toBeGreaterThan(10);
      expect(record.sources.length).toBeGreaterThan(0);
      expect(record.sources.every(({ href }) => href.startsWith('https://'))).toBe(true);
      expect(record.evidenceReleaseIds.length).toBeGreaterThan(0);
      expect(record.relatedHref === null || /^\/(?!\/)/u.test(record.relatedHref)).toBe(true);
      expect(record.canonicalHref).toMatch(/^\/(?:news|guides|zh-cn|ko)\//u);
    }
  });

  it('publishes sixteen evidence-linked and accessible Data Story infographics', () => {
    const stories = EDITORIAL_PORTFOLIO.filter(({ type }) => type === 'data-story');
    expect(stories).toHaveLength(16);
    for (const story of stories) {
      expect(story.infographic).not.toBeNull();
      expect(story.infographic?.locale).toBe(story.locale);
      expect(story.infographic?.evidenceReleaseIds).toEqual(story.evidenceReleaseIds);
      expect(story.infographic?.accessibleSummary.length).toBeGreaterThan(20);
      expect(story.infographic?.series.length).toBeGreaterThan(0);
    }
    expect(EDITORIAL_PORTFOLIO.filter(({ type }) => type !== 'data-story')
      .every(({ infographic }) => infographic === null)).toBe(true);
  });

  it('preserves sources, evidence, and chart facts in every Korean counterpart', () => {
    const english = EDITORIAL_PORTFOLIO.filter(({ locale }) => locale === 'en');
    const korean = EDITORIAL_PORTFOLIO.filter(({ locale }) => locale === 'ko');
    const chartFacts = (chart: InfographicSpec) => ({
      template: chart.template,
      unit: chart.unit,
      period: chart.period,
      evidenceReleaseIds: chart.evidenceReleaseIds,
      conversionProvenance: chart.conversionProvenance,
      series: chart.series.map(series => ({
        id: series.id,
        currency: series.currency,
        values: series.values.map(({ value, evidenceReleaseId }) => ({ value, evidenceReleaseId })),
      })),
    });
    for (const original of english) {
      const translated = korean.find(({ slug }) => slug === original.slug);
      expect(translated, original.slug).toBeDefined();
      if (!translated) throw new Error(`Missing Korean article: ${original.slug}`);
      expect(translated.translationGroupId).toBe(original.translationGroupId);
      expect(translated.canonicalHref).toBe(`/ko/${original.type === 'guide' ? 'guides' : 'news'}/${original.slug}/`);
      expect(translated.type).toBe(original.type);
      expect(translated.marketId).toBe(original.marketId);
      expect(translated.evidenceReleaseIds).toEqual(original.evidenceReleaseIds);
      expect(translated.sources.map(({ id, kind, href, checkedAt, publishedAt }) => ({ id, kind, href, checkedAt, publishedAt })))
        .toEqual(original.sources.map(({ id, kind, href, checkedAt, publishedAt }) => ({ id, kind, href, checkedAt, publishedAt })));
      expect(translated.title).toMatch(/[가-힣]/);
      expect(translated.bodyMarkdown).toMatch(/[가-힣]/);
      if (original.infographic) {
        expect(translated.infographic).not.toBeNull();
        if (!translated.infographic) throw new Error(`Missing Korean chart: ${original.slug}`);
        expect(chartFacts(translated.infographic)).toEqual(chartFacts(original.infographic));
        expect(translated.infographic.locale).toBe('ko');
        expect(translated.infographic.title).toMatch(/[가-힣]/);
        expect(translated.infographic.accessibleSummary).toMatch(/[가-힣]/);
      }
    }
    expect(Object.keys(KOREAN_RESEARCH_FIGURES).sort()).toEqual(Object.keys(RESEARCH_FIGURES).sort());
    for (const [slug, original] of Object.entries(RESEARCH_FIGURES)) {
      const translated = KOREAN_RESEARCH_FIGURES[slug];
      if (!translated) throw new Error(`Missing Korean research figure: ${slug}`);
      expect(chartFacts(translated)).toEqual(chartFacts(original));
      expect(translated.locale).toBe('ko');
      expect(translated.title).toMatch(/[가-힣]/);
      expect(translated.accessibleSummary).toMatch(/[가-힣]/);
    }
  });

  it('uses official primary sources for policies and reviews translations independently', () => {
    const officialHosts = new Set([
      'www.law.go.kr', 'www.molit.go.kr', 'www.fsc.go.kr', 'land.seoul.go.kr',
      'www.iras.gov.sg', 'www.hdb.gov.sg',
      'www.easylaw.go.kr', 'easylaw.go.kr', 'www.gov.kr', 'www.hf.go.kr',
    ]);
    for (const policy of EDITORIAL_PORTFOLIO.filter(({ type }) => type === 'policy-update')) {
      expect(policy.sources.some(({ kind, href }) => kind === 'primary'
        && officialHosts.has(new URL(href).hostname))).toBe(true);
    }
    const translated = EDITORIAL_PORTFOLIO.filter(({ translationGroupId }) => translationGroupId !== null);
    for (const groupId of new Set(translated.map(({ translationGroupId }) => translationGroupId))) {
      const group = translated.filter(({ translationGroupId }) => translationGroupId === groupId);
      expect(new Set(group.map(({ locale }) => locale)).size).toBe(group.length);
      expect(new Set(group.map(({ id }) => id)).size).toBe(group.length);
      expect(group.every(({ reviewedAt, reviewedBy }) => reviewedAt !== null && reviewedBy !== null)).toBe(true);
    }
  });

  it.each([
    ['source', { sources: [] }],
    ['reviewer', { reviewedBy: null }],
    ['review date', { reviewedAt: null }],
    ['evidence release', { evidenceReleaseIds: [] }],
  ])('blocks publication with a missing %s', (_label, override) => {
    expect(() => validatePortfolioRecord({ ...EDITORIAL_PORTFOLIO[0], ...override }))
      .toThrow(/publish/i);
  });

  it('blocks duplicate reader questions with the same conclusion and sources', () => {
    expect(() => validateEditorialPortfolio([
      ...EDITORIAL_PORTFOLIO,
      { ...EDITORIAL_PORTFOLIO[0], id: 'duplicate-record', slug: 'duplicate-record', canonicalHref: '/news/policy/duplicate-record/' },
    ])).toThrow(/duplicate reader question/i);
  });
});
