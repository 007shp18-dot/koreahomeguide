import { NextResponse } from 'next/server';

import { buildNewsWorkspaceModel } from '@/lib/news/naver-news.server';
import { buildNewsIndexModel } from '@/lib/news/news-route-model.server';

export async function GET() {
  const model = await buildNewsWorkspaceModel(buildNewsIndexModel());
  return NextResponse.json(model, {
    headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' },
  });
}
