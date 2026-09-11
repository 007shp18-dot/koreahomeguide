import { TOKYO_WARDS } from './query';

export type TokyoCheckParams = Record<string, string | string[] | undefined>;
export type TokyoCheckInput = { city: string; neighbourhood: string; area: number; price: number };
export type TokyoPriceDistribution = { count: number; median: number | null; lower: number | null; upper: number | null };

export function parseTokyoCheck(params: TokyoCheckParams): TokyoCheckInput | null {
  if (params.price === undefined && params.area === undefined) return null;
  for (const key of ['city', 'neighbourhood', 'area', 'price']) if (Array.isArray(params[key])) throw new TypeError('invalid_input');
  const city = params.city ?? '13103';
  const neighbourhood = String(params.neighbourhood ?? '').trim();
  const area = Number(params.area), price = Number(params.price);
  if (!TOKYO_WARDS.some(([code]) => code === city) || neighbourhood.length > 100
    || !Number.isFinite(area) || area <= 0 || area > 2000
    || !Number.isFinite(price) || price <= 0 || price > 100_000_000_000) throw new TypeError('invalid_input');
  return { city: String(city), neighbourhood, area, price };
}

/** A descriptive comparison only. Never estimate a property value from the median. */
export function compareTokyoPrice(price: number, area: number, evidence: TokyoPriceDistribution) {
  if (evidence.count < 5 || !evidence.median || evidence.median <= 0 || !Number.isFinite(evidence.median)
    || !Number.isFinite(price) || price <= 0 || !Number.isFinite(area) || area <= 0) return null;
  const askingPerSqm = price / area;
  return { askingPerSqm, differencePercent: (askingPerSqm / evidence.median - 1) * 100 };
}
