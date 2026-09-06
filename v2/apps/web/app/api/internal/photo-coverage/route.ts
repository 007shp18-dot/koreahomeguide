import { NextResponse } from 'next/server';

import {
  readPhotoCoverageStatus,
  runPhotoBackfillSlice,
  type PhotoBackfillOptions,
} from '@/lib/photos/photo-backfill.server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CONTENT_ADMIN_SECRET?.trim();
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    return NextResponse.json(await readPhotoCoverageStatus(), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('SignedPrice photo coverage read failed.', error);
    return NextResponse.json({ error: 'storage_unavailable' }, { status: 503 });
  }
}

function validOptions(value: unknown): PhotoBackfillOptions | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const input = value as Readonly<Record<string, unknown>>;
  if (!['kr-seoul', 'sg-singapore', 'ae-dubai'].includes(String(input.market))
    || !['google', 'wikimedia', 'naver-search', 'coverage'].includes(String(input.provider))
    || (input.market === 'ae-dubai' && !['naver-search', 'coverage'].includes(String(input.provider)))
    || !Number.isSafeInteger(input.limit) || Number(input.limit) < 1 || Number(input.limit) > 300
    || !Number.isSafeInteger(input.dailyRequestCap) || Number(input.dailyRequestCap) < 1 || Number(input.dailyRequestCap) > 100_000
    || typeof input.dailySpendCapUsd !== 'number' || !Number.isFinite(input.dailySpendCapUsd)
    || input.dailySpendCapUsd < 0 || input.dailySpendCapUsd > 10_000
    || typeof input.dryRun !== 'boolean') return null;
  return Object.freeze({
    market: input.market as PhotoBackfillOptions['market'],
    provider: input.provider as PhotoBackfillOptions['provider'],
    limit: input.limit as number,
    dailyRequestCap: input.dailyRequestCap as number,
    dailySpendCapUsd: input.dailySpendCapUsd,
    dryRun: input.dryRun,
  });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const options = validOptions(body);
  if (options === null) return NextResponse.json({ error: 'invalid_scope' }, { status: 400 });
  try {
    return NextResponse.json(await runPhotoBackfillSlice(options), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('SignedPrice photo coverage backfill failed.', error);
    return NextResponse.json({ error: 'operation_failed' }, { status: 503 });
  }
}
