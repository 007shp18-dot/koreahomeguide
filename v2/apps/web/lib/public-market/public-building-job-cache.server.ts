import 'server-only';

import { dangerouslyDeleteByTag, getCache, type RuntimeCache } from '@vercel/functions';
import type { RuntimeCacheEntryOptions, RuntimeCachePort } from '@signedprice/korea-rent';

const namespace = 'signedprice:kr-public-building-job:v2';
const sourceTag = 'kr-public-summary-job:v1';

export function createPublicBuildingJobRuntimeCache(): RuntimeCachePort {
  const cache: RuntimeCache = getCache({ namespace });
  return Object.freeze({
    async get<T>(key: string): Promise<T | null> {
      return (await cache.get(key)) as T | null;
    },
    async set<T>(key: string, value: T, options: RuntimeCacheEntryOptions): Promise<void> {
      if (options.tags.length !== 1 || options.tags[0] !== sourceTag) {
        throw new TypeError('Building job cache requires the isolated source tag.');
      }
      await cache.set(key, value, { ttl: options.ttlSeconds, tags: [sourceTag] });
    },
    async hardDeleteByTag(tag: string): Promise<void> {
      if (tag !== sourceTag) throw new TypeError('Building job cache requires the source tag.');
      await dangerouslyDeleteByTag(sourceTag);
    },
  });
}
