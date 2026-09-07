import { afterEach, describe, expect, it, vi } from 'vitest';
import type { KoreaSaleEvidenceBuildingRecord } from '@signedprice/korea-rent';
import { buildShortlist, DEFAULT_FILTERS, newlyObservedCount, validFilters } from '../lib/seoul-shortlist/model';
import { parseSavedSearch, readSavedSearch, writeSavedSearch } from '../lib/seoul-shortlist/storage';
vi.mock('server-only', () => ({}));
import { GET } from '../app/api/seoul/shortlist/route';
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
const record = (overrides: Partial<KoreaSaleEvidenceBuildingRecord> = {}): KoreaSaleEvidenceBuildingRecord => ({
  buildingId: 'jongno-test', districtSlug: 'jongno-gu', neighborhoodId: 'n1', neighborhoodName: '동', officialName: '테스트 단지', housingType: 'apartment',
  cohorts: [{ areaBand: 'all', price: { n: 5, published: true, med: 800_000_000, chg3m: null, p25: 700_000_000, p75: 900_000_000, min: 600_000_000, max: 1_000_000_000 } }],
  recentSales: [{ filedMonth: '2026-08', areaSqm: 84.9, priceWon: 900_000_000, floor: 3 }], ...overrides,
});
const source = (buildingRecords = [record()]) => ({ period: '2026-02/2026-08', generatedAt: '2026-09-07T00:00:00Z', buildingRecords });
describe('Seoul saved search', () => {
  it('matches district, exact area and budget inclusively within three source months', () => {
    const result = buildShortlist(source(), { budget: 900_000_000, minArea: 84.9, maxArea: 84.9, district: 'jongno-gu' });
    expect(result.total).toBe(1); expect(result.since).toBe('2026-06');
    for (const filter of [{ budget: 899_999_999 }, { minArea: 85 }, { maxArea: 84 }, { district: 'gangnam' }]) {
      expect(buildShortlist(source(), { ...DEFAULT_FILTERS, ...filter }).total).toBe(0);
    }
    expect(buildShortlist(source([record({ recentSales: [{ filedMonth: '2026-05', areaSqm: 84, priceWon: 800_000_000 }] })]), DEFAULT_FILTERS).total).toBe(0);
  });
  it('never substitutes unpublished or non-apartment evidence', () => {
    const rows = [record({ housingType: 'officetel' }), record({ cohorts: [{ areaBand: 'all', price: { n: 4, published: false } }] })];
    expect(buildShortlist(source(rows), DEFAULT_FILTERS).total).toBe(0);
  });
  it('retains saved apartments independently of the active price filters', () => {
    const result = buildShortlist(source(), { ...DEFAULT_FILTERS, budget: 100_000_000 }, ['jongno-gu/jongno-test', 'jongno-gu/missing']);
    expect(result.items).toHaveLength(0); expect(result.saved).toHaveLength(1);
    expect(result.missingSavedIds).toEqual(['jongno-gu/missing']);
  });
  it('paginates deterministically and clamps a stale page after filters change', () => {
    const rows = Array.from({ length: 25 }, (_, i) => record({ buildingId: `b${i}` }));
    const result = buildShortlist(source(rows), DEFAULT_FILTERS, [], 99);
    expect(result.page).toBe(2); expect(result.items).toHaveLength(1); expect(result.total).toBe(25);
  });
  it('compares multisets: ordering and dropping old records do not create alerts', () => {
    expect(newlyObservedCount(['a', 'b'], ['b', 'a'])).toBe(0);
    expect(newlyObservedCount(['a', 'b'], ['a'])).toBe(0);
    expect(newlyObservedCount(['a'], ['a', 'a'])).toBe(1);
    expect(newlyObservedCount(['a', 'b'], ['a', 'c'])).toBe(1);
  });
  it('rejects corrupt, unsupported and non-finite browser conditions', () => {
    expect(parseSavedSearch('not json').filters).toEqual(DEFAULT_FILTERS);
    expect(parseSavedSearch('{"version":2}').buildings).toEqual([]);
    expect(validFilters({ ...DEFAULT_FILTERS, budget: Infinity })).toBe(false);
    expect(validFilters({ ...DEFAULT_FILTERS, minArea: 100, maxArea: 90 })).toBe(false);
  });
  it('restores a saved baseline without reporting existing records as new', () => {
    const item = buildShortlist(source(), DEFAULT_FILTERS).items[0]!;
    const value = parseSavedSearch(JSON.stringify({ version: 1, filters: DEFAULT_FILTERS, buildings: [{ key: item.key, name: item.name, signatures: item.signatures, checkedAt: '2026-09-07T00:00:00Z' }] }));
    expect(value.buildings).toHaveLength(1);
    expect(newlyObservedCount(value.buildings[0]!.signatures, item.signatures)).toBe(0);
  });
  it('does not restore successfully saved data after browser storage is cleared', () => {
    let value: string | null = null;
    vi.stubGlobal('window', { localStorage: { getItem: () => value, setItem: (_key: string, raw: string) => { value = raw; } }, dispatchEvent: vi.fn() });
    expect(writeSavedSearch({ version: 1, filters: { ...DEFAULT_FILTERS, budget: 700_000_000 }, buildings: [] })).toBe(true);
    value = null;
    expect(parseSavedSearch(readSavedSearch()).filters).toEqual(DEFAULT_FILTERS);
  });
  it('provides a session fallback when storage writes fail', () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => '', setItem: () => { throw new Error('quota'); } }, dispatchEvent: vi.fn() });
    const state = { version: 1 as const, filters: { ...DEFAULT_FILTERS, budget: 700_000_000 }, buildings: [] };
    expect(writeSavedSearch(state)).toBe(false);
    expect(parseSavedSearch(readSavedSearch()).filters.budget).toBe(700_000_000);
  });
  it('rejects invalid and unbounded API queries', async () => {
    for (const query of ['budget=NaN', 'district=unknown', 'minArea=90&maxArea=59', 'page=0', Array(31).fill('saved=jongno/a').join('&')]) {
      expect((await GET(new Request(`https://example.com/api/seoul/shortlist?${query}`))).status).toBe(400);
    }
  });
});

 it('searches the installed verified release without shipping the full artifact', async () => {
   const { koreaEvidenceRepositoriesFromEnvironment } = await import('../lib/public-market/korea-evidence-repositories.server');
   const sale = koreaEvidenceRepositoriesFromEnvironment({ useCheckedInSnapshot: true, retainLastVerified: false }).sale;
   expect(sale).not.toBeNull();
   const result = buildShortlist(sale!.getArtifact(), DEFAULT_FILTERS);
   expect(result.total).toBeGreaterThan(0);
   expect(result.items.length).toBeLessThanOrEqual(24);
   for (const item of result.items) {
     expect(item.latest.priceWon).toBeLessThanOrEqual(DEFAULT_FILTERS.budget);
     expect(item.latest.areaSqm).toBeGreaterThanOrEqual(DEFAULT_FILTERS.minArea);
     expect(item.latest.areaSqm).toBeLessThanOrEqual(DEFAULT_FILTERS.maxArea);
   }
   console.info('Installed shortlist', { period: result.period, total: result.total, first: result.items[0]?.name });
 });
