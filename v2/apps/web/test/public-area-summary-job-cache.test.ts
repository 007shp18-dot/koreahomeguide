import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import type { RuntimeCache } from '@vercel/functions';
import {
  PUBLIC_AREA_SUMMARY_JOB_CACHE_NAMESPACE,
  PUBLIC_AREA_SUMMARY_JOB_CACHE_TAG,
  createPublicAreaSummaryJobRuntimeCache,
} from '../lib/public-market/public-area-summary-job-cache.server';

function runtimeCache(): RuntimeCache {
  return {
    async get() { return null; },
    async set() {},
    async delete() {},
    async expireTag() {},
  } as RuntimeCache;
}

describe('public area summary Vercel cache adapter', () => {
  it('uses only the verified source-job namespace and tag, never Rent Check cache', async () => {
    const cacheOptions: unknown[] = [];
    const sets: unknown[] = [];
    const deletedTags: unknown[] = [];
    const cache = runtimeCache();
    cache.set = async (...args: unknown[]) => { sets.push(args); };
    const port = createPublicAreaSummaryJobRuntimeCache({
      getCache(options) {
        cacheOptions.push(options);
        return cache;
      },
      async dangerouslyDeleteByTag(tag) {
        deletedTags.push(tag);
      },
    });

    await port.set('source:key', { verified: true }, {
      ttlSeconds: 86_400,
      tags: [PUBLIC_AREA_SUMMARY_JOB_CACHE_TAG],
    });
    await port.hardDeleteByTag(PUBLIC_AREA_SUMMARY_JOB_CACHE_TAG);

    expect(PUBLIC_AREA_SUMMARY_JOB_CACHE_NAMESPACE)
      .toBe('signedprice:kr-public-summary-job:v1');
    expect(PUBLIC_AREA_SUMMARY_JOB_CACHE_TAG).toBe('kr-public-summary-job:v1');
    expect(cacheOptions).toEqual([{
      namespace: 'signedprice:kr-public-summary-job:v1',
    }]);
    expect(sets).toEqual([[
      'source:key',
      { verified: true },
      { ttl: 86_400, tags: ['kr-public-summary-job:v1'] },
    ]]);
    expect(deletedTags).toEqual(['kr-public-summary-job:v1']);
    expect(JSON.stringify({ cacheOptions, sets, deletedTags })).not.toMatch(
      /signedprice:kr-seoul-rent-check|VERCEL_RENT_CHECK_CACHE_NAMESPACE/,
    );
  });

  it('refuses any foreign tag before cache mutation', async () => {
    let setCalls = 0;
    const cache = runtimeCache();
    cache.set = async () => { setCalls += 1; };
    const port = createPublicAreaSummaryJobRuntimeCache({
      getCache: () => cache,
      async dangerouslyDeleteByTag() {},
    });

    await expect(port.set('source:key', {}, {
      ttlSeconds: 86_400,
      tags: ['kr-seoul-rent-check'],
    })).rejects.toThrow('isolated job tag');
    expect(setCalls).toBe(0);
  });
});
