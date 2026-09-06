import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createMarketRefreshRepository } from '../lib/market-data/refresh-repository.server';
import type { NormalizedMarketBatch } from '../lib/market-data/refresh-types';

const batch: NormalizedMarketBatch = Object.freeze({
  job: 'ae-dubai-transaction',
  dataset: Object.freeze({
    id: 'ae-dubai-transactions', marketId: 'ae-dubai', provider: 'Dubai Land Department',
    officialName: 'DLD transactions', landingUrl: 'https://dubailand.gov.ae/open-data',
    subjectScope: 'Dubai transactions', refreshCadence: 'daily', expectedLag: 'daily',
    schemaVersion: 'test-v1', parserVersion: 'test-parser-v1',
    rightsPolicyId: 'ae-dubai-pulse-open-data-v1',
  }),
  sourceAsOf: '2026-09-06T00:00:00.000Z',
  records: Object.freeze([Object.freeze({
    businessKey: "source-key-'not-sql'",
    contentHash: 'a'.repeat(64),
    sourceObservedAt: '2026-09-06T00:00:00.000Z',
    rawMetadata: Object.freeze({ source: 'official' }),
    entity: Object.freeze({
      id: 'ae-dubai:project:test', marketId: 'ae-dubai',
      geography: Object.freeze({
        id: 'ae-dubai:community:test', marketId: 'ae-dubai', kind: 'community',
        officialName: 'Test Area', localizedNames: Object.freeze({ en: 'Test Area' }),
        providerCode: 'test-area',
      }),
      kind: 'project', canonicalName: 'Test Project', normalizedName: 'testproject',
      addressText: 'Test Project, Dubai', housingSector: null, propertyClass: 'Flat',
      identityStatus: 'verified', localAttributes: Object.freeze({ source: 'dld' }),
      localSchemaVersion: 'test-project@1',
    }),
    observation: Object.freeze({
      kind: 'sale', stage: 'ready', observedAt: '2026-09-06', registeredAt: '2026-09-06',
      periodStart: null, periodEnd: null, amountMinor: 100_000_000,
      annualAmountMinor: null, currencyCode: 'AED', depositMinor: null,
      recurringAmountMinor: null, frequency: 'once', propertyAreaSqm: 80,
      transactedAreaSqm: 80, areaBasis: 'test', floorValue: null, floorRange: null,
      bedrooms: 2, tenureKind: 'freehold', status: 'active',
      localAttributes: Object.freeze({ procedure: 'Sale' }), localSchemaVersion: 'test@1',
    }),
  })]),
});

describe('market refresh repository leases', () => {
  it('starts a run only after atomically acquiring an expiring job lease', async () => {
    const query = vi.fn().mockResolvedValue([{ run_id: 'run-1', lease_token: 'lease-1' }]);
    const repository = createMarketRefreshRepository({
      query,
      transaction: vi.fn(),
    }, { randomId: () => 'lease-1' });

    await expect(repository.start('kr-seoul-sale')).resolves.toEqual({
      runId: 'run-1', leaseToken: 'lease-1', job: 'kr-seoul-sale',
    });
    expect(query).toHaveBeenCalledOnce();
    expect(query.mock.calls[0]?.[0]).toMatch(/market-data-refresh:start/);
    expect(query.mock.calls[0]?.[0]).toMatch(/expires_at\s*<\s*now\(\)/i);
    expect(query.mock.calls[0]?.[1]).toEqual(['kr-seoul-sale', 'lease-1']);
  });

  it('returns null when another non-expired run owns the lease', async () => {
    const repository = createMarketRefreshRepository({
      query: vi.fn().mockResolvedValue([]),
      transaction: vi.fn(),
    }, { randomId: () => 'lease-2' });
    await expect(repository.start('sg-private-sale')).resolves.toBeNull();
  });
});

describe('market refresh transactional persistence', () => {
  it('supersedes every other active hash when a business key changes or reverts', async () => {
    const transaction = vi.fn().mockResolvedValue([
      [], [], [],
      [{ received: '1', inserted: '0', updated: '1', unchanged: '0', unlinked: '0' }],
    ]);
    const repository = createMarketRefreshRepository({ query: vi.fn(), transaction });

    await expect(repository.persist({
      runId: 'run-1', leaseToken: 'lease-1', job: 'ae-dubai-transaction',
    }, batch)).resolves.toEqual({
      received: 1, inserted: 0, updated: 1, unchanged: 0, unlinked: 0,
    });

    const statements = transaction.mock.calls[0]?.[0] as readonly Readonly<{
      statement: string; parameters: readonly unknown[];
    }>[];
    expect(statements).toHaveLength(4);
    expect(statements[3]?.statement).toMatch(/status\s*=\s*'superseded'/i);
    expect(statements[3]?.statement).toMatch(
      /changed_keys[\s\S]*FROM classified WHERE key_exists[\s\S]*superseded/i,
    );
    expect(statements[3]?.statement).not.toMatch(
      /changed_keys[\s\S]*FROM classified WHERE key_exists AND NOT exact_exists[\s\S]*superseded/i,
    );
    expect(statements[3]?.statement).toMatch(/ON CONFLICT \(dataset_id, business_key, content_hash\)/i);
    expect(statements[3]?.statement).not.toContain("source-key-'not-sql'");
    expect(String(statements[3]?.parameters[0])).toContain("source-key-'not-sql'");
  });

  it('rejects a batch that does not belong to the acquired job', async () => {
    const repository = createMarketRefreshRepository({ query: vi.fn(), transaction: vi.fn() });
    await expect(repository.persist({
      runId: 'run-1', leaseToken: 'lease-1', job: 'kr-seoul-sale',
    }, batch)).rejects.toThrow(/job mismatch/i);
  });

  it('coalesces multiple property classes reported under the same project identity', async () => {
    const transaction = vi.fn().mockResolvedValue([
      [], [], [],
      [{ received: '2', inserted: '2', updated: '0', unchanged: '0', unlinked: '0' }],
    ]);
    const repository = createMarketRefreshRepository({ query: vi.fn(), transaction });
    const first = batch.records[0]!;
    const mixedProjectBatch: NormalizedMarketBatch = Object.freeze({
      ...batch,
      records: Object.freeze([
        first,
        Object.freeze({
          ...first,
          businessKey: 'source-key-2',
          contentHash: 'b'.repeat(64),
          entity: Object.freeze({ ...first.entity!, propertyClass: 'Villa' }),
        }),
      ]),
    });

    await expect(repository.persist({
      runId: 'run-1', leaseToken: 'lease-1', job: 'ae-dubai-transaction',
    }, mixedProjectBatch)).resolves.toMatchObject({ received: 2 });
    const statements = transaction.mock.calls[0]?.[0] as readonly Readonly<{
      statement: string; parameters: readonly unknown[];
    }>[];
    expect(JSON.parse(String(statements[2]?.parameters[0]))).toEqual([
      expect.objectContaining({ id: 'ae-dubai:project:test', property_class: null }),
    ]);
  });

  it('chunks large batches below the Neon HTTP limit and aggregates counters', async () => {
    const transaction = vi.fn()
      .mockResolvedValueOnce([
        [], [], [],
        [{ received: '1', inserted: '1', updated: '0', unchanged: '0', unlinked: '0' }],
      ])
      .mockResolvedValueOnce([
        [], [], [],
        [{ received: '1', inserted: '0', updated: '1', unchanged: '0', unlinked: '0' }],
      ]);
    const first = batch.records[0]!;
    const largeBatch: NormalizedMarketBatch = Object.freeze({
      ...batch,
      records: Object.freeze([
        first,
        Object.freeze({
          ...first,
          businessKey: 'source-key-2',
          contentHash: 'b'.repeat(64),
          entity: Object.freeze({ ...first.entity!, propertyClass: 'Villa' }),
        }),
      ]),
    });
    const repository = createMarketRefreshRepository(
      { query: vi.fn(), transaction },
      { maxRecordsPerTransaction: 1 },
    );

    await expect(repository.persist({
      runId: 'run-1', leaseToken: 'lease-1', job: 'ae-dubai-transaction',
    }, largeBatch)).resolves.toEqual({
      received: 2, inserted: 1, updated: 1, unchanged: 0, unlinked: 0,
    });
    expect(transaction).toHaveBeenCalledTimes(2);
    const secondStatements = transaction.mock.calls[1]?.[0] as readonly Readonly<{
      statement: string; parameters: readonly unknown[];
    }>[];
    expect(secondStatements[2]?.statement).toMatch(/property_entities\.property_class IS NULL/i);
  });

  it('finishes a run and releases its exact lease in the same transaction', async () => {
    const transaction = vi.fn().mockResolvedValue([[], []]);
    const repository = createMarketRefreshRepository({ query: vi.fn(), transaction });
    const run = { runId: 'run-1', leaseToken: 'lease-1', job: 'ae-dubai-rent' } as const;

    await repository.succeed(run, {
      received: 2, inserted: 1, updated: 0, unchanged: 1, unlinked: 0,
    }, '2026-09-06T00:00:00.000Z');

    const statements = transaction.mock.calls[0]?.[0] as readonly Readonly<{
      statement: string; parameters: readonly unknown[];
    }>[];
    expect(statements[0]?.statement).toMatch(/state\s*=\s*'succeeded'/i);
    expect(statements[1]?.statement).toMatch(/DELETE FROM market_data_refresh_leases/i);
    expect(statements[1]?.parameters).toEqual(['ae-dubai-rent', 'lease-1']);
  });

  it('stores only a stable failure code and releases the lease', async () => {
    const transaction = vi.fn().mockResolvedValue([[], []]);
    const repository = createMarketRefreshRepository({ query: vi.fn(), transaction });
    const run = { runId: 'run-1', leaseToken: 'lease-1', job: 'sg-private-rent' } as const;

    await repository.fail(run, 'provider_unavailable');
    const statements = transaction.mock.calls[0]?.[0] as readonly Readonly<{
      statement: string; parameters: readonly unknown[];
    }>[];
    expect(statements[0]?.parameters).toEqual(['run-1', 'lease-1', 'provider_unavailable']);
    await expect(repository.fail(run, 'secret=https://bad.example'))
      .rejects.toThrow(/error code/i);
  });
});
