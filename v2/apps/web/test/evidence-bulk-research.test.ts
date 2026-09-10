import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
vi.mock('server-only', () => ({}));
import { createPoolRepository } from '../lib/evidence-pool/repository.server';
import { createToolResearchRepository } from '../lib/tool-research/repository.server';
import { parseBulk, type BulkCommand } from '../lib/evidence-pool/bulk';
import { assessEvidence } from '../lib/evidence-pool/quality';
import { createPoolHandlers } from '../lib/evidence-pool/handlers.server';
import { issueSession, SESSION_COOKIE } from '../lib/evidence-pool/auth.server';
import type { EvidenceInput } from '../lib/evidence-pool/contract';
const modulePath = process.env.EVIDENCE_TEST_PGLITE_MODULE;
type DB = { query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>; exec(sql: string): Promise<unknown>; close(): Promise<void> };
(modulePath ? describe : describe.skip)('bulk review and consent dashboard PostgreSQL', () => {
  let db: DB; let repo: ReturnType<typeof createPoolRepository>;
  let sourceId: string;
  const day = new Date().toISOString().slice(0,10);
  beforeAll(async () => {
    const { PGlite } = createRequire(import.meta.url)(modulePath!);
    db = new PGlite();
    for (const name of ['0020_property_evidence_pool.sql', '0018_tool_research_submissions.sql', '0023_tool_research_maintenance.sql']) await db.exec(await readFile(new URL(`../db/migrations/${name}`, import.meta.url), 'utf8'));
    repo = createPoolRepository({ query: async (sql, params) => (await db.query(sql, params)).rows });
    const source = await repo.mutate({ action: 'create-source', input: { name: 'Verified source', url: 'https://bulk.example', kind: 'official' } }, 'test');
    sourceId = source.id;
    await repo.mutate({ action: 'review', entity: 'source', id: source.id, version: 1, status: 'approved', reason: 'Verified source' }, 'test');
  });
  afterAll(async () => { await db?.close(); });
  function input(building: string): EvidenceInput { return { sourceId, market: 'seoul', tier: 'essential', metric: 'sale_price', basis: 'paid', amount: 500000000, currency: 'KRW', unit: 'total', area: 'Test district', building, sizeSqm: 80, observedOn: day, expiresOn: '2099-12-31', url: 'https://bulk.example/price', housingType: 'apartment', conditions: 'Completed sale, vacant possession' }; }
  function bulk(ids: string[] | null, status: 'approved' | 'rejected' = 'approved'): BulkCommand { return { action: 'bulk-preview', scope: { ids, market: '', status: '', query: '', quality: '' }, status, reason: 'Checked source and conditions', fingerprint: '' }; }
  it('filters existing incomplete values without changing records; handles fee exceptions', async () => {
    const missing = await repo.mutate({ action: 'create-evidence', input: { ...input('Incomplete'), housingType: '', conditions: '' } }, 'test');
    const fee = await repo.mutate({ action: 'create-evidence', input: { ...input(''), metric: 'transaction_cost', sizeSqm: null, housingType: '' } }, 'test');
    const list = await repo.list({ page: 1, market: '', status: '', query: '', quality: 'incomplete' });
    expect(list.evidence.map(r => r.id)).toContain(missing.id);
    expect(list.evidence.map(r => r.id)).not.toContain(fee.id);
    expect(assessEvidence(list.evidence[0]!, day).quality).toBe('incomplete');
    expect(await repo.history('evidence', missing.id)).toHaveLength(1);
    await expect(repo.mutate({ action: 'review', entity: 'evidence', id: missing.id, version: 1, status: 'approved', reason: 'Cannot approve incomplete' }, 'test')).rejects.toThrow('conflict');
  });
  it('previews eligible and blocked rows; bulk update writes exactly one history per changed row', async () => {
    const good = await repo.mutate({ action: 'create-evidence', input: input('Bulk good') }, 'test');
    const bad = await repo.mutate({ action: 'create-evidence', input: { ...input('Bulk bad'), conditions: '' } }, 'test');
    const command = bulk([good.id, bad.id]); const preview = await repo.bulk(command, 'test');
    expect(preview).toMatchObject({ matched: 2, eligible: 1, blocked: 1 });
    expect(await repo.bulk({ ...command, action: 'bulk-review', fingerprint: preview.fingerprint }, 'test')).toMatchObject({ changed: 1 });
    expect(await repo.history('evidence', good.id)).toHaveLength(2);
    expect(await repo.history('evidence', bad.id)).toHaveLength(1);
    await expect(repo.bulk({ ...command, action: 'bulk-review', fingerprint: preview.fingerprint }, 'test')).rejects.toThrow('conflict');
  });
  it('rejects a stale preview atomically and rolls back updates if history insert fails', async () => {
    const a = await repo.mutate({ action: 'create-evidence', input: input('Concurrent A') }, 'test');
    const b = await repo.mutate({ action: 'create-evidence', input: input('Concurrent B') }, 'test');
    const command = bulk([a.id,b.id]); const preview = await repo.bulk(command,'test');
    await repo.mutate({ action: 'correct', id: b.id, version: 1, input: { ...input('Concurrent B'), amount: 600000000 }, reason: 'Revised source amount' }, 'test');
    await expect(repo.bulk({ ...command, action: 'bulk-review', fingerprint: preview.fingerprint }, 'test')).rejects.toThrow('conflict');
    expect(await repo.history('evidence',a.id)).toHaveLength(1);
    const fresh = await repo.bulk(command,'test');
    await expect(repo.bulk({ ...command, action: 'bulk-review', fingerprint: fresh.fingerprint }, '')).rejects.toThrow();
    expect(await repo.history('evidence',a.id)).toHaveLength(1);
    expect((await repo.bulk(command,'test')).eligible).toBe(2);
  });
  it('detects cross-source duplicate candidates and expiry; filter-wide rejection preserves values', async () => {
    const a = input('Duplicate');
    const duplicateA = await repo.mutate({ action: 'create-evidence', input: a },'test');
    const duplicateB = await repo.mutate({ action: 'create-evidence', input: { ...a, url: 'https://bulk.example/another' } },'test');
    const old = await repo.mutate({ action: 'create-evidence', input: { ...input('Expired'), observedOn: '2000-01-01', expiresOn: '2001-01-01' } },'test');
    const duplicates = await repo.list({ page:1,market:'',status:'',query:'',quality:'duplicate' });
    expect(duplicates.total).toBe(2);
    expect(duplicates.evidence.every(r => assessEvidence(r,day).quality === 'duplicate')).toBe(true);
    const outdated = await repo.list({ page:1,market:'',status:'',query:'',quality:'outdated' });
    expect(outdated.evidence.map(r => r.id)).toContain(old.id);
    const command = bulk(null,'rejected'); command.scope.quality = 'duplicate';
    const preview = await repo.bulk(command,'test');
    expect(preview.eligible).toBe(2);
    expect(await repo.bulk({ ...command,action:'bulk-review',fingerprint:preview.fingerprint },'test')).toMatchObject({ changed:2 });
    expect((await repo.list({page:1,market:'',status:'rejected',query:'Duplicate'})).total).toBe(2);
    await repo.mutate({ action: 'review', entity: 'evidence', id: duplicateA.id, version: 2, status: 'approved', reason: 'Keep verified copy; other copy rejected' }, 'test');
    expect((await repo.bulk(bulk([duplicateB.id]), 'test')).eligible).toBe(0);
  });
  it('excludes expired and deleted shares and never returns identity hashes', async () => {
    const research = createToolResearchRepository({ query: async (sql, params) => (await db.query(sql, params ? [...params] : [])).rows });
    const snapshot = { schemaVersion: 1, tool: 'single-quote', market: 'kr-seoul', currency: 'KRW', bands: { askingPrice: 'krw-500m-1b', area: 'sqm-60-85', sample: 'sample-10-24' }, categories: { transaction: 'sale', housingType: 'apartment', verdict: 'typical', scope: 'building' } } as const;
    for (const [hash, now] of [['a', new Date()], ['b', new Date('2000-01-01')]] as const) await research.submit({ ownerHash: hash.repeat(64), retryId: randomUUID(), scenarioHash: hash.repeat(64), snapshot, source: 'user_scenario', purpose: 'product_research', consentVersion: 'tool-research-consent-2026-09-09', now });
    const data = await repo.research('kr-seoul','single-quote');
    expect(data.total).toBe(1); expect(data.distributions.find(r => r.field === 'area')).toMatchObject({value:'sqm-60-85',count:1});
    expect(data.recent[0]?.bands.area).toBe('60–85 m²');
    expect(JSON.stringify(data)).not.toContain('a'.repeat(64));
    expect((await repo.research('ae-dubai','')).total).toBe(0);
    await research.deleteOwner('a'.repeat(64)); expect((await repo.research('','')).total).toBe(0);
  });
});
describe('bulk and research API boundaries', () => {
  it('rejects unbounded IDs, withdrawal and malformed scopes', () => {
    const good = { action:'bulk-preview',scope:{market:'',status:'',query:'',quality:'',ids:null},status:'approved',reason:'Checked source',fingerprint:'' };
    expect(parseBulk(good)).not.toBeNull();
    expect(parseBulk({...good,status:'withdrawn'})).toBeNull();
    expect(parseBulk({...good,scope:{...good.scope,ids:[]}})).toBeNull();
    expect(parseBulk({...good,scope:{...good.scope,quality:'invented'}})).toBeNull();
  });
  it('guards research reads and bulk writes before repository access', async () => {
    const factory = vi.fn(() => { throw new Error('unexpected'); });
    const secret = 'test-only-secret-with-at-least-32-characters';
    const handlers = createPoolHandlers(factory, () => secret);
    const url = 'https://signedprice.com/api/internal/evidence-pool/';
    expect((await handlers.GET(new Request(`${url}?view=research`))).status).toBe(401);
    expect((await handlers.POST(new Request(url,{method:'POST',headers:{Cookie:`${SESSION_COOKIE}=${issueSession(secret)}`,Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'}))).status).toBe(403);
    expect(factory).not.toHaveBeenCalled();
  });
});
