import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import type { RuntimeCache } from '@vercel/functions';

import {
  PUBLIC_SUMMARY_JOB_CACHE_NAMESPACE,
  PUBLIC_SUMMARY_JOB_CACHE_TAG,
  createPublicSummaryJobRuntimeCache,
} from '../lib/public-market/public-summary-job-cache.server';

describe('public summary Vercel cache adapter', () => {
  it('uses only the isolated job namespace and tag', async () => {
    const cacheOptions: unknown[] = [];
    const sets: unknown[] = [];
    const deletedTags: unknown[] = [];
    const runtimeCache = {
      async get() { return null; },
      async set(...args: unknown[]) { sets.push(args); },
      async delete() {},
      async expireTag() {},
    } as RuntimeCache;
    const port = createPublicSummaryJobRuntimeCache({
      getCache(options) {
        cacheOptions.push(options);
        return runtimeCache;
      },
      async dangerouslyDeleteByTag(tag) {
        deletedTags.push(tag);
      },
    });

    await port.set('source:key', { verified: true }, {
      ttlSeconds: 86_400,
      tags: [PUBLIC_SUMMARY_JOB_CACHE_TAG],
    });
    await port.hardDeleteByTag(PUBLIC_SUMMARY_JOB_CACHE_TAG);

    expect(PUBLIC_SUMMARY_JOB_CACHE_NAMESPACE).toBe('signedprice:kr-public-summary-job:v1');
    expect(cacheOptions).toEqual([{ namespace: 'signedprice:kr-public-summary-job:v1' }]);
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

  it('refuses a non-job tag at the adapter boundary', async () => {
    const runtimeCache = {
      async get() { return null; },
      async set() {},
      async delete() {},
      async expireTag() {},
    } as RuntimeCache;
    const port = createPublicSummaryJobRuntimeCache({
      getCache: () => runtimeCache,
      async dangerouslyDeleteByTag() {},
    });

    await expect(port.hardDeleteByTag('kr-seoul-rent-check')).rejects.toThrow('job tag');
  });
});
