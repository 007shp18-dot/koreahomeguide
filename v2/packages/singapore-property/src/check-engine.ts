import type {
  HdbRentCheckRecord,
  HdbResaleCheckRecord,
  SingaporeCheckArtifact,
  SingaporeCheckMarket,
  SingaporeCheckRecord,
  UraPrivateSaleCheckRecord,
} from './check-artifact.ts';

export const SINGAPORE_CHECK_PUBLICATION_MINIMUM = 5 as const;
export const SINGAPORE_CHECK_MAX_COMPLETED_MONTHS = 12 as const;

export type SingaporeCheckMonthWindow = Readonly<{
  from: string;
  to: string;
  monthCount: number;
  maximumMonthCount: typeof SINGAPORE_CHECK_MAX_COMPLETED_MONTHS;
}>;

export type SingaporeAreaBand = Readonly<{ minimum: number; maximum: number }>;

export type UraPrivateSaleOffer = Readonly<{
  market: 'ura-private-sale';
  amountSgd: number;
  endMonth?: string;
  filters: Readonly<{
    marketSegment: 'CCR' | 'RCR' | 'OCR';
    projectId: string | null;
    district: string;
    propertyType: string;
    areaBand: SingaporeAreaBand;
    floorRange: string | null;
    saleType: string | null;
  }>;
}>;

export type HdbResaleOffer = Readonly<{
  market: 'hdb-resale';
  amountSgd: number;
  endMonth?: string;
  filters: Readonly<{
    town: string;
    blockId: string | null;
    flatType: string;
    storeyRange: string | null;
    areaBand: SingaporeAreaBand;
  }>;
}>;

export type HdbRentOffer = Readonly<{
  market: 'hdb-rent';
  amountSgd: number;
  endMonth?: string;
  filters: Readonly<{
    town: string;
    blockId: string | null;
    flatType: string;
  }>;
}>;

export type SingaporeCheckOffer = UraPrivateSaleOffer | HdbResaleOffer | HdbRentOffer;

export type SingaporeCheckScopeLevel =
  | 'exact'
  | 'project'
  | 'district'
  | 'segment'
  | 'block'
  | 'town'
  | 'national';

export type SingaporeCheckResult =
  | Readonly<{
      status: 'ready';
      market: SingaporeCheckMarket;
      amountSgd: number;
      sourceIdentifier: string;
      window: SingaporeCheckMonthWindow;
      scope: Readonly<{ level: SingaporeCheckScopeLevel; label: string }>;
      fallbackDisclosure: string | null;
      distribution: Readonly<{
        minimum: number;
        p25: number;
        median: number;
        p75: number;
        maximum: number;
      }>;
      percentile: number;
      sampleCount: number;
      minimumSample: typeof SINGAPORE_CHECK_PUBLICATION_MINIMUM;
      secondary:
        | Readonly<{
            kind: 'ura-private-sale';
            medianPsf: number;
            tenures: readonly string[];
            floorRanges: readonly string[];
            saleTypes: readonly string[];
          }>
        | Readonly<{
            kind: 'hdb-resale';
            remainingLeases: readonly string[];
            flatModels: readonly string[];
            storeyRanges: readonly string[];
          }>
        | Readonly<{ kind: 'hdb-rent' }>;
    }>
  | Readonly<{
      status: 'insufficient';
      market: SingaporeCheckMarket;
      window: SingaporeCheckMonthWindow;
      sampleCount: number;
      minimumSample: typeof SINGAPORE_CHECK_PUBLICATION_MINIMUM;
      attemptedScopes: readonly Readonly<{
        level: SingaporeCheckScopeLevel;
        label: string;
        count: number;
      }>[];
    }>
  | Readonly<{
      status: 'unavailable';
      market: SingaporeCheckMarket;
      reason: 'invalid-input' | 'evidence-unavailable';
      message: string;
    }>;

export type SingaporeCheckComparison =
  | Readonly<{
      status: 'ready';
      basis: 'native-market-position';
      verdict: 'tradeoff';
      winner: null;
      marketRelationship: 'same-market' | 'cross-market';
      offers: readonly [
        Extract<SingaporeCheckResult, { status: 'ready' }>,
        Extract<SingaporeCheckResult, { status: 'ready' }>,
      ];
    }>
  | Readonly<{
      status: 'unavailable';
      reason: 'offer-evidence-unavailable';
      message: string;
    }>;

function monthOrdinal(value: string): number | null {
  const match = /^(20\d{2})-(0[1-9]|1[0-2])$/.exec(value);
  if (match === null) return null;
  return Number(match[1]) * 12 + Number(match[2]) - 1;
}

function monthFromOrdinal(value: number): string {
  const year = Math.floor(value / 12);
  const month = value % 12 + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function singaporeCompletedMonthWindow(
  period: Readonly<{ from: string; to: string }>,
  requestedEndMonth: string = period.to,
): SingaporeCheckMonthWindow | null {
  const availableFrom = monthOrdinal(period.from);
  const availableTo = monthOrdinal(period.to);
  const requestedTo = monthOrdinal(requestedEndMonth);
  if (availableFrom === null
    || availableTo === null
    || requestedTo === null
    || availableFrom > availableTo
    || requestedTo < availableFrom
    || requestedTo > availableTo) return null;
  const effectiveFrom = Math.max(
    availableFrom,
    requestedTo - SINGAPORE_CHECK_MAX_COMPLETED_MONTHS + 1,
  );
  return Object.freeze({
    from: monthFromOrdinal(effectiveFrom),
    to: requestedEndMonth,
    monthCount: requestedTo - effectiveFrom + 1,
    maximumMonthCount: SINGAPORE_CHECK_MAX_COMPLETED_MONTHS,
  });
}

function validText(value: string | null): value is string {
  return value !== null && value.trim().length > 0;
}

function validBand(value: SingaporeAreaBand): boolean {
  return Number.isFinite(value.minimum)
    && Number.isFinite(value.maximum)
    && value.minimum >= 0
    && value.maximum > value.minimum;
}

function validOffer(offer: SingaporeCheckOffer): boolean {
  if (!Number.isFinite(offer.amountSgd) || offer.amountSgd <= 0) return false;
  if (offer.market === 'ura-private-sale') {
    return validText(offer.filters.district)
      && validText(offer.filters.propertyType)
      && validBand(offer.filters.areaBand);
  }
  if (offer.market === 'hdb-resale') {
    return validText(offer.filters.town)
      && validText(offer.filters.flatType)
      && validBand(offer.filters.areaBand);
  }
  return validText(offer.filters.town) && validText(offer.filters.flatType);
}

function percentile(values: readonly number[], fraction: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const lowerValue = sorted[lower]!;
  const upperValue = sorted[upper]!;
  return lowerValue + (upperValue - lowerValue) * (position - lower);
}

function percentileRank(values: readonly number[], amount: number): number {
  return Math.round((values.filter((value) => value <= amount).length / values.length) * 100);
}

type ScopeCandidate<TRecord extends SingaporeCheckRecord> = Readonly<{
  level: SingaporeCheckScopeLevel;
  label: string;
  matches: (record: TRecord) => boolean;
}>;

function inArea(value: number, band: SingaporeAreaBand): boolean {
  return value >= band.minimum && value <= band.maximum;
}

function uraScopes(offer: UraPrivateSaleOffer): readonly ScopeCandidate<UraPrivateSaleCheckRecord>[] {
  const { filters } = offer;
  const shared = (record: UraPrivateSaleCheckRecord) => (
    record.marketSegment === filters.marketSegment
    && record.propertyType === filters.propertyType
    && inArea(record.floorAreaSqm, filters.areaBand)
  );
  const optional = (record: UraPrivateSaleCheckRecord) => (
    (filters.floorRange === null || record.floorRange === filters.floorRange)
    && (filters.saleType === null || record.saleType === filters.saleType)
  );
  return Object.freeze([
    {
      level: 'exact',
      label: 'Selected project and filters',
      matches: (record) => shared(record)
        && record.district === filters.district
        && (filters.projectId === null || record.projectId === filters.projectId)
        && optional(record),
    },
    ...(filters.projectId === null ? [] : [{
      level: 'project' as const,
      label: 'Selected project',
      matches: (record: UraPrivateSaleCheckRecord) => shared(record)
        && record.projectId === filters.projectId,
    }]),
    {
      level: 'district',
      label: 'Selected district',
      matches: (record) => shared(record) && record.district === filters.district,
    },
    {
      level: 'segment',
      label: 'Selected market segment',
      matches: shared,
    },
  ]);
}

function hdbResaleScopes(offer: HdbResaleOffer): readonly ScopeCandidate<HdbResaleCheckRecord>[] {
  const { filters } = offer;
  const shared = (record: HdbResaleCheckRecord) => (
    record.flatType === filters.flatType && inArea(record.floorAreaSqm, filters.areaBand)
  );
  return Object.freeze([
    {
      level: 'exact',
      label: 'Selected block and filters',
      matches: (record) => shared(record)
        && record.town === filters.town
        && (filters.blockId === null || record.blockId === filters.blockId)
        && (filters.storeyRange === null || record.storeyRange === filters.storeyRange),
    },
    ...(filters.blockId === null ? [] : [{
      level: 'block' as const,
      label: 'Selected block',
      matches: (record: HdbResaleCheckRecord) => shared(record)
        && record.blockId === filters.blockId,
    }]),
    {
      level: 'town',
      label: 'Selected town',
      matches: (record) => shared(record) && record.town === filters.town,
    },
    { level: 'national', label: 'Singapore HDB', matches: shared },
  ]);
}

function hdbRentScopes(offer: HdbRentOffer): readonly ScopeCandidate<HdbRentCheckRecord>[] {
  const { filters } = offer;
  const shared = (record: HdbRentCheckRecord) => record.flatType === filters.flatType;
  return Object.freeze([
    {
      level: 'exact',
      label: 'Selected block and filters',
      matches: (record) => shared(record)
        && record.town === filters.town
        && (filters.blockId === null || record.blockId === filters.blockId),
    },
    ...(filters.blockId === null ? [] : [{
      level: 'block' as const,
      label: 'Selected block',
      matches: (record: HdbRentCheckRecord) => shared(record)
        && record.blockId === filters.blockId,
    }]),
    {
      level: 'town',
      label: 'Selected town',
      matches: (record) => shared(record) && record.town === filters.town,
    },
    { level: 'national', label: 'Singapore HDB', matches: shared },
  ]);
}

function fallbackDisclosure(level: SingaporeCheckScopeLevel): string | null {
  if (level === 'exact') return null;
  return `The exact selection was below five records; ${level} evidence is shown without widening the time window.`;
}

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort((left, right) => left.localeCompare(right, 'en')));
}

function secondaryEvidence(records: readonly SingaporeCheckRecord[]) {
  const first = records[0]!;
  if (first.market === 'ura-private-sale') {
    const typed = records as readonly UraPrivateSaleCheckRecord[];
    return Object.freeze({
      kind: 'ura-private-sale' as const,
      medianPsf: percentile(typed.map(({ psf }) => psf), 0.5),
      tenures: unique(typed.map(({ tenure }) => tenure)),
      floorRanges: unique(typed.map(({ floorRange }) => floorRange)),
      saleTypes: unique(typed.map(({ saleType }) => saleType)),
    });
  }
  if (first.market === 'hdb-resale') {
    const typed = records as readonly HdbResaleCheckRecord[];
    return Object.freeze({
      kind: 'hdb-resale' as const,
      remainingLeases: unique(typed.map(({ remainingLease }) => remainingLease)),
      flatModels: unique(typed.map(({ flatModel }) => flatModel)),
      storeyRanges: unique(typed.map(({ storeyRange }) => storeyRange)),
    });
  }
  return Object.freeze({ kind: 'hdb-rent' as const });
}

export function evaluateSingaporeCheckOffer(input: Readonly<{
  artifact: SingaporeCheckArtifact;
  offer: SingaporeCheckOffer;
}>): SingaporeCheckResult {
  const { artifact, offer } = input;
  if (artifact.market !== offer.market) return Object.freeze({
    status: 'unavailable',
    market: offer.market,
    reason: 'evidence-unavailable',
    message: 'Verified evidence for the selected Singapore market is unavailable.',
  });
  if (!validOffer(offer)) return Object.freeze({
    status: 'unavailable',
    market: offer.market,
    reason: 'invalid-input',
    message: 'Complete every required native-market field.',
  });
  const window = singaporeCompletedMonthWindow(artifact.period, offer.endMonth);
  if (window === null) return Object.freeze({
    status: 'unavailable',
    market: offer.market,
    reason: 'evidence-unavailable',
    message: 'The selected completed-month window is outside verified evidence.',
  });
  const records = artifact.records.filter((record) => (
    record.month >= window.from && record.month <= window.to
  ));
  const scopes = offer.market === 'ura-private-sale'
    ? uraScopes(offer)
    : offer.market === 'hdb-resale'
      ? hdbResaleScopes(offer)
      : hdbRentScopes(offer);
  const attemptedScopes: Array<{
    level: SingaporeCheckScopeLevel;
    label: string;
    count: number;
  }> = [];
  for (const scope of scopes as readonly ScopeCandidate<SingaporeCheckRecord>[]) {
    const matching = records.filter(scope.matches);
    attemptedScopes.push({ level: scope.level, label: scope.label, count: matching.length });
    if (matching.length < SINGAPORE_CHECK_PUBLICATION_MINIMUM) continue;
    const values = matching.map(({ amountSgd }) => amountSgd);
    return Object.freeze({
      status: 'ready',
      market: offer.market,
      amountSgd: offer.amountSgd,
      sourceIdentifier: artifact.sourceIdentifier,
      window,
      scope: Object.freeze({ level: scope.level, label: scope.label }),
      fallbackDisclosure: fallbackDisclosure(scope.level),
      distribution: Object.freeze({
        minimum: Math.min(...values),
        p25: percentile(values, 0.25),
        median: percentile(values, 0.5),
        p75: percentile(values, 0.75),
        maximum: Math.max(...values),
      }),
      percentile: percentileRank(values, offer.amountSgd),
      sampleCount: matching.length,
      minimumSample: SINGAPORE_CHECK_PUBLICATION_MINIMUM,
      secondary: secondaryEvidence(matching),
    });
  }
  const sampleCount = attemptedScopes.reduce((maximum, scope) => Math.max(maximum, scope.count), 0);
  return Object.freeze({
    status: 'insufficient',
    market: offer.market,
    window,
    sampleCount,
    minimumSample: SINGAPORE_CHECK_PUBLICATION_MINIMUM,
    attemptedScopes: Object.freeze(attemptedScopes.map((scope) => Object.freeze(scope))),
  });
}

export function compareSingaporeCheckOffers(
  left: SingaporeCheckResult,
  right: SingaporeCheckResult,
): SingaporeCheckComparison {
  if (left.status !== 'ready' || right.status !== 'ready') return Object.freeze({
    status: 'unavailable',
    reason: 'offer-evidence-unavailable',
    message: 'Both offers need supported native-market evidence before comparison.',
  });
  return Object.freeze({
    status: 'ready',
    basis: 'native-market-position',
    verdict: 'tradeoff',
    winner: null,
    marketRelationship: left.market === right.market ? 'same-market' : 'cross-market',
    offers: Object.freeze([left, right]) as readonly [typeof left, typeof right],
  });
}
