import 'server-only';

import { cache } from 'react';

import { contentDatabase } from '../db/postgres.server';
import {
  getPublishedContent,
  listPublishedContent,
} from '../content/content-repository.server';
import type { PublishedContentArticle } from '../content/content-types';
import type {
  ContentLocale,
  ContentSource,
  ContentType,
  EvidenceState,
} from '../content/content-types';
import {
  editorialMarketLabels,
  estimateReadMinutes,
  getStarterEditorialArticle,
  STARTER_EDITORIAL_ARTICLES,
  type EditorialArticle,
  type EditorialMarketKey,
  type EditorialStatus,
} from './editorial-content';

function articleFromPublished(row: PublishedContentArticle): EditorialArticle {
  return Object.freeze({
    slug: row.slug,
    marketKey: row.marketId === 'kr-seoul' ? 'seoul' : row.marketId === 'sg-singapore' ? 'singapore' : null,
    title: row.title,
    summary: row.deck,
    bodyMarkdown: row.bodyMarkdown,
    status: 'published',
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    readMinutes: estimateReadMinutes(row.bodyMarkdown),
    sources: Object.freeze(row.sources.map((source) => Object.freeze({
      publisher: source.publisher,
      label: source.title,
      href: source.href,
      checkedAt: source.checkedAt,
    }))),
  });
}

export async function listPublishedContentArticles(): Promise<readonly EditorialArticle[]> {
  const stored = (await listPublishedContent({ locale: 'en', limit: 200 }))
    .map(articleFromPublished);
  const storedSlugs = new Set(stored.map(({ slug }) => slug));
  return Object.freeze([...stored, ...STARTER_EDITORIAL_ARTICLES.filter(({ slug }) => !storedSlugs.has(slug))]
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt)));
}

export const getPublishedContentArticle = cache(async (slug: string): Promise<EditorialArticle | null> => {
  const stored = await getPublishedContent('en', slug);
  return stored === null ? getStarterEditorialArticle(slug) : articleFromPublished(stored);
});

export type SaveEditorialArticleInput = Readonly<{
  slug: string;
  marketKey: EditorialMarketKey;
  title: string;
  summary: string;
  bodyMarkdown: string;
  status: EditorialStatus;
  locale: ContentLocale;
  contentType: ContentType;
  evidenceState: EvidenceState;
  reviewedBy: string | null;
  sources: readonly ContentSource[];
}>;

export async function saveEditorialArticle(input: SaveEditorialArticleInput): Promise<void> {
  const sql = contentDatabase();
  if (sql === null) throw new Error('database_not_configured');
  if (input.status === 'published' && (
    input.reviewedBy === null
    || (input.evidenceState !== 'not-applicable'
      && !input.sources.some(({ kind }) => kind === 'primary'))
  )) throw new Error('publication_requirements_not_met');
  if (input.marketKey !== null) {
    const countryCode = input.marketKey === 'seoul' ? 'KR' : input.marketKey === 'singapore' ? 'SG' : 'AE';
    await sql`
      INSERT INTO markets (key, name, country_code)
      VALUES (${input.marketKey}, ${editorialMarketLabels[input.marketKey]}, ${countryCode})
      ON CONFLICT (key) DO UPDATE SET name = excluded.name, updated_at = now()
    `;
  }
  await sql`
    INSERT INTO content_articles (
      slug, market_key, title, summary, body_markdown, status, published_at,
      reviewed_at, reviewed_by, locale, content_type, market_id, editorial_status,
      evidence_state, author_name
    ) VALUES (
      ${input.slug}, ${input.marketKey}, ${input.title}, ${input.summary},
      ${input.bodyMarkdown}, ${input.status},
      ${input.status === 'published' ? new Date().toISOString() : null},
      ${input.status === 'published' ? new Date().toISOString() : null},
      ${input.status === 'published' ? input.reviewedBy : null},
      ${input.locale}, ${input.contentType},
      ${input.marketKey === 'seoul' ? 'kr-seoul' : input.marketKey === 'singapore' ? 'sg-singapore' : null},
      ${input.status}, ${input.evidenceState}, 'SignedPrice Data Desk'
    )
    ON CONFLICT (slug) DO UPDATE SET
      market_key = excluded.market_key,
      title = excluded.title,
      summary = excluded.summary,
      body_markdown = excluded.body_markdown,
      status = excluded.status,
      locale = excluded.locale,
      content_type = excluded.content_type,
      market_id = excluded.market_id,
      editorial_status = excluded.editorial_status,
      evidence_state = excluded.evidence_state,
      author_name = excluded.author_name,
      published_at = CASE
        WHEN excluded.status = 'published' THEN coalesce(content_articles.published_at, now())
        ELSE content_articles.published_at
      END,
      reviewed_at = CASE WHEN excluded.status = 'published' THEN now() ELSE content_articles.reviewed_at END,
      reviewed_by = CASE WHEN excluded.status = 'published' THEN excluded.reviewed_by ELSE content_articles.reviewed_by END,
      updated_at = now()
  `;
  for (const [position, source] of input.sources.entries()) {
    await sql`
      INSERT INTO content_sources (
        id, source_kind, publisher, title, canonical_url, published_at, checked_at
      ) VALUES (
        ${source.id}, ${source.kind}, ${source.publisher}, ${source.title}, ${source.href},
        ${source.publishedAt ?? null}, ${source.checkedAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        source_kind = excluded.source_kind,
        publisher = excluded.publisher,
        title = excluded.title,
        canonical_url = excluded.canonical_url,
        published_at = excluded.published_at,
        checked_at = excluded.checked_at,
        updated_at = now()
    `;
    await sql`
      INSERT INTO content_source_links (content_slug, source_id, claim_scope, position)
      VALUES (${input.slug}, ${source.id}, ${source.kind === 'primary' ? 'primary' : 'article'}, ${position})
      ON CONFLICT (content_slug, source_id, claim_scope) DO NOTHING
    `;
  }
}
