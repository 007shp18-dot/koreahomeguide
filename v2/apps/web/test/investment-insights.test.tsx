import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { buildInsightItems, insightFilterHref, InsightsIndex } from '../components/newsroom/insights-index';
import { resolveNewsroomFilters } from '../components/newsroom/newsroom-index';
import { NewsroomArticle } from '../components/newsroom/newsroom-article';
import { listPortfolioRecords } from '../content/portfolio-manifest';

describe('investment Insights discovery', () => {
  it('preserves the chosen city and investment topic in each language', () => {
    for (const locale of ['en', 'ko', 'zh-CN'] as const) {
      const href = insightFilterHref(locale, 'tokyo', 'investment');
      expect(href).toContain('market=tokyo&topic=investment');
      expect(href.startsWith(locale === 'en' ? '/news/' : locale === 'ko' ? '/ko/news/' : '/zh-cn/news/')).toBe(true);
      const filters = resolveNewsroomFilters(Object.fromEntries(new URL(href, 'https://example.test').searchParams));
      expect(filters).toMatchObject({ market: 'tokyo', topic: 'investment', type: 'insights' });
    }
    expect(resolveNewsroomFilters({ topic: 'unreviewed' }).canonicalHref).toBe('/news/');
    expect(resolveNewsroomFilters({ type: 'news', topic: 'investment' }).topic).toBeUndefined();
  });
  it('includes financial analysis without promoting neighborhood lifestyle articles', () => {
    const all = buildInsightItems([], 'all');
    const investment = buildInsightItems([], 'all', 'en', 'investment');
    expect(investment.length).toBeGreaterThan(0);
    expect(all.length).toBeGreaterThan(investment.length);
    expect(investment.some(item => item.href.includes('dubai-rental-yield-after-costs'))).toBe(true);
    expect(investment.some(item => item.href.endsWith('/seongsu/'))).toBe(false);
    expect(buildInsightItems([], 'tokyo', 'en', 'investment').every(item => item.city === 'tokyo')).toBe(true);
  });
  it('renders one shared index structure in all three languages', () => {
    for (const locale of ['en', 'ko', 'zh-CN'] as const) {
      const html = renderToStaticMarkup(<InsightsIndex articles={[]} market="all" topic="investment" locale={locale} />);
      expect(html).toContain('data-newsroom-layout="insights"');
      expect(html).toContain(`lang="${locale}"`);
      expect(html).toContain(locale === 'en' ? '>Investment</a>' : locale === 'ko' ? '>투자</a>' : '>投资</a>');
    }
  });
  it('opens a market report scenario with the matching market and currency', () => {
    const article = listPortfolioRecords('en').find(item => item.marketId === 'sg-singapore' && item.type === 'market-brief')!;
    const html = renderToStaticMarkup(<NewsroomArticle article={article} />);
    expect(html).toContain('/tools/property-scenario?market=sg-singapore&amp;currency=SGD');
    expect(html).toContain('Model purchase costs and rental income');
  });
});
