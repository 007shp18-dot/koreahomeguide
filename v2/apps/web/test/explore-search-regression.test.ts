import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({ usePathname: () => '/ko/kr/seoul/explore/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), useSearchParams: () => new URLSearchParams() }));
import { AreaExplorer } from '../components/public-market/area-explorer';
import { buildKoreaEvidenceAreaExploreModel } from '../lib/public-market/korea-explorer-area-route.server';
import { koreaEvidenceRepositoriesFromEnvironment } from '../lib/public-market/korea-evidence-repositories.server';
import { buildKoreaExplorerEvidenceProjection } from '../lib/public-market/korea-explorer-evidence.server';
import { filterExploreBuildings } from '../lib/public-market/area-explorer-state';

const repositories = koreaEvidenceRepositoriesFromEnvironment({ useCheckedInSnapshot: true });
function search(q: string, districtSlug?: string, buildingPage = 1) {
  const result = buildKoreaExplorerEvidenceProjection(repositories,
    { transaction: 'sale', areaBand: 'all', housingType: 'all', contractGroup: 'all' },
    { includeBuildings: true, buildingQuery: q, districtSlug, buildingPage });
  if (result.status !== 'ready' || !result.buildingPage) throw new Error('Search evidence unavailable');
  return result.buildingPage;
}
describe('Explore search regressions', () => {
  it('renders city-wide nickname results with the all-Seoul selector and correct building links', () => {
    const projection = buildKoreaExplorerEvidenceProjection(repositories,
      { transaction: 'sale', areaBand: 'all', housingType: 'all', contractGroup: 'all' },
      { includeBuildings: true, buildingQuery: '마래푸' });
    if (projection.status !== 'ready') throw new Error('missing evidence');
    const model = buildKoreaEvidenceAreaExploreModel(undefined, projection);
    const html = renderToStaticMarkup(createElement(AreaExplorer, { model, locale: 'ko', initialQuery: '마래푸' }));
    expect(html).toContain('서울 전체 실거래가');
    expect(html).toContain('value="all" selected=""');
    for (const complex of [1, 2, 3, 4]) expect(html).toContain(`마포래미안푸르지오${complex}단지`);
    expect(html).not.toContain('도봉구 실거래가');
    expect(html).toContain('district=mapo-gu');
  });
  it('searches every Seoul district rather than silently selecting the first match', () => {
    const result = search('래미안');
    expect(new Set(result.buildings.map(b => b.districtSlug)).size).toBeGreaterThan(1);
    expect(result.total).toBeGreaterThan(result.buildings.length);
    expect(result.buildings.length).toBeLessThanOrEqual(50);
    expect(search('래미안', undefined, 2).buildings[0]?.buildingId).not.toBe(result.buildings[0]?.buildingId);
  });
  it.each(['마래푸', '마포 래미안 푸르지오', '마래푸 2단지'])('matches the retained complex for %s', q => {
    const result = search(q);
    expect(result.total).toBeGreaterThan(0);
    expect(result.buildings.every(b => b.districtSlug === 'mapo-gu' && b.officialName.startsWith('마포래미안푸르지오'))).toBe(true);
    if (q.endsWith('2단지')) expect(result.buildings.map(b => b.officialName)).toEqual(['마포래미안푸르지오2단지']);
  });
  it('retains an explicit district and returns no match instead of a different district', () => {
    const result = search('마포래미안푸르지오', 'dobong-gu');
    expect(result.districtSlug).toBe('dobong-gu');
    expect(result.total).toBe(0);
  });
  it('returns no unrelated building for an unknown query', () => {
    expect(search('없는건물xyz').total).toBe(0);
  });
  it('uses the same aliases and spacing rules when filtering the delivered page', () => {
    const records = [{ districtSlug: 'mapo-gu' as const, neighborhoodId: 'ahyeon', neighborhoodName: '아현동',
      name: '마포래미안푸르지오2단지', housingType: 'apartment', jeonseObservationCount: 1, monthlyObservationCount: 0 }];
    expect(filterExploreBuildings(records, '마래푸', 'all')).toEqual(records);
    expect(filterExploreBuildings(records, '마포', 'all')).toEqual(records);
    expect(filterExploreBuildings(records, '마포 래미안 푸르지오', 'all')).toEqual(records);
    expect(filterExploreBuildings(records, '마래푸', 'different-dong')).toEqual([]);
  });
});
