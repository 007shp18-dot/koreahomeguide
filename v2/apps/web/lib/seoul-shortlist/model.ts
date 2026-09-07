import type { KoreaSaleEvidenceBuildingRecord, KoreaSaleEvidenceRecentSale } from '@signedprice/korea-rent';

export type SearchFilters = { budget: number; minArea: number; maxArea: number; district: string };
export const DEFAULT_FILTERS: SearchFilters = { budget: 1_000_000_000, minArea: 59, maxArea: 85, district: 'all' };
export type ShortlistItem = {
  key: string; buildingId: string; district: string; name: string; neighborhood: string;
  latest: KoreaSaleEvidenceRecentSale; matchingCount: number; signatures: string[];
};
export type ShortlistResult = {
  status: 'ready'; period: string; generatedAt: string; since: string;
  total: number; page: number; pageSize: number; items: ShortlistItem[];
  saved: ShortlistItem[]; missingSavedIds: string[];
};
export function validFilters(value: unknown): value is SearchFilters {
  if (!value || typeof value !== 'object') return false;
  const f = value as SearchFilters;
  return Number.isSafeInteger(f.budget) && f.budget >= 10_000_000 && f.budget <= 100_000_000_000
    && Number.isFinite(f.minArea) && f.minArea >= 1 && f.minArea <= 500
    && Number.isFinite(f.maxArea) && f.maxArea >= f.minArea && f.maxArea <= 500
    && typeof f.district === 'string' && /^[a-z-]{1,30}$/.test(f.district);
}
export function saleSignature(sale: KoreaSaleEvidenceRecentSale): string {
  return [sale.filedMonth, sale.areaSqm, sale.priceWon, sale.floor ?? '', sale.buildYear ?? ''].join('|');
}
export function newlyObservedCount(previous: readonly string[], current: readonly string[]): number {
  const counts = new Map<string, number>();
  for (const key of previous) counts.set(key, (counts.get(key) ?? 0) + 1);
  let added = 0;
  for (const key of current) {
    const remaining = counts.get(key) ?? 0;
    if (remaining > 0) counts.set(key, remaining - 1);
    else added++;
  }
  return added;
}
export function buildShortlist(
  source: { period: string; generatedAt: string; buildingRecords: readonly KoreaSaleEvidenceBuildingRecord[] },
  filters: SearchFilters,
  savedIds: readonly string[] = [],
  page = 1,
): ShortlistResult {
  const end = source.period.split('/')[1]!;
  const [year, month] = end.split('-').map(Number);
  const start = new Date(Date.UTC(year!, month! - 3, 1));
  const since = start.toISOString().slice(0, 7);
  const candidates: ShortlistItem[] = [];
  const saved: ShortlistItem[] = [];
  const wanted = new Set(savedIds);
  for (const building of source.buildingRecords) {
    if (building.housingType !== 'apartment' || !building.cohorts.some(c => c.areaBand === 'all' && c.price.published)) continue;
    const sales = building.recentSales;
    if (!sales.length) continue;
    const key = `${building.districtSlug}/${building.buildingId}`;
    const base = {
      key, buildingId: building.buildingId, district: building.districtSlug,
      name: building.officialName, neighborhood: building.neighborhoodName,
      signatures: sales.map(saleSignature),
    };
    if (wanted.has(key)) saved.push({ ...base, latest: sales[0]!, matchingCount: sales.length });
    if (filters.district !== 'all' && filters.district !== building.districtSlug) continue;
    const matching = sales.filter(s => s.filedMonth >= since && s.priceWon <= filters.budget
      && s.areaSqm >= filters.minArea && s.areaSqm <= filters.maxArea);
    if (matching.length) candidates.push({ ...base, latest: matching[0]!, matchingCount: matching.length });
  }
  candidates.sort((a, b) => b.latest.filedMonth.localeCompare(a.latest.filedMonth)
    || b.matchingCount - a.matchingCount || a.latest.priceWon - b.latest.priceWon || a.key.localeCompare(b.key));
  const pageSize = 24;
  const effectivePage = Math.min(Math.max(1, page), Math.max(1, Math.ceil(candidates.length / pageSize)));
  return {
    status: 'ready', period: source.period, generatedAt: source.generatedAt, since,
    total: candidates.length, page: effectivePage, pageSize,
    items: candidates.slice((effectivePage - 1) * pageSize, effectivePage * pageSize), saved,
    missingSavedIds: savedIds.filter(id => !saved.some(item => item.key === id)),
  };
}
