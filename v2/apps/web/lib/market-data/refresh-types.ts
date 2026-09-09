export const MARKET_REFRESH_JOBS = Object.freeze([
  'kr-seoul-sale',
  'kr-seoul-rent',
  'sg-private-sale',
  'sg-private-rent',
  'ae-dubai-transaction',
  'ae-dubai-rent',
] as const);

export type MarketRefreshJob = (typeof MARKET_REFRESH_JOBS)[number];

const MARKET_REFRESH_JOB_SET = new Set<string>(MARKET_REFRESH_JOBS);

export function isMarketRefreshJob(value: string): value is MarketRefreshJob {
  return MARKET_REFRESH_JOB_SET.has(value);
}

export type MarketId = 'kr-seoul' | 'sg-singapore' | 'ae-dubai';
export type ObservationKind = 'sale' | 'rent' | 'valuation' | 'mortgage' | 'gift';
export type ObservationStatus = 'active' | 'cancelled' | 'corrected' | 'superseded';

export type RefreshDataset = Readonly<{
  id: string;
  marketId: MarketId;
  provider: string;
  officialName: string;
  landingUrl: string;
  subjectScope: string;
  refreshCadence: string;
  expectedLag: string;
  schemaVersion: string;
  parserVersion: string;
  rightsPolicyId: string;
}>;

export type NormalizedGeography = Readonly<{
  id: string;
  marketId: MarketId;
  kind: 'district' | 'planning-area' | 'town' | 'neighborhood' | 'community';
  officialName: string;
  localizedNames: Readonly<Record<string, string>>;
  providerCode: string;
}>;

export type NormalizedPropertyEntity = Readonly<{
  id: string;
  marketId: MarketId;
  geography: NormalizedGeography | null;
  kind: 'project' | 'estate' | 'building';
  canonicalName: string;
  normalizedName: string;
  addressText: string | null;
  housingSector: 'hdb' | 'private_residential' | null;
  propertyClass: string | null;
  identityStatus: 'verified' | 'unverified';
  localAttributes: Readonly<Record<string, unknown>>;
  localSchemaVersion: string;
}>;

export type NormalizedObservation = Readonly<{
  kind: ObservationKind;
  stage: string | null;
  observedAt: string;
  registeredAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  amountMinor: number | null;
  annualAmountMinor: number | null;
  currencyCode: 'KRW' | 'SGD' | 'AED';
  depositMinor: number | null;
  recurringAmountMinor: number | null;
  frequency: 'once' | 'monthly' | 'quarterly' | 'annual' | null;
  propertyAreaSqm: number | null;
  transactedAreaSqm: number | null;
  areaBasis: string | null;
  floorValue: number | null;
  floorRange: string | null;
  bedrooms: number | null;
  tenureKind: string | null;
  status: Exclude<ObservationStatus, 'superseded'>;
  localAttributes: Readonly<Record<string, unknown>>;
  localSchemaVersion: string;
}>;

export type NormalizedMarketRecord = Readonly<{
  businessKey: string;
  contentHash: string;
  sourceObservedAt: string;
  rawMetadata: Readonly<Record<string, unknown>>;
  entity: NormalizedPropertyEntity | null;
  observation: NormalizedObservation | null;
}>;

export type NormalizedMarketBatch = Readonly<{
  job: MarketRefreshJob;
  dataset: RefreshDataset;
  sourceAsOf: string;
  records: readonly NormalizedMarketRecord[];
  /** Fully fetched URA months; retire absent anonymous records only after all chunks succeed. */
  reconciliationMonths?: readonly string[];
}>;

export type MarketRefreshCounters = Readonly<{
  received: number;
  inserted: number;
  updated: number;
  unchanged: number;
  unlinked: number;
}>;
