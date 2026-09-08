import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

vi.mock('server-only', () => ({}));
import { createMarketRefreshRepository, type MarketRefreshSqlPort } from '../lib/market-data/refresh-repository.server';
import type { NormalizedMarketBatch } from '../lib/market-data/refresh-types';

type Row = Record<string, unknown>;
type Database = { query(sql: string, parameters?: unknown[]): Promise<{ rows: Row[] }>;
  exec(sql: string): Promise<unknown>; transaction<T>(callback: (transaction: Database) => Promise<T>): Promise<T>; close(): Promise<void> };
const modulePath = process.env.MARKET_REFRESH_TEST_PGLITE_MODULE ?? process.env.JAPAN_TEST_PGLITE_MODULE;
// Optional local PostgreSQL/WASM verification, using only an in-memory database.
const suite = modulePath ? describe : describe.skip;
const run = { runId: '1', leaseToken: 'local-test', job: 'ae-dubai-transaction' } as const;
const batch: NormalizedMarketBatch = {
  job: run.job,
  dataset: { id: 'ae-dubai-transactions', marketId: 'ae-dubai', provider: 'Dubai Land Department',
    officialName: 'DLD transactions', landingUrl: 'https://dubailand.gov.ae/open-data',
    subjectScope: 'Dubai sales', refreshCadence: 'daily', expectedLag: 'daily',
    schemaVersion: 'test@1', parserVersion: 'test@1', rightsPolicyId: 'ae-dubai-pulse-open-data-v1' },
  sourceAsOf: '2026-09-06T00:00:00.000Z',
  records: [{ businessKey: 'official-sale-1', contentHash: 'a'.repeat(64),
    sourceObservedAt: '2026-09-06T00:00:00.000Z', rawMetadata: { provider: 'dld' },
    entity: { id: 'ae-dubai:test-project', marketId: 'ae-dubai', kind: 'project',
      geography: { id: 'ae-dubai:test-area', marketId: 'ae-dubai', kind: 'community',
        officialName: 'Test Area', localizedNames: { en: 'Test Area' }, providerCode: 'test-area' },
      canonicalName: 'Test Project', normalizedName: 'testproject', addressText: 'Dubai',
      housingSector: null, propertyClass: 'Flat', identityStatus: 'verified',
      localAttributes: { provider: 'dld' }, localSchemaVersion: 'test@1' },
    observation: { kind: 'sale', stage: 'ready', observedAt: '2026-09-06', registeredAt: null,
      periodStart: null, periodEnd: null, amountMinor: 100_000_000, annualAmountMinor: null,
      currencyCode: 'AED', depositMinor: null, recurringAmountMinor: null, frequency: 'once',
      propertyAreaSqm: 80, transactedAreaSqm: 80, areaBasis: 'registered', floorValue: null,
      floorRange: null, bedrooms: 2, tenureKind: 'freehold', status: 'active',
      localAttributes: { procedure: 'Sale' }, localSchemaVersion: 'test@1' } }],
};

suite('market refresh SQL material updates', () => {
  let db: Database;
  let port: MarketRefreshSqlPort;
  beforeAll(async () => {
    const { PGlite } = createRequire(import.meta.url)(modulePath!) as { PGlite: new () => Database };
    db = new PGlite();
    port = { query: async (statement, parameters = []) => (await db.query(statement, [...parameters])).rows,
      transaction: statements => db.transaction(async transaction => {
        const results = [];
        for (const { statement, parameters = [] } of statements) results.push((await transaction.query(statement, [...parameters])).rows);
        return results;
      }) };
    for (const filename of ['0001_persistent_content.sql', '0003_global_property_core.sql', '0011_market_data_refresh.sql']) {
      const sql = await readFile(new URL(`../db/migrations/${filename}`, import.meta.url), 'utf8');
      for (const statement of sql.split(/^\s*-- statement-breakpoint\s*$/m)) if (statement.trim()) await db.exec(statement);
    }
  }, 30_000);
  beforeEach(async () => {
    await db.exec('TRUNCATE observations, source_records, datasets, property_entities, geographies RESTART IDENTITY CASCADE');
  });
  afterAll(async () => { await db?.close(); });

  async function versions() {
    const result: Record<string, Row[]> = {};
    for (const table of ['datasets', 'geographies', 'property_entities', 'observations']) {
      result[table] = (await db.query(`SELECT id, xmin::text AS version, updated_at FROM ${table} ORDER BY id`)).rows;
    }
    return result;
  }

  it('repeated chunks avoid physical evidence/entity updates while source last-seen metadata still advances', async () => {
    const first = batch.records[0]!;
    const data = { ...batch, records: [first, { ...first, businessKey: 'official-sale-2', contentHash: 'b'.repeat(64) }] };
    const repository = createMarketRefreshRepository(port, { maxRecordsPerTransaction: 1 });
    await expect(repository.persist(run, data)).resolves.toMatchObject({ received: 2, inserted: 2 });
    const previous = await versions();
    const repeated = { ...data, records: data.records.map(record => ({ ...record,
      sourceObservedAt: '2026-09-07T00:00:00.000Z', rawMetadata: { provider: 'dld', sourceRun: 'second' } })) };
    await expect(repository.persist(run, repeated)).resolves.toMatchObject({ received: 2, inserted: 0, updated: 0, unchanged: 2 });
    expect(await versions()).toEqual(previous);
    expect((await db.query('SELECT observed_at, raw_metadata FROM source_records ORDER BY id')).rows).toEqual([
      { observed_at: new Date('2026-09-07T00:00:00.000Z'), raw_metadata: { provider: 'dld', sourceRun: 'second' } },
      { observed_at: new Date('2026-09-07T00:00:00.000Z'), raw_metadata: { provider: 'dld', sourceRun: 'second' } },
    ]);
  });

  it('preserves correction history and reactivates a previously superseded exact hash', async () => {
    const repository = createMarketRefreshRepository(port);
    const first = batch.records[0]!;
    await repository.persist(run, batch);
    const corrected = { ...batch, records: [{ ...first, contentHash: 'b'.repeat(64),
      observation: { ...first.observation!, amountMinor: 120_000_000, status: 'corrected' as const } }] };
    await expect(repository.persist(run, corrected)).resolves.toMatchObject({ updated: 1 });
    expect((await db.query('SELECT amount_minor::text, status FROM observations ORDER BY id')).rows).toEqual([
      { amount_minor: '100000000', status: 'superseded' }, { amount_minor: '120000000', status: 'corrected' },
    ]);
    await expect(repository.persist(run, batch)).resolves.toMatchObject({ unchanged: 1 });
    expect((await db.query('SELECT amount_minor::text, status FROM observations ORDER BY id')).rows).toEqual([
      { amount_minor: '100000000', status: 'active' }, { amount_minor: '120000000', status: 'superseded' },
    ]);
  });

  it('inserts the observation when an existing source becomes linked to an entity', async () => {
    const repository = createMarketRefreshRepository(port);
    await expect(repository.persist(run, { ...batch, records: [{ ...batch.records[0]!, entity: null }] })).resolves.toMatchObject({ unlinked: 1 });
    expect((await db.query('SELECT count(*)::integer AS count FROM observations')).rows[0]?.count).toBe(0);
    await expect(repository.persist(run, batch)).resolves.toMatchObject({ unchanged: 1, unlinked: 0 });
    expect((await db.query('SELECT subject_entity_id, status FROM observations')).rows).toEqual([{ subject_entity_id: 'ae-dubai:test-project', status: 'active' }]);
  });

  it('preserves enriched null-coalesced fields and merged attributes without redundant entity writes', async () => {
    const repository = createMarketRefreshRepository(port);
    await repository.persist(run, batch);
    await db.exec("UPDATE property_entities SET housing_sector='private_residential', local_attributes=local_attributes || '{\"enriched\":true}'::jsonb, property_class=NULL");
    const previous = await versions();
    const first = batch.records[0]!;
    await repository.persist(run, { ...batch, records: [{ ...first,
      entity: { ...first.entity!, geography: null, addressText: null, housingSector: null } }] });
    expect((await versions()).property_entities).toEqual(previous.property_entities);
    expect((await db.query('SELECT geography_id, address_text, housing_sector, property_class, local_attributes FROM property_entities')).rows[0]).toEqual({
      geography_id: 'ae-dubai:test-area', address_text: 'Dubai', housing_sector: 'private_residential',
      property_class: null, local_attributes: { provider: 'dld', enriched: true },
    });
  });

  it('applies changed geography, entity and observation material fields even for an existing source hash', async () => {
    const repository = createMarketRefreshRepository(port);
    await repository.persist(run, batch);
    const first = batch.records[0]!;
    await repository.persist(run, { ...batch, dataset: { ...batch.dataset, parserVersion: 'test@2' }, records: [{ ...first,
      entity: { ...first.entity!, canonicalName: 'Corrected Project', propertyClass: 'Villa',
        geography: { ...first.entity!.geography!, officialName: 'Corrected Area', localizedNames: { en: 'Corrected Area' } },
        localAttributes: { provider: 'dld', corrected: true } },
      observation: { ...first.observation!, floorValue: 5, status: 'cancelled', localAttributes: { procedure: 'Cancelled sale' } } }] });
    expect((await db.query('SELECT parser_version FROM datasets')).rows[0]?.parser_version).toBe('test@2');
    expect((await db.query('SELECT official_name FROM geographies')).rows[0]?.official_name).toBe('Corrected Area');
    expect((await db.query('SELECT canonical_name, property_class, local_attributes FROM property_entities')).rows[0]).toEqual({
      canonical_name: 'Corrected Project', property_class: null, local_attributes: { provider: 'dld', corrected: true },
    });
    expect((await db.query('SELECT floor_value, status, local_attributes FROM observations')).rows[0]).toEqual({
      floor_value: 5, status: 'cancelled', local_attributes: { procedure: 'Cancelled sale' },
    });
  });
});
