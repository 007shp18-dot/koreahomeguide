import { marketIds, type DeepReadonly, type MarketId } from './markets';

export type PublicMarketAvailability = 'ready' | 'unavailable';

type PublicMarketConfigDefinition = {
  marketId: MarketId;
  availability: PublicMarketAvailability;
  publicPath: `/${string}/`;
  areaSlug: string;
  marketLabel: string;
  currencyCode: 'KRW' | 'SGD' | 'AED';
  currencySymbol: string;
  formatLocale: string;
  quoteLabel: string;
  quoteUnit: string;
  geographyNoun: string;
  parentGeographyNoun: string;
  registryLabel: string;
  axis: {
    min: number;
    max: number;
    step: number;
  };
  dealTypes: string[];
  guideFamilies: string[];
};

export type PublicMarketConfig = DeepReadonly<PublicMarketConfigDefinition>;

function deepFreeze<Value>(value: Value): DeepReadonly<Value> {
  if (value !== null && typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested);
    }
    Object.freeze(value);
  }
  return value as DeepReadonly<Value>;
}

const configsById = deepFreeze<Record<MarketId, PublicMarketConfigDefinition>>({
  'kr-seoul': {
    marketId: 'kr-seoul',
    availability: 'ready',
    publicPath: '/kr/',
    areaSlug: 'seoul',
    marketLabel: 'Seoul',
    currencyCode: 'KRW',
    currencySymbol: '₩',
    formatLocale: 'ko-KR',
    quoteLabel: 'Monthly rent',
    quoteUnit: 'KRW/month',
    geographyNoun: 'area',
    parentGeographyNoun: 'country',
    registryLabel: 'MOLIT reported rental contracts',
    axis: { min: 0, max: 5_000_000, step: 10_000 },
    dealTypes: ['rent'],
    guideFamilies: ['rent', 'buy', 'invest'],
  },
  'sg-singapore': {
    marketId: 'sg-singapore',
    availability: 'unavailable',
    publicPath: '/sg/',
    areaSlug: 'singapore',
    marketLabel: 'Singapore',
    currencyCode: 'SGD',
    currencySymbol: 'S$',
    formatLocale: 'en-SG',
    quoteLabel: 'Monthly rent',
    quoteUnit: 'SGD/month',
    geographyNoun: 'area',
    parentGeographyNoun: 'country',
    registryLabel: 'HDB public market data',
    axis: { min: 0, max: 20_000, step: 100 },
    dealTypes: ['rent'],
    guideFamilies: ['rent', 'buy', 'invest'],
  },
  'ae-dubai': {
    marketId: 'ae-dubai',
    availability: 'unavailable',
    publicPath: '/ae/',
    areaSlug: 'dubai',
    marketLabel: 'Dubai',
    currencyCode: 'AED',
    currencySymbol: 'AED',
    formatLocale: 'en-AE',
    quoteLabel: 'Annual rent',
    quoteUnit: 'AED/year',
    geographyNoun: 'area',
    parentGeographyNoun: 'emirate',
    registryLabel: 'DLD and Ejari market data',
    axis: { min: 0, max: 1_000_000, step: 1_000 },
    dealTypes: ['rent'],
    guideFamilies: ['rent', 'buy', 'invest'],
  },
});

export const publicMarketConfigs: readonly PublicMarketConfig[] = deepFreeze(
  marketIds.map((marketId) => configsById[marketId]),
);

export function getPublicMarketConfig(marketId: MarketId): PublicMarketConfig {
  return configsById[marketId];
}
