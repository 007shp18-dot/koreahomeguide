import { describe, expect, it } from 'vitest';

import {
  loadPropertyEvidenceSeed,
  propertyEvidenceSeedPage,
} from '../scripts/property-evidence-seed-source.mjs';

describe('SignedPrice property evidence database seed source', () => {
  it('projects only transaction rows that exist in the installed artifacts', () => {
    const seed = loadPropertyEvidenceSeed();

    expect(seed.summary).toMatchObject({
      koreaRentObservations: 177_641,
      koreaSaleObservations: 62_678,
      singaporePrivateObservations: 133_942,
      observationTotal: 374_261,
      hdbMetricRows: 40_044,
    });
    expect(seed.summary.observationIdentityDigest).toMatch(/^[a-f0-9]{64}$/u);
    expect(seed.summary.observationContentDigest).toMatch(/^[a-f0-9]{64}$/u);
    expect(seed.summary.metricIdentityDigest).toMatch(/^[a-f0-9]{64}$/u);
  }, 30_000);

  it('emits deterministic metadata for four installed evidence releases', () => {
    const first = loadPropertyEvidenceSeed();
    const second = loadPropertyEvidenceSeed();

    expect(first.metadata.rightsPolicies).toHaveLength(4);
    expect(first.metadata.datasets.map(({ id }: { id: string }) => id)).toEqual([
      'kr-rent', 'kr-sale', 'sg-hdb', 'sg-private-sale',
    ]);
    expect(first.metadata.evidenceReleases).toHaveLength(4);
    expect(second.summary).toEqual(first.summary);
  }, 30_000);

  it('pages stable scoped rows without exposing Dubai or the absent source rows', () => {
    const rent = propertyEvidenceSeedPage('kr-rent', 0, 2);
    const privateSale = propertyEvidenceSeedPage('sg-private-sale', 0, 2);
    const hdbMetrics = propertyEvidenceSeedPage('sg-hdb-metrics', 0, 4);

    expect(rent).toMatchObject({ kind: 'kr-rent', offset: 0, limit: 2, total: 177_641 });
    expect(privateSale).toMatchObject({ kind: 'sg-private-sale', total: 133_942 });
    expect(hdbMetrics).toMatchObject({ kind: 'sg-hdb-metrics', total: 40_044 });
    expect(rent.items).toHaveLength(2);
    expect(privateSale.items).toHaveLength(2);
    expect(hdbMetrics.items).toHaveLength(4);

    for (const row of [...rent.items, ...privateSale.items]) {
      expect(row.entityId).toMatch(/^(?:kr-seoul|sg-singapore):/u);
      expect(row.entityId).not.toContain('dubai');
      expect(row.businessKey).not.toContain('dubai');
      expect(row.contentHash).toMatch(/^[a-f0-9]{64}$/u);
    }
    for (const row of hdbMetrics.items) {
      expect(row.entityId).toMatch(/^sg-singapore:block:/u);
      expect(row.identityKey).not.toContain('dubai');
    }
  }, 30_000);

  it('keeps business and metric identities unique within each dataset', () => {
    const readAll = (kind: 'kr-rent' | 'kr-sale' | 'sg-private-sale' | 'sg-hdb-metrics', total: number) => {
      const rows: Array<{ businessKey?: string; identityKey?: string }> = [];
      for (let offset = 0; offset < total; offset += 5_000) {
        rows.push(...propertyEvidenceSeedPage(kind, offset, 5_000).items);
      }
      return rows;
    };
    for (const kind of ['kr-rent', 'kr-sale', 'sg-private-sale'] as const) {
      const total = propertyEvidenceSeedPage(kind, 0, 1).total;
      const rows = readAll(kind, total);
      expect(new Set(rows.map(({ businessKey }) => businessKey)).size).toBe(total);
    }
    const metricTotal = propertyEvidenceSeedPage('sg-hdb-metrics', 0, 1).total;
    const metrics = readAll('sg-hdb-metrics', metricTotal);
    expect(new Set(metrics.map(({ identityKey }) => identityKey)).size).toBe(metricTotal);
  }, 30_000);
});
