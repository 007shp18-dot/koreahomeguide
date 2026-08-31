import 'server-only';

import { KR_SEOUL_NEWS_CLAIMS_BY_ID } from '../../content/news/kr-seoul-claims.server';
import { KR_SEOUL_NEWS_RECORDS } from '../../content/news/kr-seoul';
import { createPublicAreaSummaryRepository } from '../public-market/area-summary-repository.server';
import { publicCanonical } from '../public-metadata';
import { resolveNewsEvidence } from './news-evidence.server';
import { createNewsRepository } from './news-repository.server';
import type { VerifiedNewsRecord } from './news-schema';

export type NewsIndexModel = Readonly<{
  records: readonly VerifiedNewsRecord[];
  unavailableVerifiedCount: number;
}>;

export type NewsDetailModel = Readonly<{
  record: VerifiedNewsRecord;
  jsonLd: Readonly<Record<string, unknown>>;
}>;

export type NewsRouteDependencies = Readonly<{
  areaSource: unknown;
  period: string;
}>;

function environmentDependencies(): NewsRouteDependencies {
  const serialized = process.env.SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT;
  let areaSource: unknown;
  try {
    areaSource = serialized === undefined ? undefined : JSON.parse(serialized);
  } catch {
    areaSource = undefined;
  }
  return Object.freeze({
    areaSource,
    period: process.env.SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD ?? '',
  });
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value)) deepFreeze(nested);
  return value;
}

function jsonLdFor(record: VerifiedNewsRecord): Readonly<Record<string, unknown>> {
  const url = publicCanonical(`/kr/seoul/news/${record.slug}/`);
  return deepFreeze({
    '@context': 'https://schema.org',
    '@type': record.category === 'methodology' ? 'Article' : 'NewsArticle',
    headline: record.title,
    description: record.summary,
    datePublished: record.publishedAt,
    ...(record.updatedAt === null ? {} : { dateModified: record.updatedAt }),
    inLanguage: record.language,
    mainEntityOfPage: url,
    url,
    author: { '@type': 'Organization', name: 'SignedPrice' },
    publisher: { '@type': 'Organization', name: 'SignedPrice' },
    citation: record.source.url,
    about: { '@type': 'Place', name: 'Seoul, South Korea' },
  });
}

export function buildNewsIndexModel(
  dependencies: NewsRouteDependencies = environmentDependencies(),
): NewsIndexModel {
  const repository = createNewsRepository(KR_SEOUL_NEWS_RECORDS);
  let areaSummaryRepository = null;
  try {
    areaSummaryRepository = createPublicAreaSummaryRepository({
      source: dependencies.areaSource,
      expected: { marketId: 'kr-seoul', period: dependencies.period },
    });
  } catch {
    areaSummaryRepository = null;
  }

  let unavailableVerifiedCount = 0;
  const records = Object.freeze(repository.list('kr-seoul').filter((record) => {
    try {
      resolveNewsEvidence(record, {
        claims: KR_SEOUL_NEWS_CLAIMS_BY_ID[record.id] ?? [],
        areaSummaryRepository,
      });
      return true;
    } catch {
      if (record.evidence.status === 'verified') unavailableVerifiedCount += 1;
      return false;
    }
  }));
  return Object.freeze({ records, unavailableVerifiedCount });
}

export function buildNewsDetailModel(
  slug: string,
  dependencies: NewsRouteDependencies = environmentDependencies(),
): NewsDetailModel | null {
  const record = buildNewsIndexModel(dependencies).records.find(
    (candidate) => candidate.slug === slug,
  );
  if (record === undefined) return null;
  return Object.freeze({ record, jsonLd: jsonLdFor(record) });
}
