import MarketRepresentativePhotoFrame from './market-representative-photo-frame';

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
  tokyo: Object.freeze({
    src: '/assets/markets/tokyo-cityscape.jpg',
    alt: 'Tokyo cityscape seen from Tokyo Skytree',
    focalPoint: Object.freeze({ x: 50, y: 50 }),
  }),
} satisfies Readonly<Record<'seoul' | 'singapore' | 'dubai' | 'tokyo', MarketPhoto>>);

export type MarketRepresentativePhotoProps = Readonly<{
  photo: MarketPhoto | null;
  eager?: boolean;
  cityLabel?: string;
  context?: 'property' | 'city';
  locale?: 'en' | 'ko' | 'zh-CN';
}>;

export function MarketRepresentativePhoto(props: MarketRepresentativePhotoProps) {
  return <MarketRepresentativePhotoFrame {...props} />;
}
