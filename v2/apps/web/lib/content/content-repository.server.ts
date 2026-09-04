import 'server-only';

import { cache } from 'react';

import { publicContentDatabase } from '../db/postgres.server';
import type {
  ContentLocale,
  ContentMarketId,
  ContentSource,
  ContentType,
  PublishedContentArticle,
  PublishedContentQuery,
} from './content-types';

export type { PublishedContentArticle } from './content-types';

const locales = Object.freeze(['en', 'ko', 'zh-CN'] as const);
const contentTypes = Object.freeze([
  'news-brief', 'policy-update', 'market-brief', 'data-story', 'guide',
] as const);

function validIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(new Date(value).getTime());
}

function isInternalHref(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
}

export function isPublishableContent(
  article: PublishedContentArticle,
): boolean {
  if (
    article.status !== 'published'
    || !locales.includes(article.locale)
    || !contentTypes.includes(article.type)
    || article.evidenceState === 'withdrawn'
    || article.reviewedAt === null
    || article.reviewedBy === null
    || article.reviewedBy.trim().length === 0
    || !validIsoDate(article.reviewedAt)
    || !validIsoDate(article.publishedAt)
    || !validIsoDate(article.updatedAt)
  ) return false;
  return article.evidenceState === 'not-applicable'
    || article.sources.some(({ kind }) => kind === 'primary');
}

export function canonicalContentHref(article: PublishedContentArticle): string | null {
  if (!isPublishableContent(article)) return null;
  if (article.type === 'policy-update') return `/news/policy/${article.slug}/`;
  if (article.type === 'guide') return `/guides/${article.slug}/`;
  return `/news/${article.slug}/`;
}

export type PublishedContentRepository = Readonly<{
  list(query: PublishedContentQuery): readonly PublishedContentArticle[];
  get(locale: ContentLocale, slug: string): PublishedContentArticle | null;
}>;

export function createPublishedContentRepository(
  records: readonly PublishedContentArticle[],
): PublishedContentRepository {
  const published = Object.freeze(records
    .filter(isPublishableContent)
    .sort((left, right) => (
      right.publishedAt.localeCompare(left.publishedAt) || left.slug.localeCompare(right.slug)
    )));
  return Object.freeze({
    list(query) {
      const limit = Math.min(Math.max(Math.trunc(query.limit), 1), 200);
      return Object.freeze(published.filter((article) => (
        article.locale === query.locale
        && (query.marketId === undefined || article.marketId === query.marketId)
        && (query.type === undefined || article.type === query.type)
      )).slice(0, limit));
    },
    get(locale, slug) {
      return published.find((article) => article.locale === locale && article.slug === slug) ?? null;
    },
  });
}

function sourceFromRow(value: unknown): ContentSource | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const row = value as Readonly<Record<string, unknown>>;
  if (
    typeof row.id !== 'string'
    || (row.kind !== 'primary' && row.kind !== 'secondary')
    || typeof row.publisher !== 'string'
    || typeof row.title !== 'string'
    || typeof row.href !== 'string'
    || !validIsoDate(row.checkedAt)
  ) return null;
  return Object.freeze({
    id: row.id,
    kind: row.kind,
    publisher: row.publisher,
    title: row.title,
    href: row.href,
    checkedAt: row.checkedAt,
    publishedAt: validIsoDate(row.publishedAt) ? row.publishedAt : null,
  });
}

function articleFromRow(row: Readonly<Record<string, unknown>>): PublishedContentArticle | null {
  const sources = Array.isArray(row.sources)
    ? Object.freeze(row.sources.flatMap((source) => {
        const parsed = sourceFromRow(source);
        return parsed === null ? [] : [parsed];
      }))
    : Object.freeze([]);
  if (
    typeof row.slug !== 'string'
    || typeof row.title !== 'string'
    || typeof row.summary !== 'string'
    || typeof row.body_markdown !== 'string'
    || !locales.includes(row.locale as ContentLocale)
    || !contentTypes.includes(row.content_type as ContentType)
    || !(row.market_id === null || row.market_id === 'kr-seoul' || row.market_id === 'sg-singapore')
    || !validIsoDate(row.published_at)
    || !validIsoDate(row.updated_at)
  ) return null;
  const article: PublishedContentArticle = Object.freeze({
    id: `${row.locale}:${row.slug}`,
    slug: row.slug,
    locale: row.locale as ContentLocale,
    marketId: row.market_id as ContentMarketId | null,
    type: row.content_type as ContentType,
    title: row.title,
    deck: row.summary,
    bodyMarkdown: row.body_markdown,
    status: 'published',
    evidenceState: row.evidence_state === 'verified' || row.evidence_state === 'not-applicable'
      ? row.evidence_state
      : row.evidence_state === 'partial' ? 'partial' : 'withdrawn',
    authorName: typeof row.author_name === 'string' ? row.author_name : 'SignedPrice Data Desk',
    reviewedAt: validIsoDate(row.reviewed_at) ? row.reviewed_at : null,
    reviewedBy: typeof row.reviewed_by === 'string' ? row.reviewed_by : null,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    relatedHref: isInternalHref(row.related_href) ? row.related_href : null,
    sources,
  });
  return isPublishableContent(article) ? article : null;
}

async function queryPublishedContent(query: PublishedContentQuery): Promise<readonly PublishedContentArticle[]> {
  const sql = publicContentDatabase();
  if (sql === null) return Object.freeze([]);
  try {
    const rows = await sql`
      SELECT
        article.slug, article.locale, article.market_id, article.content_type,
        article.title, article.summary, article.body_markdown, article.evidence_state,
        article.author_name, article.reviewed_at, article.reviewed_by,
        article.published_at, article.updated_at, article.related_href,
        COALESCE(source_set.sources, '[]'::jsonb) AS sources
      FROM content_articles article
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(jsonb_build_object(
          'id', source.id, 'kind', source.source_kind, 'publisher', source.publisher,
          'title', source.title, 'href', source.canonical_url,
          'checkedAt', source.checked_at, 'publishedAt', source.published_at
        ) ORDER BY link.position) AS sources
        FROM content_source_links link
        JOIN content_sources source ON source.id = link.source_id
        WHERE link.content_slug = article.slug
      ) source_set ON true
      WHERE article.editorial_status = 'published'
        AND article.locale = ${query.locale}
        AND (${query.marketId ?? null}::text IS NULL OR article.market_id = ${query.marketId ?? null})
        AND (${query.type ?? null}::text IS NULL OR article.content_type = ${query.type ?? null})
        AND article.published_at IS NOT NULL
        AND article.published_at <= now()
        AND article.reviewed_at IS NOT NULL
        AND article.reviewed_by IS NOT NULL
        AND article.evidence_state <> 'withdrawn'
      ORDER BY article.published_at DESC, article.slug
      LIMIT ${Math.min(Math.max(Math.trunc(query.limit), 1), 200)}
    `;
    return Object.freeze(rows.flatMap((row) => {
      const article = articleFromRow(row);
      return article === null ? [] : [article];
    }));
  } catch (error) {
    console.error('SignedPrice published content read failed.', error);
    return Object.freeze([]);
  }
}

export async function listPublishedContent(
  query: PublishedContentQuery,
): Promise<readonly PublishedContentArticle[]> {
  return queryPublishedContent(query);
}

export const getPublishedContent = cache(async (
  locale: ContentLocale,
  slug: string,
): Promise<PublishedContentArticle | null> => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) return null;
  const articles = await queryPublishedContent({ locale, limit: 200 });
  return articles.find((article) => article.slug === slug) ?? null;
});
