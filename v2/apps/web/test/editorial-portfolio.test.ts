import { describe, expect, it } from 'vitest';

import {
  EDITORIAL_PORTFOLIO,
  validateEditorialPortfolio,
  validatePortfolioRecord,
} from '../content/portfolio-manifest';

describe('launch editorial portfolio', () => {
  it('labels Seoul charts with the public building release rather than the newer raw rent release', () => {
    const charts = EDITORIAL_PORTFOLIO.flatMap(({ infographic }) => infographic ? [infographic] : [])
      .filter(({ id }) => id.startsWith('seoul-'));
    expect(charts).toHaveLength(3);
    for (const chart of charts) {
      expect(chart.period).toEqual({ start: '2026-01-01', end: '2026-07-31' });
      expect(chart.evidenceReleaseIds).toEqual(['public-kr-building-summary-2026-09-01']);
    }
  });

  it('uses both middle observations for even-sized published building cohorts in both languages', () => {
    // Independently recalculated from public-building-summary.json: 22/5/10/17/41 buildings.
    const charts = EDITORIAL_PORTFOLIO.flatMap(({ infographic }) => infographic ? [infographic] : [])
      .filter(({ id }) => id.startsWith('seoul-district-price-distribution-chart'));
    expect(charts).toHaveLength(2);
    for (const chart of charts) {
      expect(chart.series[0]?.values.map(({ value }) => value)).toEqual([5.375, 5.475, 4.8, 4.5, 2.6]);
    }
  });

  it('preserves the five-year Singapore source period and the even-sized CCR project median', () => {
    const charts = EDITORIAL_PORTFOLIO.flatMap(({ infographic }) => infographic ? [infographic] : [])
      .filter(({ id }) => id.startsWith('singapore-region-comparison-chart'));
    expect(charts).toHaveLength(2);
    for (const chart of charts) {
      expect(chart.period).toEqual({ start: '2021-08-01', end: '2026-08-31' });
      // 614 published CCR projects: average of the two middle project medians.
      expect(chart.series[0]?.values.map(({ value }) => value)).toEqual([2167, 1716, 1462]);
    }
  });

  it('publishes the exact approved 29-item language and format mix', () => {
    expect(EDITORIAL_PORTFOLIO).toHaveLength(29);
    expect(Object.isFrozen(EDITORIAL_PORTFOLIO)).toBe(true);
    expect(EDITORIAL_PORTFOLIO.filter(({ locale }) => locale === 'en')).toHaveLength(21);
    expect(EDITORIAL_PORTFOLIO.filter(({ locale }) => locale === 'zh-CN')).toHaveLength(8);
    expect(Object.fromEntries(['policy-update', 'market-brief', 'data-story', 'guide'].map((type) => [
      type,
      EDITORIAL_PORTFOLIO.filter((record) => record.type === type).length,
    ]))).toEqual({
      'policy-update': 8,
      'market-brief': 5,
      'data-story': 6,
      guide: 10,
    });
  });

  it('keeps every published claim attached to review, evidence and an internal next step', () => {
    expect(validateEditorialPortfolio(EDITORIAL_PORTFOLIO)).toBe(EDITORIAL_PORTFOLIO);
    expect(new Set(EDITORIAL_PORTFOLIO.map(({ id }) => id)).size).toBe(29);
    expect(new Set(EDITORIAL_PORTFOLIO.map(({ canonicalHref }) => canonicalHref)).size).toBe(29);
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
      expect(record.canonicalHref).toMatch(/^\/(?:news|guides|zh-cn)\//u);
    }
  });

  it('publishes six evidence-linked and accessible Data Story infographics', () => {
    const stories = EDITORIAL_PORTFOLIO.filter(({ type }) => type === 'data-story');
    expect(stories).toHaveLength(6);
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

  it('uses official primary sources for policies and reviews translations independently', () => {
    const officialHosts = new Set([
      'www.law.go.kr', 'www.molit.go.kr', 'www.fsc.go.kr', 'land.seoul.go.kr',
      'www.iras.gov.sg', 'www.hdb.gov.sg',
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
