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
