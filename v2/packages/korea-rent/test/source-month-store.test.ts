import { describe, expect, it } from 'vitest';

import {
  RENT_CHECK_CACHE_TAGS,
  STABLE_RENT_CHECK_TAG,
  sourceCacheNamespace,
  writeSourceMonthCache,
  type RuntimeCacheEntryOptions,
  type RuntimeCachePort,
} from '../src/cache';
import {
  createSourceMonthStore,
  type SourceMonthIdentity,
} from '../src/source-month-store';
import type { KoreaRentRecord, MolitRentalMonth } from '../src';

type Stored = {
  value: unknown;
  options: RuntimeCacheEntryOptions;
};

class InspectableCache implements RuntimeCachePort {
  readonly entries = new Map<string, Stored>();
  readonly deletedTags: string[] = [];

  async get<T>(key: string): Promise<T | null> {
    return (this.entries.get(key)?.value as T | undefined) ?? null;
  }

  async set<T>(
    key: string,
    value: T,
    options: RuntimeCacheEntryOptions,
  ): Promise<void> {
    this.entries.set(key, { value, options });
  }

  async hardDeleteByTag(tag: string): Promise<void> {
    this.deletedTags.push(tag);
    for (const [key, entry] of this.entries) {
      if (entry.options.tags.includes(tag)) this.entries.delete(key);
    }
  }
}

const identity: SourceMonthIdentity = {
  sourceHousingType: 'apartment',
  lawdCd: '11110',
  dealYmd: '202607',
  pageSize: 100,
};

function month(): MolitRentalMonth {
  const row: KoreaRentRecord = {
    sourceHousingType: 'apartment',
    areaSqm: 50,
    depositWon: 300_000_000,
    monthlyRentWon: 0,
    contractDate: '2026-07-15',
    contractType: 'new',
    recordStatus: 'active',
    sourceRecordId: 'fixture-1',
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

describe('configurable source-month store', () => {
  it('isolates job keys, tags, and corrupt-generation deletion', async () => {
    const cache = new InspectableCache();
    const store = createSourceMonthStore({
      namespacePrefix: 'signedprice:kr-public-summary-job:v1',
      ttlSeconds: 43_200,
      tags: ['kr-public-summary-job:v1'],
      corruptTag: 'kr-public-summary-job:v1',
    });

    await store.write(cache, month());

    expect([...cache.entries.keys()].every((key) =>
      key.startsWith('signedprice:kr-public-summary-job:v1:'))).toBe(true);
    expect([...cache.entries.values()].every((entry) =>
      entry.options.ttlSeconds === 43_200 &&
      entry.options.tags.join(',') === 'kr-public-summary-job:v1')).toBe(true);

    const manifestKey = [...cache.entries.keys()].find((key) => key.endsWith(':manifest'))!;
    const manifest = cache.entries.get(manifestKey)!;
    cache.entries.set(manifestKey, {
      ...manifest,
      value: { ...(manifest.value as object), kind: 'corrupt' },
    });

    await expect(store.read(cache, identity)).resolves.toBeNull();
    expect(cache.deletedTags).toEqual(['kr-public-summary-job:v1']);
    expect(cache.deletedTags).not.toContain(STABLE_RENT_CHECK_TAG);
  });

  it('keeps the legacy Rent Check namespace and tags byte-for-byte unchanged', async () => {
    const cache = new InspectableCache();

    expect(sourceCacheNamespace(identity)).toBe(
      'kr-seoul-rent-check:source:market=kr-seoul:endpoint=v1:' +
      'type=apartment:lawd=11110:month=202607:pageSize=100:' +
      'parser=kr-molit-rent-parser-v2:rights=kr-molit-rent-v1',
    );

    await writeSourceMonthCache(cache, month());

    expect([...cache.entries.values()].every((entry) =>
      JSON.stringify(entry.options.tags) === JSON.stringify(RENT_CHECK_CACHE_TAGS))).toBe(true);
  });
});
