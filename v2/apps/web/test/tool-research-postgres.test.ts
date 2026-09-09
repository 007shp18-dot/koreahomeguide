import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

vi.mock('server-only', () => ({}));

import type { NormalizedToolResearchSnapshot } from '../lib/tool-research/contract';
import {
  createToolResearchRepository,
  ToolResearchStorageUnavailableError,
  type ToolResearchSqlPort,
} from '../lib/tool-research/repository.server';

type Row = Record<string, unknown>;
type Database = {
  query(sql: string, parameters?: unknown[]): Promise<{ rows: Row[] }>;
  exec(sql: string): Promise<unknown>;
  transaction<T>(callback: (transaction: Database) => Promise<T>): Promise<T>;
  close(): Promise<void>;
};

const localPglite = '/workspace/scratch/c926a5a3f09d/japan-coverage-harness/node_modules/@electric-sql/pglite/dist/index.cjs';
const modulePath = process.env.TOOL_RESEARCH_TEST_PGLITE_MODULE
  ?? (existsSync(localPglite) ? localPglite : null);
const postgresSuite = modulePath === null ? describe.skip : describe;
const snapshot: NormalizedToolResearchSnapshot = {
  schemaVersion: 1,
  tool: 'single-quote',
  market: 'kr-seoul',
  currency: 'KRW',
  bands: { askingPrice: 'krw-100m-500m', area: 'sqm-60-85', sample: 'sample-10-24' },
  categories: { transaction: 'sale', housingType: 'apartment', verdict: 'typical', scope: 'district' },
};

function submission(overrides: Record<string, unknown> = {}) {
  return {
    ownerHash: 'a'.repeat(64),
    retryId: '018f47a6-7e8d-7e79-9f1e-123456789abc',
    scenarioHash: 'b'.repeat(64),
    snapshot,
    source: 'user_scenario' as const,
    purpose: 'product_research' as const,
    consentVersion: 'tool-research-consent-2026-09-09' as const,
    now: new Date('2026-09-09T12:00:00.000Z'),
    ...overrides,
  };
}

postgresSuite('tool research PostgreSQL retention and ownership', () => {
  let db: Database;
  let port: ToolResearchSqlPort;

  beforeAll(async () => {
    const { PGlite } = createRequire(import.meta.url)(modulePath!) as { PGlite: new () => Database };
    db = new PGlite();
    port = {
      query: async (statement, parameters = []) => (await db.query(statement, [...parameters])).rows,
    };
    const sql = await readFile(new URL('../db/migrations/0018_tool_research_submissions.sql', import.meta.url), 'utf8');
    for (const statement of sql.split(/^\s*-- statement-breakpoint\s*$/m)) {
      if (statement.trim()) await db.exec(statement);
    }
  }, 30_000);

  beforeEach(async () => {
    await db.exec('TRUNCATE tool_research_submissions');
  });

  afterAll(async () => { await db?.close(); });

  it('deduplicates a retry within its initialized owner scope', async () => {
    const repository = createToolResearchRepository(port, {
      id: () => '018f47a6-7e8d-7e79-9f1e-000000000001',
    });
    await expect(repository.submit(submission())).resolves.toEqual({
      state: 'stored', expiresAt: '2026-12-08T12:00:00.000Z',
    });
    await expect(repository.submit(submission())).resolves.toEqual({
      state: 'duplicate', expiresAt: '2026-12-08T12:00:00.000Z',
    });
    expect((await db.query('SELECT owner_hash, count(*)::integer AS count FROM tool_research_submissions GROUP BY owner_hash')).rows)
      .toEqual([{ owner_hash: 'a'.repeat(64), count: 1 }]);
  });

  it('never reassigns a retry or record to a different owner', async () => {
    let sequence = 0;
    const repository = createToolResearchRepository(port, {
      id: () => `018f47a6-7e8d-7e79-9f1e-${String(++sequence).padStart(12, '0')}`,
    });
    await repository.submit(submission());
    await expect(repository.submit(submission({ ownerHash: 'c'.repeat(64) }))).resolves.toMatchObject({ state: 'stored' });
    expect((await db.query('SELECT owner_hash FROM tool_research_submissions ORDER BY owner_hash')).rows).toEqual([
      { owner_hash: 'a'.repeat(64) }, { owner_hash: 'c'.repeat(64) },
    ]);
  });

  it('deduplicates the same normalized scenario per owner and UTC day without extending retention', async () => {
    const ids = [
      '018f47a6-7e8d-7e79-9f1e-000000000001',
      '018f47a6-7e8d-7e79-9f1e-000000000002',
      '018f47a6-7e8d-7e79-9f1e-000000000003',
    ];
    const repository = createToolResearchRepository(port, { id: () => ids.shift()! });
    await repository.submit(submission());
    await expect(repository.submit(submission({
      retryId: '018f47a6-7e8d-7e79-9f1e-123456789abd',
      now: new Date('2026-09-09T23:59:59.000Z'),
    }))).resolves.toEqual({ state: 'duplicate', expiresAt: '2026-12-08T12:00:00.000Z' });
    await expect(repository.submit(submission({
      retryId: '018f47a6-7e8d-7e79-9f1e-123456789abe',
      now: new Date('2026-09-10T00:00:00.000Z'),
    }))).resolves.toEqual({ state: 'stored', expiresAt: '2026-12-09T00:00:00.000Z' });
    expect((await db.query('SELECT count(*)::integer AS count FROM tool_research_submissions')).rows[0]?.count).toBe(2);
    expect((await db.query('SELECT consent_version, consent_granted_at = created_at AS same_time FROM tool_research_submissions ORDER BY created_at LIMIT 1')).rows[0])
      .toEqual({ consent_version: 'tool-research-consent-2026-09-09', same_time: true });
  });

  it('deletes only the requesting owner records', async () => {
    let sequence = 0;
    const repository = createToolResearchRepository(port, {
      id: () => `018f47a6-7e8d-7e79-9f1e-${String(++sequence).padStart(12, '0')}`,
    });
    await repository.submit(submission());
    await repository.submit(submission({
      ownerHash: 'c'.repeat(64), retryId: '018f47a6-7e8d-7e79-9f1e-123456789abd',
    }));
    await expect(repository.deleteOwner('a'.repeat(64))).resolves.toBe(1);
    expect((await db.query('SELECT owner_hash FROM tool_research_submissions')).rows).toEqual([
      { owner_hash: 'c'.repeat(64) },
    ]);
  });

  it('physically expires payload and owner data and summarizes retained rows only', async () => {
    let sequence = 0;
    const repository = createToolResearchRepository(port, {
      id: () => `018f47a6-7e8d-7e79-9f1e-${String(++sequence).padStart(12, '0')}`,
    });
    await repository.submit(submission({ now: new Date('2026-06-01T00:00:00.000Z') }));
    await repository.submit(submission({
      ownerHash: 'c'.repeat(64), retryId: '018f47a6-7e8d-7e79-9f1e-123456789abd',
      scenarioHash: 'd'.repeat(64), now: new Date('2026-09-09T00:00:00.000Z'),
    }));
    await expect(repository.summarizeRetained({ now: new Date('2026-09-09T12:00:00.000Z') })).resolves.toEqual([
      { market: 'kr-seoul', tool: 'single-quote', count: 1 },
    ]);
    await expect(repository.expire(new Date('2026-09-09T12:00:00.000Z'))).resolves.toBe(1);
    expect((await db.query("SELECT count(*)::integer AS count FROM tool_research_submissions WHERE payload::text LIKE '%100m-500m%' OR owner_hash=$1", ['a'.repeat(64)])).rows[0]?.count).toBe(1);
    expect((await db.query('SELECT count(*)::integer AS count FROM tool_research_submissions')).rows[0]?.count).toBe(1);
  });

  it('bounds broad internal summaries by market, tool, and a hard row limit', async () => {
    const repository = createToolResearchRepository(port, {
      id: () => '018f47a6-7e8d-7e79-9f1e-000000000001',
    });
    await repository.submit(submission());
    await expect(repository.summarizeRetained({
      market: 'kr-seoul', tool: 'single-quote', limit: 1,
      now: new Date('2026-09-09T12:00:00.000Z'),
    })).resolves.toEqual([{ market: 'kr-seoul', tool: 'single-quote', count: 1 }]);
    await expect(repository.summarizeRetained({ limit: 51 })).rejects.toBeInstanceOf(ToolResearchStorageUnavailableError);
  });

  it('redacts database failures behind one storage error', async () => {
    const repository = createToolResearchRepository({
      query: async () => { throw new Error('postgres://secret'); },
    });
    await expect(repository.submit(submission())).rejects.toEqual(expect.objectContaining({
      name: 'ToolResearchStorageUnavailableError', message: 'Tool research storage is unavailable.',
    }));
  });

  it('enables row-level security without granting raw table access to PUBLIC', async () => {
    expect((await db.query("SELECT relrowsecurity FROM pg_class WHERE relname='tool_research_submissions'")).rows)
      .toEqual([{ relrowsecurity: true }]);
    expect((await db.query("SELECT grantee FROM information_schema.role_table_grants WHERE table_name='tool_research_submissions' AND grantee='PUBLIC'")).rows)
      .toEqual([]);
  });
});
