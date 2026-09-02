import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { HdbMarketPanel } from '../components/singapore/hdb-market-panel';

describe('HDB market panel', () => {
  it('renders separate, labelled resale and rental charts with an accessible table', () => {
    const town = {
      town: 'BEDOK', href: '/sg/singapore/hdb/bedok/', resaleCount: 10, resaleCountLabel: '10', resaleMedianSgd: 500_000,
      resaleMedianLabel: 'SGD 500,000', rentalCount: 9, rentalCountLabel: '9',
      rentalMedianSgd: 3_200, rentalMedianLabel: 'SGD 3,200',
    } as const;
    const html = renderToStaticMarkup(<HdbMarketPanel model={{
      status: 'ready', resalePeriod: '2017-01/2026-09', rentalPeriod: '2021-01/2026-08',
      propertyThrough: '2025-12', resaleTotalLabel: '239,583', rentalTotalLabel: '209,852',
      propertyTotalLabel: '13,357', publicationMinimum: 5, towns: [town],
      featuredResale: [town], featuredRental: [town],
    }} />);
    expect(html).toContain('HDB resale median');
    expect(html).toContain('HDB monthly rent median');
    expect(html).toContain('HDB resale and rental evidence by town');
    expect(html).toContain('not independently verified by HDB');
    expect(html).not.toContain('combined median');
  });
});
