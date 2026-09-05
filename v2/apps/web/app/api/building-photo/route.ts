import { NextResponse } from 'next/server';

import { getStoredPublicPhotoApproval } from '@/lib/photos/building-photo-store.server';

export const revalidate = 300;

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key')?.trim();
  if (!key || key.length > 240) return NextResponse.json({ state: 'unverified' }, { status: 200 });
  const approval = await getStoredPublicPhotoApproval(key);
  if (approval === null) return NextResponse.json({ state: 'unverified' }, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
  return NextResponse.json({ state: 'approved', ...approval }, {
    status: 200,
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
  });
}
