import photos from './neighbourhood-photos.json';
import type { NeighbourhoodPhoto } from './neighbourhood-stories';

export type NeighbourhoodPhotoId = keyof typeof photos;
export const PHOTO_ESSAYS: Readonly<Record<string, Readonly<{
  hero: NeighbourhoodPhotoId;
  sections: Readonly<Partial<Record<number, NeighbourhoodPhotoId>>>;
}>>> = {
  'seoul/seongsu': { hero: 'seoul-street', sections: { 0: 'seoul-forest', 2: 'seoul-river' } },
  'seoul/wangsimni': { hero: 'wangsimni-station', sections: {} },
  'seoul/mangwon': { hero: 'mangwon-river', sections: { 0: 'mangwon-market', 1: 'mangwon-night' } },
  'seoul/buy-jeonse-rent': { hero: 'yeonhui-housing', sections: {} },
  'singapore/new-launch-premium': { hero: 'sg-scala', sections: {} },
  'tokyo/old-condo-costs': { hero: 'tokyo-apartments', sections: {} },
  'singapore/discover': { hero: 'sg-flats', sections: { 0: 'sg-market', 1: 'sg-balconies', 2: 'sg-seating' } },
  'dubai/discover': { hero: 'dubai-waterfront', sections: { 0: 'dubai-walk', 1: 'dubai-park', 3: 'dubai-day' } },
  'tokyo/discover': { hero: 'tokyo-river', sections: { 1: 'tokyo-blossom', 3: 'tokyo-lane', 4: 'tokyo-station' } },
};

// Cards and articles must resolve the same place, never an unrelated city fallback.
export function journeyArticlePhoto(city: string, id: string): NeighbourhoodPhoto | undefined {
  const essay = PHOTO_ESSAYS[`${city}/${id}`];
  if (!essay) return undefined;
  const photo = photos[essay.hero];
  return { ...photo, alt: photo.caption, licenseUrl: photo.licenseHref };
}
