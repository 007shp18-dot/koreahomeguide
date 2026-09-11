import photos from './neighbourhood-photos.json';
import type { NeighbourhoodPhotoId } from './journey-article-photos';
import type { NeighbourhoodPhoto } from './neighbourhood-stories';

// Editorial selections, not photographs of the transactions discussed in a story.
// Keep named neighbourhood stories in PHOTO_ESSAYS, where exact place identity is required.
export const INSIGHT_PHOTOS: Readonly<Record<string, NeighbourhoodPhotoId>> = {
  'how-to-read-property-transaction-prices-and-medians': 'seoul-river',
  'how-to-read-property-transaction-prices-and-medians-en': 'seoul-river',
  'how-to-read-property-transaction-prices-and-medians-zh': 'seoul-river',
  'singapore-condo-absd-60-percent-real-acquisition-cost': 'singapore-condo-recent',
  'singapore-condo-absd-60-percent-real-acquisition-cost-en': 'singapore-condo-recent',
  'singapore-condo-absd-60-percent-real-acquisition-cost-zh': 'singapore-condo-recent',
  'seoul-singapore-dubai-buyer-pulse-september-2026': 'dubai-day',
  'seoul-59sqm-under-700-million-2026': 'nowon-view',
  'seoul-apartment-buying-budget-guide': 'nowon-apartments',
  'singapore-condo-buying-budget-guide': 'sg-heritage',
  'dubai-ready-apartment-buying-budget-guide': 'dubai-waterfront',
  'seoul-monthly-2026-09': 'seoul-river',
  'singapore-monthly-2026-09': 'sg-balconies',
  'dubai-monthly-2026-09': 'dubai-miracle-garden',
  'seoul-84sqm-under-one-billion-2026': 'nowon-apartments',
  'singapore-condos-under-1-5-million-2026': 'sg-heritage',
  'korea-foreon-neighbour-price-gap': 'dunchon-station',
  'singapore-lentor-launch-resale-divergence': 'lentor-station',
  'dubai-rental-yield-after-costs': 'dubai-park',
  'korea-rental-deposit-protection-status': 'yeonhui-housing',
  'singapore-absd-policy-status': 'sg-scala',
  'korea-foreign-property-reporting-status': 'seoul-river',
  'seoul-land-transaction-permit-status': 'seoul-forest',
  'korea-housing-finance-rules-status': 'nowon-view',
  'singapore-hdb-private-owner-waitout-status': 'sg-bishan',
  'seoul-district-price-distribution': 'seoul-street',
  'seoul-new-renewal-rent-gap': 'yeonhui-community',
  'korea-deposit-monthly-rent-cost-structure': 'mangwon-night',
  'singapore-ccr-rcr-ocr-comparison': 'sg-flats',
  'singapore-condo-prices-2026-by-project': 'singapore-condo-recent',
  'tokyo-asking-price-vs-contracted-price-2026': 'tokyo-apartment-recent',
};

export function insightPhoto(slug: string): NeighbourhoodPhoto | undefined {
  const id = INSIGHT_PHOTOS[slug];
  if (!id) return undefined;
  const photo = photos[id];
  return { ...photo, alt: `${photo.caption} · City context`, licenseUrl: photo.licenseHref };
}
