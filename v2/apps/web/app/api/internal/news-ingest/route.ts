import { NextResponse } from 'next/server';

import { contentDatabaseConfigured } from '@/lib/db/postgres.server';
import { fetchNaverNewsItems } from '@/lib/news/naver-news.server';
import {
  finishNewsIngestionRun,
  startNewsIngestionRun,
  storeNewsItems,
} from '@/lib/news/news-persistence.server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!contentDatabaseConfigured()) return NextResponse.json({ error: 'database_not_configured' }, { status: 503 });
  let runId: string | null = null;
  try {
    runId = await startNewsIngestionRun();
    const result = await fetchNaverNewsItems();
    const storedCount = result.state === 'ready' ? await storeNewsItems(result.items) : 0;
    const status = result.state !== 'ready' ? 'failed' : result.failedSearches > 0 ? 'partial' : 'succeeded';
    await finishNewsIngestionRun({
      id: runId,
      status,
      fetchedCount: result.items.length,
      storedCount,
      ...(result.diagnostic === undefined ? {} : { diagnostic: result.diagnostic }),
    });
    return NextResponse.json({ status, fetchedCount: result.items.length, storedCount });
  } catch (error) {
    const diagnostic = error instanceof Error ? error.message.slice(0, 400) : 'unknown_error';
    try {
      await finishNewsIngestionRun({ id: runId, status: 'failed', fetchedCount: 0, storedCount: 0, diagnostic });
    } catch (writeError) {
      console.error('SignedPrice ingestion failure could not be recorded.', writeError);
    }
    console.error('SignedPrice scheduled news ingestion failed.', error);
    return NextResponse.json({ error: 'ingestion_failed' }, { status: 502 });
  }
}

