import type { DubaiHousingSegment, DubaiSaleStage } from './evidence-contract';
import type { DubaiExploreArea } from './route-types';

export const DUBAI_COMPARISON_STORAGE_KEY = 'signedprice:comparison:dubai:v1';
export const COMPARISON_LIMIT = 3;
export const SAVED_COMPARISON_LIMIT = 10;
export type DubaiComparison = Readonly<{
  areas: readonly string[];
  housing: DubaiHousingSegment;
  stage: DubaiSaleStage;
  from: string;
  to: string;
}>;
const date = (value: unknown): value is string => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
  && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

export function parseDubaiComparison(value: unknown): DubaiComparison | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (!Array.isArray(candidate.areas) || candidate.areas.length < 2 || candidate.areas.length > COMPARISON_LIMIT
    || !candidate.areas.every((slug: unknown) => typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 100)
    || new Set(candidate.areas).size !== candidate.areas.length
    || (candidate.housing !== 'apartment' && candidate.housing !== 'villa')
    || (candidate.stage !== 'ready' && candidate.stage !== 'off-plan')
    || !date(candidate.from) || !date(candidate.to) || candidate.from > candidate.to) return null;
  return { areas: candidate.areas, housing: candidate.housing as DubaiHousingSegment,
    stage: candidate.stage as DubaiSaleStage, from: candidate.from, to: candidate.to };
}

export function comparisonHash(preset: DubaiComparison): string {
  return `#compare=${encodeURIComponent(JSON.stringify(preset))}`;
}
export function comparisonFromHash(hash: string): DubaiComparison | null {
  if (!hash.startsWith('#compare=') || hash.length > 2048) return null;
  try { return parseDubaiComparison(JSON.parse(decodeURIComponent(hash.slice(9)))); }
  catch { return null; }
}
export function savedComparisons(raw: string | null): DubaiComparison[] {
  if (!raw || raw.length > 16000) return [];
  try {
    const values: unknown = JSON.parse(raw);
    if (!Array.isArray(values)) return [];
    return values.slice(0, SAVED_COMPARISON_LIMIT).flatMap(value => {
      const valid = parseDubaiComparison(value);
      return valid ? [valid] : [];
    });
  } catch { return []; }
}
export function saveComparison(existing: readonly DubaiComparison[], next: DubaiComparison): DubaiComparison[] {
  const key = (item: DubaiComparison) => `${[...item.areas].sort().join(',')}:${item.housing}:${item.stage}`;
  return [next, ...existing.filter(item => key(item) !== key(next))].slice(0, SAVED_COMPARISON_LIMIT);
}
export function comparisonRows(areas: readonly DubaiExploreArea[], preset: DubaiComparison) {
  return preset.areas.map(slug => {
    const area = areas.find(item => item.slug === slug) ?? null;
    const segment = area?.segments.find(item => item.housing === preset.housing) ?? null;
    return { slug, area, sale: segment?.sales[preset.stage === 'ready' ? 'ready' : 'offPlan'] ?? null,
      rent: preset.stage === 'ready' ? segment?.rent ?? null : null };
  });
}
