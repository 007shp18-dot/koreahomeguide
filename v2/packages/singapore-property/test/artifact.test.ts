import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import type { UraRightsOperation } from '../src/rights.ts';
import {
  buildSingaporeSnapshot,
  calculatePsf,
  parseSingaporeSnapshot,
  stringifySingaporeSnapshot,
  toSquareFeet,
} from '../src/artifact';
import { parseUraPrivateSaleEnvelope } from '../src/ura-transaction.ts';

const fixture = JSON.parse(readFileSync(
  new URL('./fixtures/ura-transaction-envelope.synthetic.json', import.meta.url),
  'utf8',
)) as unknown;

const allowedRights = Object.freeze({
  operations: Object.freeze({
    ingest: 'allowed', aggregate: 'allowed', display: 'allowed', commercial: 'allowed', index: 'blocked',
  } as const satisfies Readonly<Record<UraRightsOperation, 'allowed' | 'blocked'>>),
});

function records() {
  return [1, 2, 3, 4].flatMap((batch) => parseUraPrivateSaleEnvelope(fixture, batch));
}

describe('Singapore private-sale snapshot', () => {
  it('uses native measurements, raw observations, and complete batch reconciliation', () => {
    expect(toSquareFeet(100)).toBeCloseTo(1076.39104167, 8);
    expect(calculatePsf(2_000_000, 100)).toBe(1858);

    const snapshot = buildSingaporeSnapshot({
      records: records(),
      generatedAt: '2026-08-31T09:00:00.000Z',
      rights: allowedRights,
    });

    expect(snapshot.version).toBe('signedprice-singapore-private-sale-v1');
    expect(snapshot.sourceBatches).toEqual([1, 2, 3, 4]);
    expect(snapshot.period).toEqual({ from: '2026-06', to: '2026-08' });
    expect(snapshot.totals).toEqual({ projects: 2, transactions: 12, excluded: 0 });
    expect(snapshot.totals.transactions).toBe(
      snapshot.segments.reduce((sum, segment) => sum + segment.n, 0),
    );
    expect(snapshot.segments.map(({ segment, n, published }) => ({ segment, n, published }))).toEqual([
      { segment: 'CCR', n: 8, published: true },
      { segment: 'RCR', n: 0, published: false },
      { segment: 'OCR', n: 4, published: false },
    ]);
    expect(snapshot.segments[0]).toMatchObject({
      medianPriceSgd: 2_225_000,
      medianPsf: 1_873,
    });
    expect(snapshot.segments[1]).toMatchObject({
      medianPriceSgd: null,
      medianPsf: null,
      reason: 'minimum_sample_not_met',
    });
    expect(snapshot.projects.map(({ id }) => id)).toHaveLength(2);
    expect(new Set(snapshot.projects.map(({ id }) => id)).size).toBe(2);
    expect(snapshot.projects.every(({ id }) => /^[a-f0-9]{64}$/.test(id))).toBe(true);
    expect(snapshot.digest).toMatch(/^[a-f0-9]{64}$/);
  });

  it('sorts records deterministically and parses a canonical deep-frozen snapshot', () => {
    const source = records().reverse();
    const snapshot = buildSingaporeSnapshot({
      records: source,
      generatedAt: '2026-08-31T09:00:00.000Z',
      rights: allowedRights,
    });
    expect(snapshot.records.map(({ contractMonth }) => contractMonth)).toEqual(
      [...snapshot.records.map(({ contractMonth }) => contractMonth)].sort().reverse(),
    );

    const parsed = parseSingaporeSnapshot(stringifySingaporeSnapshot(snapshot));
    expect(parsed).toEqual(snapshot);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.records[0])).toBe(true);
  });

  it('refuses pending rights, incomplete batches, and digest mutation', () => {
    expect(() => buildSingaporeSnapshot({
      records: records(),
      generatedAt: '2026-08-31T09:00:00.000Z',
      rights: {
        operations: {
          aggregate: 'requires_dataset_confirmation',
          display: 'requires_dataset_confirmation',
        },
      },
    })).toThrow('Singapore snapshot publication rights are not confirmed.');

    expect(() => buildSingaporeSnapshot({
      records: records().filter(({ sourceOrder }) => sourceOrder.batch !== 4),
      generatedAt: '2026-08-31T09:00:00.000Z',
      rights: allowedRights,
    })).toThrow('Singapore snapshot requires four complete batches.');

    const snapshot = buildSingaporeSnapshot({
      records: records(),
      generatedAt: '2026-08-31T09:00:00.000Z',
      rights: allowedRights,
    });
    const altered = JSON.parse(stringifySingaporeSnapshot(snapshot)) as Record<string, unknown>;
    const alteredRecords = altered.records as Array<Record<string, unknown>>;
    alteredRecords[0]!.priceSgd = 1;
    expect(() => parseSingaporeSnapshot(JSON.stringify(altered))).toThrow(
      'Singapore snapshot digest is invalid.',
    );
  });
});
