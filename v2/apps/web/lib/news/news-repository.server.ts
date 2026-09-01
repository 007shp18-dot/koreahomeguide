import 'server-only';

import {
  parseVerifiedNewsRecord,
  type NewsMarketId,
  type VerifiedNewsRecord,
} from './news-schema';

export type NewsRepository = Readonly<{
  list(marketId: NewsMarketId): readonly VerifiedNewsRecord[];
  getBySlug(marketId: NewsMarketId, slug: string): VerifiedNewsRecord | null;
}>;

function invalidRepository(): never {
  throw new TypeError('Invalid verified News repository.');
}

export function createNewsRepository(source: readonly unknown[]): NewsRepository {
  try {
    const records = source.map(parseVerifiedNewsRecord);
    const ids = new Set<string>();
    const compoundSlugs = new Set<string>();
    for (const record of records) {
      const compoundSlug = `${record.marketId}:${record.slug}`;
      if (ids.has(record.id) || compoundSlugs.has(compoundSlug)) invalidRepository();
      ids.add(record.id);
      compoundSlugs.add(compoundSlug);
    }

    const byMarket = new Map<NewsMarketId, readonly VerifiedNewsRecord[]>();
    const byMarketAndSlug = new Map<string, VerifiedNewsRecord>();
    for (const marketId of ['kr-seoul'] as const) {
      const marketRecords = Object.freeze(
        records
          .filter((record) => record.marketId === marketId)
          .sort((left, right) => (
            right.publishedAt.localeCompare(left.publishedAt) ||
            left.id.localeCompare(right.id)
          )),
      );
      byMarket.set(marketId, marketRecords);
      for (const record of marketRecords) {
        byMarketAndSlug.set(`${marketId}:${record.slug}`, record);
      }
    }

    return Object.freeze({
      list(marketId: NewsMarketId): readonly VerifiedNewsRecord[] {
        return byMarket.get(marketId) ?? Object.freeze([]);
      },
      getBySlug(marketId: NewsMarketId, slug: string): VerifiedNewsRecord | null {
        return byMarketAndSlug.get(`${marketId}:${slug}`) ?? null;
      },
    });
  } catch {
    invalidRepository();
  }
}
