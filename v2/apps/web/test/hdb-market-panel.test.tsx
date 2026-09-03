import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { HdbMarketPanel } from '../components/singapore/hdb-market-panel';
import { HdbTownDetail } from '../components/singapore/hdb-town-detail';
import { HdbBlockDetail } from '../components/singapore/hdb-block-detail';

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
    expect(html).toContain('d_8b84c4ee58e3cfc0ece0d773c8ca6abc');
    expect(html).not.toContain('combined median');
  });
});

describe('HDB detail composition', () => {
  const block = {
    blockId: '10-bedok-road', href: '/sg/singapore/hdb/bedok/10-bedok-road/', address: '10 BEDOK ROAD',
    resaleCountLabel: '10', resaleMedianLabel: 'SGD 500,000', rentalCountLabel: '9', rentalMedianLabel: 'SGD 3,200',
    property: { yearCompleted: 1980, maxFloorLevel: 12, totalDwellingUnits: 120, residential: true, commercial: false, multistoreyCarpark: false },
  } as const;

  it('uses the shared Detail shell for town and block routes', () => {
    const town = renderToStaticMarkup(<HdbTownDetail model={{ town: 'BEDOK', townSlug: 'bedok', blocks: [block] }} />);
    const detail = renderToStaticMarkup(<HdbBlockDetail block={block} town="BEDOK" townHref="/sg/singapore/hdb/bedok/" googleMapsBrowserKey={null} />);
    expect(town).toContain('data-market-detail-shell="true"');
    expect(detail).toContain('data-market-detail-shell="true"');
    expect(`${town}${detail}`).not.toMatch(/\/kr\/seoul\//);
  });
});
