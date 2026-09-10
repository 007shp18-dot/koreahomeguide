import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { japanBackfillScopes, readJapanBackfillStatus, runJapanBackfill } from '../lib/japan/backfill.server';
import { collectJapanSnapshot, JapanNoDataError, scopeKey, type JapanScope } from '../lib/japan/source.server';
import type { refreshJapan } from '../lib/japan/refresh.server';
import type { MarketRefreshSqlPort } from '../lib/market-data/refresh-repository.server';

const now = new Date('2026-09-10T00:00:00Z');
function storage() {
  const rows = new Map<string, Record<string, unknown>>();
  const query = vi.fn(async (sql: string, params: readonly unknown[] = []) => {
    const [city, year, quarter, state] = params;
    const key = `${city}:${year}:Q${quarter}`;
    if (sql.includes('backfill-inventory')) return [...rows.values()];
    if (sql.includes('backfill-claim')) {
      rows.set(key, { city, year, quarter, published: false, retry_after: '2026-09-10T00:10:00Z' });
      return [{ city }];
    }
    if (sql.includes('backfill-finish')) {
      rows.set(key, { city, year, quarter, published: state === 'ready', retry_after: '2026-09-11T00:00:00Z' });
      return [];
    }
    throw new Error('unexpected_sql');
  });
  const port: MarketRefreshSqlPort = { query, transaction: vi.fn() };
  return { rows, query, port };
}
const ready = (scope: JapanScope) => ({ state: 'ready' as const, scope, releaseId: 'validated', received: 1,
  sourceAsOf: now.toISOString(), snapshotHash: 'a'.repeat(64) });

describe('Japan bounded durable initial backfill', () => {
  it('covers all 23 wards newest completed quarter first, through every quarter since2024', () => {
    const scopes = japanBackfillScopes(now);
    expect(scopes).toHaveLength(230);
    expect(new Set(scopes.map(scopeKey)).size).toBe(230);
    expect(scopes[0]).toEqual({ city: '13101', year: '2026', quarter: '2' });
    expect(scopes[23]).toEqual({ city: '13101', year: '2026', quarter: '1' });
    expect(scopes.at(-1)).toEqual({ city: '13123', year: '2024', quarter: '1' });
  });
  it('skips published and individually deferred scopes; records absence without publishing a zero', async () => {
    const db = storage();
    db.rows.set('13101:2026:Q2', { city: '13101', year: 2026, quarter: 2, published: true });
    db.rows.set('13102:2026:Q2', { city: '13102', year: 2026, quarter: 2, published: false, retry_after: '2026-09-11T00:00:00Z' });
    const calls: string[] = [];
    const refresh: typeof refreshJapan = vi.fn(async (_repo, scope) => {
      calls.push(scope.city);
      return scope.city === '13103' ? { state: 'failed' as const, code: 'no_data' } : ready(scope);
    });
    const pause = vi.fn(async () => {});
    const result = await runJapanBackfill({ apiKey: 'test', port: db.port, now, refresh, pause });
    expect(calls).toEqual(['13103', '13104', '13105']);
    expect(result).toMatchObject({ attempted: 3, published: 3, deferred: 2, remaining: 225 });
    expect(result.results[0]).toMatchObject({ state: 'failed' as const, code: 'no_data' });
    expect(pause.mock.calls).toEqual([[1000], [1000]]);
    const absence = db.query.mock.calls.find(([sql, params]) => sql.includes('backfill-finish') && params?.[3] === 'no_data');
    expect(absence?.[1]?.[4]).toBe(86400);
  });
  it('does not burst after a provider failure and leaves other wards eligible', async () => {
    const db = storage();
    const refresh: typeof refreshJapan = vi.fn(async () => ({ state: 'failed' as const, code: 'provider_unavailable' }));
    const result = await runJapanBackfill({ apiKey: 'test', port: db.port, now, refresh });
    expect(result.attempted).toBe(1);
    expect(result.remaining).toBe(229);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it('reserves request time, and honours a contended global collection lease', async () => {
    const db = storage();
    let clock = 0;
    const refresh: typeof refreshJapan = vi.fn(async (_repo, scope) => { clock = 50_000; return ready(scope); });
    expect((await runJapanBackfill({ apiKey: 'test', port: db.port, now, refresh, clock: () => clock })).attempted).toBe(1);
    const busy: typeof refreshJapan = vi.fn(async () => ({ state: 'busy' as const }));
    expect((await runJapanBackfill({ apiKey: 'test', port: db.port, now, refresh: busy })).state).toBe('busy');
    expect(busy).toHaveBeenCalledTimes(1);
  });
  it('does not mark an entire quarter unavailable from a single404', async () => {
    const db = storage();
    db.rows.set('13101:2026:Q2', { city: '13101', year: 2026, quarter: 2, published: false, retry_after: '2026-09-11T00:00:00Z' });
    const status = await readJapanBackfillStatus(db.port, now);
    expect(status.quarters[0]).toMatchObject({ published: 0, deferred: 1, remaining: 22 });
    expect(status.next?.city).toBe('13102');
    const fetch404 = vi.fn(async () => new Response(null, { status: 404 }));
    await expect(collectJapanSnapshot(status.next!, 'test', fetch404)).rejects.toBeInstanceOf(JapanNoDataError);
    await expect(collectJapanSnapshot(status.next!, 'test', vi.fn(async () => new Response(null, { status: 500 })))).rejects.toThrow('provider_unavailable');
  });
  it('reports deferred, not complete, when missing scopes are awaiting the provider recheck', async () => {
    const db = storage();
    for (const scope of japanBackfillScopes(now)) db.rows.set(scopeKey(scope), {
      ...scope, published: false, retry_after: '2026-09-11T00:00:00Z',
    });
    const refresh: typeof refreshJapan = vi.fn(async (_repo, scope) => ready(scope));
    const result = await runJapanBackfill({ apiKey: 'test', port: db.port, now, refresh });
    expect(result).toMatchObject({ state: 'deferred', published: 0, remaining: 0, deferred: 230, attempted: 0 });
    expect(refresh).not.toHaveBeenCalled();
  });
});
