import { NextResponse } from 'next/server';

import { propertySeedPage } from '@/scripts/property-seed-source.mjs';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function integer(value: string | null, fallback: number): number {
  if (value === null || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : fallback;
}

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV !== 'preview') {
    return new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  const url = new URL(request.url);
  const kind = url.searchParams.get('kind') ?? 'seoul';
  const offset = integer(url.searchParams.get('offset'), 0);
  const limit = integer(url.searchParams.get('limit'), 1000);
  try {
    return NextResponse.json(propertySeedPage(kind, offset, limit), {
      headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
    });
  } catch (error) {
    console.error('SignedPrice preview seed export failed.', error);
    return NextResponse.json({ error: 'seed_source_unavailable' }, { status: 503 });
  }
}
