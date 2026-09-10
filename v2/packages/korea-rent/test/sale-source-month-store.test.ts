import { describe, expect, it } from 'vitest';

import {
  MOLIT_SALE_ENDPOINT_VERSION,
  MOLIT_SALE_PARSER_VERSION,
  MOLIT_SALE_RIGHTS_POLICY_ID,
  createSaleSourceMonthStore,
  type KoreaSaleRecord,
  type MolitSaleMonth,
  type RuntimeCacheEntryOptions,
  type RuntimeCachePort,
  type SaleSourceMonthIdentity,
} from '../src';

type Stored = Readonly<{
  value: unknown;
  options: RuntimeCacheEntryOptions;
}>;

class InspectableCache implements RuntimeCachePort {
  readonly entries = new Map<string, Stored>();
  readonly deletedTags: string[] = [];

  async get<T>(key: string): Promise<T | null> {
    return (this.entries.get(key)?.value as T | undefined) ?? null;
  }

  async set<T>(key: string, value: T, options: RuntimeCacheEntryOptions): Promise<void> {
    this.entries.set(key, { value, options });
  }

  async hardDeleteByTag(tag: string): Promise<void> {
    this.deletedTags.push(tag);
    for (const [key, entry] of this.entries) {
      if (entry.options.tags.includes(tag)) this.entries.delete(key);
    }
  }
}

const identity: SaleSourceMonthIdentity = {
  sourceHousingType: 'apartment',
  lawdCd: '11110',
  dealYmd: '202607',
  pageSize: 100,
};

function month(): MolitSaleMonth {
  const row: KoreaSaleRecord = {
    sourceHousingType: 'apartment',
    areaSqm: 59.97,
    priceWon: 1_465_000_000,
    contractDate: '2026-07-15',
    recordStatus: 'active',
    buildingLabel: '한강서울',
    legalDong: '여의도동',
    sourceRecordId: 'sale-fixture-1',
    floor: 12,
    buildYear: 2018,
  };
  return {
    ...identity,
    totalCount: 1,
    pages: [{
      pageNo: 1,
      rows: [row],
      rowFingerprintDigests: ['a'.repeat(64)],
    }],
    records: [row],
    retrievedAt: '2026-08-30T00:00:00.000Z',
  };
}

describe('sale source-month store', () => {
  it('uses a sale-only namespace, parser, rights policy, TTL, and tags', async () => {
    const cache = new InspectableCache();
    const store = createSaleSourceMonthStore({
      namespacePrefix: 'signedprice:kr-sale-job:v1',
      ttlSeconds: 43_200,
      tags: ['kr-sale-job:v1'],
      corruptTag: 'kr-sale-job:v1',
    });

    expect(store.namespace(identity)).toBe(
      `signedprice:kr-sale-job:v1:market=kr-seoul:endpoint=${MOLIT_SALE_ENDPOINT_VERSION}:` +
      `type=apartment:lawd=11110:month=202607:pageSize=100:` +
      `parser=${MOLIT_SALE_PARSER_VERSION}:rights=${MOLIT_SALE_RIGHTS_POLICY_ID}`,
    );

    await store.write(cache, month());
    expect([...cache.entries.values()].every((entry) =>
      entry.options.ttlSeconds === 43_200 &&
      entry.options.tags.join(',') === 'kr-sale-job:v1')).toBe(true);
    await expect(store.read(cache, identity)).resolves.toEqual(month());
  });

  it('deletes only the sale generation when any chunk fails exact validation', async () => {
    const cache = new InspectableCache();
    const store = createSaleSourceMonthStore({
      namespacePrefix: 'signedprice:kr-sale-job:v1',
      ttlSeconds: 43_200,
      tags: ['kr-sale-job:v1'],
      corruptTag: 'kr-sale-job:v1',
    });
    await store.write(cache, month());
    const pageKey = [...cache.entries.keys()].find((key) => key.includes(':page=1'))!;
    const page = cache.entries.get(pageKey)!;
    cache.entries.set(pageKey, {
      ...page,
      value: { ...(page.value as object), rows: [{ bad: true }] },
    });

    await expect(store.read(cache, identity)).resolves.toBeNull();
    expect(cache.deletedTags).toEqual(['kr-sale-job:v1']);
    expect(cache.deletedTags).not.toContain('kr-public-summary-job:v1');
  });

  it('does not publish a manifest when a page write fails', async () => {
    const cache = new InspectableCache();
    const originalSet = cache.set.bind(cache);
    cache.set = async (key, value, options) => {
      if (key.includes(':page=1')) throw new Error('cache unavailable');
      await originalSet(key, value, options);
    };
    const store = createSaleSourceMonthStore({
      namespacePrefix: 'signedprice:kr-sale-job:v1',
      ttlSeconds: 43_200,
      tags: ['kr-sale-job:v1'],
      corruptTag: 'kr-sale-job:v1',
    });

    await expect(store.write(cache, month())).resolves.toBeUndefined();
    expect([...cache.entries.keys()].some((key) => key.endsWith(':manifest'))).toBe(false);
  });
});
