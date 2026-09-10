import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const config = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
) as Readonly<{
  crons?: readonly Readonly<{ path: string; schedule: string }>[];
}>;

const expectedMarketCrons = Object.freeze([
  Object.freeze({
    path: '/api/internal/market-data-refresh/?job=kr-seoul-sale',
    schedule: '10 18 * * *',
  }),
  Object.freeze({
    path: '/api/internal/market-data-refresh/?job=kr-seoul-rent',
    schedule: '25 18 * * *',
  }),
  Object.freeze({
    path: '/api/internal/market-data-refresh/?job=sg-private-sale',
    schedule: '10 2 * * *',
  }),
  Object.freeze({
    path: '/api/internal/market-data-refresh/?job=sg-private-rent',
    schedule: '25 2 * * *',
  }),
  Object.freeze({
    path: '/api/internal/market-data-refresh/?job=ae-dubai-transaction',
    schedule: '10 1 * * *',
  }),
  Object.freeze({
    path: '/api/internal/market-data-refresh/?job=ae-dubai-rent',
    schedule: '25 1 * * *',
  }),
]);

describe('market data refresh production schedules', () => {
  it('runs each isolated official-source job at its intended UTC cadence', () => {
    const marketCrons = (config.crons ?? []).filter(({ path }) => (
      path.startsWith('/api/internal/market-data-refresh/')
    ));
    expect(marketCrons).toEqual(expectedMarketCrons);
  });

  it('keeps every cron request path unique without replacing existing operations', () => {
    const crons = config.crons ?? [];
    expect(new Set(crons.map(({ path }) => path)).size).toBe(crons.length);
    expect(crons).toContainEqual({
      path: '/api/internal/public-entity-projection/',
      schedule: '57 0 * * *',
    });
    expect(crons).toContainEqual({
      path: '/api/internal/news-ingest/',
      schedule: '17 0 * * *',
    });
  });
});
