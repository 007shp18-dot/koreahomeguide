export const PUBLIC_EVIDENCE_DISPLAY_STATES = ['published', 'stale', 'withdrawn'] as const;
export const PUBLIC_LOCATION_PRECISIONS = ['rooftop', 'parcel', 'street', 'district-centroid'] as const;
export const PUBLIC_LOCATION_VERIFICATION_STATES = ['verified', 'provisional', 'rejected'] as const;
export const MARKET_CAPABILITY_FEATURES = [
  'market_overview', 'explore', 'check', 'property_detail', 'transaction_detail', 'research',
] as const;
export const MARKET_CAPABILITY_STATES = ['available', 'limited', 'rights_blocked'] as const;
export const MARKET_HOUSING_SECTORS = ['all', 'hdb', 'private_residential'] as const;

export type PublicEvidenceDisplayState = typeof PUBLIC_EVIDENCE_DISPLAY_STATES[number];
export type PublicLocationPrecision = typeof PUBLIC_LOCATION_PRECISIONS[number];
export type PublicLocationVerificationState = typeof PUBLIC_LOCATION_VERIFICATION_STATES[number];
export type MarketCapabilityFeature = typeof MARKET_CAPABILITY_FEATURES[number];
export type MarketCapabilityState = typeof MARKET_CAPABILITY_STATES[number];
export type MarketHousingSector = typeof MARKET_HOUSING_SECTORS[number];

export type PublicEvidenceRelease = Readonly<{
  id: string;
  marketId: 'kr-seoul' | 'sg-singapore';
  datasetId: string;
  periodStart: string;
  periodEnd: string;
  recordCount: number;
  rightsPolicyId: string;
  displayState: PublicEvidenceDisplayState;
  sha256: string;
}>;

export type PublicEntityLocation = Readonly<{
  entityId: string;
  marketId: 'kr-seoul' | 'sg-singapore';
  latitude: number;
  longitude: number;
  precision: PublicLocationPrecision;
  provider: string;
  providerReference: string | null;
  rightsPolicyId: string;
  verificationStatus: PublicLocationVerificationState;
  verifiedAt: string;
  updatedAt: string;
}>;

export type MarketCapability = Readonly<{
  marketId: 'kr-seoul' | 'sg-singapore' | 'ae-dubai';
  feature: MarketCapabilityFeature;
  housingSector: MarketHousingSector;
  state: MarketCapabilityState;
  publicHref: string | null;
  label: string;
  limitations: readonly string[];
  checkedAt: string;
  evidenceReleaseId: string | null;
}>;
