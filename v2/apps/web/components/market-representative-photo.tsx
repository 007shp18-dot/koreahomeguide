import styles from './market-representative-photo.module.css';

export type MarketPhoto = Readonly<{
  src: string;
  alt: string;
  position?: string;
}>;

export const MARKET_PHOTOS = Object.freeze({
  seoul: Object.freeze({
    src: '/assets/markets/seoul-residential.jpg',
    alt: 'Seoul apartment skyline with Namsan in the distance',
    position: 'center 48%',
  }),
  singapore: Object.freeze({
    src: '/assets/markets/singapore-residential.jpg',
    alt: 'High-rise residential architecture in Singapore',
    position: 'center 44%',
  }),
  dubai: Object.freeze({
    src: '/assets/markets/dubai-skyline.jpg',
    alt: 'Dubai skyline and high-rise buildings',
    position: 'center 52%',
  }),
} satisfies Readonly<Record<'seoul' | 'singapore' | 'dubai', MarketPhoto>>);

export function MarketRepresentativePhoto({ photo, eager = false, cityLabel }: Readonly<{
  photo: MarketPhoto;
  eager?: boolean;
  cityLabel?: string;
}>) {
  return <figure className={styles.frame} data-building-media="curated-market-photo">
    {/* These are stable editorial market images, not a claim about a specific listing. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      alt={photo.alt}
      src={photo.src}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      style={{ objectPosition: photo.position ?? 'center' }}
    />
    <figcaption>
      {cityLabel === undefined ? null : `${cityLabel} · `}
      Editorial city photograph · not this exact property
    </figcaption>
  </figure>;
}
