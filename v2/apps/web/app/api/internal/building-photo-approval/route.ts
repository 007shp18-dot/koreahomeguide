import { NextResponse } from 'next/server';

import {
  parsePhotoReviewDecision, photoReviewStoreFromEnvironment,
  type PhotoReviewFilter,
} from '@/lib/photos/photo-review-store.server';

export const dynamic = 'force-dynamic';
const HEADERS = { 'Cache-Control': 'private, no-store' };
function authorized(request: Request) {
  const secret = process.env.CONTENT_ADMIN_SECRET?.trim();
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`);
}
function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: HEADERS });
}

export async function GET(request: Request) {
  if (!authorized(request)) return response({ error: 'unauthorized' }, 401);
  const params = new URL(request.url).searchParams;
  if ([...params.keys()].some(key => !['afterId', 'limit', 'source', 'market', 'status'].includes(key))) return response({ error: 'invalid_filter' }, 400);
  const filter: PhotoReviewFilter = {
    ...(params.has('afterId') ? { afterId: params.get('afterId')! } : {}),
    ...(params.has('limit') ? { limit: Number(params.get('limit')) } : {}),
    ...(params.has('source') ? { source: params.get('source') as PhotoReviewFilter['source'] } : {}),
    ...(params.has('market') ? { market: params.get('market') as PhotoReviewFilter['market'] } : {}),
    ...(params.has('status') ? { status: params.get('status') as PhotoReviewFilter['status'] } : {}),
  };
  try { return response(await photoReviewStoreFromEnvironment().list(filter)); }
  catch (error) { return response({ error: error instanceof TypeError ? 'invalid_filter' : 'storage_unavailable' }, error instanceof TypeError ? 400 : 503); }
}

export async function POST(request: Request) {
  if (!authorized(request)) return response({ error: 'unauthorized' }, 401);
  if (Number(request.headers.get('content-length') ?? 0) > 4096) return response({ error: 'payload_too_large' }, 413);
  let body: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > 4096) return response({ error: 'payload_too_large' }, 413);
    body = JSON.parse(text);
  } catch { return response({ error: 'invalid_json' }, 400); }
  const input = parsePhotoReviewDecision(body);
  if (!input) return response({ error: 'invalid_request' }, 400);
  try {
    const result = await photoReviewStoreFromEnvironment().review(input);
    return response(result, result.state === 'reviewed' ? 200 : result.state === 'not-found' ? 404 : 409);
  } catch { return response({ error: 'storage_unavailable' }, 503); }
}
