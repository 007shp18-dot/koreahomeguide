import { afterEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { defaults } from '../lib/global-shortlist/model';
import { parseGlobalSaved, readGlobalSaved, writeGlobalSaved } from '../lib/global-shortlist/storage';
import { singaporeBudget, dubaiBudget } from '../lib/global-shortlist/repository.server';
import { createInstalledSnapshotRepository, resolveInstalledSnapshotObject, resolveInstalledSnapshotRegistry } from '../lib/snapshots/installed-snapshot-repository.server';
import { createSingaporeSnapshotRepositoryFromInstalled } from '../lib/singapore/snapshot-repository.server';
import { createDubaiEvidenceRepositoryFromInstalled } from '../lib/dubai/evidence-repository.server';
import { GET } from '../app/api/shortlist/[market]/route';
afterEach(() => vi.unstubAllGlobals());
const installed = () => createInstalledSnapshotRepository({ registrySource: resolveInstalledSnapshotRegistry(), resolveObject: resolveInstalledSnapshotObject });
it('screens installed Singapore resales and preserves saved projects outside the filter', async () => {
  const repository = await createSingaporeSnapshotRepositoryFromInstalled(installed().get('sg-singapore', 'sg-private-sale'));
  const f = defaults('singapore');
  const result = singaporeBudget(repository, f, [], 1);
  expect(result.total).toBeGreaterThan(0);
  expect(result.items.length).toBeLessThanOrEqual(24);
  for (const item of result.items) {
    expect(item.price).toBeLessThanOrEqual(f.budget);
    expect(item.description.match(/\d{4}-\d{2}/)![0] >= result.period.split('..')[0]!).toBe(true);
    const q = new URL(item.checkHref, 'https://example.com').searchParams;
    expect(Number(q.get('a-area-min'))).toBeGreaterThanOrEqual(f.minArea);
    expect(Number(q.get('a-area-max'))).toBeLessThanOrEqual(f.maxArea);
    expect(q.get('a-project')).toBe(item.key.split('/')[1]);
    expect(q.get('a-amount')).toBeNull();
  }
  const key = result.items[0]!.key;
  const narrowed = singaporeBudget(repository, { ...f, budget: 1 }, [key], 1);
  expect(narrowed.total).toBe(0); expect(narrowed.saved[0]!.key).toBe(key);
  console.info('Singapore budget release', result.period, result.total, result.items[0]?.name);
});
it('screens Dubai medians separately by completion and housing without inventing unit matches', () => {
  const repository = createDubaiEvidenceRepositoryFromInstalled(installed().get('ae-dubai', 'ae-area-evidence'));
  const f = defaults('dubai');
  const result = dubaiBudget(repository, { ...f, budget: 500_000_000 }, [], 1);
  expect(result.total).toBeGreaterThan(0);
  for (const item of result.items) {
    const sale = repository.getArea(item.region)!.segments.find(s => s.housing === 'apartment')!.sales.ready!;
    expect(item.price).toBe(sale.medianPriceAed); expect(item.count).toBeGreaterThanOrEqual(30);
    expect(item.checkHref).toContain('completion=ready'); expect(item.checkHref).not.toContain('price=');
  }
  expect(dubaiBudget(repository, { ...f, budget: 1 }, [result.items[0]!.key], 1).saved).toHaveLength(1);
  console.info('Dubai budget release', result.period, 'ready areas', result.total);
});
it('rejects bad requests before accessing evidence', async () => {
  for (const query of ['budget=NaN', 'page=0', 'housing=castle', 'minArea=100&maxArea=10', 'saved=javascript:alert(1)']) expect((await GET(new Request(`https://example.com?${query}`), { params: Promise.resolve({ market: 'singapore' }) })).status).toBe(400);
  expect((await GET(new Request('https://example.com'), { params: Promise.resolve({ market: 'unknown' }) })).status).toBe(404);
});
it('restores both city filters, rejects unsafe saved identities, and respects cleared storage', () => {
  const state = parseGlobalSaved(''); state.filters.dubai.budget = 2_000_000;
  state.places.push({ market: 'dubai', key: 'marina/apartment-ready', name: 'Marina', signature: 'a'.repeat(64), checkedAt: '2026-09-07T00:00:00Z' });
  expect(parseGlobalSaved(JSON.stringify(state))).toEqual(state);
  expect(parseGlobalSaved(JSON.stringify({ ...state, places: [{ ...state.places[0], key: '../escape' }] })).places).toEqual([]);
  let value: string | null = null;
  vi.stubGlobal('window', { localStorage: { setItem: (_: string, raw: string) => { value = raw; }, getItem: () => value }, dispatchEvent: vi.fn() });
  expect(writeGlobalSaved(state)).toBe(true); expect(parseGlobalSaved(readGlobalSaved())).toEqual(state);
  value = null; expect(parseGlobalSaved(readGlobalSaved()).places).toEqual([]);
});
