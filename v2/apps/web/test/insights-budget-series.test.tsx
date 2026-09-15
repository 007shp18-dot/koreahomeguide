import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { buildInsightItems, insightFilterHref, InsightsIndex } from '../components/newsroom/insights-index';
import { resolveNewsroomFilters } from '../components/newsroom/newsroom-index';
import { BUDGET_GUIDE_SERIES } from '../content/budget-guide-series';
import { INSIGHT_TOPICS } from '../content/insight-topics';
import { getPortfolioRecord } from '../content/portfolio-manifest';
import { NewsroomArticle } from '../components/newsroom/newsroom-article';

describe('four-city budget collection', () => {
  it('keeps city and topic together across all supported locales', () => {
    for (const locale of ['en', 'ko', 'zh-CN'] as const) {
      for (const topic of INSIGHT_TOPICS) {
        const url = new URL(insightFilterHref(locale, 'tokyo', topic), 'https://example.test');
        expect(resolveNewsroomFilters(Object.fromEntries(url.searchParams))).toMatchObject({ market: 'tokyo', type: 'insights', ...(topic === 'all' ? {} : { topic }) });
      }
      const budget = buildInsightItems([], 'all', locale, 'budget');
      expect(budget).toHaveLength(4);
      expect(new Set(budget.map(item => item.city))).toEqual(new Set(['seoul', 'singapore', 'dubai', 'tokyo']));
      expect(buildInsightItems([], 'tokyo', locale, 'budget')).toHaveLength(1);
      const html = renderToStaticMarkup(<InsightsIndex articles={[]} market="all" locale={locale} topic="budget" />);
      for (const guide of BUDGET_GUIDE_SERIES) expect(html).toContain(guide.slug);
      expect(html).toContain('data-budget-edition="2026-09"');
      expect(html).not.toContain('data-newsroom-lead');
      expect(html).not.toContain('No stories match');
    }
  });
  it('removes superseded introductions from discovery while separating living and policy', () => {
    const all = buildInsightItems([], 'all');
    expect(all.some(item => item.href.includes('/city-stories/seoul/seongsu/'))).toBe(false);
    expect(all.length).toBeGreaterThan(4);
    expect(all.every(item => item.investment)).toBe(true);
    expect(buildInsightItems([], 'all', 'en', 'neighborhood').every(item => item.topic === 'Neighborhood living')).toBe(true);
    expect(buildInsightItems([], 'all', 'en', 'neighborhood').length).toBeGreaterThan(0);
    const policies = buildInsightItems([], 'all', 'en', 'policy');
    expect(policies.length).toBeGreaterThan(0);
    expect(policies.every(item => item.topic === 'Buying rules')).toBe(true);
    expect(all.some(item => item.slug === 'seoul-euljiro-read-the-workshop-signs' && item.investment)).toBe(false);
  });
  it('labels the buying-led default without changing the explicit neighbourhood collection', () => {
    for (const [locale, buying, neighbourhood] of [
      ['en', 'Buying', 'Neighbourhoods'],
      ['ko', '구매', '동네·생활'],
      ['zh-CN', '购房', '社区生活'],
    ] as const) {
      const html = renderToStaticMarkup(<InsightsIndex articles={[]} market="all" locale={locale} />);
      expect(html).toMatch(new RegExp(`aria-current="page"[^>]*>${buying}</a>`));
      expect(html).toContain(`>${neighbourhood}</a>`);
    }
  });
  it('publishes Tokyo in three languages with quarter-level evidence and functioning article content', () => {
    for (const locale of ['en', 'ko', 'zh-CN'] as const) {
      const article = getPortfolioRecord(locale, 'tokyo-apartment-buying-budget-guide')!;
      expect(article.type).toBe('guide');
      expect(article.marketId).toBe('jp-tokyo');
      expect(article.sources.some(source => source.href.includes('city=13101&year=2026&quarter=1'))).toBe(true);
      const html = renderToStaticMarkup(<NewsroomArticle article={article} />);
      expect(html).toContain('30,000,000');
      expect(html).toContain('50,000,000');
      expect(html).toContain('100,000,000');
      expect(html).toContain('1977');
      expect(html).toContain('currency=JPY');
      expect(html).toContain('/jp/tokyo/shortlist/');
    }
  });
});
