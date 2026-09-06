import type { DubaiSaleDistribution } from './evidence-contract';

export type DubaiCheckQuery = Readonly<{
  area: string;
  housing: 'apartment' | 'villa';
  completion: 'ready' | 'off-plan';
  askingPriceAed: number | null;
  areaSqm: number | null;
  annualRentAed: number | null;
  returnTo: string | null;
}>;

export type DubaiCheckInput = Readonly<{
  askingPriceAed: number;
  areaSqm: number;
  annualRentAed: number;
  benchmark: DubaiSaleDistribution;
}>;

export type DubaiCheckResult = Readonly<{
  askingPriceAed: number;
  benchmarkMedianPriceAed: number;
  priceDifferencePct: number;
  askingPricePerSqmAed: number;
  benchmarkMedianPricePerSqmAed: number;
  pricePerSqmDifferencePct: number;
  grossYieldPct: number;
  verdict: 'below-middle-range' | 'within-middle-range' | 'above-middle-range';
}>;

export type DubaiCheckRouteState = Readonly<{
  kind: 'empty' | 'invalid';
  query: null;
}> | Readonly<{
  kind: 'ready';
  query: DubaiCheckQuery;
}>;

const DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/u;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
function difference(value: number, reference: number): number {
  return round((value / reference - 1) * 100, 1);
}

function inputNumber(value: unknown, minimum: number, maximum: number): number | null | 'invalid' {
  if (value === undefined || value === '') return null;
  if (typeof value !== 'string' || !DECIMAL.test(value)) return 'invalid';
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : 'invalid';
}

function safeReturnTo(value: unknown): string | null | 'invalid' {
  if (value === undefined || value === '') return null;
  if (typeof value !== 'string' || !value.startsWith('/ae/dubai/')
    || value.startsWith('//') || value.includes('\\') || value.includes('\0')) return 'invalid';
  try {
    const parsed = new URL(value, 'https://www.signedprice.com');
    if (parsed.origin !== 'https://www.signedprice.com') return 'invalid';
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return 'invalid';
  }
}

export function calculateDubaiCheck(input: DubaiCheckInput): DubaiCheckResult {
  if (![input.askingPriceAed, input.areaSqm, input.annualRentAed].every(Number.isFinite)
    || input.askingPriceAed <= 0 || input.areaSqm <= 0 || input.annualRentAed <= 0) {
    throw new Error('Invalid Dubai Check input');
  }
  const askingPricePerSqmAed = input.askingPriceAed / input.areaSqm;
  const verdict = askingPricePerSqmAed < input.benchmark.pricePerSqmP25Aed
    ? 'below-middle-range'
    : askingPricePerSqmAed > input.benchmark.pricePerSqmP75Aed
      ? 'above-middle-range'
      : 'within-middle-range';
  return Object.freeze({
    askingPriceAed: input.askingPriceAed,
    benchmarkMedianPriceAed: input.benchmark.medianPriceAed,
    priceDifferencePct: difference(input.askingPriceAed, input.benchmark.medianPriceAed),
    askingPricePerSqmAed: round(askingPricePerSqmAed, 2),
    benchmarkMedianPricePerSqmAed: input.benchmark.medianPricePerSqmAed,
    pricePerSqmDifferencePct: difference(askingPricePerSqmAed, input.benchmark.medianPricePerSqmAed),
    grossYieldPct: round(input.annualRentAed / input.askingPriceAed * 100, 1),
    verdict,
  });
}

export function parseDubaiCheckQuery(
  query: Readonly<Record<string, string | string[] | undefined>>,
): DubaiCheckQuery | null {
  for (const value of Object.values(query)) if (Array.isArray(value)) return null;
  const area = query.area;
  const housing = query.housing ?? 'apartment';
  const completion = query.completion ?? 'ready';
  if (typeof area !== 'string' || !SLUG.test(area)
    || (housing !== 'apartment' && housing !== 'villa')
    || (completion !== 'ready' && completion !== 'off-plan')) return null;
  const askingPriceAed = inputNumber(query.price, 100_000, 500_000_000);
  const areaSqm = inputNumber(query.areaSqm, 10, 1_000);
  const annualRentAed = inputNumber(query.annualRent, 5_000, 20_000_000);
  const returnTo = safeReturnTo(query.returnTo);
  if (askingPriceAed === 'invalid' || areaSqm === 'invalid'
    || annualRentAed === 'invalid' || returnTo === 'invalid') return null;
  return Object.freeze({
    area,
    housing,
    completion,
    askingPriceAed,
    areaSqm,
    annualRentAed,
    returnTo,
  });
}

export function resolveDubaiCheckRouteState(
  query: Readonly<Record<string, string | string[] | undefined>>,
): DubaiCheckRouteState {
  const submitted = ['area', 'housing', 'completion', 'price', 'areaSqm', 'annualRent', 'returnTo']
    .some((key) => Object.hasOwn(query, key));
  if (!submitted) return Object.freeze({ kind: 'empty', query: null });
  const parsed = parseDubaiCheckQuery(query);
  return parsed === null
    ? Object.freeze({ kind: 'invalid', query: null })
    : Object.freeze({ kind: 'ready', query: parsed });
}

export function createDubaiCheckHref(input: DubaiCheckQuery): `/ae/dubai/check/?${string}` {
  const query = new URLSearchParams({
    area: input.area,
    housing: input.housing,
    completion: input.completion,
  });
  if (input.askingPriceAed !== null) query.set('price', String(input.askingPriceAed));
  if (input.areaSqm !== null) query.set('areaSqm', String(input.areaSqm));
  if (input.annualRentAed !== null) query.set('annualRent', String(input.annualRentAed));
  if (input.returnTo !== null) query.set('returnTo', input.returnTo);
  return `/ae/dubai/check/?${query.toString()}`;
}
