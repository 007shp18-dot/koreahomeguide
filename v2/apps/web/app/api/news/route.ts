import { NextResponse } from 'next/server';
import { loadPublicHeadlines } from '@/lib/news/public-headlines.server';

export async function GET() {
  const stored = await loadPublicHeadlines();
  // A failed read must retain the client's last successful snapshot. Discovery
  // collection belongs to the scheduled ingestion route, behind editorial review.
  if (stored === null) {
    return NextResponse.json({ error: 'headlines_unavailable' }, {
      status: 503, headers: { 'Cache-Control': 'no-store' },
    });
  }
  const headers = { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' };
  return NextResponse.json({ items: stored, naverState: 'ready' }, { headers });
}
