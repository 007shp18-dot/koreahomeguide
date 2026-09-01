import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  InstalledSnapshotUnavailableError,
  createInstalledSnapshotRepository,
} from '../lib/snapshots/installed-snapshot-repository.server';

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

describe('installed snapshot repository', () => {
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
