import {
  getMarketProfile,
  marketProfiles,
  type Intent,
  type MarketId,
  type MarketProfile,
} from './markets';

export function getMarketByRoute(
  countryCode: string,
  citySlug: string,
): MarketProfile | undefined {
  return marketProfiles.find(
    (market) => market.countryCode === countryCode && market.citySlug === citySlug,
  );
}

export function getMarketHref(marketId: MarketId): string {
  const market = getMarketProfile(marketId);
  return `/${market.countryCode}/${market.citySlug}/`;
}

export function getIntentHref(marketId: MarketId, intent: Intent): string {
  return `${getMarketHref(marketId)}${intent}/`;
}
