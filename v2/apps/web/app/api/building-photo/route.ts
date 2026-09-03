import { NextResponse } from 'next/server';

import { getPublicPhotoApproval } from '@/lib/photos/verified-building-photo-registry.server';

export const revalidate = 300;

export function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key')?.trim();
  if (!key || key.length > 240) return NextResponse.json({ state: 'unverified' }, { status: 200 });
  const approval = getPublicPhotoApproval(key);
  return NextResponse.json(approval === null
    ? { state: 'unverified' }
    : { state: 'approved', ...approval }, {
      status: 200,
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
    });
}
