import { NextResponse } from 'next/server';

import {
  saveEditorialArticle,
  type SaveEditorialArticleInput,
} from '@/lib/insights/content-article-store.server';
import type { ContentSource } from '@/lib/content/content-types';

export const dynamic = 'force-dynamic';

function authorized(request: Request): boolean {
  const secret = process.env.CONTENT_ADMIN_SECRET?.trim();
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`);
}

function text(value: unknown, minimum: number, maximum: number): string | null {
  if (typeof value !== 'string') return null;
  const result = value.trim();
  return result.length >= minimum && result.length <= maximum ? result : null;
}

export function parseEditorialArticleInput(value: unknown): SaveEditorialArticleInput | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const slug = text(record.slug, 3, 120);
  const title = text(record.title, 8, 180);
  const summary = text(record.summary, 20, 600);
  const bodyMarkdown = text(record.bodyMarkdown, 80, 100_000);
  const marketValue = record.marketKey;
  const statusValue = record.status;
  const locale = record.locale === 'ko' || record.locale === 'zh-CN' ? record.locale : 'en';
  const contentType = ['news-brief', 'policy-update', 'market-brief', 'data-story', 'guide']
    .includes(String(record.contentType)) ? record.contentType as SaveEditorialArticleInput['contentType'] : 'data-story';
  const evidenceState = ['verified', 'partial', 'not-applicable', 'withdrawn']
    .includes(String(record.evidenceState)) ? record.evidenceState as SaveEditorialArticleInput['evidenceState'] : 'partial';
  const reviewedBy = text(record.reviewedBy, 2, 120);
  const sources: readonly ContentSource[] = Array.isArray(record.sources)
    ? Object.freeze(record.sources.flatMap((candidate, index) => {
        if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) return [];
        const source = candidate as Readonly<Record<string, unknown>>;
        const publisher = text(source.publisher, 2, 160);
        const sourceTitle = text(source.title, 2, 240);
        const href = text(source.href, 8, 2_000);
        const checkedAt = text(source.checkedAt, 10, 40);
        const kind = source.kind === 'secondary' ? 'secondary' : source.kind === 'primary' ? 'primary' : null;
        if (publisher === null || sourceTitle === null || href === null || checkedAt === null || kind === null) return [];
        try {
          const sourceUrl = new URL(href);
          if (sourceUrl.protocol !== 'https:') return [];
          if (!Number.isFinite(new Date(checkedAt).getTime())) return [];
        } catch { return []; }
        return [Object.freeze({
          id: typeof source.id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(source.id)
            ? source.id : `source-${index + 1}`,
          kind, publisher, title: sourceTitle, href, checkedAt,
          publishedAt: typeof source.publishedAt === 'string' ? source.publishedAt : null,
        })];
      }))
    : Object.freeze([]);
  if (slug === null || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)
    || title === null || summary === null || bodyMarkdown === null
    || !['global', 'seoul', 'singapore', 'dubai'].includes(String(marketValue))
    || !['draft', 'review', 'published', 'archived'].includes(String(statusValue))
    || (statusValue === 'published' && marketValue === 'dubai')
    || (statusValue === 'published' && (
      reviewedBy === null
      || (evidenceState !== 'not-applicable' && !sources.some(({ kind }) => kind === 'primary'))
    ))) return null;
  return Object.freeze({
    slug,
    marketKey: marketValue === 'global' ? null : marketValue as SaveEditorialArticleInput['marketKey'],
    title,
    summary,
    bodyMarkdown,
    status: statusValue as SaveEditorialArticleInput['status'],
    locale,
    contentType,
    evidenceState,
    reviewedBy,
    sources,
  });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const input = parseEditorialArticleInput(body);
  if (input === null) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  try {
    await saveEditorialArticle(input);
    const href = input.contentType === 'policy-update'
      ? `/news/policy/${input.slug}/`
      : input.contentType === 'guide' ? `/guides/${input.slug}/` : `/news/${input.slug}/`;
    return NextResponse.json({ state: input.status, slug: input.slug, href });
  } catch (error) {
    if (error instanceof Error && error.message === 'database_not_configured') {
      return NextResponse.json({ error: 'database_not_configured' }, { status: 503 });
    }
    if (error instanceof Error && error.message === 'publication_requirements_not_met') {
      return NextResponse.json({ error: 'publication_requirements_not_met' }, { status: 422 });
    }
    console.error('SignedPrice editorial article save failed.', error);
    return NextResponse.json({ error: 'storage_unavailable' }, { status: 503 });
  }
}
