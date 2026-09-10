import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  buildKoreaBuildingRankings,
  buildPublicAreaRankingsModel,
} from '../lib/public-market/rankings-route-model.server';
import type { KoreaEvidenceRepositories } from '../lib/public-market/korea-evidence-repositories.server';
import type { PublicAreaRankingsModel } from '../lib/public-market/area-route-types';
import { DistrictRankings } from '../components/public-market/district-rankings';
import {
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaFixture,
} from './public-area-fixture';

function rankedArtifact() {
  return createPublicAreaFixture({
    publishedMedians: {
      'jongno-gu': 200_000_000,
      'jung-gu': 100_000_000,
      'yongsan-gu': 100_000_000,
      'seongdong-gu': 300_000_000,
    },
    publishedOverrides: {
      'jongno-gu': {
        n: 7,
        min: 160_000_000,
        p25: 180_000_000,
        med: 200_000_000,
        p75: 220_000_000,
        max: 240_000_000,
        chg3m: -5,
      },
      'jung-gu': {
        n: 9,
        min: 60_000_000,
        p25: 80_000_000,
        med: 100_000_000,
        p75: 150_000_000,
        max: 170_000_000,
        chg3m: 2,
      },
      'yongsan-gu': {
        n: 9,
        min: 70_000_000,
        p25: 90_000_000,
        med: 100_000_000,
        p75: 110_000_000,
        max: 130_000_000,
        chg3m: null,
      },
      'seongdong-gu': {
        n: 5,
        min: 100_000_000,
        p25: 200_000_000,
        med: 300_000_000,
        p75: 400_000_000,
        max: 500_000_000,
        chg3m: 0,
      },
    },
  });
}

const REFERENCE_INSTANT = '2026-09-01T00:00:00.000Z';

function publishedBuildingPrice(median: number) {
  return Object.freeze({
    n: 5, published: true as const, min: median - 2, p25: median - 1,
    med: median, p75: median + 1, max: median + 2, chg3m: null,
  });
}

function saleBuilding(buildingId: string, median: number, published = true) {
  return Object.freeze({
    buildingId,
    districtSlug: 'gangnam-gu' as const,
    neighborhoodId: 'gangnam-gu-daechi',
    neighborhoodName: '대치동',
    officialName: `Building ${buildingId}`,
    housingType: 'apartment' as const,
    cohorts: Object.freeze([{ areaBand: 'all' as const, price: published
      ? publishedBuildingPrice(median)
      : Object.freeze({ n: 4, published: false as const }) }]),
    recentSales: Object.freeze([]),
  });
}

function saleRepositories(buildings: readonly ReturnType<typeof saleBuilding>[]): KoreaEvidenceRepositories {
  return Object.freeze({
    rent: null,
    sale: Object.freeze({
      listBuildingRecords: () => buildings,
    }) as unknown as NonNullable<KoreaEvidenceRepositories['sale']>,
  });
}

function rentRepositories(): KoreaEvidenceRepositories {
  const record = Object.freeze({
    buildingId: 'rent-building',
    districtSlug: 'mapo-gu' as const,
    neighborhoodId: 'mapo-gu-hapjeong',
    neighborhoodName: '합정동',
    officialName: 'Rent Building',
    housingType: 'apartment' as const,
    cohorts: Object.freeze([
      Object.freeze({
        transaction: 'jeonse' as const, areaBand: '40-60' as const,
        contractGroup: 'all' as const, primaryMetric: 'deposit' as const,
        primary: publishedBuildingPrice(400_000_000), filedDeposit: null,
      }),
      Object.freeze({
        transaction: 'monthly' as const, areaBand: '60-85' as const,
        contractGroup: 'new' as const, primaryMetric: 'monthly-rent' as const,
        primary: publishedBuildingPrice(1_500_000),
        filedDeposit: publishedBuildingPrice(50_000_000),
      }),
    ]),
    recentTransactions: Object.freeze([]),
  });
  return Object.freeze({
    sale: null,
    rent: Object.freeze({
      listBuildingRecords: () => Object.freeze([record]),
    }) as unknown as NonNullable<KoreaEvidenceRepositories['rent']>,
  });
}

function build(source: unknown = rankedArtifact(), period = PUBLIC_AREA_FIXTURE_PERIOD, page = 1) {
  return buildPublicAreaRankingsModel({ source, period, referenceInstant: REFERENCE_INSTANT, page });
}

describe('Seoul public district rankings model', () => {
  it('ranks publishable buildings by median before slicing stable-ID ties across pages', () => {
    const leading = Array.from({ length: 19 }, (_, index) => (
      saleBuilding(`leader-${String(index).padStart(2, '0')}`, 1_000_000_000 - index)
    ));
    const repositories = saleRepositories([
      ...leading,
      saleBuilding('tie-z', 500_000_000),
      saleBuilding('tie-a', 500_000_000),
      saleBuilding('withheld', 900_000_000, false),
      saleBuilding('last', 100_000_000),
    ]);
    const selection = {
      transaction: 'sale' as const,
      areaBand: 'all' as const,
      housingType: 'apartment' as const,
      contractGroup: 'not-applicable' as const,
    };

    const first = buildKoreaBuildingRankings(repositories, selection, 1, 20);
    const second = buildKoreaBuildingRankings(repositories, selection, 2, 20);

    expect(first.status).toBe('ready');
    expect(second.status).toBe('ready');
    if (first.status !== 'ready' || second.status !== 'ready') return;
    expect(first.rows.at(-1)).toMatchObject({ buildingId: 'tie-a', rank: 20 });
    expect(second.rows[0]).toMatchObject({
      buildingId: 'tie-z', rank: 21, medianWon: 500_000_000, sampleCount: 5,
      href: '/kr/seoul/explore/gangnam-gu/tie-z/?transaction=sale&area=all&propertyType=apartment',
    });
    expect(second.pagination).toMatchObject({ page: 2, total: 22, pageCount: 2 });
    expect(first.withheldBuildingCount).toBe(1);
    expect(new Set([...first.rows, ...second.rows].map(({ buildingId }) => buildingId)).size).toBe(22);
  });

  it('keeps building and district pagination state independent in their links', () => {
    const districtPage = build(createPublicAreaFixture(), PUBLIC_AREA_FIXTURE_PERIOD, 2);
    if (districtPage.status !== 'ready') throw new Error('Expected ready district rankings');
    const repositories = saleRepositories(Array.from(
      { length: 45 },
      (_, index) => saleBuilding(`building-${String(index).padStart(2, '0')}`, 1_000_000_000 - index),
    ));
    const selection = {
      transaction: 'sale' as const,
      areaBand: 'all' as const,
      housingType: 'apartment' as const,
      contractGroup: 'not-applicable' as const,
    };
    const model = Object.freeze({
      ...districtPage,
      evidenceSelection: selection,
      transactionAvailability: Object.freeze({ sale: true, jeonse: false, monthly: false }),
      buildingRankings: buildKoreaBuildingRankings(repositories, selection, 2, 20),
    }) satisfies PublicAreaRankingsModel;

    const html = renderToStaticMarkup(createElement(DistrictRankings, { model }));

    expect(model.pagination.page).toBe(2);
    expect(model.buildingRankings.status).toBe('ready');
    if (model.buildingRankings.status !== 'ready') return;
    expect(model.buildingRankings.pagination.page).toBe(2);
    expect(model.buildingRankings.rows.map(({ rank }) => rank)).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 21),
    );
    expect(html).toContain('href="/kr/seoul/rankings?transaction=sale&amp;area=all&amp;propertyType=apartment&amp;page=2"');
    expect(html).toContain('href="/kr/seoul/rankings?transaction=sale&amp;area=all&amp;propertyType=apartment&amp;buildingPage=3&amp;page=2"');
    expect(html).toContain('href="/kr/seoul/rankings?transaction=sale&amp;area=all&amp;propertyType=apartment&amp;buildingPage=2"');
  });

  it.each([
    [{ transaction: 'jeonse', areaBand: '40-60', housingType: 'apartment', contractGroup: 'all' }, '₩400,000,000', 'transaction=jeonse&area=40-60&propertyType=apartment&contractType=all'],
    [{ transaction: 'monthly', areaBand: '60-85', housingType: 'apartment', contractGroup: 'new' }, '₩1,500,000', 'transaction=monthly&area=60-85&propertyType=apartment&contractType=new'],
  ] as const)('keeps the exact rental context on building detail links', (selection, label, query) => {
    const model = buildKoreaBuildingRankings(rentRepositories(), selection, 1, 20);

    expect(model.status).toBe('ready');
    if (model.status !== 'ready') return;
    expect(model.rows[0]).toMatchObject({
      buildingId: 'rent-building',
      medianLabel: label,
      href: `/kr/seoul/explore/mapo-gu/rent-building/?${query}`,
    });
  });

  it('ranks the median high to low with legal-code tie breaks', () => {
    const model = build();
    expect(model.status).toBe('ready');
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    expect(model.median.map(({ slug }) => slug)).toEqual([
      'seongdong-gu',
      'jongno-gu',
      'jung-gu',
      'yongsan-gu',
    ]);
    expect(model.change).toEqual([]);
    expect(model.spread.map(({ slug, metric }) => [slug, metric])).toEqual([
      ['seongdong-gu', 200_000_000],
      ['jung-gu', 70_000_000],
      ['jongno-gu', 40_000_000],
      ['yongsan-gu', 20_000_000],
    ]);
    expect(model.sample.map(({ slug }) => slug)).toEqual([
      'jung-gu',
      'yongsan-gu',
      'jongno-gu',
      'seongdong-gu',
    ]);
    expect(model.median.map(({ rank }) => rank)).toEqual([1, 2, 3, 4]);
  });

  it('omits withheld rows everywhere and excludes every uncounted stored change', () => {
    const model = build();
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    expect(model.withheldDistrictCount).toBe(21);
    expect(model.changeExcludedDistrictCount).toBe(25);
    expect(model.median).toHaveLength(4);
    expect(model.change).toHaveLength(0);
    expect(model.spread).toHaveLength(4);
    expect(model.sample).toHaveLength(4);
  });

  it('uses legal-code order when every primary metric ties', () => {
    const artifact = createPublicAreaFixture({
      publishedMedians: { 'jongno-gu': 100_000_000, 'jung-gu': 100_000_000 },
      publishedOverrides: {
        'jongno-gu': { n: 7, chg3m: 1 },
        'jung-gu': { n: 7, chg3m: 1 },
      },
    });
    const model = build(artifact);
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    for (const rows of [model.median, model.spread, model.sample]) {
      expect(rows.map(({ slug }) => slug)).toEqual(['jongno-gu', 'jung-gu']);
    }
    expect(model.change).toEqual([]);
  });

  it('formats retained ranking values and explains why change is not assessable', () => {
    const model = build();
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    expect(model.median[0]).toMatchObject({
      valueLabel: '₩300,000,000',
      metric: 300_000_000,
      bar: null,
    });
    expect(model.changeAxisLabel).toEqual({ minimum: '0.0%', maximum: '0.0%' });
    expect(model.changeInterpretation).toEqual({
      status: 'not_assessable',
      title: 'Three-month change not assessable',
      definition: 'Prior/latest sample counts were not retained in this snapshot.',
      note: 'Stored change values are excluded from rankings until both comparison counts are retained.',
    });
    expect(model.spread.at(0)?.valueLabel).toBe('₩200,000,000');
    expect(model.spread.at(0)?.distribution).toMatchObject({
      published: true,
      min: 100_000_000,
      p25: 200_000_000,
      med: 300_000_000,
      p75: 400_000_000,
      max: 500_000_000,
    });
    expect(model.spread.at(0)?.plotAxis).toEqual({ min: 60_000_000, max: 500_000_000 });
    expect(model.median.every(({ distribution }) => distribution === null)).toBe(true);
    expect(model.sample.every(({ distribution }) => distribution === null)).toBe(true);
    expect(model.sample.at(0)?.valueLabel).toBe('9');
    expect(model.hasNegativeChange).toBe(false);
  });

  it.each([
    { name: 'positive-only', values: [1, 4] },
    { name: 'negative-only', values: [-4, -1] },
    { name: 'all-zero', values: [0, 0] },
  ])('excludes $name change inputs when prior/latest counts were not retained', ({ values }) => {
    const artifact = createPublicAreaFixture({
      publishedMedians: { 'jongno-gu': 100_000_000, 'jung-gu': 110_000_000 },
      publishedOverrides: {
        'jongno-gu': { chg3m: values[0] },
        'jung-gu': { chg3m: values[1] },
      },
    });
    const model = build(artifact);
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    expect(model.change).toEqual([]);
    expect(model.hasNegativeChange).toBe(false);
    expect(model.changeExcludedDistrictCount).toBe(25);
  });

  it('renders classified periods while leaving unsupported change metrics out of the public selector', () => {
    const model = build();
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    const html = renderToStaticMarkup(createElement(DistrictRankings, { model }));

    expect(html).not.toContain('Three-month change not assessable');
    expect(html).not.toContain('Prior/latest sample counts were not retained in this snapshot.');
    expect(html).not.toContain('Stored change values are excluded from rankings');
    expect(html).not.toMatch(/[+-](?:2\.0|5\.0)%/);
    expect(html).not.toContain('two completed windows');
    expect(html).not.toContain('Four comparisons');
    expect(html.match(/data-month-state="complete"/g)).toHaveLength(6);
    expect(html.match(/data-month-state="filing_in_progress"/g)).toHaveLength(1);
    expect(html).toContain('Complete');
    expect(html).toContain('Filing in progress');
    expect(html.match(/data-plot-variant="compact"/g)).toHaveLength(4);
    expect(html.match(/data-ranking-distribution=/g)).toHaveLength(4);
    expect(html).toContain('aria-describedby=');
  });

  it('returns explicit empty lists for a valid artifact with no published district', () => {
    const model = build(createPublicAreaFixture({ publishedMedians: {} }));
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    expect(model.median).toEqual([]);
    expect(model.change).toEqual([]);
    expect(model.spread).toEqual([]);
    expect(model.sample).toEqual([]);
    expect(model.withheldDistrictCount).toBe(25);
    expect(model.changeExcludedDistrictCount).toBe(25);
  });

  it('does not mutate source data and recursively freezes ready output', () => {
    const artifact = rankedArtifact();
    const before = structuredClone(artifact);
    const model = build(artifact);
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    expect(artifact).toEqual(before);
    expect(Object.isFrozen(model)).toBe(true);
    expect(Object.isFrozen(model.median)).toBe(true);
    expect(Object.isFrozen(model.median[0])).toBe(true);
    expect(Object.isFrozen(model.changeInterpretation)).toBe(true);
    expect(Object.isFrozen(model.period)).toBe(true);
    expect(Object.isFrozen(model.period.months)).toBe(true);
    expect(Object.isFrozen(model.changeAxisLabel)).toBe(true);
  });

  it.each([
    ['invalid artifact', { nope: true }, PUBLIC_AREA_FIXTURE_PERIOD],
    ['period mismatch', rankedArtifact(), '2025-01/2025-07'],
  ])('fails closed for %s', (_name, source, period) => {
    const model = build(source, period);

    expect(model).toMatchObject({
      status: 'unavailable',
      message: 'Verified district summary unavailable',
    });
    expect(model).not.toHaveProperty('median');
    expect(JSON.stringify(model)).not.toMatch(/100000000|200000000|300000000/);
  });

  it('assigns stable global ranks before slicing adjacent pages', () => {
    const pageOne = build(createPublicAreaFixture(), PUBLIC_AREA_FIXTURE_PERIOD, 1);
    const pageTwo = build(createPublicAreaFixture(), PUBLIC_AREA_FIXTURE_PERIOD, 2);
    if (pageOne.status !== 'ready' || pageTwo.status !== 'ready') throw new Error('Expected ready rankings');

    expect(pageOne.median).toHaveLength(20);
    expect(pageOne.median.map(({ rank }) => rank)).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
    expect(pageTwo.median.map(({ rank }) => rank)).toEqual([21, 22, 23, 24, 25]);
    expect(pageOne.median.at(-1)?.metric).toBeGreaterThanOrEqual(pageTwo.median[0]!.metric);
    expect(new Set([...pageOne.median, ...pageTwo.median].map(({ lawdCd }) => lawdCd)).size).toBe(25);
    expect(pageTwo.pagination).toMatchObject({ page: 2, pageSize: 20, total: 25, pageCount: 2 });
  });
});


describe('building ranking measures', () => {
  it('ranks retained sales independently from medians and shows actual area and month', () => {
    const rows = [
      { ...saleBuilding('lower-median', 100), recentSales: [{ filedMonth: '2026-07', areaSqm: 50, priceWon: 900 }] },
      { ...saleBuilding('higher-median', 200), recentSales: [{ filedMonth: '2026-08', areaSqm: 100, priceWon: 1000 }] },
      { ...saleBuilding('withheld', 100, false), recentSales: [{ filedMonth: '2026-08', areaSqm: 10, priceWon: 99999 }] },
    ];
    const repositories = saleRepositories(rows as unknown as Parameters<typeof saleRepositories>[0]);
    const selection = { transaction: 'sale', areaBand: 'all', housingType: 'apartment', contractGroup: 'not-applicable' } as const;
    const high = buildKoreaBuildingRankings(repositories, selection, 1, 20, 'recent-high');
    expect(high.rows.map(row => row.buildingId)).toEqual(['higher-median', 'lower-median']);
    expect(high.rows[0]).toMatchObject({ rankingValue: 1000, observedMonth: '2026-08', observedAreaSqm: 100 });
    const psm = buildKoreaBuildingRankings(repositories, selection, 1, 20, 'recent-psm');
    expect(psm.rows.map(row => row.buildingId)).toEqual(['lower-median', 'higher-median']);
    expect(psm.rows[0]?.rankingValue).toBe(18);
  });
  it('sorts full cohort filing counts before pagination', () => {
    const first = saleBuilding('expensive', 500);
    const second = { ...saleBuilding('busy', 100), cohorts: [{ areaBand: 'all' as const, price: { ...publishedBuildingPrice(100), n: 20 } }] };
    const model = buildKoreaBuildingRankings(saleRepositories([first, second] as unknown as Parameters<typeof saleRepositories>[0]), { transaction: 'sale', areaBand: 'all', housingType: 'apartment', contractGroup: 'not-applicable' }, 1, 1, 'volume');
    expect(model.rows[0]).toMatchObject({ buildingId: 'busy', rankingValue: 20 });
  });
});
