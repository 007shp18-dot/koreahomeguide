import { describe, expect, it } from 'vitest';

import {
  loadPropertySeedRows,
  loadSeoulBuildingSeed,
  loadSingaporeHdbSeed,
  loadSingaporePrivateSeed,
} from '../scripts/property-seed-source.mjs';

describe('SignedPrice property database seed source', () => {
  it('preserves every Seoul building ID instead of generating a replacement ID', () => {
    const rows = loadSeoulBuildingSeed();
    expect(rows).toHaveLength(48_999);
    expect(rows).toContainEqual(expect.objectContaining({
      externalId: 'dobong-gu-jljtx9',
      legacyKey: 'seoul:dobong-gu-jljtx9',
      globalEntityId: 'kr-seoul:estate:dobong-gu-jljtx9',
    }));
    for (const row of rows) {
      expect(row.legacyKey).toBe(`seoul:${row.externalId}`);
      expect(row.globalEntityId).toBe(`kr-seoul:estate:${row.externalId}`);
    }
  });

  it('preserves Singapore private-project and HDB block IDs', () => {
    const privateRows = loadSingaporePrivateSeed();
    const hdbRows = loadSingaporeHdbSeed();
    expect(privateRows).toHaveLength(3_862);
    expect(hdbRows.length).toBeGreaterThan(0);
    for (const row of privateRows) {
      expect(row.externalId).toMatch(/^[0-9a-f]{64}$/);
      expect(row.legacyKey).toBe(`singapore:project:${row.externalId}`);
      expect(row.globalEntityId).toBe(`sg-singapore:project:${row.externalId}`);
    }
    for (const row of hdbRows) {
      expect(row.externalId).toMatch(/^[0-9a-f]{64}$/);
      expect(row.legacyKey).toBe(`singapore:block:${row.externalId}`);
      expect(row.globalEntityId).toBe(`sg-singapore:block:${row.externalId}`);
    }
  });

  it('is deterministic, duplicate-free and never emits Dubai rows', () => {
    const first = loadPropertySeedRows();
    const second = loadPropertySeedRows();
    expect(second.summary).toEqual(first.summary);
    expect(new Set(first.all.map((row) => row.legacyKey)).size).toBe(first.summary.total);
    expect(new Set(first.all.map((row) => row.globalEntityId)).size).toBe(first.summary.total);
    expect(first.all.some((row) => row.legacyMarketKey === 'dubai')).toBe(false);
    expect(first.all.some((row) => row.globalMarketId === 'ae-dubai')).toBe(false);
  });
});
