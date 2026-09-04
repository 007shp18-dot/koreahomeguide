import { NextResponse } from 'next/server';

import {
  saveEditorialArticle,
  type SaveEditorialArticleInput,
} from '@/lib/insights/content-article-store.server';

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
  if (slug === null || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)
    || title === null || summary === null || bodyMarkdown === null
    || !['global', 'seoul', 'singapore', 'dubai'].includes(String(marketValue))
    || !['draft', 'review', 'published', 'archived'].includes(String(statusValue))) return null;
  return Object.freeze({
    slug,
    marketKey: marketValue === 'global' ? null : marketValue as SaveEditorialArticleInput['marketKey'],
    title,
    summary,
    bodyMarkdown,
    status: statusValue as SaveEditorialArticleInput['status'],
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
    return NextResponse.json({ state: input.status, slug: input.slug, href: `/insights/${input.slug}/` });
  } catch (error) {
    if (error instanceof Error && error.message === 'database_not_configured') {
      return NextResponse.json({ error: 'database_not_configured' }, { status: 503 });
    }
    console.error('SignedPrice editorial article save failed.', error);
    return NextResponse.json({ error: 'storage_unavailable' }, { status: 503 });
  }
}
