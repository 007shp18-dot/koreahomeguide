import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock('../components/maps/naver-district-map', async (original) => {
  const mapModule = await original<typeof import('../components/maps/naver-district-map')>();
  return { ...mapModule, NaverDistrictMap: ({ buildings = [], areaGroups = [] }: {
    buildings?: readonly unknown[]; areaGroups?: readonly { count: number }[];
  }) => <div data-test-map-total={buildings.length + areaGroups.reduce((sum, group) => sum + group.count, 0)} /> };
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
    }, { includeBuildings: true, districtSlug: 'gangnam-gu', buildingQuery: 'gangnam-gu', buildingPage });
    if (projection.status !== 'ready' || projection.buildingPage === null) throw new Error('Missing installed fixture');
    const model = buildKoreaEvidenceAreaExploreModel('gangnam-gu', projection);
    const html = renderToStaticMarkup(<AreaExplorer model={model} initialQuery="gangnam-gu"
      initialSelection={{ market: 'kr', transaction: 'jeonse', district: 'gangnam-gu' }} />);
    expect(projection.buildingPage.buildings).toHaveLength(50);
    expect(projection.buildingPage.total).toBeGreaterThan(50);
    expect(html).toContain(`data-test-map-total="${projection.buildingPage.total}"`);
    expect(html).toContain('including buildings on other result pages');
  }, 15_000);
});
