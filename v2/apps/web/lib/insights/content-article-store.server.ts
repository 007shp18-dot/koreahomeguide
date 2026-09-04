import 'server-only';

import { cache } from 'react';

import { contentDatabase } from '../db/postgres.server';
import {
  editorialMarketLabels,
  estimateReadMinutes,
  getStarterEditorialArticle,
  STARTER_EDITORIAL_ARTICLES,
  type EditorialArticle,
  type EditorialMarketKey,
  type EditorialStatus,
} from './editorial-content';

function isoDate(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function articleFromRow(row: Record<string, unknown>): EditorialArticle | null {
  const marketKey = row.market_key;
  const publishedAt = isoDate(row.published_at);
  const updatedAt = isoDate(row.updated_at);
  if (typeof row.slug !== 'string' || typeof row.title !== 'string'
    || typeof row.summary !== 'string' || typeof row.body_markdown !== 'string'
    || publishedAt === null || updatedAt === null
    || !(marketKey === null || ['seoul', 'singapore', 'dubai'].includes(String(marketKey)))) return null;
  return Object.freeze({
    slug: row.slug,
    marketKey: marketKey as EditorialMarketKey,
    title: row.title,
    summary: row.summary,
    bodyMarkdown: row.body_markdown,
    status: 'published',
    publishedAt,
    updatedAt,
    readMinutes: estimateReadMinutes(row.body_markdown),
  });
}

export async function listPublishedContentArticles(): Promise<readonly EditorialArticle[]> {
  const sql = contentDatabase();
  let stored: EditorialArticle[] = [];
  if (sql !== null) {
    try {
      const rows = await sql`
        SELECT slug, market_key, title, summary, body_markdown, published_at, updated_at
        FROM content_articles
        WHERE status = 'published' AND published_at IS NOT NULL AND published_at <= now()
        ORDER BY published_at DESC
      `;
      stored = rows.flatMap((row) => {
        const article = articleFromRow(row);
        return article === null ? [] : [article];
      });
    } catch (error) {
      console.error('SignedPrice editorial article read failed.', error);
    }
  }
  const storedSlugs = new Set(stored.map(({ slug }) => slug));
  return Object.freeze([...stored, ...STARTER_EDITORIAL_ARTICLES.filter(({ slug }) => !storedSlugs.has(slug))]
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt)));
}

export const getPublishedContentArticle = cache(async (slug: string): Promise<EditorialArticle | null> => {
  const sql = contentDatabase();
  if (sql !== null) {
    try {
      const [row] = await sql`
        SELECT slug, market_key, title, summary, body_markdown, published_at, updated_at
        FROM content_articles
        WHERE slug = ${slug} AND status = 'published'
          AND published_at IS NOT NULL AND published_at <= now()
        LIMIT 1
      `;
      if (row !== undefined) {
        const article = articleFromRow(row);
        if (article !== null) return article;
      }
    } catch (error) {
      console.error('SignedPrice editorial article read failed.', error);
    }
  }
  return getStarterEditorialArticle(slug);
});

export type SaveEditorialArticleInput = Readonly<{
  slug: string;
  marketKey: EditorialMarketKey;
  title: string;
  summary: string;
  bodyMarkdown: string;
  status: EditorialStatus;
}>;

export async function saveEditorialArticle(input: SaveEditorialArticleInput): Promise<void> {
  const sql = contentDatabase();
  if (sql === null) throw new Error('database_not_configured');
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
      reviewed_at, reviewed_by
    ) VALUES (
      ${input.slug}, ${input.marketKey}, ${input.title}, ${input.summary},
      ${input.bodyMarkdown}, ${input.status},
      ${input.status === 'published' ? new Date().toISOString() : null},
      ${input.status === 'published' ? new Date().toISOString() : null},
      ${input.status === 'published' ? 'content-editor' : null}
    )
    ON CONFLICT (slug) DO UPDATE SET
      market_key = excluded.market_key,
      title = excluded.title,
      summary = excluded.summary,
      body_markdown = excluded.body_markdown,
      status = excluded.status,
      published_at = CASE
        WHEN excluded.status = 'published' THEN coalesce(content_articles.published_at, now())
        ELSE content_articles.published_at
      END,
      reviewed_at = CASE WHEN excluded.status = 'published' THEN now() ELSE content_articles.reviewed_at END,
      reviewed_by = CASE WHEN excluded.status = 'published' THEN 'content-editor' ELSE content_articles.reviewed_by END,
      updated_at = now()
  `;
}
