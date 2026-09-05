import Image from 'next/image';

import styles from './market-representative-photo.module.css';

export type MarketPhoto = Readonly<{
  src: string;
  alt: string;
  focalPoint: Readonly<{ x: number; y: number }>;
}>;

export const MARKET_PHOTOS = Object.freeze({
  seoul: Object.freeze({
    src: '/assets/markets/seoul-residential.jpg',
    alt: 'Seoul apartment skyline with Namsan in the distance',
    focalPoint: Object.freeze({ x: 50, y: 48 }),
  }),
  singapore: Object.freeze({
    src: '/assets/markets/singapore-residential.jpg',
    alt: 'High-rise residential architecture in Singapore',
    focalPoint: Object.freeze({ x: 50, y: 44 }),
  }),
  dubai: Object.freeze({
    src: '/assets/markets/dubai-skyline.jpg',
    alt: 'Dubai skyline and high-rise buildings',
    focalPoint: Object.freeze({ x: 50, y: 52 }),
  }),
} satisfies Readonly<Record<'seoul' | 'singapore' | 'dubai', MarketPhoto>>);

export function MarketRepresentativePhoto({ photo, eager = false, cityLabel }: Readonly<{
  photo: MarketPhoto | null;
  eager?: boolean;
  cityLabel?: string;
}>) {
  if (photo === null) return <figure className={styles.frame} data-building-media="market-context-fallback">
    <div className={styles.fallback}>
      <strong>{cityLabel === undefined ? 'Property market context' : `${cityLabel} market context`}</strong>
      <span>No approved market photograph is available.</span>
    </div>
    <figcaption>{cityLabel === undefined ? null : `${cityLabel} · `}Verified market context</figcaption>
  </figure>;

  return <figure className={styles.frame} data-building-media="curated-market-photo">
    {/* These are stable editorial market images, not a claim about a specific listing. */}
    <Image
      alt={photo.alt}
      src={photo.src}
      fill
      priority={eager}
      sizes="(max-width: 850px) 100vw, 55vw"
      style={{ objectPosition: `${photo.focalPoint.x}% ${photo.focalPoint.y}%` }}
    />
    <figcaption>
      {cityLabel === undefined ? null : `${cityLabel} · `}
      Editorial city photograph · not this exact property
    </figcaption>
  </figure>;
}
