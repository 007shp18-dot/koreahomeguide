import { describe, expect, it } from 'vitest';
import { matchesSeoulNeighborhoodQuery, seoulNeighborhoodLabel } from '../lib/public-market/seoul-neighborhood-label';
import { buildingDisplayLabel } from '../lib/public-market/building-display-label';
import { filterExploreBuildings } from '../lib/public-market/area-explorer-state';

describe('reviewed Seoul neighborhood labels', () => {
  it('uses district-scoped aliases while preserving unknown names and Korean text', () => {
    expect(seoulNeighborhoodLabel('gangnam-gu', '역삼동', 'en')).toBe('Yeoksam-dong');
    expect(seoulNeighborhoodLabel('gangnam-gu', '역삼동', 'ko')).toBe('역삼동');
    expect(seoulNeighborhoodLabel('other-gu', '역삼동', 'en')).toBe('역삼동');
    expect(seoulNeighborhoodLabel('gangnam-gu', '미확인동', 'en')).toBe('미확인동');
    expect(matchesSeoulNeighborhoodQuery('gangnam-gu', '역삼동', 'YEOKSAM DONG')).toBe(true);
    expect(matchesSeoulNeighborhoodQuery('gangnam-gu', '역삼동', 'yeoksamdong')).toBe(true);
    expect(matchesSeoulNeighborhoodQuery('gangnam-gu', '역삼동', ' --- ')).toBe(false);
  });
  it('keeps English and Korean searches on the same source identity and retains other filters', () => {
    const source = {districtSlug:'gangnam-gu', neighborhoodId:'source-neighborhood', neighborhoodName:'역삼동', name:'(123-4)', housingType:'apartment', jeonseObservationCount:2, monthlyObservationCount:0} as const;
    expect(filterExploreBuildings([source], 'Yeoksam-dong', 'all')).toEqual([source]);
    expect(filterExploreBuildings([source], '역삼동', 'all')).toEqual([source]);
    expect(filterExploreBuildings([source], 'Yeoksam', 'all', 'officetel')).toEqual([]);
    expect(filterExploreBuildings([source], 'Yeoksam', 'other-neighborhood')).toEqual([]);
    expect(buildingDisplayLabel(source,'en')).toEqual({title:'Lot 123-4',location:'Gangnam-gu · Yeoksam-dong 123-4',original:'강남구 역삼동 123-4',isLot:true});
    expect(source.name).toBe('(123-4)');
    expect(source.neighborhoodId).toBe('source-neighborhood');
  });
});
