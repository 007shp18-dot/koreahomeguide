export {
  getMarketProfile,
  intents,
  marketIds,
  marketProfiles,
  type CapabilityState,
  type DataScope,
  type DeepReadonly,
  type HousingSectorCode,
  type Intent,
  type MarketDataCapability,
  type MarketId,
  type MarketProfile,
} from './markets';
export { createRightsPolicy, type RightsPolicy, type RightsPolicyInput } from './rights';
export {
  evaluateReadiness,
  type ReadinessInput,
  type RouteReadiness,
} from './readiness';
export { getIntentHref, getMarketByRoute, getMarketHref } from './routes';
export {
  median,
  percentile,
  percentileRank,
  roundDifferencePct,
  roundWon,
  type ComparableRentContract,
  type RentComparisonConfidence,
  type RentComparisonRating,
  type RentComparisonResult,
  type RentComparisonVerdictBasis,
  type RentQuote,
  type SourceCoverage,
  type SourceRetrievalWindow,
} from './rent-check';
