import { describe, expect, it } from 'vitest';

import { parseInstalledSnapshotRegistry } from '../src/snapshots';

function validRegistry(): unknown {
  return {
    registryVersion: 'signedprice-installed-snapshots-v1',
    snapshots: [
      {
        marketId: 'kr-seoul',
        dataset: 'kr-building-registry',
        schemaVersion: 'signedprice-observed-building-inventory-v1',
        sourceVersion: 'molit-rent-v1',
        parserVersion: 'kr-molit-building-parser-v2',
        rightsPolicyId: 'kr-molit-rent-v1',
        period: '2026-01/2026-07',
        generatedAt: '2026-09-01T01:15:56.720Z',
        objectUrl: 'installed://kr-building-registry',
        sha256: 'a'.repeat(64),
        recordCount: 317,
      },
    ],
  };
}

describe('installed snapshot registry', () => {
  it('returns a deeply immutable registry for an exact valid contract', () => {
    const source = validRegistry();
    const parsed = parseInstalledSnapshotRegistry(source);
    const mutable = parsed as unknown as {
      snapshots: Array<{ recordCount: number }>;
    };

    try {
      mutable.snapshots[0]!.recordCount = 0;
      mutable.snapshots.push(mutable.snapshots[0]!);
    } catch {
      // Frozen contracts reject mutation in strict mode.
    }

    expect(parsed).toEqual(source);
    expect(parsed.snapshots[0]!.recordCount).toBe(317);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.snapshots)).toBe(true);
    expect(Object.isFrozen(parsed.snapshots[0])).toBe(true);
  });

  it.each([
    ['unknown root key', (value: Record<string, unknown>) => { value.extra = true; }],
    ['unknown snapshot key', (value: Record<string, unknown>) => {
      (value.snapshots as Array<Record<string, unknown>>)[0]!.extra = true;
    }],
    ['unknown market', (value: Record<string, unknown>) => {
      (value.snapshots as Array<Record<string, unknown>>)[0]!.marketId = 'kr-busan';
    }],
    ['unknown dataset', (value: Record<string, unknown>) => {
      (value.snapshots as Array<Record<string, unknown>>)[0]!.dataset = 'kr-listings';
    }],
    ['reversed period', (value: Record<string, unknown>) => {
      (value.snapshots as Array<Record<string, unknown>>)[0]!.period = '2026-07/2026-01';
    }],
    ['invalid calendar month', (value: Record<string, unknown>) => {
      (value.snapshots as Array<Record<string, unknown>>)[0]!.period = '2026-00/2026-07';
    }],
    ['non-canonical instant', (value: Record<string, unknown>) => {
      (value.snapshots as Array<Record<string, unknown>>)[0]!.generatedAt = '2026-09-01';
    }],
    ['arbitrary object URL', (value: Record<string, unknown>) => {
      (value.snapshots as Array<Record<string, unknown>>)[0]!.objectUrl = 'file:///tmp/data.json';
    }],
    ['invalid digest', (value: Record<string, unknown>) => {
      (value.snapshots as Array<Record<string, unknown>>)[0]!.sha256 = 'A'.repeat(64);
    }],
    ['negative record count', (value: Record<string, unknown>) => {
      (value.snapshots as Array<Record<string, unknown>>)[0]!.recordCount = -1;
    }],
    ['blank version', (value: Record<string, unknown>) => {
      (value.snapshots as Array<Record<string, unknown>>)[0]!.parserVersion = ' ';
    }],
  ])('rejects %s', (_label, mutate) => {
    const value = validRegistry() as Record<string, unknown>;
    mutate(value);

    expect(() => parseInstalledSnapshotRegistry(value)).toThrow(
      'Invalid installed snapshot registry.',
    );
  });

  it('rejects duplicate market and dataset activation records', () => {
    const value = validRegistry() as { snapshots: unknown[] };
    value.snapshots.push(structuredClone(value.snapshots[0]));

    expect(() => parseInstalledSnapshotRegistry(value)).toThrow(
      'Invalid installed snapshot registry.',
    );
  });

  it('accepts an HTTPS object location for a server-owned immutable object', () => {
    const value = validRegistry() as { snapshots: Array<Record<string, unknown>> };
    value.snapshots[0]!.objectUrl = 'https://objects.signedprice.internal/snapshots/kr-building-registry.json';

    expect(parseInstalledSnapshotRegistry(value).snapshots[0]!.objectUrl).toBe(
      'https://objects.signedprice.internal/snapshots/kr-building-registry.json',
    );
  });

  it.each([
    ['kr-seoul', 'kr-building-registry'],
    ['kr-seoul', 'kr-sale'],
    ['kr-seoul', 'kr-rent'],
    ['kr-seoul', 'kr-conversion'],
    ['sg-singapore', 'sg-private-sale'],
    ['sg-singapore', 'sg-private-rent'],
    ['sg-singapore', 'sg-hdb'],
    ['sg-singapore', 'sg-market-context'],
  ])('accepts the supported %s %s activation pair', (marketId, dataset) => {
    const value = validRegistry() as { snapshots: Array<Record<string, unknown>> };
    value.snapshots[0]!.marketId = marketId;
    value.snapshots[0]!.dataset = dataset;

    expect(parseInstalledSnapshotRegistry(value).snapshots[0]).toMatchObject({
      marketId,
      dataset,
    });
  });

  it('rejects a dataset installed under the wrong market', () => {
    const value = validRegistry() as { snapshots: Array<Record<string, unknown>> };
    value.snapshots[0]!.dataset = 'sg-private-sale';

    expect(() => parseInstalledSnapshotRegistry(value)).toThrow(
      'Invalid installed snapshot registry.',
    );
  });
});
