import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { GlobalProductHub } from '../components/global-product-hub';
import { NewsroomIndex, resolveNewsroomFilters } from '../components/newsroom/newsroom-index';
import { getPortfolioRecord } from '../content/portfolio-manifest';

describe('guide and editorial discovery', () => {
  it('offers practical guide titles without a repeated action menu for every article', () => {
    const html = renderToStaticMarkup(<GlobalProductHub kind="guides" guideMarket="seoul" />);
    expect(html).toMatch(/<h[23][^>]*><a[^>]*href="\/guides\/buy-property-in-korea-as-foreigner"/);
    expect(html).not.toContain('>Read guide</a>');
    expect(html).not.toContain('>Explore prices</a>');
    expect(html).not.toContain('seoul-apartment-buying-budget-guide');
    expect(html).not.toContain('compare-seoul-district-prices');
  });

  it.each(['en', 'ko'] as const)('keeps practical reference out of %s Insights while including budget analysis', locale => {
    const practical = getPortfolioRecord(locale, 'buy-property-in-korea-as-foreigner')!;
    const budget = getPortfolioRecord(locale, 'seoul-apartment-buying-budget-guide')!;
    const html = renderToStaticMarkup(<NewsroomIndex locale={locale} articles={[practical, budget]} policies={[]} filters={resolveNewsroomFilters({ type: 'data-stories', market: 'seoul' })} headlines={<></>} />);
    expect(html).toContain(budget.title.replaceAll('&', '&amp;'));
    expect(html).not.toContain(practical.title.replaceAll('&', '&amp;'));
  });
});
