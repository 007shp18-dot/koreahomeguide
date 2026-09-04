import type { CapabilityState, DeepReadonly, HousingSectorCode, MarketId } from './markets';

export const marketCapabilityFeatures = [
  'market_overview',
  'explore',
  'check',
  'property_detail',
  'transaction_detail',
  'research',
] as const;

export type MarketCapabilityFeature = (typeof marketCapabilityFeatures)[number];

type MarketCapabilityDefinition = {
  marketId: MarketId;
  feature: MarketCapabilityFeature;
  housingSector: HousingSectorCode | null;
  state: CapabilityState;
  publicHref: string | null;
  label: string;
  limitations: string[];
};

export type MarketCapability = DeepReadonly<MarketCapabilityDefinition>;

function deepFreeze<Value>(value: Value): DeepReadonly<Value> {
  if (value !== null && typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value as DeepReadonly<Value>;
}

const registry = deepFreeze<MarketCapabilityDefinition[]>([
  { marketId: 'kr-seoul', feature: 'market_overview', housingSector: null, state: 'available', publicHref: '/kr/seoul/', label: 'Seoul market overview', limitations: [] },
  { marketId: 'kr-seoul', feature: 'explore', housingSector: null, state: 'available', publicHref: '/kr/seoul/explore/', label: 'Explore Seoul', limitations: [] },
  { marketId: 'kr-seoul', feature: 'check', housingSector: null, state: 'available', publicHref: '/kr/seoul/check/', label: 'Check a Seoul price', limitations: [] },
  { marketId: 'kr-seoul', feature: 'property_detail', housingSector: null, state: 'available', publicHref: '/kr/seoul/explore/', label: 'Seoul property evidence', limitations: [] },
  { marketId: 'kr-seoul', feature: 'transaction_detail', housingSector: null, state: 'available', publicHref: '/kr/seoul/explore/', label: 'Reported sale, jeonse and monthly-rent evidence', limitations: [] },
  { marketId: 'kr-seoul', feature: 'research', housingSector: null, state: 'available', publicHref: '/insights/', label: 'Seoul research', limitations: [] },

  { marketId: 'sg-singapore', feature: 'market_overview', housingSector: null, state: 'available', publicHref: '/sg/', label: 'Singapore market overview', limitations: [] },
  { marketId: 'sg-singapore', feature: 'explore', housingSector: null, state: 'limited', publicHref: '/sg/singapore/explore/', label: 'Explore Singapore', limitations: ['Coverage differs between private residential projects and HDB blocks.'] },
  { marketId: 'sg-singapore', feature: 'check', housingSector: null, state: 'limited', publicHref: '/sg/singapore/check/', label: 'Check a Singapore price', limitations: ['Results depend on released sector evidence.'] },
  { marketId: 'sg-singapore', feature: 'property_detail', housingSector: 'private_residential', state: 'limited', publicHref: '/sg/singapore/explore/?sector=private', label: 'Private residential project evidence', limitations: ['Only released URA evidence is shown.'] },
  { marketId: 'sg-singapore', feature: 'property_detail', housingSector: 'hdb', state: 'limited', publicHref: '/sg/singapore/explore/?sector=hdb', label: 'HDB block evidence', limitations: ['Public and private housing are not combined.'] },
  { marketId: 'sg-singapore', feature: 'transaction_detail', housingSector: 'private_residential', state: 'limited', publicHref: '/sg/singapore/explore/', label: 'URA private residential evidence', limitations: ['Only released URA evidence is shown.'] },
  { marketId: 'sg-singapore', feature: 'transaction_detail', housingSector: 'hdb', state: 'limited', publicHref: '/sg/singapore/explore/?sector=hdb', label: 'HDB resale evidence', limitations: ['Public and private housing are not combined.'] },
  { marketId: 'sg-singapore', feature: 'research', housingSector: null, state: 'available', publicHref: '/insights/', label: 'Singapore research', limitations: [] },

  { marketId: 'ae-dubai', feature: 'market_overview', housingSector: null, state: 'available', publicHref: '/ae/dubai/', label: 'Dubai market overview', limitations: [] },
  { marketId: 'ae-dubai', feature: 'explore', housingSector: null, state: 'limited', publicHref: '/ae/dubai/', label: 'Explore Dubai market context', limitations: ['Project-level evidence is not yet a public transaction tool.'] },
  { marketId: 'ae-dubai', feature: 'check', housingSector: null, state: 'rights_blocked', publicHref: null, label: 'Dubai price check', limitations: ['A licensed display boundary is required before release.'] },
  { marketId: 'ae-dubai', feature: 'property_detail', housingSector: null, state: 'rights_blocked', publicHref: null, label: 'Dubai property evidence', limitations: ['Property-level evidence requires rights clearance.'] },
  { marketId: 'ae-dubai', feature: 'transaction_detail', housingSector: null, state: 'rights_blocked', publicHref: null, label: 'Dubai transaction detail', limitations: ['Transaction detail requires a licensed display boundary.'] },
  { marketId: 'ae-dubai', feature: 'research', housingSector: null, state: 'available', publicHref: '/insights/', label: 'Dubai research', limitations: [] },
]);

export function listMarketCapabilities(marketId: MarketId): readonly MarketCapability[] {
  return registry.filter((capability) => capability.marketId === marketId);
}

export function getMarketCapability(
  marketId: MarketId,
  feature: MarketCapabilityFeature,
  housingSector: HousingSectorCode | null,
): MarketCapability | null {
  return registry.find((capability) => capability.marketId === marketId
    && capability.feature === feature
    && capability.housingSector === housingSector) ?? null;
}
