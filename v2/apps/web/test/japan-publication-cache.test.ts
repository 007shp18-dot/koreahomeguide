import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ read: vi.fn(), coverage: vi.fn(), entries: new Map<string, unknown>(), settings: vi.fn() }));
vi.mock('../lib/japan/repository.server', () => ({ readJapanPublication: mocks.read, readJapanCoverage: mocks.coverage }));
vi.mock('next/cache', () => ({ unstable_cache: (fn: (...args: unknown[]) => Promise<unknown>, keys: string[], options: { revalidate: number }) => {
  mocks.settings(keys, options);
  return async (...args: unknown[]) => {
    const key = JSON.stringify([keys, args]);
    if (mocks.entries.has(key)) return mocks.entries.get(key);
    const data = await fn(...args); // An exception never creates an entry.
    mocks.entries.set(key, data);
    return data;
  };
} }));
import { readCachedJapanCoverage, readCachedJapanPublication } from '../lib/japan/publication-cache.server';
const scope = { city: '13103', year: '2025', quarter: '4' };
const filters = { q: '', type: '', minArea: null, maxArea: null, page: 1, release: null };
beforeEach(() => { mocks.entries.clear(); mocks.read.mockReset(); mocks.coverage.mockReset(); });
describe('shared Japan Data Cache contract', () => {
  it('shares current publication metadata briefly and never converts storage errors into an empty coverage cache', async () => {
    expect(mocks.settings).toHaveBeenCalledWith(['jp-tokyo-published-coverage-v1'], { revalidate: 60 });
    mocks.coverage.mockRejectedValueOnce(new Error('database failure')).mockResolvedValueOnce([
      { city: '13113', year: '2026', quarter: '1', sourceCount: 12 },
    ]);
    await expect(readCachedJapanCoverage()).rejects.toThrow('database failure');
    expect(await readCachedJapanCoverage()).toEqual([{ city: '13113', year: '2026', quarter: '1', sourceCount: 12 }]);
    await readCachedJapanCoverage();
    expect(mocks.coverage).toHaveBeenCalledTimes(2);
  });
  it('uses a 60-second bounded response cache shared by page and API without restamping source time', async () => {
    expect(mocks.settings).toHaveBeenCalledWith(['jp-tokyo-published-transactions-v1'], { revalidate: 60 });
    mocks.read.mockResolvedValue({ releaseId: 'published', retrievedAt: '2025-12-01T00:00:00Z', records: [] });
    await readCachedJapanPublication(scope, filters);
    expect((await readCachedJapanPublication({ ...scope }, { ...filters }))?.retrievedAt).toBe('2025-12-01T00:00:00Z');
    expect(mocks.read).toHaveBeenCalledTimes(1);
  });
  it('separates scopes, releases and filter/pagination variants', async () => {
    mocks.read.mockResolvedValue({ records: [] });
    await readCachedJapanPublication(scope, filters);
    await readCachedJapanPublication({ ...scope, quarter: '3' }, filters);
    await readCachedJapanPublication(scope, { ...filters, q: 'Azabu' });
    await readCachedJapanPublication(scope, { ...filters, page: 2 });
    await readCachedJapanPublication(scope, { ...filters, release: 'jp-area-11111111-1111-1111-1111-111111111111' });
    expect(mocks.read).toHaveBeenCalledTimes(5);
  });
  it('does not cache unpublished scopes or errors, so a later successful release can appear immediately', async () => {
    mocks.read.mockResolvedValueOnce(null).mockRejectedValueOnce(new Error('database failure')).mockResolvedValueOnce({ releaseId: 'new' });
    expect(await readCachedJapanPublication(scope, filters)).toBeNull();
    await expect(readCachedJapanPublication(scope, filters)).rejects.toThrow('database failure');
    expect((await readCachedJapanPublication(scope, filters))?.releaseId).toBe('new');
    expect(mocks.read).toHaveBeenCalledTimes(3);
  });
});
