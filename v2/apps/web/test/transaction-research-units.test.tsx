import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RecentTransactionPlot, SizeCohortResearch } from '../components/market-ui/transaction-research';

describe('monthly detail research units', () => {
  it.each([['en', '/month'], ['ko', '/월']] as const)('labels monthly chart values and existing size medians in %s', (locale, unit) => {
    const plot = renderToStaticMarkup(<RecentTransactionPlot locale={locale} periodUnit="month"
      rows={[{ filedMonth: '2026-01', areaSqm: 50, primaryWon: 300_000, primaryLabel: '₩300,000' }]} />);
    expect(plot).toContain(`300K ${unit}</text>`);
    expect(plot).toContain(`₩300,000 ${unit}</title>`);
    const table = renderToStaticMarkup(<SizeCohortResearch locale={locale} currency="KRW" periodUnit="month"
      rows={[{ group: 'monthly', size: 'Under 60 m²', count: 5, median: 300_000 }]} />);
    expect(table).toContain(`300,000 ${unit}`);
  });

  it('does not add monthly units to existing sale or deposit callers', () => {
    const html = renderToStaticMarkup(<SizeCohortResearch currency="KRW"
      rows={[{ group: 'sale', size: 'Under 60 m²', count: 5, median: 300_000_000 }]} />);
    expect(html).toContain('300,000,000');
    expect(html).not.toContain('/month');
  });
});
