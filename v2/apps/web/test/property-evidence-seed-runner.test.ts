import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  createPropertyEvidenceSeedRunner,
} from '../scripts/seed-property-evidence.mjs';

type ObservationFixture = Readonly<{
  datasetId: string;
  businessKey: string;
  contentHash: string;
  entityId: string;
}>;

type MetricFixture = Readonly<{
  identityKey: string;
  entityId: string;
}>;

type SummaryFixture = Readonly<{
  koreaRentSourceRecords: number;
  koreaRentObservations: number;
  koreaSaleSourceRecords: number;
  koreaSaleObservations: number;
  singaporePrivateSourceRecords: number;
  singaporePrivateObservations: number;
  sourceRecordTotal: number;
  observationTotal: number;
  unlinkedSourceRecords: number;
  hdbMetricRows: number;
  observationIdentityDigest: string;
  observationContentDigest: string;
  metricIdentityDigest: string;
}>;

function fixtureSeed() {
  const observations: ObservationFixture[] = [
    { datasetId: 'kr-rent', businessKey: 'a', contentHash: 'a'.repeat(64), entityId: 'kr-seoul:estate:a' },
    { datasetId: 'kr-sale', businessKey: 'b', contentHash: 'b'.repeat(64), entityId: 'kr-seoul:estate:b' },
    { datasetId: 'sg-private-sale', businessKey: 'c', contentHash: 'c'.repeat(64), entityId: 'sg-singapore:project:c' },
  ];
  const metrics: MetricFixture[] = [
    { identityKey: 'median:block', entityId: 'sg-singapore:block:a' },
    { identityKey: 'count:block', entityId: 'sg-singapore:block:a' },
  ];
  return {
    metadata: { rightsPolicies: [], datasets: [], evidenceReleases: [], metricDefinitions: [] },
    observations: {
      'kr-rent': [observations[0]],
      'kr-sale': [observations[1]],
      'sg-private-sale': [observations[2]],
    },
    metrics,
    summary: {
      koreaRentSourceRecords: 1,
      koreaRentObservations: 1,
      koreaSaleSourceRecords: 1,
      koreaSaleObservations: 1,
      singaporePrivateSourceRecords: 1,
      singaporePrivateObservations: 1,
      sourceRecordTotal: 3,
      observationTotal: 3,
      unlinkedSourceRecords: 0,
      hdbMetricRows: 2,
      observationIdentityDigest: 'd'.repeat(64),
      observationContentDigest: 'e'.repeat(64),
      metricIdentityDigest: 'f'.repeat(64),
    },
  };
}

function memoryPort() {
  const observations = new Set<string>();
  const metrics = new Set<string>();
  let writes = 0;
  let maximumBatch = 0;
  const port = {
    async upsertMetadata() { writes += 1; return 0; },
    async upsertObservations(rows: readonly ObservationFixture[]) {
      writes += 1;
      maximumBatch = Math.max(maximumBatch, rows.length);
      let inserted = 0;
      for (const row of rows) {
        const key = `${row.datasetId}:${row.businessKey}:${row.contentHash}`;
        if (!observations.has(key)) { observations.add(key); inserted += 1; }
      }
      return inserted;
    },
    async upsertMetrics(rows: readonly MetricFixture[]) {
      writes += 1;
      maximumBatch = Math.max(maximumBatch, rows.length);
      let inserted = 0;
      for (const row of rows) {
        if (!metrics.has(row.identityKey)) { metrics.add(row.identityKey); inserted += 1; }
      }
      return inserted;
    },
    async verify(expected: SummaryFixture) {
      return { ...expected, orphanObservations: 0, dubaiMutations: 0 };
    },
  };
  return { port, observations, metrics, writes: () => writes, maximumBatch: () => maximumBatch };
}

describe('property evidence database seed runner', () => {
  it('commits source-record inserts before observations select those records', () => {
    const source = readFileSync(
      new URL('../scripts/seed-property-evidence.mjs', import.meta.url),
      'utf8',
    );
    const method = source.slice(
      source.indexOf('async upsertObservations(rows)'),
      source.indexOf('async upsertMetrics(rows)'),
    );

    expect(method).toContain('await sql.transaction');
    expect(method).not.toContain('inserted_sources AS');
    expect(method).toContain('INNER JOIN property_entities AS entity');
    expect(method).toContain('WHERE input.projectable');
  });

  it('writes bounded batches and inserts nothing on identical replay', async () => {
    const memory = memoryPort();
    const runner = createPropertyEvidenceSeedRunner(memory.port, fixtureSeed);

    const first = await runner.run({ batchSize: 2, verifyOnly: false });
    const second = await runner.run({ batchSize: 2, verifyOnly: false });

    expect(first).toMatchObject({ insertedObservations: 3, insertedMetrics: 2 });
    expect(second).toMatchObject({ insertedObservations: 0, insertedMetrics: 0 });
    expect(memory.observations.size).toBe(3);
    expect(memory.metrics.size).toBe(2);
    expect(memory.maximumBatch()).toBeLessThanOrEqual(2);
  });

  it('performs no writes in verify-only mode', async () => {
    const memory = memoryPort();
    const runner = createPropertyEvidenceSeedRunner(memory.port, fixtureSeed);

    const result = await runner.run({ batchSize: 1_000, verifyOnly: true });

    expect(result.verification).toMatchObject({ observationTotal: 3, hdbMetricRows: 2 });
    expect(memory.writes()).toBe(0);
  });

  it('rejects oversized batches and out-of-scope entities before writing', async () => {
    const memory = memoryPort();
    const runner = createPropertyEvidenceSeedRunner(memory.port, fixtureSeed);

    await expect(runner.run({ batchSize: 1_001, verifyOnly: false })).rejects.toThrow(/batch size/iu);
    const badSeed = fixtureSeed();
    badSeed.observations['kr-rent'][0] = {
      ...badSeed.observations['kr-rent'][0]!, entityId: 'ae-dubai:building:a',
    };
    await expect(createPropertyEvidenceSeedRunner(memory.port, () => badSeed)
      .run({ batchSize: 1, verifyOnly: false })).rejects.toThrow(/scope/iu);
    expect(memory.writes()).toBe(0);
  });
});
