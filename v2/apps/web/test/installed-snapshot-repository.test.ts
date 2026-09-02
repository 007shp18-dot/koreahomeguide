import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  InstalledSnapshotUnavailableError,
  createInstalledSnapshotRepository,
  resolveInstalledSnapshotObject,
  resolveInstalledSnapshotRegistry,
  checkedInSnapshotsAreEnabled,
} from '../lib/snapshots/installed-snapshot-repository.server';
import {
  buildSingaporeSnapshot,
  parseUraPrivateSaleEnvelope,
  stringifySingaporeSnapshot,
} from '@signedprice/singapore-property';
import { readFileSync } from 'node:fs';

const period = '2026-01/2026-07';

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalJson(record[key])}`
  )).join(',')}}`;
}

function payload(): Readonly<Record<string, unknown>> {
  return Object.freeze({
    artifactVersion: 'signedprice-observed-building-inventory-v1',
    provenance: Object.freeze({ marketId: 'kr-seoul', period }),
    records: Object.freeze([
      Object.freeze({ buildingId: 'gangnam-gu-one' }),
      Object.freeze({ buildingId: 'jongno-gu-two' }),
    ]),
  });
}

function conversionPayload(): Readonly<Record<string, unknown>> {
  return Object.freeze({
    artifactVersion: 1,
    generatedAt: '2026-09-01T00:00:00.000Z',
    provenance: Object.freeze({
      marketId: 'kr-seoul',
      period,
      provider: 'MOLIT',
      endpointVersion: 'v1',
      parserVersion: 'kr-molit-rent-parser-v2',
      rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true,
      sha256: 'a'.repeat(64),
    }),
    readiness: Object.freeze({
      state: 'ready',
      maximumAgeDays: 45,
      minimumPairsPerAnchor: 120,
    }),
    totals: Object.freeze({
      eligiblePairCount: 620,
      excluded: Object.freeze({
        cancelled: 4,
        invalidMoney: 2,
        differentBuildingOrArea: 10,
      }),
    }),
    curves: Object.freeze([
      Object.freeze({ housingType: 'apartment', anchors: Object.freeze([]) }),
      Object.freeze({ housingType: 'officetel', anchors: Object.freeze([]) }),
    ]),
  });
}

function registry(
  source: unknown,
  overrides: Readonly<Record<string, unknown>> = Object.freeze({}),
): unknown {
  return {
    registryVersion: 'signedprice-installed-snapshots-v1',
    snapshots: [{
      marketId: 'kr-seoul',
      dataset: 'kr-building-registry',
      schemaVersion: 'signedprice-observed-building-inventory-v1',
      sourceVersion: 'molit-rent-v1',
      parserVersion: 'kr-molit-building-parser-v2',
      rightsPolicyId: 'kr-molit-rent-v1',
      period,
      generatedAt: '2026-09-01T01:15:56.720Z',
      objectUrl: 'installed://kr-building-registry',
      sha256: createHash('sha256').update(canonicalJson(source)).digest('hex'),
      recordCount: 2,
      ...overrides,
    }],
  };
}

function conversionRegistry(
  source: unknown,
  overrides: Readonly<Record<string, unknown>> = Object.freeze({}),
): unknown {
  return {
    registryVersion: 'signedprice-installed-snapshots-v1',
    snapshots: [{
      marketId: 'kr-seoul',
      dataset: 'kr-conversion',
      schemaVersion: '1',
      sourceVersion: 'molit-rent-v1',
      parserVersion: 'kr-molit-rent-parser-v2',
      rightsPolicyId: 'kr-molit-rent-v1',
      period,
      generatedAt: '2026-09-01T00:00:00.000Z',
      objectUrl: 'installed://kr-conversion',
      sha256: createHash('sha256').update(canonicalJson(source)).digest('hex'),
      recordCount: 620,
      ...overrides,
    }],
  };
}

describe('installed snapshot repository', () => {
  it('allows release fixtures to disable checked-in production snapshots explicitly', () => {
    expect(checkedInSnapshotsAreEnabled({
      NODE_ENV: 'production',
      SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS: 'false',
    })).toBe(false);
    expect(checkedInSnapshotsAreEnabled({ NODE_ENV: 'production' })).toBe(true);
    expect(checkedInSnapshotsAreEnabled({ NODE_ENV: 'test' })).toBe(true);
  });

  it('verifies an installed Singapore private-sale snapshot by its exact artifact identity', () => {
    const envelope = JSON.parse(readFileSync(
      new URL('../../../packages/singapore-property/test/fixtures/ura-transaction-envelope.synthetic.json', import.meta.url),
      'utf8',
    )) as unknown;
    const source = buildSingaporeSnapshot({
      records: [1, 2, 3, 4].flatMap((batch) => parseUraPrivateSaleEnvelope(envelope, batch)),
      generatedAt: '2026-08-31T09:00:00.000Z',
      rights: { operations: { aggregate: 'allowed', display: 'allowed' } },
    });
    const serialized = stringifySingaporeSnapshot(source);
    const singaporeRegistry = {
      registryVersion: 'signedprice-installed-snapshots-v1',
      snapshots: [{
        marketId: 'sg-singapore',
        dataset: 'sg-private-sale',
        schemaVersion: 'signedprice-singapore-private-sale-v1',
        sourceVersion: 'ura-data-service-v1',
        parserVersion: 'sg-ura-private-sale-parser-v1',
        rightsPolicyId: 'sg-ura-private-sale-v1',
        period: '2026-06/2026-08',
        generatedAt: '2026-08-31T09:00:00.000Z',
        objectUrl: 'installed://sg-private-sale',
        sha256: createHash('sha256').update(serialized.trimEnd()).digest('hex'),
        recordCount: 12,
      }],
    };
    const repository = createInstalledSnapshotRepository({
      registrySource: singaporeRegistry,
      resolveObject: () => source,
    });

    expect(repository.get('sg-singapore', 'sg-private-sale')).toMatchObject({
      metadata: { period: '2026-06/2026-08', recordCount: 12 },
      payload: { digest: source.digest, totals: { transactions: 12 } },
    });
  });

  it('resolves every checked-in Korea snapshot object', () => {
    const installed = resolveInstalledSnapshotObject('installed://kr-building-registry');

    expect(installed).toMatchObject({
      artifactVersion: 'signedprice-observed-building-inventory-v1',
      provenance: { marketId: 'kr-seoul', period: '2026-02/2026-08' },
      stats: { observedBuildingCount: 48_999 },
    });
    expect(resolveInstalledSnapshotObject('installed://kr-rent')).toMatchObject({
      stats: { eligibleRecordCount: 340_704 },
    });
    expect(resolveInstalledSnapshotObject('installed://kr-sale')).toMatchObject({
      stats: { eligibleRecordCount: 74_188 },
    });
    expect(resolveInstalledSnapshotObject('installed://kr-conversion')).toMatchObject({
      totals: { eligiblePairCount: 1_031_799 },
    });
    expect(resolveInstalledSnapshotObject('installed://sg-private-sale')).toMatchObject({
      version: 'signedprice-singapore-private-sale-v1',
      period: { from: '2021-08', to: '2026-08' },
      totals: { projects: 3_862, transactions: 133_942 },
    });
    expect(resolveInstalledSnapshotObject('installed://sg-hdb')).toMatchObject({
      version: 'signedprice-singapore-hdb-published-v1',
      totals: { resale: 239_583, rental: 209_852, properties: 13_357, sourceRows: 462_792 },
    });
    expect(resolveInstalledSnapshotObject('https://example.com/snapshot.json')).toBeUndefined();
  });

  it('verifies the exact checked-in registry against every installed Korea artifact', () => {
    const repository = createInstalledSnapshotRepository({
      registrySource: resolveInstalledSnapshotRegistry(),
      resolveObject: resolveInstalledSnapshotObject,
    });

    expect(repository.get('kr-seoul', 'kr-building-registry').metadata.recordCount).toBe(48_999);
    expect(repository.get('kr-seoul', 'kr-rent').metadata.recordCount).toBe(49_129);
    expect(repository.get('kr-seoul', 'kr-sale').metadata.recordCount).toBe(22_850);
    expect(repository.get('kr-seoul', 'kr-conversion').metadata.recordCount).toBe(1_031_799);
    expect(repository.get('sg-singapore', 'sg-private-sale').metadata.recordCount).toBe(133_942);
    expect(repository.get('sg-singapore', 'sg-hdb').metadata.recordCount).toBe(462_792);
  });

  it('returns a digest, schema, identity and count verified payload', () => {
    const source = payload();
    const repository = createInstalledSnapshotRepository({
      registrySource: registry(source),
      resolveObject: (objectUrl) => objectUrl === 'installed://kr-building-registry'
        ? source
        : undefined,
    });

    const result = repository.get('kr-seoul', 'kr-building-registry');

    expect(result.metadata.recordCount).toBe(2);
    expect(result.payload).toBe(source);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('verifies a conversion snapshot against its eligible pair count', () => {
    const source = conversionPayload();
    const repository = createInstalledSnapshotRepository({
      registrySource: conversionRegistry(source),
      resolveObject: (objectUrl) => objectUrl === 'installed://kr-conversion'
        ? source
        : undefined,
    });

    const result = repository.get('kr-seoul', 'kr-conversion');

    expect(result.metadata.recordCount).toBe(620);
    expect(result.payload).toBe(source);
  });

  it('rejects a conversion snapshot whose eligible pair count differs from the registry', () => {
    const source = conversionPayload();
    const repository = createInstalledSnapshotRepository({
      registrySource: conversionRegistry(source, { recordCount: 619 }),
      resolveObject: () => source,
    });

    expect(() => repository.get('kr-seoul', 'kr-conversion'))
      .toThrow(InstalledSnapshotUnavailableError);
  });

  it('rejects an absent dataset without substituting another snapshot', () => {
    const source = payload();
    const repository = createInstalledSnapshotRepository({
      registrySource: registry(source),
      resolveObject: () => source,
    });

    expect(() => repository.get('kr-seoul', 'kr-sale'))
      .toThrow(InstalledSnapshotUnavailableError);
  });

  it.each([
    ['digest mismatch', { sha256: 'b'.repeat(64) }, payload()],
    ['record-count mismatch', { recordCount: 3 }, payload()],
    ['schema mismatch', { schemaVersion: 'signedprice-observed-building-inventory-v2' }, payload()],
    ['period mismatch', { period: '2025-01/2025-07' }, payload()],
    ['market mismatch', { marketId: 'sg-singapore', dataset: 'sg-market-context' }, payload()],
    ['unresolved object', {}, undefined],
  ])('fails closed on %s', (_label, overrides, resolved) => {
    const source = payload();
    const metadataOverrides = overrides as Readonly<Record<string, unknown>>;
    const repository = createInstalledSnapshotRepository({
      registrySource: registry(source, overrides),
      resolveObject: () => resolved,
    });

    expect(() => repository.get(
      (metadataOverrides.marketId ?? 'kr-seoul') as 'kr-seoul' | 'sg-singapore',
      (metadataOverrides.dataset ?? 'kr-building-registry') as
        | 'kr-building-registry'
        | 'sg-market-context',
    )).toThrow(InstalledSnapshotUnavailableError);
  });

  it('does not resolve an object when the requested activation is absent', () => {
    const source = payload();
    const resolveObject = vi.fn(() => source);
    const repository = createInstalledSnapshotRepository({
      registrySource: registry(source),
      resolveObject,
    });

    expect(() => repository.get('sg-singapore', 'sg-private-sale'))
      .toThrow(InstalledSnapshotUnavailableError);
    expect(resolveObject).not.toHaveBeenCalled();
  });
});
