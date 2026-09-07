import { NextResponse } from 'next/server';

import { contentDatabase } from '@/lib/db/postgres.server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const single = params.get('key');
  const batch = params.get('keys');
  const keys = (batch ?? single ?? '').split(',').map((key) => key.trim());
  if ((single !== null && batch !== null) || params.getAll('key').length > 1 || params.getAll('keys').length > 1
    || keys.length > 50 || keys.some((key) => !/^seoul:[a-zA-Z0-9._~-]{1,220}$/.test(key))) {
    return NextResponse.json({ error: 'invalid_key' }, { status: 400 });
  }
  const sql = contentDatabase();
  if (sql === null) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  try {
    const rows = await sql`
      SELECT key, coalesce(nullif(road_address, ''), legal_address) AS address, latitude, longitude,
        (nullif(trim(road_address), '') IS NOT NULL) AS verified_address
      FROM buildings
      WHERE key = ANY(${keys}::text[]) AND identity_status = 'verified'
      LIMIT 50
    `;
    const locations = rows.flatMap((row) => {
      if (typeof row.key !== 'string' || !keys.includes(row.key) || typeof row.address !== 'string' || row.address.trim() === '') return [];
      const valid = typeof row.latitude === 'number' && typeof row.longitude === 'number'
        && row.latitude >= 37.4 && row.latitude <= 37.72 && row.longitude >= 126.75 && row.longitude <= 127.25;
      return [{ key: row.key, address: row.address, latitude: valid ? row.latitude : null, longitude: valid ? row.longitude : null,
        ...(row.verified_address === true ? { verifiedAddress: true } : {}) }];
    });
    const location = locations[0];
    if (batch === null && location === undefined) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const body = batch !== null ? { locations } : { address: location!.address, latitude: location!.latitude, longitude: location!.longitude };
    return NextResponse.json(body, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
  } catch (error) {
    console.error('SignedPrice building-location read failed.', error);
    return NextResponse.json({ error: 'storage_unavailable' }, { status: 503 });
  }
}
