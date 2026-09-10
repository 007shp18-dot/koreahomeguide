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
  photoRegistryKey?: string;
  observationLabel: string;
  periodLabel: string;
  facts: readonly string[];
  href: string;
  mapHref: string;
}>;

function singaporeVisuals(): readonly HomeMarketVisual[] {
  const repository = hdbSnapshotRepositoryFromEnvironment();
  if (repository === null) return Object.freeze([]);
  const blocks = repository.listTowns().flatMap((town) => repository.listBlocks(town.town))
    .filter((block) => block.property !== null && block.resaleMedianSgd !== null && block.resaleCount >= 5)
    .sort((left, right) => right.resaleCount - left.resaleCount || left.blockId.localeCompare(right.blockId))
    .slice(0, 24);
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
      photoRegistryKey: `sg-hdb:${block.town}:${address}`,
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
  // Dubai stays out of building rotation until a released building-detail
  // record exists. Its market overview still communicates the rights status.
  return Object.freeze([...seoul, ...singaporeVisuals()]);
}
