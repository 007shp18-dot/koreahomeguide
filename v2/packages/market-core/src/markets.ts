export type DeepReadonly<Value> = Value extends readonly (infer Item)[]
  ? readonly DeepReadonly<Item>[]
  : Value extends object
    ? { readonly [Key in keyof Value]: DeepReadonly<Value[Key]> }
    : Value;

function deepFreeze<Value>(value: Value): DeepReadonly<Value> {
  if (value !== null && typeof value === 'object') {
    for (const nestedValue of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nestedValue);
    }
    Object.freeze(value);
  }

  return value as DeepReadonly<Value>;
}

export const marketIds = deepFreeze(['kr-seoul', 'sg-singapore', 'ae-dubai'] as const);

export type MarketId = (typeof marketIds)[number];

export const intents = deepFreeze(['rent', 'buy', 'invest'] as const);

export type Intent = (typeof intents)[number];

export type CapabilityState = 'available' | 'limited' | 'rights_blocked';

/** Housing sectors, not tenure. */
export type HousingSectorCode = 'hdb' | 'private_residential';

export type DataScope =
  | 'market_intelligence'
  | 'property_detail'
  | 'transaction_detail';

type MarketDataCapabilityDefinition = {
  dataScope: DataScope;
  housingSector: HousingSectorCode | null;
  state: CapabilityState;
  label: string;
  limitations: string[];
};

export type MarketDataCapability = DeepReadonly<MarketDataCapabilityDefinition>;

type MarketProfileDefinition = {
  id: MarketId;
  countryCode: 'kr' | 'sg' | 'ae';
  citySlug: 'seoul' | 'singapore' | 'dubai';
  cityName: string;
  nativeCurrency: 'KRW' | 'SGD' | 'AED';
  productDepth: 'full_product' | 'market_intelligence';
  dataLabel: string;
  limitations: string[];
  capabilities: Record<Intent, CapabilityState>;
  dataCapabilities: MarketDataCapabilityDefinition[];
};

export type MarketProfile = DeepReadonly<MarketProfileDefinition>;

const marketProfilesById = deepFreeze<Record<MarketId, MarketProfileDefinition>>({
  'kr-seoul': {
    id: 'kr-seoul',
    countryCode: 'kr',
    citySlug: 'seoul',
    cityName: 'Seoul',
    nativeCurrency: 'KRW',
    productDepth: 'full_product',
    dataLabel: 'Official rent and sale intelligence',
    limitations: ['Publication and indexing remain subject to readiness approval.'],
    capabilities: {
      rent: 'available',
      buy: 'available',
      invest: 'available',
    },
    dataCapabilities: [
      {
        dataScope: 'transaction_detail',
        housingSector: null,
        state: 'available',
        label: 'Official rent and sale intelligence',
        limitations: ['Publication and indexing remain subject to readiness approval.'],
      },
    ],
  },
  'sg-singapore': {
    id: 'sg-singapore',
    countryCode: 'sg',
    citySlug: 'singapore',
    cityName: 'Singapore',
    nativeCurrency: 'SGD',
    productDepth: 'market_intelligence',
    dataLabel: 'HDB public market intelligence',
    limitations: [
      'Private residential detail is rights-blocked until commercial rights permit publication.',
      'Partner and developer-project interest flows require advertising and referral review.',
    ],
    capabilities: {
      rent: 'limited',
      buy: 'limited',
      invest: 'limited',
    },
    dataCapabilities: [
      {
        dataScope: 'market_intelligence',
        housingSector: 'hdb',
        state: 'available',
        label: 'HDB public market intelligence',
        limitations: ['HDB public intelligence has sector-specific limitations.'],
      },
      {
        dataScope: 'property_detail',
        housingSector: 'private_residential',
        state: 'rights_blocked',
        label: 'Private residential detail',
        limitations: [
          'Private residential detail is rights-blocked until commercial rights permit publication.',
        ],
      },
    ],
  },
  'ae-dubai': {
    id: 'ae-dubai',
    countryCode: 'ae',
    citySlug: 'dubai',
    cityName: 'Dubai',
    nativeCurrency: 'AED',
    productDepth: 'market_intelligence',
    dataLabel: 'Market intelligence subject to rights clearance',
    limitations: [
      'Transaction detail is rights-blocked until a licensed-provider boundary is established.',
      'Verified project interest and partner flow require DLD, RERA, advertising, referral, and data-rights gates.',
    ],
    capabilities: {
      rent: 'limited',
      buy: 'limited',
      invest: 'limited',
    },
    dataCapabilities: [
      {
        dataScope: 'transaction_detail',
        housingSector: null,
        state: 'rights_blocked',
        label: 'Transaction detail',
        limitations: [
          'Transaction detail is rights-blocked until a licensed-provider boundary is established.',
        ],
      },
    ],
  },
});

/**
 * Phase 1's public registry. Future markets are added here, so consumers do
 * not need market-specific conditionals.
 */
export const marketProfiles: readonly MarketProfile[] = deepFreeze(
  marketIds.map((marketId) => marketProfilesById[marketId]),
);

export function getMarketProfile(marketId: MarketId): MarketProfile {
  return marketProfilesById[marketId];
}
