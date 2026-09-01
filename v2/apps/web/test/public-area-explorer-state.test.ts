import { describe, expect, it } from 'vitest';

import {
  areaExplorerReducer,
  buildingExplorerSelectionReducer,
  filterExploreBuildings,
  resolveExploreSearchDistrict,
  type AreaExplorerState,
} from '../lib/public-market/area-explorer-state';
import type { ExploreBuildingModel } from '../lib/public-market/area-route-types';

const districtSlugs = ['jongno-gu', 'gangnam-gu', 'mapo-gu'] as const;
const buildings: readonly ExploreBuildingModel[] = [
  {
    id: 'evidence-tower', districtSlug: 'gangnam-gu', neighborhoodId: 'yeoksam-dong',
    neighborhoodName: '역삼동 Yeoksam-dong', name: 'Evidence Tower', housingType: 'Apartment',
    evidenceStatus: 'published', observationCount: 12, jeonseObservationCount: 12,
    monthlyObservationCount: 0, firstObservedMonth: '2026-01', lastObservedMonth: '2026-07',
    latitude: 37.5, longitude: 127.03, sampleLabel: '12 contracts', medianLabel: '₩300,000,000',
    newSampleLabel: '7 contracts', newMedianLabel: '₩310,000,000', renewalSampleLabel: '5 contracts',
    renewalMedianLabel: '₩290,000,000', unknownContractCount: 0,
    href: '/kr/seoul/explore/gangnam-gu/evidence-tower/',
  },
  {
    id: 'river-home', districtSlug: 'mapo-gu', neighborhoodId: 'hapjeong-dong',
    neighborhoodName: '합정동 Hapjeong-dong', name: 'River Home', housingType: 'Officetel',
    evidenceStatus: 'unavailable', observationCount: 8, jeonseObservationCount: 5,
    monthlyObservationCount: 3, firstObservedMonth: '2026-02', lastObservedMonth: '2026-07',
    latitude: null, longitude: null, sampleLabel: '8 observed contracts', medianLabel: null,
    newSampleLabel: '4 contracts', newMedianLabel: null, renewalSampleLabel: '4 contracts',
    renewalMedianLabel: null, unknownContractCount: 0,
    href: '/kr/seoul/explore/mapo-gu/river-home/',
  },
] as const;

function state(): AreaExplorerState {
  return Object.freeze({
    selectedSlug: 'jongno-gu',
    districtSlugs: Object.freeze([...districtSlugs]),
  });
}

describe('public area Explorer selection state', () => {
  it('filters retained buildings by name or neighborhood without substituting results', () => {
    expect(filterExploreBuildings(buildings, 'evidence', 'all').map(({ id }) => id)).toEqual([
      'evidence-tower',
    ]);
    expect(filterExploreBuildings(buildings, 'YEOKSAM', 'all').map(({ id }) => id)).toEqual([
      'evidence-tower',
    ]);
    expect(filterExploreBuildings(buildings, 'not-retained', 'all')).toEqual([]);
  });

  it('applies the real neighborhood and text filters together', () => {
    expect(filterExploreBuildings(buildings, '', 'hapjeong-dong').map(({ id }) => id)).toEqual([
      'river-home',
    ]);
    expect(filterExploreBuildings(buildings, 'river', 'yeoksam-dong')).toEqual([]);
  });

  it('finds observed identities by district, dong, housing type and transaction evidence', () => {
    expect(filterExploreBuildings(buildings, 'mapo-gu', 'all').map(({ id }) => id))
      .toEqual(['river-home']);
    expect(filterExploreBuildings(buildings, 'hapjeong-dong', 'all').map(({ id }) => id))
      .toEqual(['river-home']);
    expect(filterExploreBuildings(buildings, '오피스텔', 'all').map(({ id }) => id))
      .toEqual(['river-home']);
    expect(filterExploreBuildings(buildings, '월세', 'all').map(({ id }) => id))
      .toEqual(['river-home']);
    expect(filterExploreBuildings(buildings, '전세', 'all').map(({ id }) => id))
      .toEqual(['evidence-tower', 'river-home']);
    expect(buildings[1]?.medianLabel).toBeNull();
  });

  it('opens the retained district that matches a homepage building or district query', () => {
    const districts = [
      { slug: 'gangnam-gu', nameEn: 'Gangnam-gu', nameKo: '강남구' },
      { slug: 'mapo-gu', nameEn: 'Mapo-gu', nameKo: '마포구' },
    ] as const;

    expect(resolveExploreSearchDistrict(districts, buildings, 'River Home', 'gangnam-gu')).toBe('mapo-gu');
    expect(resolveExploreSearchDistrict(districts, buildings, '마포', 'gangnam-gu')).toBe('mapo-gu');
    expect(resolveExploreSearchDistrict(districts, buildings, 'missing', 'gangnam-gu')).toBe('gangnam-gu');
  });

  it('uses one selection action for map and row controls', () => {
    const initial = state();
    const fromMap = areaExplorerReducer(initial, {
      type: 'select', slug: 'gangnam-gu',
    });
    const fromRow = areaExplorerReducer(initial, {
      type: 'select', slug: 'gangnam-gu',
    });

    expect(fromMap).toEqual(fromRow);
    expect(fromMap.selectedSlug).toBe('gangnam-gu');
    expect(fromMap.districtSlugs).toBe(initial.districtSlugs);
    expect(Object.isFrozen(fromMap)).toBe(true);
  });

  it('preserves identity for repeat or unknown selection', () => {
    const initial = state();
    expect(areaExplorerReducer(initial, {
      type: 'select', slug: 'jongno-gu',
    })).toBe(initial);
    expect(areaExplorerReducer(initial, {
      type: 'select', slug: 'unknown-gu',
    })).toBe(initial);
  });

  it('converges marker and rail building selection on one selected panel ID', () => {
    const initial = Object.freeze({ selectedBuildingId: null });
    const fromMarker = buildingExplorerSelectionReducer(initial, {
      type: 'select_building', source: 'marker', buildingId: 'evidence-tower',
    });
    const fromRail = buildingExplorerSelectionReducer(initial, {
      type: 'select_building', source: 'rail', buildingId: 'evidence-tower',
    });

    expect(fromMarker).toEqual(fromRail);
    expect(fromMarker).toEqual({ selectedBuildingId: 'evidence-tower' });
    expect(Object.isFrozen(fromMarker)).toBe(true);
  });
});
