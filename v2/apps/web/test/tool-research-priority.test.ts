import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
vi.mock('server-only', () => ({}));
import { createToolResearchRepository } from '../lib/tool-research/repository.server';
import { aggregateToolResearch } from '../lib/tool-research/maintenance.server';
import { researchDashboard } from '../lib/evidence-pool/research.server';
import { createPoolRepository } from '../lib/evidence-pool/repository.server';

const modulePath = process.env.EVIDENCE_TEST_PGLITE_MODULE;
type DB = { query(statement: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>; exec(sql: string): Promise<unknown>; close(): Promise<void> };
(modulePath ? describe : describe.skip)('live consent-safe research priority PostgreSQL', () => {
  let db: DB;
  const sql = { query: async (statement: string, params: unknown[] = []) => (await db.query(statement, params)).rows };
  const research = createToolResearchRepository({ query: (s, p = []) => sql.query(s, [...p]) });
  beforeAll(async () => {
    const { PGlite } = createRequire(import.meta.url)(modulePath!);
    db = new PGlite();
    for (const file of ['0018_tool_research_submissions.sql', '0020_property_evidence_pool.sql', '0023_tool_research_maintenance.sql']) {
      await db.exec(await readFile(new URL(`../db/migrations/${file}`, import.meta.url), 'utf8'));
    }
  }, 30000);
  afterAll(async () => { await db?.close(); });
  async function submit(hash: string, now: Date, low = true) {
    await research.submit({ ownerHash: hash.repeat(64), scenarioHash: hash.repeat(64), retryId: randomUUID(),
      snapshot: { schemaVersion: 1, tool: 'single-quote', market: 'kr-seoul', currency: 'KRW',
        bands: { askingPrice: 'krw-500m-1b', area: 'sqm-60-85', sample: low ? 'sample-0-4' : 'sample-10-24' },
        categories: { transaction: 'sale', housingType: 'apartment', verdict: 'typical', scope: 'building' } },
      source: 'user_scenario', purpose: 'product_research', consentVersion: 'tool-research-consent-2026-09-09', now });
  }
  it('excludes expired and future shares; withdrawal immediately clears daily-checked aggregates', async () => {
    const now = new Date();
    await submit('a', now);
    await submit('b', new Date(now.getTime() - 91 * 86400000));
    await submit('c', new Date(now.getTime() + 86400000));
    await aggregateToolResearch({ query: (s, p = []) => sql.query(s, [...p]) }, now);
    const before = await researchDashboard(sql, '', '');
    expect(before.priorities[0]).toMatchObject({ market: 'kr-seoul', directShares: 1, lowEvidenceShares: 1 });
    expect(before.lastAggregatedAt).not.toBeNull();
    expect(before.total).toBe(1);
    expect(JSON.stringify(before)).not.toContain('a'.repeat(64));
    await research.deleteOwner('a'.repeat(64));
    const after = await researchDashboard(sql, '', '');
    expect(after.total).toBe(0);
    expect(after.priorities.every(p => p.directShares === 0 && p.lowEvidenceShares === 0)).toBe(true);
    expect(after.lastAggregatedAt).toBe(before.lastAggregatedAt);
    expect(Object.keys((await sql.query('SELECT * FROM tool_research_maintenance'))[0]!)).toEqual(['id', 'last_aggregated_at']);
  });
  it('uses existing evidence quality classification and does not count rejected rows as gaps', async () => {
    const pool = createPoolRepository(sql);
    const source = await pool.mutate({ action: 'create-source', input: { name: 'Priority test source', url: 'https://example.com/priority', kind: 'official' } }, 'test');
    const input = { sourceId: source.id, market: 'singapore', tier: 'essential', metric: 'sale_price', basis: 'paid', amount: 1000000, currency: 'SGD', unit: 'total', area: 'Central', building: 'Needs conditions', housingType: 'condo', sizeSqm: 80, observedOn: new Date().toISOString().slice(0, 10), expiresOn: '2099-12-31', url: 'https://example.com/price', conditions: '' } as const;
    const evidence = await pool.mutate({ action: 'create-evidence', input }, 'test');
    const before = await researchDashboard(sql, '', '');
    expect(before.priorities[0]).toMatchObject({ market: 'sg-singapore', incompleteEvidence: 1, pendingEvidence: 1 });
    await pool.mutate({ action: 'review', entity: 'evidence', id: evidence.id, version: 1, status: 'rejected', reason: 'Not usable' }, 'test');
    expect((await researchDashboard(sql, '', '')).priorities.find(p => p.market === 'sg-singapore')).toMatchObject({ incompleteEvidence: 0, pendingEvidence: 0 });
  });
  it('keeps cross-city comparisons separate and matches their low evidence to the correct city', async () => {
    await research.submit({ ownerHash: 'd'.repeat(64), scenarioHash: 'd'.repeat(64), retryId: randomUUID(),
      snapshot: { schemaVersion: 1, tool: 'passport', market: 'global', currency: 'KRW',
        bands: { budget: 'krw-500m-1b', seoulArea: 'sqm-60-85', singaporeArea: 'sqm-60-85', dubaiArea: 'sqm-60-85',
          seoulSample: 'sample-10-24', singaporeSample: 'sample-0-4', dubaiSample: 'sample-10-24' },
        categories: { dubaiStage: 'ready' } },
      source: 'user_scenario', purpose: 'product_research', consentVersion: 'tool-research-consent-2026-09-09', now: new Date() });
    const data = await researchDashboard(sql, 'global', 'passport');
    expect(data.priorities[0]).toMatchObject({ market: 'sg-singapore', directShares: 0, comparisonShares: 1, lowEvidenceShares: 1 });
    expect(data.priorities.filter(p => p.market !== 'sg-singapore').every(p => p.lowEvidenceShares === 0 && p.directShares === 0)).toBe(true);
    await research.deleteOwner('d'.repeat(64));
    expect((await researchDashboard(sql, '', '')).priorities.every(p => p.comparisonShares === 0)).toBe(true);
  });
});
