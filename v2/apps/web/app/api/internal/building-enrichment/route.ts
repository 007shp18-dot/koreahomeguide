import { NextResponse } from 'next/server';

import { contentDatabaseConfigured } from '@/lib/db/postgres.server';
import {
  discoverGooglePlacePhotoCandidates,
  discoverWikimediaCommonsPhotoCandidates,
} from '@/lib/photos/building-photo-store.server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!contentDatabaseConfigured()) return NextResponse.json({ error: 'database_not_configured' }, { status: 503 });
  const parameters = new URL(request.url).searchParams;
  const market = parameters.get('market');
  const limit = Number(parameters.get('limit') ?? 12);
  if ((market !== null && market !== 'seoul' && market !== 'singapore')
    || !Number.isInteger(limit) || limit < 1 || limit > 12) {
    return NextResponse.json({ error: 'invalid_scope' }, { status: 400 });
  }
  const commons = await discoverWikimediaCommonsPhotoCandidates(limit, market ?? undefined);
  const google = await discoverGooglePlacePhotoCandidates(limit, market ?? undefined);
  return NextResponse.json({
    state: commons.state === 'ready' || google.state === 'ready' ? 'ready' : 'not-configured',
    checked: commons.checked + google.checked,
    candidates: commons.candidates + google.candidates,
    sources: { wikimediaCommons: commons, googlePlaces: google },
  });
}
