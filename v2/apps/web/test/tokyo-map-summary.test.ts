import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
vi.mock('server-only', () => ({}));
import { readTokyoMapSummary } from '../lib/japan/map-summary.server';
import type { MarketRefreshSqlPort } from '../lib/market-data/refresh-repository.server';

const modulePath = process.env.JAPAN_TEST_PGLITE_MODULE;
const suite = modulePath ? describe : describe.skip;
suite('Tokyo map aggregates published transactions, not the visible page', () => {
  let db: { exec(sql: string): Promise<unknown>; query(sql: string, params: unknown[]): Promise<{ rows: Record<string, unknown>[] }>; close(): Promise<void> };
  let port: MarketRefreshSqlPort;
  beforeAll(async () => {
    const { PGlite } = createRequire(import.meta.url)(modulePath!);
    db = new PGlite();
    port = { query: async (sql, params = []) => (await db.query(sql, [...params])).rows, transaction: vi.fn() };
    await db.exec(`CREATE TABLE japan_area_publications (city text, year int, quarter int, release_id text);
      CREATE TABLE japan_area_releases (id text, state text);
      CREATE TABLE japan_area_records (release_id text, record jsonb);
      INSERT INTO japan_area_releases VALUES ('current','published'),('old','superseded'),('staged','staged'),('other-quarter','published'),('empty','published');
      INSERT INTO japan_area_publications VALUES ('13103',2025,4,'current'),('13113',2025,4,'staged'),('13103',2025,3,'other-quarter'),('13101',2025,4,'empty');
      INSERT INTO japan_area_records SELECT 'current', jsonb_build_object('price', n * 1000000, 'district','Azabu','municipality','Minato','type','Condo','areaSqm',70,'floorPlan','2LDK','buildingYear','2010') FROM generate_series(1,25) n;
      INSERT INTO japan_area_records VALUES ('old','{"price":999999999}'),('staged','{"price":888888888}'),('other-quarter','{"price":777777777}');`);
  });
  afterAll(async () => { await db?.close(); });
  const filters = { q: '', type: '', minArea: null, maxArea: null };
  it('uses all 25 current records for the median and excludes other periods and unpublished releases', async () => {
    const rows = await readTokyoMapSummary('2025', '4', filters, port);
    expect(rows).toEqual([
      { city: '13101', count: 0, medianPrice: null },
      { city: '13103', count: 25, medianPrice: 13000000 },
    ]);
  });
  it('keeps published wards with no filter matches distinct from unpublished wards', async () => {
    const rows = await readTokyoMapSummary('2025', '4', { ...filters, minArea: 80 }, port);
    expect(rows).toEqual([{ city: '13101', count: 0, medianPrice: null }, { city: '13103', count: 0, medianPrice: null }]);
  });
});
