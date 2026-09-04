import { NextResponse } from 'next/server';

import { contentDatabase } from '@/lib/db/postgres.server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key')?.trim();
  if (!key || !/^seoul:[a-zA-Z0-9._~-]{1,220}$/.test(key)) {
    return NextResponse.json({ error: 'invalid_key' }, { status: 400 });
  }
  const sql = contentDatabase();
  if (sql === null) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  try {
    const [row] = await sql`
      SELECT coalesce(road_address, legal_address) AS address, latitude, longitude
      FROM buildings
      WHERE key = ${key} AND identity_status = 'verified'
      LIMIT 1
    `;
    if (typeof row?.address !== 'string') return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({
      address: row.address,
      latitude: typeof row.latitude === 'number' ? row.latitude : null,
      longitude: typeof row.longitude === 'number' ? row.longitude : null,
    }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } });
  } catch (error) {
    console.error('SignedPrice building-location read failed.', error);
    return NextResponse.json({ error: 'storage_unavailable' }, { status: 503 });
  }
}
