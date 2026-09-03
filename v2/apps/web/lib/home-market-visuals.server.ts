import 'server-only';

import { buildHomeFeaturedBuildings } from './public-market/home-featured-buildings.server';
import { hdbSnapshotRepositoryFromEnvironment } from './singapore/hdb-snapshot-repository.server';
import { hdbTownSlug } from './singapore/hdb-route-model.server';

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
  facts: readonly string[];
  href: string;
  mapHref: string;
}>;

const dubaiVisuals: readonly HomeMarketVisual[] = Object.freeze([
  { id: 'ae-burj-khalifa', name: 'Burj Khalifa', market: 'Dubai', countryCode: 'AE', location: 'Downtown Dubai', provider: 'google', latitude: 25.1972, longitude: 55.2744, addressQuery: 'Burj Khalifa, Downtown Dubai, UAE', observationLabel: 'Verified place identity', periodLabel: 'Price evidence awaiting release clearance', facts: ['Downtown Dubai', 'Place context'], href: '/ae/dubai/explore/', mapHref: 'https://www.google.com/maps/search/?api=1&query=Burj+Khalifa+Dubai' },
  { id: 'ae-marina-gate', name: 'Marina Gate', market: 'Dubai', countryCode: 'AE', location: 'Dubai Marina', provider: 'google', latitude: 25.0877, longitude: 55.1469, addressQuery: 'Marina Gate, Dubai Marina, UAE', observationLabel: 'Verified place identity', periodLabel: 'Price evidence awaiting release clearance', facts: ['Dubai Marina', 'Place context'], href: '/ae/dubai/explore/', mapHref: 'https://www.google.com/maps/search/?api=1&query=Marina+Gate+Dubai' },
  { id: 'ae-address-sky-view', name: 'Address Sky View', market: 'Dubai', countryCode: 'AE', location: 'Downtown Dubai', provider: 'google', latitude: 25.2012, longitude: 55.2691, addressQuery: 'Address Sky View, Downtown Dubai, UAE', observationLabel: 'Verified place identity', periodLabel: 'Price evidence awaiting release clearance', facts: ['Downtown Dubai', 'Place context'], href: '/ae/dubai/explore/', mapHref: 'https://www.google.com/maps/search/?api=1&query=Address+Sky+View+Dubai' },
]);

function singaporeVisuals(): readonly HomeMarketVisual[] {
  const repository = hdbSnapshotRepositoryFromEnvironment();
  if (repository === null) return Object.freeze([]);
  const blocks = repository.listTowns().flatMap((town) => repository.listBlocks(town.town))
    .filter((block) => block.property !== null && block.resaleMedianSgd !== null && block.resaleCount >= 5)
    .sort((left, right) => right.resaleCount - left.resaleCount || left.blockId.localeCompare(right.blockId))
    .slice(0, 6);
  return Object.freeze(blocks.map((block) => {
    const address = `${block.block} ${block.street}`;
    const townSlug = hdbTownSlug(block.town);
    return Object.freeze({
      id: `sg-${block.blockId}`,
      name: address,
      market: 'Singapore' as const,
      countryCode: 'SG' as const,
      location: `${block.town} · HDB`,
      provider: 'google' as const,
      addressQuery: `${address}, Singapore`,
      observationLabel: `SGD ${block.resaleMedianSgd!.toLocaleString('en-SG')} resale median`,
      periodLabel: `${block.resaleCount.toLocaleString('en-SG')} reported resale records`,
      facts: Object.freeze([
        `Completed ${block.property!.yearCompleted}`,
        `${block.property!.totalDwellingUnits.toLocaleString('en-SG')} homes`,
      ]),
      href: `/sg/singapore/hdb/${townSlug}/${block.blockId}/`,
      mapHref: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, Singapore`)}`,
    });
  }));
}

export function buildHomeMarketVisuals(): readonly HomeMarketVisual[] {
  const seoul: readonly HomeMarketVisual[] = buildHomeFeaturedBuildings().map((building) => ({
    ...building,
    market: 'Seoul',
    countryCode: 'KR',
    provider: 'naver',
    mapHref: building.href,
    facts: Object.freeze([
      building.observationLabel,
      building.periodLabel,
    ]),
  }));
  return Object.freeze([...seoul.slice(0, 4), ...singaporeVisuals(), ...dubaiVisuals]);
}
