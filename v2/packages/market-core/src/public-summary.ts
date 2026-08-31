import { marketIds, type MarketId } from './markets';

export type PublicMarketSummaryIdentity = Readonly<{
  marketId: MarketId;
  area: string;
  parent: string;
  deal: string;
  band: string;
  period: string;
  n: number;
}>;

export type WithheldMarketSummary = PublicMarketSummaryIdentity & Readonly<{
  published: false;
}>;

export type PublishedMarketSummary = PublicMarketSummaryIdentity & Readonly<{
  published: true;
  min: number;
  p25: number;
  med: number;
  p75: number;
  max: number;
  chg3m: number | null;
}>;

export type PublicMarketSummary = WithheldMarketSummary | PublishedMarketSummary;

export type PublicMarketSummaryInput = Omit<PublicMarketSummaryIdentity, 'n'> & Readonly<{
  n: number;
  min?: number;
  p25?: number;
  med?: number;
  p75?: number;
  max?: number;
  chg3m?: number | null;
}>;

const PERIOD_PATTERN = /^\d{4}-(?:0[1-9]|1[0-2])\/\d{4}-(?:0[1-9]|1[0-2])$/;

function assertIdentity(input: PublicMarketSummaryInput) {
  if (!marketIds.includes(input.marketId)) {
    throw new TypeError('marketId must identify a configured market');
  }
  for (const [key, value] of [
    ['area', input.area],
    ['parent', input.parent],
    ['deal', input.deal],
    ['band', input.band],
  ] as const) {
    if (value.trim().length === 0) {
      throw new TypeError(`${key} must be non-empty`);
    }
  }

  if (!PERIOD_PATTERN.test(input.period)) {
    throw new TypeError('period must be a completed YYYY-MM/YYYY-MM range');
  }
  const [periodStart, periodEnd] = input.period.split('/');
  if (periodStart! > periodEnd!) {
    throw new TypeError('period range must be ordered');
  }
  if (!Number.isInteger(input.n) || input.n < 0) {
    throw new TypeError('n must be a non-negative integer');
  }
}

function identityFrom(input: PublicMarketSummaryInput): PublicMarketSummaryIdentity {
  return {
    marketId: input.marketId,
    area: input.area,
    parent: input.parent,
    deal: input.deal,
    band: input.band,
    period: input.period,
    n: input.n,
  };
}

export function createPublicMarketSummary(
  input: PublicMarketSummaryInput,
): PublicMarketSummary {
  assertIdentity(input);
  const identity = identityFrom(input);

  if (input.n < 5) {
    return Object.freeze({ ...identity, published: false });
  }

  const fiveNumber = [input.min, input.p25, input.med, input.p75, input.max];
  if (fiveNumber.some((value) => value === undefined)) {
    throw new TypeError('published summaries require a complete five-number summary');
  }
  if (fiveNumber.some((value) => !Number.isFinite(value))) {
    throw new TypeError('published summary values must be finite');
  }
  if (fiveNumber.some((value) => value! < 0)) {
    throw new TypeError('published summary values must be non-negative');
  }
  for (let index = 1; index < fiveNumber.length; index += 1) {
    if (fiveNumber[index]! < fiveNumber[index - 1]!) {
      throw new TypeError('published five-number values must be ordered');
    }
  }
  if (input.chg3m !== undefined && input.chg3m !== null && !Number.isFinite(input.chg3m)) {
    throw new TypeError('chg3m must be finite or null');
  }

  return Object.freeze({
    ...identity,
    published: true,
    min: input.min!,
    p25: input.p25!,
    med: input.med!,
    p75: input.p75!,
    max: input.max!,
    chg3m: input.chg3m ?? null,
  });
}
