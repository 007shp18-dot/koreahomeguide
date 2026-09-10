import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const capturedMap = vi.hoisted(() => ({buildings: [] as readonly {title:string; sourceName?:string; addressQuery:string}[]}));

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock('next/dynamic', () => ({
  default: () => ({ buildings = [], areaGroups = [], neighborhoods }: {
    buildings?: readonly {title:string; sourceName?:string; addressQuery:string}[]; areaGroups?: readonly { count: number }[];
    neighborhoods?: readonly { buildingCount: number }[];
  }) => {
    capturedMap.buildings = buildings;
    return <div data-test-map-total={neighborhoods?.reduce((sum, item) => sum + item.buildingCount, 0)
      ?? buildings.length + areaGroups.reduce((sum, group) => sum + group.count, 0)}
    data-test-map-tier={neighborhoods === undefined ? 'buildings' : 'neighborhoods'} />;
  },
}));
vi.mock('../components/maps/naver-district-map', async (original) => {
  const mapModule = await original<typeof import('../components/maps/naver-district-map')>();
  return { ...mapModule, NaverDistrictMap: ({ buildings = [], areaGroups = [], neighborhoods }: {
    buildings?: readonly {title:string; sourceName?:string; addressQuery:string}[]; areaGroups?: readonly { count: number }[];
    neighborhoods?: readonly { buildingCount: number }[];
  }) => { capturedMap.buildings = buildings; return <div data-test-map-total={neighborhoods?.reduce((sum, item) => sum + item.buildingCount, 0)
      ?? buildings.length + areaGroups.reduce((sum, group) => sum + group.count, 0)}
    data-test-map-tier={neighborhoods === undefined ? 'buildings' : 'neighborhoods'} />; } };
});

import { AreaExplorer } from '../components/public-market/area-explorer';
import { koreaEvidenceRepositoriesFromEnvironment } from '../lib/public-market/korea-evidence-repositories.server';
import { buildKoreaExplorerEvidenceProjection } from '../lib/public-market/korea-explorer-evidence.server';
import { buildKoreaEvidenceAreaExploreModel } from '../lib/public-market/korea-explorer-area-route.server';

describe('Seoul projection-to-map pagination', () => {
  it.each([1, 2])('represents the entire result count while loading detail page %i', (buildingPage) => {
    const repositories = koreaEvidenceRepositoriesFromEnvironment({ useCheckedInSnapshot: true });
    const projection = buildKoreaExplorerEvidenceProjection(repositories, {
      transaction: 'jeonse', areaBand: 'all', housingType: 'all', contractGroup: 'all',
    }, { includeBuildings: true, districtSlug: 'gangnam-gu', buildingPage });
    if (projection.status !== 'ready' || projection.buildingPage === null) throw new Error('Missing installed fixture');
    const model = buildKoreaEvidenceAreaExploreModel('gangnam-gu', projection);
    const html = renderToStaticMarkup(<AreaExplorer model={model}
      initialSelection={{ market: 'kr', transaction: 'jeonse', district: 'gangnam-gu', view: 'split' }} />);
    expect(projection.buildingPage.buildings).toHaveLength(50);
    expect(projection.buildingPage.total).toBeGreaterThan(50);
    expect(html).toContain(`data-test-map-total="${projection.buildingPage.total}"`);
    expect(html).toContain('data-test-map-tier="neighborhoods"');
    expect(html).toContain('data-building-row=');

    const neighborhood = projection.buildingPage.neighborhoods?.find(({ count }) => count > 50);
    if (neighborhood === undefined) throw new Error('Missing large neighborhood fixture');
    const scoped = buildKoreaExplorerEvidenceProjection(repositories, {
      transaction: 'jeonse', areaBand: 'all', housingType: 'all', contractGroup: 'all',
    }, { includeBuildings: true, districtSlug: 'gangnam-gu', neighborhoodId: neighborhood.id });
    if (scoped.status !== 'ready' || scoped.buildingPage === null) throw new Error('Missing scoped fixture');
    const scopedHtml = renderToStaticMarkup(<AreaExplorer
      model={buildKoreaEvidenceAreaExploreModel('gangnam-gu', scoped)}
      initialSelection={{ market: 'kr', transaction: 'jeonse', district: 'gangnam-gu', neighborhood: neighborhood.id, view: 'split' }} />);
    expect(scoped.buildingPage.buildings).toHaveLength(50);
    expect(scoped.buildingPage.pageSize).toBe(50);
    expect(scoped.buildingPage.mapBuildings).toHaveLength(scoped.buildingPage.total);
    expect(scopedHtml).toContain(`data-test-map-total="${scoped.buildingPage.total}"`);
    expect(scopedHtml).toContain('data-test-map-tier="buildings"');
  }, 15_000);
  it('returns identical source buildings for English and Korean neighborhood searches', () => {
    const repositories = koreaEvidenceRepositoriesFromEnvironment({ useCheckedInSnapshot: true });
    const selection = {transaction:'jeonse', areaBand:'all', housingType:'all', contractGroup:'all'} as const;
    const project = (query: string) => buildKoreaExplorerEvidenceProjection(repositories, selection, {
      includeBuildings:true, districtSlug:'gangnam-gu', buildingQuery:query,
    });
    const korean = project('역삼동');
    const english = project('Yeoksam-dong');
    if (korean.status !== 'ready' || english.status !== 'ready') throw new Error('Missing installed fixture');
    expect(korean.buildingPage?.total).toBeGreaterThan(0);
    expect(english.buildingPage?.total).toBe(korean.buildingPage?.total);
    expect(english.buildingPage?.buildings.map(b => b.buildingId)).toEqual(korean.buildingPage?.buildings.map(b => b.buildingId));
    const html = renderToStaticMarkup(<AreaExplorer model={buildKoreaEvidenceAreaExploreModel('gangnam-gu', english)}
      initialSelection={{market:'kr', transaction:'jeonse', district:'gangnam-gu', view:'split'}} initialQuery="Yeoksam-dong" />);
    expect(html).toContain('Yeoksam-dong');
    expect(html).toContain(`data-test-map-total="${english.buildingPage?.total}"`);
    expect(html).toContain('data-building-row=');
  }, 15_000);

  it('keeps parcel lookup identity and Korean address unchanged between display languages', () => {
    const repositories = koreaEvidenceRepositoriesFromEnvironment({useCheckedInSnapshot:true});
    const projection = buildKoreaExplorerEvidenceProjection(repositories, {transaction:'jeonse'}, {includeBuildings:true,districtSlug:'gangnam-gu'});
    if (projection.status !== 'ready') throw new Error('Missing installed fixture');
    const base = buildKoreaEvidenceAreaExploreModel('gangnam-gu', projection);
    if (base.status !== 'ready' || base.buildingAvailability.status !== 'ready') throw new Error('Missing installed fixture');
    const parcel = {...base.buildingAvailability.buildings[0]!, name:'(554-31)', neighborhoodName:'역삼동'};
    const model = {...base, buildingAvailability:{...base.buildingAvailability, buildings:[parcel],mapBuildings:[parcel],mapGroups:[],neighborhoods:[],total:1}};
    const render = (locale: 'en' | 'ko') => {
      renderToStaticMarkup(<AreaExplorer model={model} locale={locale} initialSelection={{market:'kr',transaction:'jeonse',district:'gangnam-gu',view:'map'}} />);
      return capturedMap.buildings[0]!;
    };
    const english = render('en');
    const korean = render('ko');
    expect(english.title).toBe('Lot 554-31');
    expect(korean.title).toBe('역삼동 554-31');
    expect(english.sourceName).toBe('강남구 역삼동 554-31');
    expect(english.sourceName).toBe(korean.sourceName);
    expect(english.addressQuery).toBe(korean.addressQuery);
    expect(english.addressQuery).toContain('서울특별시 강남구 역삼동 554-31');
  }, 15_000);

});
