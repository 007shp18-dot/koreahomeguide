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
    expect(`${town}${detail}`).not.toContain('/kr/seoul/check');
  });

  it('uses only approved exact-entity building updates with source date', () => {
    const facts={id:'candidate',version:2,status:'approved',entityId:'sg-singapore:block:10-bedok-road',block:'10',street:'BEDOK ROAD',yearCompleted:1999,maxFloorLevel:24,dwellingUnits:240,residential:true,town:'BD',fetchedAt:'2026-09-09T00:00:00Z',sourceUrl:'https://data.gov.sg/',contentHash:'hash',isCurrent:true};
    const render=(status:string,entityId=facts.entityId)=>renderToStaticMarkup(<HdbBlockDetail block={block} town="BEDOK" townHref="/sg/singapore/hdb/bedok/" googleMapsBrowserKey={null} approvedFacts={{...facts,status,entityId}} />);
    expect(render('approved')).toContain('1999');expect(render('approved')).toContain('2026-09-09');
    expect(render('pending')).not.toContain('1999');expect(render('approved','sg-singapore:block:wrong')).not.toContain('1999');
  });

  it('renders official nearest rail and school evidence on a block', () => {
    const detail = renderToStaticMarkup(<HdbBlockDetail
      block={block}
      town="BEDOK"
      townHref="/sg/singapore/hdb/bedok/"
      googleMapsBrowserKey={null}
      proximity={{
        status: 'ready', coordinateStatus: 'ready',
        nearestStation: { sourceId: 'lta:station:bedok', name: 'Bedok MRT', lines: ['MRT'], distanceMeters: 380 },
        nearestSchool: { sourceId: 'moe:school:bedok', name: 'BEDOK GREEN PRIMARY SCHOOL', distanceMeters: 520 },
      }}
    />);
    expect(detail).toContain('Nearby MRT/LRT and schools');
    expect(detail).toContain('Bedok MRT');
    expect(detail).toContain('BEDOK GREEN PRIMARY SCHOOL');
    expect(detail).toContain('Straight-line distance');
  });

  it('shows a verified OneMap coordinate with conspicuous official licence attribution', () => {
    const detail = renderToStaticMarkup(<HdbBlockDetail
      block={block}
      town="BEDOK"
      townHref="/sg/singapore/hdb/bedok/"
      googleMapsBrowserKey={null}
      location={{
        entityId: 'sg-singapore:block:10-bedok-road',
        marketId: 'sg-singapore',
        latitude: 1.323456,
        longitude: 103.94321,
        precision: 'rooftop',
        provider: 'OneMap',
        providerReference: '10 BEDOK ROAD',
        rightsPolicyId: 'sg-onemap-search-v1',
        verificationStatus: 'verified',
        verifiedAt: '2026-09-09T00:00:00.000Z',
        updatedAt: '2026-09-09T00:00:00.000Z',
      }}
    />);
    expect(detail).toContain('data-hdb-location="verified"');
    expect(detail).toContain('1.323456, 103.943210');
    expect(detail).toContain('data-location-attribution="onemap"');
    expect(detail).toContain('Contains information from');
    expect(detail).toContain('href="https://www.onemap.gov.sg/"');
    expect(detail).toContain('href="https://www.onemap.gov.sg/legal/opendatalicence.html"');
  });

  it('does not claim OneMap attribution for another verified location provider', () => {
    const detail = renderToStaticMarkup(<HdbBlockDetail
      block={block}
      town="BEDOK"
      townHref="/sg/singapore/hdb/bedok/"
      googleMapsBrowserKey={null}
      location={{
        entityId: 'sg-singapore:block:10-bedok-road',
        marketId: 'sg-singapore',
        latitude: 1.323456,
        longitude: 103.94321,
        precision: 'rooftop',
        provider: 'Another provider',
        providerReference: null,
        rightsPolicyId: 'other-location-policy',
        verificationStatus: 'verified',
        verifiedAt: '2026-09-09T00:00:00.000Z',
        updatedAt: '2026-09-09T00:00:00.000Z',
      }}
    />);
    expect(detail).toContain('data-hdb-location="verified"');
    expect(detail).not.toContain('data-location-attribution="onemap"');
    expect(detail).not.toContain('opendatalicence.html');
  });
});
