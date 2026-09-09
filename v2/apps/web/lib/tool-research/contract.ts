import type { ToolId, ToolMarket } from '../analytics/tool-events';

export const RESEARCH_SCHEMA_VERSION = 1 as const;
export const RESEARCH_CONSENT_VERSION = 'tool-research-consent-2026-09-09' as const;

export const RESEARCH_TOOL_IDS = [
  'passport',
  'property-scenario',
  'single-quote',
  'offer-compare',
  'rent-check',
  'singapore-check',
  'dubai-check',
] as const satisfies readonly ToolId[];

export type ResearchToolId = (typeof RESEARCH_TOOL_IDS)[number];
export type ResearchMarket = ToolMarket;
export type ResearchCurrency = 'KRW' | 'SGD' | 'AED' | 'USD';

export type ResearchBand<Id extends string = string> = Readonly<{ id: Id; label: string }>;

const AMOUNT_SCALES = {
  KRW: [
    [1_000_000, 'krw-under-1m', 'under KRW 1m'],
    [10_000_000, 'krw-1m-10m', 'KRW 1m–10m'],
    [100_000_000, 'krw-10m-100m', 'KRW 10m–100m'],
    [500_000_000, 'krw-100m-500m', 'KRW 100m–500m'],
    [1_000_000_000, 'krw-500m-1b', 'KRW 500m–1bn'],
    [2_000_000_000, 'krw-1b-2b', 'KRW 1bn–2bn'],
    [5_000_000_000, 'krw-2b-5b', 'KRW 2bn–5bn'],
    [Infinity, 'krw-5b-plus', 'KRW 5bn or more'],
  ],
  SGD: [
    [1_000, 'sgd-under-1k', 'under SGD 1k'],
    [10_000, 'sgd-1k-10k', 'SGD 1k–10k'],
    [100_000, 'sgd-10k-100k', 'SGD 10k–100k'],
    [500_000, 'sgd-100k-500k', 'SGD 100k–500k'],
    [1_000_000, 'sgd-500k-1m', 'SGD 500k–1m'],
    [2_000_000, 'sgd-1m-2m', 'SGD 1m–2m'],
    [Infinity, 'sgd-2m-plus', 'SGD 2m or more'],
  ],
  AED: [
    [10_000, 'aed-under-10k', 'under AED 10k'],
    [50_000, 'aed-10k-50k', 'AED 10k–50k'],
    [250_000, 'aed-50k-250k', 'AED 50k–250k'],
    [1_000_000, 'aed-250k-1m', 'AED 250k–1m'],
    [5_000_000, 'aed-1m-5m', 'AED 1m–5m'],
    [10_000_000, 'aed-5m-10m', 'AED 5m–10m'],
    [Infinity, 'aed-10m-plus', 'AED 10m or more'],
  ],
  USD: [
    [1_000, 'usd-under-1k', 'under USD 1k'],
    [10_000, 'usd-1k-10k', 'USD 1k–10k'],
    [100_000, 'usd-10k-100k', 'USD 10k–100k'],
    [500_000, 'usd-100k-500k', 'USD 100k–500k'],
    [1_000_000, 'usd-500k-1m', 'USD 500k–1m'],
    [2_000_000, 'usd-1m-2m', 'USD 1m–2m'],
    [Infinity, 'usd-2m-plus', 'USD 2m or more'],
  ],
} as const satisfies Record<ResearchCurrency, readonly (readonly [number, string, string])[]>;

const AREA_SCALE = [
  [40, 'sqm-under-40', 'under 40 m²'],
  [60, 'sqm-40-60', '40–60 m²'],
  [85, 'sqm-60-85', '60–85 m²'],
  [120, 'sqm-85-120', '85–120 m²'],
  [Infinity, 'sqm-120-plus', '120 m² or more'],
] as const;

const YIELD_SCALE = [
  [0, 'yield-negative', 'below 0%'],
  [2, 'yield-0-2', '0–2%'],
  [4, 'yield-2-4', '2–4%'],
  [6, 'yield-4-6', '4–6%'],
  [Infinity, 'yield-6-plus', '6% or more'],
] as const;

const SAMPLE_SCALE = [
  [5, 'sample-0-4', '0–4 observations'],
  [10, 'sample-5-9', '5–9 observations'],
  [25, 'sample-10-24', '10–24 observations'],
  [50, 'sample-25-49', '25–49 observations'],
  [100, 'sample-50-99', '50–99 observations'],
  [Infinity, 'sample-100-plus', '100 or more observations'],
] as const;

export type ResearchAmountBandId = 'amount-none' | (typeof AMOUNT_SCALES)[ResearchCurrency][number][1];
export type ResearchAreaBandId = (typeof AREA_SCALE)[number][1];
export type ResearchYieldBandId = (typeof YIELD_SCALE)[number][1];
export type ResearchSampleBandId = (typeof SAMPLE_SCALE)[number][1];

function bucket<Id extends string>(
  value: number,
  scale: readonly (readonly [number, Id, string])[],
): ResearchBand<Id> {
  if (!Number.isFinite(value)) throw new TypeError('Research value must be finite.');
  const match = scale.find(([upperExclusive]) => value < upperExclusive);
  if (match === undefined) throw new TypeError('Research value cannot be bucketed.');
  return Object.freeze({ id: match[1], label: match[2] });
}

export function bucketResearchAmount(value: number, currency: ResearchCurrency): ResearchBand<ResearchAmountBandId> {
  if (value < 0 || !(currency in AMOUNT_SCALES)) {
    throw new TypeError('Research amount cannot be bucketed.');
  }
  if (value === 0) return Object.freeze({ id: 'amount-none', label: `${currency} 0` });
  return bucket(value, AMOUNT_SCALES[currency]);
}

export function bucketResearchArea(value: number): ResearchBand<ResearchAreaBandId> {
  if (value <= 0) throw new TypeError('Research area cannot be bucketed.');
  return bucket(value, AREA_SCALE);
}

export function bucketResearchYield(value: number): ResearchBand<ResearchYieldBandId> {
  return bucket(value, YIELD_SCALE);
}

export function bucketResearchSample(value: number): ResearchBand<ResearchSampleBandId> {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError('Research sample cannot be bucketed.');
  }
  return bucket(value, SAMPLE_SCALE);
}

const AMOUNT_BAND_IDS = Object.freeze(Object.fromEntries(
  Object.entries(AMOUNT_SCALES).map(([currency, scale]) => [
    currency,
    Object.freeze(['amount-none', ...scale.map(([, id]) => id)]),
  ]),
)) as Readonly<Record<ResearchCurrency, readonly string[]>>;
const AREA_BAND_IDS = AREA_SCALE.map(([, id]) => id);
const YIELD_BAND_IDS = YIELD_SCALE.map(([, id]) => id);
const SAMPLE_BAND_IDS = SAMPLE_SCALE.map(([, id]) => id);

type PassportSnapshot = Readonly<{
  schemaVersion: 1;
  tool: 'passport';
  market: 'global';
  currency: ResearchCurrency;
  bands: Readonly<Record<'budget', ResearchAmountBandId>
    & Record<'seoulArea' | 'singaporeArea' | 'dubaiArea', ResearchAreaBandId>
    & Record<'seoulSample' | 'singaporeSample' | 'dubaiSample', ResearchSampleBandId>>;
  categories: Readonly<{ dubaiStage: 'ready' | 'off-plan' }>;
}>;

type PropertyScenarioSnapshot = Readonly<{
  schemaVersion: 1;
  tool: 'property-scenario';
  market: Exclude<ResearchMarket, 'global'>;
  currency: Exclude<ResearchCurrency, 'USD'>;
  bands: Readonly<Record<'purchasePrice' | 'acquisitionCosts' | 'monthlyRent' | 'annualOperatingCosts', ResearchAmountBandId>
    & Record<'yield', ResearchYieldBandId> & Partial<Record<'area', ResearchAreaBandId>>>;
  categories: Readonly<Partial<{ housingType: ResearchHousingType }>>;
}>;

type SingleQuoteSnapshot = Readonly<{
  schemaVersion: 1;
  tool: 'single-quote';
  market: 'kr-seoul';
  currency: 'KRW';
  bands: Readonly<Record<'askingPrice', ResearchAmountBandId> & Record<'area', ResearchAreaBandId> & Record<'sample', ResearchSampleBandId>>;
  categories: Readonly<{ transaction: ResearchTransaction; housingType: ResearchHousingType; verdict: ResearchVerdict; scope: 'district' | 'neighborhood' | 'building' }>;
}>;

type OfferCompareSnapshot = Readonly<{
  schemaVersion: 1;
  tool: 'offer-compare';
  market: 'kr-seoul';
  currency: 'KRW';
  bands: Readonly<Record<'offerAUpfront' | 'offerBUpfront', ResearchAmountBandId>
    & Partial<Record<'offerARecurring' | 'offerBRecurring', ResearchAmountBandId>>
    & Record<'sampleA' | 'sampleB', ResearchSampleBandId>>;
  categories: Readonly<{ offerATransaction: ResearchTransaction; offerBTransaction: ResearchTransaction; comparison: 'market-position' | 'recurring-cost' | 'tradeoff' | 'equal' }>;
}>;

type RentCheckSnapshot = Readonly<{
  schemaVersion: 1;
  tool: 'rent-check';
  market: 'kr-seoul';
  currency: 'KRW';
  bands: Readonly<Record<'deposit' | 'monthlyRent', ResearchAmountBandId> & Record<'area', ResearchAreaBandId> & Record<'sample', ResearchSampleBandId>>;
  categories: Readonly<{ housingType: ResearchHousingType; verdict: ResearchVerdict }>;
}>;

type SingaporeCheckSnapshot = Readonly<{
  schemaVersion: 1;
  tool: 'singapore-check';
  market: 'sg-singapore';
  currency: 'SGD';
  bands: Readonly<Record<'askingPrice', ResearchAmountBandId> & Record<'area', ResearchAreaBandId> & Record<'sample', ResearchSampleBandId>>;
  categories: Readonly<{ segment: 'private-sale' | 'hdb-resale' | 'hdb-rent'; housingType: ResearchHousingType; verdict: ResearchVerdict }>;
}>;

type DubaiCheckSnapshot = Readonly<{
  schemaVersion: 1;
  tool: 'dubai-check';
  market: 'ae-dubai';
  currency: 'AED';
  bands: Readonly<Record<'askingPrice', ResearchAmountBandId> & Record<'area', ResearchAreaBandId>
    & Record<'sample', ResearchSampleBandId> & Partial<Record<'annualRent', ResearchAmountBandId> & Record<'yield', ResearchYieldBandId>>>;
  categories: Readonly<{ stage: 'ready' | 'off-plan'; housingType: 'apartment' | 'villa'; verdict: ResearchVerdict }>;
}>;

export type NormalizedToolResearchSnapshot =
  | PassportSnapshot
  | PropertyScenarioSnapshot
  | SingleQuoteSnapshot
  | OfferCompareSnapshot
  | RentCheckSnapshot
  | SingaporeCheckSnapshot
  | DubaiCheckSnapshot;

export type ToolResearchSubmission = Readonly<{
  consent: Readonly<{ granted: true; version: typeof RESEARCH_CONSENT_VERSION }>;
  retryId: string;
  snapshot: NormalizedToolResearchSnapshot;
}>;

export type ResearchHousingType = 'apartment' | 'villa' | 'officetel' | 'detached' | 'condo' | 'hdb' | 'landed' | 'townhouse' | 'other-residential';
export type ResearchTransaction = 'sale' | 'jeonse' | 'monthly';
export type ResearchVerdict = 'below' | 'typical' | 'above';

const HOUSING_TYPES: readonly ResearchHousingType[] = ['apartment', 'villa', 'officetel', 'detached', 'condo', 'hdb', 'landed', 'townhouse', 'other-residential'];
const TRANSACTIONS: readonly ResearchTransaction[] = ['sale', 'jeonse', 'monthly'];
const VERDICTS: readonly ResearchVerdict[] = ['below', 'typical', 'above'];
const RETRY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RecordValue = Record<string, unknown>;

function exactRecord(value: unknown, keys: readonly string[]): RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) invalid();
  const record = value as RecordValue;
  const actual = Object.keys(record);
  if (actual.length !== keys.length || actual.some((key) => !keys.includes(key))) invalid();
  return record;
}

function enumValue<T extends string>(value: unknown, values: readonly T[]): T {
  if (typeof value !== 'string' || !values.includes(value as T)) invalid();
  return value as T;
}

function invalid(): never {
  throw new TypeError('Invalid tool research submission.');
}

const TOOL_RULES = {
  passport: {
    markets: ['global'], currencies: ['KRW', 'SGD', 'AED', 'USD'],
    requiredBands: ['budget', 'seoulArea', 'singaporeArea', 'dubaiArea', 'seoulSample', 'singaporeSample', 'dubaiSample'], optionalBands: [],
    categories: { dubaiStage: ['ready', 'off-plan'] }, optionalCategories: [],
  },
  'property-scenario': {
    markets: ['kr-seoul', 'sg-singapore', 'ae-dubai'], currencies: ['KRW', 'SGD', 'AED'],
    requiredBands: ['purchasePrice', 'acquisitionCosts', 'monthlyRent', 'annualOperatingCosts', 'yield'], optionalBands: ['area'],
    categories: { housingType: HOUSING_TYPES }, optionalCategories: ['housingType'],
  },
  'single-quote': {
    markets: ['kr-seoul'], currencies: ['KRW'],
    requiredBands: ['askingPrice', 'area', 'sample'], optionalBands: [],
    categories: { transaction: TRANSACTIONS, housingType: HOUSING_TYPES, verdict: VERDICTS, scope: ['district', 'neighborhood', 'building'] }, optionalCategories: [],
  },
  'offer-compare': {
    markets: ['kr-seoul'], currencies: ['KRW'],
    requiredBands: ['offerAUpfront', 'offerBUpfront', 'sampleA', 'sampleB'], optionalBands: ['offerARecurring', 'offerBRecurring'],
    categories: { offerATransaction: TRANSACTIONS, offerBTransaction: TRANSACTIONS, comparison: ['market-position', 'recurring-cost', 'tradeoff', 'equal'] }, optionalCategories: [],
  },
  'rent-check': {
    markets: ['kr-seoul'], currencies: ['KRW'],
    requiredBands: ['deposit', 'monthlyRent', 'area', 'sample'], optionalBands: [],
    categories: { housingType: HOUSING_TYPES, verdict: VERDICTS }, optionalCategories: [],
  },
  'singapore-check': {
    markets: ['sg-singapore'], currencies: ['SGD'],
    requiredBands: ['askingPrice', 'area', 'sample'], optionalBands: [],
    categories: { segment: ['private-sale', 'hdb-resale', 'hdb-rent'], housingType: HOUSING_TYPES, verdict: VERDICTS }, optionalCategories: [],
  },
  'dubai-check': {
    markets: ['ae-dubai'], currencies: ['AED'],
    requiredBands: ['askingPrice', 'area', 'sample'], optionalBands: ['annualRent', 'yield'],
    categories: { stage: ['ready', 'off-plan'], housingType: ['apartment', 'villa'], verdict: VERDICTS }, optionalCategories: [],
  },
} as const;

const AREA_KEYS = new Set(['area', 'seoulArea', 'singaporeArea', 'dubaiArea']);
const YIELD_KEYS = new Set(['yield']);
const SAMPLE_KEYS = new Set(['sample', 'sampleA', 'sampleB', 'seoulSample', 'singaporeSample', 'dubaiSample']);

function normalizedSnapshot(value: unknown): NormalizedToolResearchSnapshot {
  const snapshot = exactRecord(value, ['schemaVersion', 'tool', 'market', 'currency', 'bands', 'categories']);
  if (snapshot.schemaVersion !== RESEARCH_SCHEMA_VERSION) invalid();
  const tool = enumValue(snapshot.tool, RESEARCH_TOOL_IDS);
  const rule = TOOL_RULES[tool];
  const market = enumValue(snapshot.market, rule.markets);
  const currency = enumValue(snapshot.currency, rule.currencies) as ResearchCurrency;
  if (tool === 'property-scenario' && ({ 'kr-seoul': 'KRW', 'sg-singapore': 'SGD', 'ae-dubai': 'AED' } as const)[market as Exclude<ResearchMarket, 'global'>] !== currency) invalid();

  const bandsValue = snapshot.bands;
  if (typeof bandsValue !== 'object' || bandsValue === null || Array.isArray(bandsValue)) invalid();
  const bands = bandsValue as RecordValue;
  const bandKeys = Object.keys(bands);
  const allowedBandKeys = [...rule.requiredBands, ...rule.optionalBands] as readonly string[];
  if (rule.requiredBands.some((key) => !(key in bands)) || bandKeys.some((key) => !allowedBandKeys.includes(key))) invalid();
  for (const [key, value] of Object.entries(bands)) {
    if (typeof value !== 'string') invalid();
    const allowed = AREA_KEYS.has(key) ? AREA_BAND_IDS
      : YIELD_KEYS.has(key) ? YIELD_BAND_IDS
        : SAMPLE_KEYS.has(key) ? SAMPLE_BAND_IDS
          : AMOUNT_BAND_IDS[currency];
    if (!allowed.includes(value)) invalid();
    if (['budget', 'askingPrice', 'purchasePrice'].includes(key) && value === 'amount-none') invalid();
  }

  const categoriesValue = snapshot.categories;
  if (typeof categoriesValue !== 'object' || categoriesValue === null || Array.isArray(categoriesValue)) invalid();
  const categories = categoriesValue as RecordValue;
  const categoryRules = rule.categories as Readonly<Record<string, readonly string[]>>;
  const categoryKeys = Object.keys(categories);
  if (Object.keys(categoryRules).some((key) => !rule.optionalCategories.includes(key as never) && !(key in categories))
    || categoryKeys.some((key) => !(key in categoryRules))) invalid();
  for (const [key, category] of Object.entries(categories)) enumValue(category, categoryRules[key]!);

  return Object.freeze({
    schemaVersion: RESEARCH_SCHEMA_VERSION,
    tool,
    market,
    currency,
    bands: Object.freeze({ ...bands }),
    categories: Object.freeze({ ...categories }),
  }) as NormalizedToolResearchSnapshot;
}

export function parseToolResearchSubmission(value: unknown): ToolResearchSubmission {
  const input = exactRecord(value, ['consent', 'retryId', 'snapshot']);
  const consent = exactRecord(input.consent, ['granted', 'version']);
  if (consent.granted !== true || consent.version !== RESEARCH_CONSENT_VERSION) invalid();
  if (typeof input.retryId !== 'string' || !RETRY_ID.test(input.retryId)) invalid();
  return Object.freeze({
    consent: Object.freeze({ granted: true, version: RESEARCH_CONSENT_VERSION }),
    retryId: input.retryId.toLowerCase(),
    snapshot: normalizedSnapshot(input.snapshot),
  });
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(Object.entries(value as RecordValue)
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, child]) => [key, stable(child)]));
}

export function canonicalToolResearchSnapshot(snapshot: NormalizedToolResearchSnapshot): string {
  return JSON.stringify(stable(normalizedSnapshot(snapshot)));
}

export function describeToolResearchBands(
  snapshot: NormalizedToolResearchSnapshot,
): Readonly<Record<string, string>> {
  const parsed = normalizedSnapshot(snapshot);
  const labels: Record<string, string> = {};
  for (const [field, id] of Object.entries(parsed.bands)) {
    if (id === 'amount-none') {
      labels[field] = `${parsed.currency} 0`;
      continue;
    }
    const scale: readonly (readonly [number, string, string])[] = AREA_KEYS.has(field)
      ? AREA_SCALE
      : YIELD_KEYS.has(field)
        ? YIELD_SCALE
        : SAMPLE_KEYS.has(field)
          ? SAMPLE_SCALE
          : AMOUNT_SCALES[parsed.currency];
    const match = scale.find(([, candidate]) => candidate === id);
    if (match === undefined) invalid();
    labels[field] = match[2];
  }
  return Object.freeze(labels);
}

/** Human-readable labels for already bucketed administrative aggregates. */
export function describeResearchBand(id: string, currency: ResearchCurrency): string {
  if (id === 'amount-none') return `${currency} 0`;
  return [...AMOUNT_SCALES[currency], ...AREA_SCALE, ...YIELD_SCALE, ...SAMPLE_SCALE]
    .find(([, candidate]) => candidate === id)?.[2] ?? id;
}
