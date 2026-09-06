import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock('../components/maps/naver-district-map', async (original) => {
  const mapModule = await original<typeof import('../components/maps/naver-district-map')>();
  return { ...mapModule, NaverDistrictMap: ({ buildings = [], areaGroups = [], neighborhoods }: {
    buildings?: readonly unknown[]; areaGroups?: readonly { count: number }[];
    neighborhoods?: readonly { buildingCount: number }[];
  }) => <div data-test-map-total={neighborhoods?.reduce((sum, item) => sum + item.buildingCount, 0)
      ?? buildings.length + areaGroups.reduce((sum, group) => sum + group.count, 0)}
    data-test-map-tier={neighborhoods === undefined ? 'buildings' : 'neighborhoods'} /> };
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
      initialSelection={{ market: 'kr', transaction: 'jeonse', district: 'gangnam-gu' }} />);
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
      initialSelection={{ market: 'kr', transaction: 'jeonse', district: 'gangnam-gu', neighborhood: neighborhood.id }} />);
    expect(scoped.buildingPage.buildings).toHaveLength(50);
    expect(scoped.buildingPage.pageSize).toBe(50);
    expect(scoped.buildingPage.mapBuildings).toHaveLength(scoped.buildingPage.total);
    expect(scopedHtml).toContain(`data-test-map-total="${scoped.buildingPage.total}"`);
    expect(scopedHtml).toContain('data-test-map-tier="buildings"');
  }, 15_000);
});
