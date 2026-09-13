import locations from '../../content/property-reviews/locations.json';
import type { MarketLocale } from '../locale/market-localization';
import type { ReviewText } from './property-review';

export type ReviewVisualMetric = { label: ReviewText; value: number; unit: string; basis: ReviewText; sourceId: string };
export type ReviewVisualSeries = { label: ReviewText; unit: string; basis: ReviewText; sourceId: string; points: {period: string; value: number}[] };
export type ReviewPhoto = { url: string; sourceUrl: string; credit: string; license: string; licenseUrl?: string; alt: ReviewText; kind?: 'photo' | 'render'; takenOn?: string; checkedOn?: string };
export type ReviewLocation = {
  reviewId: string; name?: ReviewText; area?: ReviewText; address: string; entityIds: string[]; detailPath: string;
  metrics: ReviewVisualMetric[]; series?: ReviewVisualSeries[]; photo: ReviewPhoto | null;
  projectId?: string | null; areaSlug?: string; wardCode?: string; segment?: string;
};
const catalogue = locations as ReviewLocation[];
export function reviewLocation(id: string): ReviewLocation | undefined { return catalogue.find(row => row.reviewId === id); }
export function hasPropertyReviewForEntity(entity: string): boolean { return catalogue.some(row => row.entityIds.includes(entity)); }
export function reviewLocationForEntity(entity: string): ReviewLocation | undefined { return catalogue.find(row => row.entityIds.includes(entity)); }
export function actualDetailHref(locale: MarketLocale, profileId: string): `/${string}` | null {
  const location = reviewLocation(profileId);
  return location ? `${locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : ''}${location.detailPath}` as `/${string}` : null;
}
export function reviewLocationForProject(projectId: string): ReviewLocation | undefined { return catalogue.find(row => row.projectId === projectId); }
export function allReviewLocations(): readonly ReviewLocation[] { return catalogue; }

export function reviewDirectoryForMarket(market: 'kr-seoul' | 'sg-singapore' | 'ae-dubai' | 'jp-tokyo') {
  const prefix = market.split('-')[0] + '-';
  return catalogue.filter(row => row.reviewId.startsWith(prefix) && row.name).map(row => ({
    id: row.reviewId, marketId: market, name: row.name!, area: row.area ?? { en: row.address, ko: row.address },
  }));
}
