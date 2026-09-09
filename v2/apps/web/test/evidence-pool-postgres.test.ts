import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
vi.mock('server-only', () => ({}));
import { createPoolRepository } from '../lib/evidence-pool/repository.server';
import type { EvidenceInput } from '../lib/evidence-pool/contract';
const modulePath = process.env.EVIDENCE_TEST_PGLITE_MODULE ?? (() => {
  try { return createRequire(import.meta.url).resolve('@electric-sql/pglite'); } catch { return null; }
})();
type Database = { query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>; exec(sql: string): Promise<unknown>; close(): Promise<void> };
(modulePath ? describe : describe.skip)(`evidence pool real PostgreSQL workflow${modulePath ? '' : ' (requires EVIDENCE_TEST_PGLITE_MODULE; see operations guide)'}`, () => {
  let db: Database;
  let repository: ReturnType<typeof createPoolRepository>;
  beforeAll(async () => {
    const { PGlite } = createRequire(import.meta.url)(modulePath!) as { PGlite: new () => Database };
    db = new PGlite();
    await db.exec(await readFile(new URL('../db/migrations/0020_property_evidence_pool.sql', import.meta.url), 'utf8'));
    repository = createPoolRepository({ query: async (sql, params = []) => (await db.query(sql, params)).rows });
  }, 30000);
  afterAll(async () => { await db?.close(); });
  it('persists, reviews, corrects, rejects stale changes and never restores withdrawal', async () => {
    const source = await repository.mutate({ action: 'create-source', input: { name: 'Official test', url: 'https://example.com', kind: 'official' } }, 'test-operator');
    const input: EvidenceInput = { sourceId: source.id, market: 'dubai', tier: 'supporting', metric: 'rent', basis: 'paid', amount: 100000, currency: 'AED', unit: 'annual', area: 'Marina', building: 'Tower', sizeSqm: 80, observedOn: '2026-09-01', expiresOn: '2099-12-01', url: 'https://example.com/rent' };
    const evidence = await repository.mutate({ action: 'create-evidence', input }, 'test-operator');
    const review = { action: 'review' as const, entity: 'evidence' as const, id: evidence.id, version: 1, status: 'approved' as const, reason: 'Source checked' };
    await expect(repository.mutate(review, 'test-operator')).rejects.toThrow('conflict');
    await repository.mutate({ action: 'review', entity: 'source', id: source.id, version: 1, status: 'approved', reason: 'Official source checked' }, 'test-operator');
    await repository.mutate(review, 'test-operator');
    await expect(repository.mutate(review, 'test-operator')).rejects.toThrow('conflict');
    await expect(repository.mutate({ action: 'create-evidence', input }, 'test-operator')).rejects.toThrow('conflict');
    await repository.mutate({ action: 'correct', id: evidence.id, version: 2, input: { ...input, amount: 90000 }, reason: 'Correct invoice total' }, 'test-operator');
    let data = await repository.list({ page: 1, market: '', status: '', query: '' });
    expect(data.evidence[0]).toMatchObject({ amount: 90000, status: 'pending', version: 3 });
    const history = await repository.history('evidence', evidence.id);
    expect(history).toHaveLength(3);
    expect(history[2]?.snapshot).toMatchObject({ data: { amount: 90000 } });
    await repository.mutate({ ...review, version: 3, status: 'withdrawn' }, 'test-operator');
    await expect(repository.mutate({ ...review, version: 4 }, 'test-operator')).rejects.toThrow('conflict');
    await expect(repository.mutate({ action: 'correct', id: evidence.id, version: 4, input, reason: 'Do not restore' }, 'test-operator')).rejects.toThrow('conflict');
    data = await repository.list({ page: 1, market: '', status: 'withdrawn', query: '' });
    expect(data.total).toBe(1); expect(data.counts.withdrawn).toBe(1);
    expect(await repository.history('evidence', evidence.id)).toHaveLength(4);
  });
  it('rolls back the record when the audit insert fails', async () => {
    await expect(repository.mutate({ action: 'create-source', input: { name: 'Rollback test', url: 'https://rollback.example', kind: 'official' } }, '')).rejects.toThrow();
    expect((await db.query("SELECT count(*)::int AS count FROM property_pool_sources WHERE url = 'https://rollback.example/'")).rows[0]?.count).toBe(0);
  });
  it('exposes withdrawn source state immediately and blocks reapproval through it', async () => {
    const source = await repository.mutate({ action: 'create-source', input: { name: 'Withdrawal source', url: 'https://withdrawal.example', kind: 'official' } }, 'test-operator');
    await repository.mutate({ action: 'review', entity: 'source', id: source.id, version: 1, status: 'approved', reason: 'Checked source' }, 'test-operator');
    const input: EvidenceInput = { sourceId: source.id, market: 'seoul', tier: 'essential', metric: 'sale_price', basis: 'paid', amount: 500000000, currency: 'KRW', unit: 'total', area: 'Gangnam', building: 'Test Building', sizeSqm: 80, observedOn: '2026-09-01', expiresOn: '2099-12-01', url: 'https://withdrawal.example/price' };
    const row = await repository.mutate({ action: 'create-evidence', input }, 'test-operator');
    await repository.mutate({ action: 'review', entity: 'evidence', id: row.id, version: 1, status: 'approved', reason: 'Price checked' }, 'test-operator');
    await repository.mutate({ action: 'review', entity: 'source', id: source.id, version: 2, status: 'withdrawn', reason: 'Source withdrawn' }, 'test-operator');
    const data = await repository.list({ page: 1, market: 'seoul', status: 'approved', query: 'Gangnam' });
    expect(data.evidence).toHaveLength(1); expect(data.evidence[0]).toMatchObject({ sourceStatus: 'withdrawn' });
    await expect(repository.mutate({ action: 'correct', id: row.id, version: 2, input, reason: 'Should not restore source' }, 'test-operator')).rejects.toThrow('conflict');
    await expect(repository.mutate({ action: 'review', entity: 'source', id: source.id, version: 3, status: 'approved', reason: 'Should not restore' }, 'test-operator')).rejects.toThrow('conflict');
  });
  it('keeps expired evidence out of approvals and filters it by UTC date', async () => {
    const source = await repository.mutate({ action: 'create-source', input: { name: 'Expired source', url: 'https://expired.example', kind: 'official' } }, 'test-operator');
    await repository.mutate({ action: 'review', entity: 'source', id: source.id, version: 1, status: 'approved', reason: 'Checked source' }, 'test-operator');
    const input: EvidenceInput = { sourceId: source.id, market: 'singapore', tier: 'supporting', metric: 'rent', basis: 'paid', amount: 3000, currency: 'SGD', unit: 'monthly', area: 'Central', building: 'Test Building', sizeSqm: 60, observedOn: '2000-01-01', expiresOn: '2000-02-01', url: 'https://expired.example/rent' };
    const row = await repository.mutate({ action: 'create-evidence', input }, 'test-operator');
    await expect(repository.mutate({ action: 'review', entity: 'evidence', id: row.id, version: 1, status: 'approved', reason: 'Cannot approve expired' }, 'test-operator')).rejects.toThrow('conflict');
    const data = await repository.list({ page: 1, market: 'singapore', status: 'expired', query: '' });
    expect(data.total).toBe(1); expect(data.evidence[0]?.id).toBe(row.id);
    expect(await repository.history('evidence', row.id)).toHaveLength(1);
  });
  it('keeps the workspace readable beyond 1,000 sources with bounded pages', async () => {
    await db.exec(`INSERT INTO property_pool_sources(id, name, url, kind)
      SELECT ('aaaaaaaa-aaaa-4aaa-8aaa-' || lpad(n::text, 12, '0'))::uuid,
        'Pagination ' || n, 'https://pagination.example/' || n, 'official' FROM generate_series(1, 1001) n`);
    const first = await repository.list({ page: 1, market: '', status: '', query: '', sourcePage: 1 });
    const second = await repository.list({ page: 1, market: '', status: '', query: '', sourcePage: 2 });
    expect(first.sources).toHaveLength(100); expect(second.sources).toHaveLength(100);
    expect(first.sourceTotal).toBeGreaterThan(1000);
    const firstIds = new Set(first.sources.map((source) => source.id));
    expect(second.sources.some((source) => firstIds.has(source.id))).toBe(false);
  });
});
