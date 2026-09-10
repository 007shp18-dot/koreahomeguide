/** Open the selected building on the map without dropping its Explore filters. */
export function seoulBuildingLocationHref(exploreHref: string): string {
  const target = new URL(exploreHref, 'https://signedprice.invalid');
  target.searchParams.set('view', 'map');
  return `${target.pathname}${target.search}`;
}
