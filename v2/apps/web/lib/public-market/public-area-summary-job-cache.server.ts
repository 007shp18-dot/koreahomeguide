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

export const PUBLIC_AREA_SUMMARY_JOB_CACHE_NAMESPACE =
  'signedprice:kr-public-summary-job:v1' as const;
export const PUBLIC_AREA_SUMMARY_JOB_CACHE_TAG =
  'kr-public-summary-job:v1' as const;

export type PublicAreaSummaryJobCacheDependencies = Readonly<{
  getCache: typeof getCache;
  dangerouslyDeleteByTag: typeof dangerouslyDeleteByTag;
}>;

const productionDependencies: PublicAreaSummaryJobCacheDependencies = {
  getCache,
  dangerouslyDeleteByTag,
};

function assertJobTags(tags: readonly string[]): void {
  if (tags.length !== 1 || tags[0] !== PUBLIC_AREA_SUMMARY_JOB_CACHE_TAG) {
    throw new TypeError('Public area summary cache requires the isolated job tag.');
  }
}

export function createPublicAreaSummaryJobRuntimeCache(
  dependencies: PublicAreaSummaryJobCacheDependencies = productionDependencies,
): RuntimeCachePort {
  const runtimeCache: RuntimeCache = dependencies.getCache({
    namespace: PUBLIC_AREA_SUMMARY_JOB_CACHE_NAMESPACE,
  });
  return Object.freeze({
    async get<T>(key: string): Promise<T | null> {
      return (await runtimeCache.get(key)) as T | null;
    },
    async set<T>(
      key: string,
      value: T,
      options: RuntimeCacheEntryOptions,
    ): Promise<void> {
      assertJobTags(options.tags);
      await runtimeCache.set(key, value, {
        ttl: options.ttlSeconds,
        tags: [PUBLIC_AREA_SUMMARY_JOB_CACHE_TAG],
      });
    },
    async hardDeleteByTag(tag: string): Promise<void> {
      assertJobTags([tag]);
      await dependencies.dangerouslyDeleteByTag(PUBLIC_AREA_SUMMARY_JOB_CACHE_TAG);
    },
  });
}
