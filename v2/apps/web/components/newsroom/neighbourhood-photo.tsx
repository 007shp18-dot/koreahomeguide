import Image from 'next/image';
import photos from '../../content/neighbourhood-photos.json';
import styles from './journey-article.module.css';

export type NeighbourhoodPhotoId = keyof typeof photos;
export const PHOTO_ESSAYS: Readonly<Record<string, Readonly<{ hero: NeighbourhoodPhotoId; sections: Readonly<Partial<Record<number, NeighbourhoodPhotoId>>> }>>> = {
  'seoul/seongsu': { hero: 'seoul-forest', sections: { 0: 'seoul-lake', 1: 'seoul-street', 2: 'seoul-river' } },
  'singapore/discover': { hero: 'sg-flats', sections: { 0: 'sg-market', 1: 'sg-balconies', 2: 'sg-seating' } },
  'dubai/discover': { hero: 'dubai-waterfront', sections: { 0: 'dubai-walk', 1: 'dubai-park', 3: 'dubai-day' } },
  'tokyo/discover': { hero: 'tokyo-river', sections: { 1: 'tokyo-blossom', 3: 'tokyo-lane', 4: 'tokyo-station' } },
};

export function NeighbourhoodPhoto({ id, eager = false }: Readonly<{ id: NeighbourhoodPhotoId; eager?: boolean }>) {
  const photo = photos[id];
  return <figure className={styles.scenePhoto} data-neighbourhood-photo={id}>
    <Image src={photo.src} alt={photo.caption} width={photo.width} height={photo.height} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} sizes="(max-width: 740px) calc(100vw - 40px), 900px" />
    <figcaption>{photo.caption}<span><a href={photo.source} target="_blank" rel="noopener noreferrer">Photo: {photo.author}</a> · <a href={photo.licenseHref} target="_blank" rel="noopener noreferrer">{photo.license}</a></span></figcaption>
  </figure>;
}
