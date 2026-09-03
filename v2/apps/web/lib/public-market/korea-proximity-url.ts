import type { KoreaExploreProximitySelection } from './area-route-types';

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
