import type { SeoulDistrictSlug } from '@signedprice/korea-rent/browser';
import type { ExploreBuildingModel } from './area-route-types';

export type AreaExplorerState = Readonly<{
  selectedSlug: SeoulDistrictSlug;
  districtSlugs: readonly SeoulDistrictSlug[];
}>;

export type AreaExplorerAction = Readonly<{
  type: 'select';
  slug: string;
}>;

export type BuildingExplorerSelectionState = Readonly<{
  selectedBuildingId: string | null;
}>;

export type BuildingExplorerSelectionAction =
  | Readonly<{
      type: 'select_building';
      source: 'marker' | 'rail';
      buildingId: string;
    }>
  | Readonly<{ type: 'clear_building' }>;

const housingTypeSearchAliases = Object.freeze({
  apartment: Object.freeze(['아파트']),
  officetel: Object.freeze(['오피스텔']),
  villa_multifamily: Object.freeze(['빌라', '연립', '다세대']),
  detached: Object.freeze(['단독', '다가구']),
} as const);

export function filterExploreBuildings(
  buildings: readonly ExploreBuildingModel[],
  query: string,
  neighborhoodId: string,
  housingType = 'all',
  districtAliases: readonly string[] = Object.freeze([]),
): readonly ExploreBuildingModel[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('en-US');
  const queryScopesSelectedDistrict = normalizedQuery.length > 0
    && districtAliases.some((alias) => (
      alias.toLocaleLowerCase('en-US').includes(normalizedQuery)
    ));
  return buildings.filter((building) => {
    if (neighborhoodId !== 'all' && building.neighborhoodId !== neighborhoodId) return false;
    if (housingType !== 'all' && building.housingType !== housingType) return false;
    if (normalizedQuery.length === 0 || queryScopesSelectedDistrict) return true;
    const transactionTokens = [
      ...(building.jeonseObservationCount > 0 ? ['jeonse', '전세'] : []),
      ...(building.monthlyObservationCount > 0 ? ['monthly', 'monthly rent', '월세'] : []),
    ];
    const housingAliases = housingTypeSearchAliases[
      building.housingType.toLocaleLowerCase('en-US') as keyof typeof housingTypeSearchAliases
    ] ?? [];
    return [
      building.districtSlug,
      building.neighborhoodId,
      building.name,
      building.neighborhoodName,
      building.housingType,
      ...housingAliases,
      ...transactionTokens,
    ]
      .some((value) => value.toLocaleLowerCase('en-US').includes(normalizedQuery));
  });
}

export function resolveExploreSearchDistrict(
  districts: readonly Readonly<{
    slug: SeoulDistrictSlug;
    nameEn: string;
    nameKo: string;
  }>[],
  buildings: readonly ExploreBuildingModel[],
  query: string,
  fallback: SeoulDistrictSlug,
): SeoulDistrictSlug {
  const normalizedQuery = query.trim().toLocaleLowerCase('en-US');
  if (normalizedQuery.length === 0) return fallback;
  const district = districts.find(({ slug, nameEn, nameKo }) => (
    [slug, nameEn, nameKo].some((value) => value.toLocaleLowerCase('en-US').includes(normalizedQuery))
  ));
  if (district !== undefined) return district.slug;
  return filterExploreBuildings(buildings, normalizedQuery, 'all')[0]?.districtSlug ?? fallback;
}

export function buildingExplorerSelectionReducer(
  state: BuildingExplorerSelectionState,
  action: BuildingExplorerSelectionAction,
): BuildingExplorerSelectionState {
  const selectedBuildingId = action.type === 'clear_building' ? null : action.buildingId;
  if (selectedBuildingId === state.selectedBuildingId) return state;
  return Object.freeze({ selectedBuildingId });
}

export function resolveSelectedExploreBuilding(
  buildings: readonly ExploreBuildingModel[],
  selectedBuildingId: string | null,
): ExploreBuildingModel | null {
  if (selectedBuildingId === null) return null;
  return buildings.find(({ id }) => id === selectedBuildingId) ?? null;
}

export function areaExplorerReducer(
  state: AreaExplorerState,
  action: AreaExplorerAction,
): AreaExplorerState {
  if (
    action.type !== 'select' ||
    action.slug === state.selectedSlug ||
    !state.districtSlugs.includes(action.slug as SeoulDistrictSlug)
  ) {
    return state;
  }
  return Object.freeze({
    selectedSlug: action.slug as SeoulDistrictSlug,
    districtSlugs: state.districtSlugs,
  });
}
