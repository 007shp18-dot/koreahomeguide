import type { SeoulDistrictSlug } from '@signedprice/korea-rent/browser';

export type AreaExplorerState = Readonly<{
  selectedSlug: SeoulDistrictSlug;
  districtSlugs: readonly SeoulDistrictSlug[];
}>;

export type AreaExplorerAction = Readonly<{
  type: 'select';
  slug: string;
}>;

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
