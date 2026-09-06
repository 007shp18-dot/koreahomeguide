import { NextResponse } from 'next/server';

import { contentDatabase } from '@/lib/db/postgres.server';
import { searchNaverBuildingImages } from '@/lib/photos/naver-image-search.server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const PRIVATE_NO_STORE = Object.freeze({ 'Cache-Control': 'private, no-store' });

function authorized(request: Request): boolean {
  const secret = process.env.CONTENT_ADMIN_SECRET?.trim();
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`);
}

function response(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: PRIVATE_NO_STORE });
}

export async function GET(request: Request) {
  if (!authorized(request)) return response({ error: 'unauthorized' }, 401);
  const buildingKey = new URL(request.url).searchParams.get('buildingKey')?.trim();
  if (!buildingKey || buildingKey.length > 240) return response({ error: 'invalid_building_key' }, 400);
  const sql = contentDatabase();
  if (sql === null) return response({ error: 'database_not_configured' }, 503);

  try {
    const [building] = await sql`
      SELECT key, market_key, official_name,
        coalesce(road_address, legal_address) AS address,
        identity_status
      FROM buildings
      WHERE key = ${buildingKey}
      LIMIT 1
    `;
    if (building === undefined) return response({ error: 'building_not_found' }, 404);
    if (building.market_key === 'dubai') return response({ error: 'unsupported_market' }, 400);
    if (!['seoul', 'singapore'].includes(String(building.market_key))) {
      return response({ error: 'unsupported_market' }, 400);
    }
    if (building.identity_status !== 'verified'
      || typeof building.official_name !== 'string'
      || typeof building.address !== 'string') {
      return response({ error: 'building_identity_not_verified' }, 409);
    }

    const result = await searchNaverBuildingImages({
      buildingName: building.official_name,
      address: building.address,
      display: 20,
    });
    const attemptStatus = result.state === 'ready'
      ? result.candidates.length > 0 ? 'succeeded' : 'no-candidate'
      : 'provider-error';
    const reason = result.state === 'ready'
      ? `result-count:${result.candidates.length}`
      : result.state;
    const retryInterval = attemptStatus === 'succeeded' ? '365 days' : attemptStatus === 'no-candidate' ? '30 days' : '1 day';
    await sql`
      INSERT INTO building_enrichment_attempts (
        building_key, pipeline, status, reason, attempted_at, next_retry_at
      ) VALUES (
        ${buildingKey}, 'photo-naver-search', ${attemptStatus}, ${reason}, now(),
        now() + ${retryInterval}::interval
      )
      ON CONFLICT (building_key, pipeline) DO UPDATE SET
        status = excluded.status,
        reason = excluded.reason,
        attempted_at = now(),
        next_retry_at = excluded.next_retry_at,
        updated_at = now()
    `;
    return response({ ...result, resultCount: result.candidates.length });
  } catch (error) {
    console.error('SignedPrice NAVER image candidate lookup failed.', error);
    return response({ error: 'provider_unavailable' }, 503);
  }
}
