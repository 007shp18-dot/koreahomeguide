import {
  dangerouslyDeleteByTag,
  getCache,
  type RuntimeCache,
} from '@vercel/functions';
import type {
  RuntimeCacheEntryOptions,
  RuntimeCachePort,
} from '@signedprice/korea-rent';

export const VERCEL_RENT_CHECK_CACHE_NAMESPACE =
  'signedprice:kr-seoul-rent-check:v1' as const;

export type VercelRuntimeCacheDependencies = {
  readonly getCache: typeof getCache;
  readonly dangerouslyDeleteByTag: typeof dangerouslyDeleteByTag;
};

const productionDependencies: VercelRuntimeCacheDependencies = {
  getCache,
  dangerouslyDeleteByTag,
};

export function createVercelRuntimeCache(
  dependencies: VercelRuntimeCacheDependencies = productionDependencies,
): RuntimeCachePort {
  const runtimeCache: RuntimeCache = dependencies.getCache({
    namespace: VERCEL_RENT_CHECK_CACHE_NAMESPACE,
  });

  return {
    async get<T>(key: string): Promise<T | null> {
      return (await runtimeCache.get(key)) as T | null;
    },
    async set<T>(
      key: string,
      value: T,
      options: RuntimeCacheEntryOptions,
    ): Promise<void> {
      await runtimeCache.set(key, value, {
        ttl: options.ttlSeconds,
        tags: [...options.tags],
      });
    },
    async hardDeleteByTag(tag): Promise<void> {
      await dependencies.dangerouslyDeleteByTag(tag);
    },
  };
}
