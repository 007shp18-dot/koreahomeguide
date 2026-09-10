import { describe, expect, test } from 'vitest';

import {
  DERIVED_STALE_SECONDS,
  RENT_CHECK_CACHE_TAGS,
  SOURCE_CACHE_TTL_SECONDS,
  STABLE_RENT_CHECK_TAG,
} from '@signedprice/korea-rent';
import type { RuntimeCache } from '@vercel/functions';

import {
  VERCEL_RENT_CHECK_CACHE_NAMESPACE,
  createVercelRuntimeCache,
} from '../lib/rent-check/runtime-cache.server';

function createHarness(initialValue: unknown = null) {
  const cacheOptions: unknown[] = [];
  const gets: string[] = [];
  const sets: Parameters<RuntimeCache['set']>[] = [];
  const deletes: string[] = [];
  const expiredTags: (string | string[])[] = [];
  const hardDeletedTags: (string | string[])[] = [];
  const runtimeCache: RuntimeCache = {
    async get(key) {
      gets.push(key);
      return initialValue;
    },
    async set(...args) {
      sets.push(args);
    },
    async delete(key) {
      deletes.push(key);
    },
    async expireTag(tag) {
      expiredTags.push(tag);
    },
  };
  const port = createVercelRuntimeCache({
    getCache(options) {
      cacheOptions.push(options);
      return runtimeCache;
    },
    async dangerouslyDeleteByTag(tag) {
      hardDeletedTags.push(tag);
    },
  });
  return {
    port,
    calls: { cacheOptions, gets, sets, deletes, expiredTags, hardDeletedTags },
  };
}

describe('Vercel Runtime Cache adapter', () => {
  test('creates one cache client in the versioned Seoul Rent Check namespace', () => {
    const { calls } = createHarness();

    expect(calls.cacheOptions).toEqual([
      { namespace: VERCEL_RENT_CHECK_CACHE_NAMESPACE },
    ]);
    expect(VERCEL_RENT_CHECK_CACHE_NAMESPACE).toBe('signedprice:kr-seoul-rent-check:v1');
  });

  test('reads through the namespaced Vercel cache without changing the key', async () => {
    const value = { verified: true };
    const { port, calls } = createHarness(value);

    await expect(port.get<typeof value>('derived:key')).resolves.toEqual(value);
    expect(calls.gets).toEqual(['derived:key']);
  });

  test.each([
    ['source', SOURCE_CACHE_TTL_SECONDS],
    ['derived', DERIVED_STALE_SECONDS],
  ])('maps the %s TTL and every stable/version tag to Vercel options', async (kind, ttl) => {
    const { port, calls } = createHarness();
    const value = { kind };

    await port.set(`${kind}:key`, value, {
      ttlSeconds: ttl,
      tags: RENT_CHECK_CACHE_TAGS,
    });

    expect(calls.sets).toEqual([
      [
        `${kind}:key`,
        value,
        {
          ttl,
          tags: [
            'kr-seoul-rent-check',
            'market:kr-seoul',
            'parser:kr-molit-rent-parser-v2',
            'methodology:kr-rent-check-quote-normalization:1',
            'rights:kr-molit-rent-v1',
          ],
        },
      ],
    ]);
  });

  test('hard-deletes the stable tag through the top-level Vercel API exactly once', async () => {
    const { port, calls } = createHarness();

    await port.hardDeleteByTag(STABLE_RENT_CHECK_TAG);

    expect(calls.hardDeletedTags).toEqual(['kr-seoul-rent-check']);
    expect(calls.expiredTags).toEqual([]);
    expect(calls.deletes).toEqual([]);
  });
});
