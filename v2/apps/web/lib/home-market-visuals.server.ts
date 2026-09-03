import 'server-only';

import { buildHomeFeaturedBuildings } from './public-market/home-featured-buildings.server';

export type HomeMarketVisual = Readonly<{
  id: string;
  name: string;
  market: 'Seoul' | 'Singapore' | 'Dubai';
  countryCode: 'KR' | 'SG' | 'AE';
  location: string;
  provider: 'naver' | 'google';
  latitude?: number;
  longitude?: number;
  addressQuery?: string;
  observationLabel: string;
  periodLabel: string;
  href: string;
  mapHref: string;
}>;

const internationalVisuals: readonly HomeMarketVisual[] = Object.freeze([
  { id: 'sg-the-sail', name: 'The Sail @ Marina Bay', market: 'Singapore', countryCode: 'SG', location: 'Marina Bay · Downtown Core', provider: 'google', latitude: 1.2807, longitude: 103.8527, observationLabel: 'Singapore market context', periodLabel: 'Nearby street view · not a listing photo', href: '/sg/singapore/explore/', mapHref: 'https://www.google.com/maps/search/?api=1&query=The+Sail+at+Marina+Bay+Singapore' },
  { id: 'sg-marina-bay-residences', name: 'Marina Bay Residences', market: 'Singapore', countryCode: 'SG', location: 'Marina Bay · Downtown Core', provider: 'google', latitude: 1.2797, longitude: 103.8543, observationLabel: 'Singapore market context', periodLabel: 'Nearby street view · not a listing photo', href: '/sg/singapore/explore/', mapHref: 'https://www.google.com/maps/search/?api=1&query=Marina+Bay+Residences+Singapore' },
  { id: 'sg-wallich-residence', name: 'Wallich Residence', market: 'Singapore', countryCode: 'SG', location: 'Tanjong Pagar · Core Central Region', provider: 'google', latitude: 1.2771, longitude: 103.8458, observationLabel: 'Singapore market context', periodLabel: 'Nearby street view · not a listing photo', href: '/sg/singapore/explore/', mapHref: 'https://www.google.com/maps/search/?api=1&query=Wallich+Residence+Singapore' },
  { id: 'ae-burj-khalifa', name: 'Burj Khalifa', market: 'Dubai', countryCode: 'AE', location: 'Downtown Dubai', provider: 'google', latitude: 25.1972, longitude: 55.2744, observationLabel: 'Dubai place context', periodLabel: 'Nearby street view · not a listing photo', href: '/ae/dubai/', mapHref: 'https://www.google.com/maps/search/?api=1&query=Burj+Khalifa+Dubai' },
  { id: 'ae-marina-gate', name: 'Marina Gate', market: 'Dubai', countryCode: 'AE', location: 'Dubai Marina', provider: 'google', latitude: 25.0877, longitude: 55.1469, observationLabel: 'Dubai place context', periodLabel: 'Nearby street view · not a listing photo', href: '/ae/dubai/', mapHref: 'https://www.google.com/maps/search/?api=1&query=Marina+Gate+Dubai' },
  { id: 'ae-address-sky-view', name: 'Address Sky View', market: 'Dubai', countryCode: 'AE', location: 'Downtown Dubai', provider: 'google', latitude: 25.2012, longitude: 55.2691, observationLabel: 'Dubai place context', periodLabel: 'Nearby street view · not a listing photo', href: '/ae/dubai/', mapHref: 'https://www.google.com/maps/search/?api=1&query=Address+Sky+View+Dubai' },
]);

export function buildHomeMarketVisuals(): readonly HomeMarketVisual[] {
  const seoul: readonly HomeMarketVisual[] = buildHomeFeaturedBuildings().map((building) => ({
    ...building,
    market: 'Seoul',
    countryCode: 'KR',
    provider: 'naver',
    mapHref: building.href,
  }));
  return Object.freeze([...seoul.slice(0, 4), ...internationalVisuals]);
}
