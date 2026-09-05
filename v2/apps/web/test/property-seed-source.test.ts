import { describe, expect, it } from 'vitest';

import {
  loadPropertySeedRows,
  loadSeoulBuildingSeed,
  loadSingaporeHdbSeed,
  loadSingaporePrivateSeed,
} from '../scripts/property-seed-source.mjs';

type SeedIdentityRow = Readonly<{
  externalId: string;
  legacyKey: string;
  legacyMarketKey: string;
  globalEntityId: string;
  globalMarketId: string;
  address: string | null;
}>;

describe('SignedPrice property database seed source', () => {
  it('preserves every Seoul building ID and emits a deterministic photo-search address', () => {
    const rows = loadSeoulBuildingSeed() as readonly SeedIdentityRow[];
    expect(rows).toHaveLength(48_999);
    expect(rows).toContainEqual(expect.objectContaining({
      externalId: 'dobong-gu-11xgxzx',
      legacyKey: 'seoul:dobong-gu-11xgxzx',
      globalEntityId: 'kr-seoul:estate:dobong-gu-11xgxzx',
      address: '서울특별시 도봉구 도봉동 554-31',
    }));
    for (const row of rows) {
      expect(row.legacyKey).toBe(`seoul:${row.externalId}`);
      expect(row.globalEntityId).toBe(`kr-seoul:estate:${row.externalId}`);
      expect(row.address).toMatch(/^서울특별시 \S+구 \S+ /u);
    }
  });

  it('preserves Singapore private-project and HDB block IDs', () => {
    const privateRows = loadSingaporePrivateSeed() as readonly SeedIdentityRow[];
    const hdbRows = loadSingaporeHdbSeed() as readonly SeedIdentityRow[];
    expect(privateRows).toHaveLength(3_862);
    expect(hdbRows).toHaveLength(10_011);
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
    const rows = first.all as readonly SeedIdentityRow[];
    expect(first.summary).toEqual({
      seoul: 48_999,
      singaporePrivate: 3_862,
      singaporeHdb: 10_011,
      total: 62_872,
      legacyIdDigest: 'd86ae08ab146e07570ccbd7b15f07a80f3ca5fd537d7199f58628348439e446a',
      entityIdDigest: '92be10891460d8604c8b6661cd4884c3eaee9ce5791a14ec6c59a49a2d9e3729',
    });
    expect(second.summary).toEqual(first.summary);
    expect(new Set(rows.map((row) => row.legacyKey)).size).toBe(first.summary.total);
    expect(new Set(rows.map((row) => row.globalEntityId)).size).toBe(first.summary.total);
    expect(rows.some((row) => row.legacyMarketKey === 'dubai')).toBe(false);
    expect(rows.some((row) => row.globalMarketId === 'ae-dubai')).toBe(false);
  });
});
