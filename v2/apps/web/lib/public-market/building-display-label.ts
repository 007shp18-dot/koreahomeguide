import { getSeoulDistrictBySlug } from '@signedprice/korea-rent/browser';

import { seoulNeighborhoodLabel } from './seoul-neighborhood-label';

/** Display-only labels: preserve the source identity and never infer a building name. */
export function buildingDisplayLabel(input: Readonly<{
  name: string; neighborhoodName: string; districtSlug: string;
}>, locale: 'en' | 'ko') {
  const district = getSeoulDistrictBySlug(input.districtSlug);
  const lot = /^\((산?\d+(?:-\d+)?)\)$/.exec(input.name.trim())?.[1];
  const address = lot ? `${input.neighborhoodName} ${lot}` : input.neighborhoodName;
  const neighborhood = seoulNeighborhoodLabel(input.districtSlug, input.neighborhoodName, locale);
  const displayAddress = lot ? `${neighborhood} ${lot}` : neighborhood;
  return {
    title: lot ? (locale === 'ko' ? address : `${lot.startsWith('산') ? 'Mountain lot' : 'Lot'} ${lot.replace(/^산/, '')}`) : input.name,
    location: [locale === 'ko' ? district?.nameKo : district?.nameEn, displayAddress].filter(Boolean).join(' · '),
    original: [district?.nameKo, address, lot ? null : input.name].filter(Boolean).join(' '),
    isLot: Boolean(lot),
  };
}
