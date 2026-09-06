import type { KoreaExploreProximitySelection } from './area-route-types';

const HYDRATED_EXPLORE_VIEWS = new Set(['split', 'list', 'table', 'map']);
const HYDRATED_PROXIMITY_DISTANCES = new Set(['250', '500', '750', '1000']);
const HYDRATED_PROXIMITY_SOURCE_ID = /^[A-Za-z0-9][A-Za-z0-9:._/+-]{0,119}$/;

function single(searchParams: URLSearchParams, key: string): string | undefined {
  const values = searchParams.getAll(key);
  return values.length === 1 ? values[0] : undefined;
}

/**
 * Preserves client-visible Explore state without trusting arbitrary query data.
 * The Explore route still reconciles source IDs against its server-side catalog.
 */
export function appendValidatedKoreaHydratedExploreState(
  href: string,
  searchParams: URLSearchParams,
): string {
  const target = new URL(href, 'https://signedprice.invalid');
  if (searchParams.has('view')) {
    target.searchParams.delete('view');
    const view = single(searchParams, 'view');
    if (view !== undefined && HYDRATED_EXPLORE_VIEWS.has(view)) {
      target.searchParams.set('view', view);
    }
  }
  for (const kind of ['station', 'school'] as const) {
    const distanceKey = `${kind}Distance`;
    target.searchParams.delete(kind);
    target.searchParams.delete(distanceKey);
    const sourceId = single(searchParams, kind);
    const distance = single(searchParams, distanceKey);
    if (sourceId === undefined || distance === undefined
      || !HYDRATED_PROXIMITY_SOURCE_ID.test(sourceId)
      || !HYDRATED_PROXIMITY_DISTANCES.has(distance)) continue;
    target.searchParams.set(kind, sourceId);
    target.searchParams.set(distanceKey, distance);
  }
  return `${target.pathname}${target.search}`;
}

/** Serializes only the already-validated Korea-only proximity pairs. */
export function appendKoreaProximityPairs(
  href: string,
  selection: KoreaExploreProximitySelection,
): string {
  const target = new URL(href, 'https://signedprice.invalid');
  target.searchParams.delete('station');
  target.searchParams.delete('stationDistance');
  target.searchParams.delete('school');
  target.searchParams.delete('schoolDistance');
  if (selection.station !== null) {
    target.searchParams.set('station', selection.station.sourceId);
    target.searchParams.set('stationDistance', String(selection.station.distanceMeters));
  }
  if (selection.school !== null) {
    target.searchParams.set('school', selection.school.sourceId);
    target.searchParams.set('schoolDistance', String(selection.school.distanceMeters));
  }
  return `${target.pathname}${target.search}`;
}
