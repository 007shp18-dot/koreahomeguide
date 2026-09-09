import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SingaporeTransactionsTable, type ProjectTransactionRow } from '../components/singapore/singapore-transactions-table';

function transaction(index: number): ProjectTransactionRow {
  return { contractMonthLabel: 'Aug 2026', priceLabel: `SGD ${index}`, areaLabel: '85 m²',
    psfLabel: 'SGD 1,000 PSF', psmLabel: 'SGD 10,764 PSM', saleTypeLabel: 'Resale',
    propertyTypeLabel: 'Condominium', areaBasisLabel: 'Strata area', tenureLabel: 'Freehold', floorRangeLabel: '01-05' };
}

describe('Singapore detail transaction history', () => {
  it('shows a readable first page while retaining the full count and navigation', () => {
    const html = renderToStaticMarkup(<SingaporeTransactionsTable rows={Array.from({ length: 1167 }, (_, i) => transaction(i))} />);
    expect(html.match(/<tbody>[\s\S]*?<\/tbody>/)?.[0].match(/<tr>/g)).toHaveLength(20);
    expect(html).toContain('1–20 of 1,167 transactions');
    expect(html).toContain('Previous');
    expect(html).toContain('Next');
    expect(html).not.toContain('<td>SGD 1166</td>');
  });
  it('does not offer nonexistent pages for a short sample', () => {
    const html = renderToStaticMarkup(<SingaporeTransactionsTable locale="ko" rows={[transaction(1)]} />);
    expect(html).toContain('총 1건 중 1–1건');
    expect(html).not.toContain('<button');
  });
});
