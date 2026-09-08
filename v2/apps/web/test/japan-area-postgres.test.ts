import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
vi.mock('server-only', () => ({}));
import { createJapanRepository, readJapanPublication, type JapanRun } from '../lib/japan/repository.server';
import type { MarketRefreshSqlPort } from '../lib/market-data/refresh-repository.server';
import { parseJapanSnapshot, type JapanSnapshot } from '../lib/japan/source.server';

type Row = Record<string, unknown>;
type Database = { query(sql: string, params?: unknown[]): Promise<{ rows: Row[] }>;
  exec(sql: string): Promise<unknown>; transaction<T>(fn: (tx: Database) => Promise<T>): Promise<T>; close(): Promise<void> };
const modulePath = process.env.JAPAN_TEST_PGLITE_MODULE;
// Optional local PostgreSQL/WASM harness: no production credential or network is used.
// JAPAN_TEST_PGLITE_MODULE=/path/to/@electric-sql/pglite/dist/index.cjs pnpm exec vitest run apps/web/test/japan-area-postgres.test.ts
const suite = modulePath ? describe : describe.skip;
suite('Japan real PostgreSQL publication and failure modes', () => {
  let db: Database;
  let port: MarketRefreshSqlPort;
  const scope = { city: '13103', year: '2025', quarter: '4' };
  const source = { Type: 'Pre-owned Condominiums, etc.', MunicipalityCode: '13103', Municipality: 'Minato Ward',
    DistrictName: 'Azabu', TradePrice: '85000000', Area: '70', FloorPlan: '2LDK', BuildingYear: '2010', Period: '4th quarter 2025' };
  const snapshot = (rows: Record<string, unknown>[]) => parseJapanSnapshot(JSON.stringify({ status: 'OK', data: rows }), scope, '2026-09-08T00:00:00Z');
  const filters = { q: '', type: '', minArea: null, maxArea: null, page: 1, release: null };
  async function publish(data: JapanSnapshot) {
    const repo = createJapanRepository(port);
    const run = await repo.start(); expect(run).not.toBeNull();
    await repo.stage(run!, data); await repo.activate(run!, true); return run!;
  }
  beforeAll(async () => {
    const { PGlite } = createRequire(import.meta.url)(modulePath!) as { PGlite: new () => Database };
    db = new PGlite();
    port = { query: async (sql, params = []) => (await db.query(sql, [...params])).rows,
      transaction: statements => db.transaction(async tx => {
        const result = []; for (const s of statements) result.push((await tx.query(s.statement, [...(s.parameters ?? [])])).rows); return result;
      }) };
    for (const file of ['0001_persistent_content.sql','0003_global_property_core.sql','0004_public_evidence_projection.sql','0011_market_data_refresh.sql','0015_japan_area_releases.sql']) {
      const sql = await readFile(new URL(`../db/migrations/${file}`, import.meta.url), 'utf8');
      for (const statement of sql.split(/^\s*-- statement-breakpoint\s*$/m)) if (statement.trim()) await db.exec(statement);
    }
  }, 30000);
  afterAll(async () => { await db?.close(); });

  it('same complete source recollected does not grow the public transaction count', async () => {
    const data = snapshot([source, { ...source, TradePrice: '90000000' }]);
    await publish(data); await publish(data);
    const current = await readJapanPublication(scope, filters, port);
    expect(current?.sourceCount).toBe(2); expect(current?.records).toHaveLength(2);
    const run = await db.query("SELECT inserted, unchanged FROM market_data_refresh_runs WHERE job='jp-tokyo-sale' ORDER BY id DESC LIMIT 1");
    expect(run.rows[0]).toMatchObject({ inserted: 0, unchanged: 2 });
  });
  it('two identical disclosed transactions remain two separately represented multiset members', async () => {
    await publish(snapshot([source, source]));
    const current = await readJapanPublication(scope, filters, port);
    expect(current?.sourceCount).toBe(2);
    expect(new Set(current?.records.map(r => r.recordReference)).size).toBe(2);
  });
  it('correction and removal replace the current snapshot while preserving prior values and release history', async () => {
    const previous = await publish(snapshot([source, source, { ...source, TradePrice: '90000000' }]));
    const corrected = await publish(snapshot([source, { ...source, TradePrice: '95000000' }]));
    const current = await readJapanPublication(scope, filters, port);
    expect(current?.records.map(r => r.price)).toEqual([95000000, 85000000]);
    const old = await readJapanPublication(scope, { ...filters, release: previous.releaseId }, port);
    expect(old?.records.map(r => r.price)).toEqual([90000000, 85000000, 85000000]);
    const history = await db.query('SELECT previous_release_id FROM japan_area_releases WHERE id=$1', [corrected.releaseId]);
    expect(history.rows[0]?.previous_release_id).toBe(previous.releaseId);
  });
  it('second chunk failure leaves published prices and source instant untouched; incomplete candidate cannot activate', async () => {
    const previous = await publish(snapshot([source]));
    let chunk = 0;
    const failingPort: MarketRefreshSqlPort = { ...port, query: async (sql, params) => {
      if (sql.includes('japan:chunk') && ++chunk === 2) throw new Error('simulated second chunk write failure');
      return port.query(sql, params);
    } };
    const repo = createJapanRepository(failingPort, 1); const run = await repo.start() as JapanRun;
    await expect(repo.stage(run, snapshot([source, { ...source, TradePrice: '99000000' }]))).rejects.toThrow('second chunk');
    await expect(repo.activate(run)).rejects.toThrow('candidate_incomplete');
    expect((await readJapanPublication(scope, filters, port))?.releaseId).toBe(previous.releaseId);
    expect((await readJapanPublication(scope, filters, port))?.records[0]?.price).toBe(85000000);
    await repo.fail(run, 'storage_unavailable');
  });
  it('expired lease is recoverable and an old worker cannot promote after a new run acquires the lease', async () => {
    const previous = await publish(snapshot([source])); const repo = createJapanRepository(port);
    const old = await repo.start() as JapanRun;
    await repo.stage(old, snapshot([{ ...source, TradePrice: '99000000' }]));
    await db.exec("UPDATE market_data_refresh_leases SET expires_at=now()-interval '1 second' WHERE job='jp-tokyo-sale'");
    const recovered = await repo.start() as JapanRun; expect(recovered).not.toBeNull();
    expect(await repo.start()).toBeNull();
    await expect(repo.activate(old)).rejects.toThrow('lease_expired');
    expect((await readJapanPublication(scope, filters, port))?.releaseId).toBe(previous.releaseId);
    await repo.stage(recovered, snapshot([{ ...source, TradePrice: '91000000' }]));
    await repo.activate(recovered);
    expect((await readJapanPublication(scope, filters, port))?.records[0]?.price).toBe(91000000);
    const state = await db.query('SELECT state,error_code FROM market_data_refresh_runs WHERE id=$1', [old.runId]);
    expect(state.rows[0]).toMatchObject({ state: 'failed', error_code: 'lease_expired' });
  });
  it('quarter-only records store JPY and disclosed area without creating any building or exact date', async () => {
    await publish(snapshot([{ ...source, Area: '2000 or greater' }]));
    const current = await readJapanPublication(scope, filters, port);
    expect(current?.records[0]).toMatchObject({ currency: 'JPY', areaSqm: null, areaLabel: '2000 or greater', periodPrecision: 'quarter' });
    expect(current?.records[0]).not.toHaveProperty('buildingId'); expect(current?.records[0]).not.toHaveProperty('observedAt');
    const entities = await db.query("SELECT count(*)::integer AS count FROM property_entities WHERE market_id='jp-tokyo'");
    expect(entities.rows[0]?.count).toBe(0);
  });
  it('hash corruption and unreviewed major count loss fail atomically', async () => {
    const previous = await publish(snapshot([source, source, source])); const repo = createJapanRepository(port);
    const reduction = await repo.start() as JapanRun; await repo.stage(reduction, snapshot([source]));
    await expect(repo.activate(reduction)).rejects.toThrow('source_count_reduction');
    expect((await readJapanPublication(scope, filters, port))?.releaseId).toBe(previous.releaseId);
    await repo.fail(reduction, 'source_invalid');
    const corrupt = await repo.start() as JapanRun; await repo.stage(corrupt, snapshot([source, source, source]));
    await db.query("UPDATE japan_area_releases SET raw_hash=repeat('a',64) WHERE id=$1", [corrupt.releaseId]);
    await expect(repo.activate(corrupt)).rejects.toThrow('candidate_incomplete');
    expect((await readJapanPublication(scope, filters, port))?.releaseId).toBe(previous.releaseId);
    await repo.fail(corrupt, 'source_invalid');
  });
});
