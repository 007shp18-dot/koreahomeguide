import { after, NextResponse } from 'next/server';
import { buildApprovedNewsWorkspaceModel, buildNewsWorkspaceModel } from '@/lib/news/naver-news.server';
import { buildNewsIndexModel } from '@/lib/news/news-route-model.server';
import { loadPersistedNewsItems } from '@/lib/news/news-persistence.server';

export async function GET() {
  const news = buildNewsIndexModel();
  const stored = await loadPersistedNewsItems(1500);
  const headers = { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' };
  if (stored !== null && stored.length > 0 && stored.some((item) => item.market === 'dubai')) {
    after(async () => { try { await buildNewsWorkspaceModel(news); } catch { console.error('SignedPrice background headline refresh failed.'); } });
    const approved = buildApprovedNewsWorkspaceModel(news);
    const unique = new Map([...approved.items, ...stored].map((item) => [item.url, item]));
    return NextResponse.json({ ...approved, items: [...unique.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)), naverState: 'ready' }, { headers });
  }
  return NextResponse.json(await buildNewsWorkspaceModel(news), { headers });
}
