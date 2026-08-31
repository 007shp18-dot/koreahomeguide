import 'server-only';

import {
  dangerouslyDeleteByTag,
  getCache,
  type RuntimeCache,
} from '@vercel/functions';
import type {
  RuntimeCacheEntryOptions,
  RuntimeCachePort,
} from '@signedprice/korea-rent';

const CACHE_NAMESPACE = 'signedprice:kr-public-summary-job:v1';
const CACHE_TAG = 'kr-public-summary-job:v1';

export function createPublicAreaSummaryJobRuntimeCache(): RuntimeCachePort {
  const runtimeCache: RuntimeCache = getCache({ namespace: CACHE_NAMESPACE });
  return Object.freeze({
    async get<T>(key: string): Promise<T | null> {
      return (await runtimeCache.get(key)) as T | null;
    },
    async set<T>(
      key: string,
      value: T,
      options: RuntimeCacheEntryOptions,
    ): Promise<void> {
      if (options.tags.length !== 1 || options.tags[0] !== CACHE_TAG) {
        throw new TypeError('Public area summary cache requires the isolated job tag.');
      }
      await runtimeCache.set(key, value, {
        ttl: options.ttlSeconds,
        tags: [CACHE_TAG],
      });
    },
    async hardDeleteByTag(tag: string): Promise<void> {
      if (tag !== CACHE_TAG) {
        throw new TypeError('Public area summary cache requires the isolated job tag.');
      }
      await dangerouslyDeleteByTag(CACHE_TAG);
    },
  });
}
