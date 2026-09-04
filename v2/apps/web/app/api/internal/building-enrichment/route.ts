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
  const commons = await discoverWikimediaCommonsPhotoCandidates();
  const google = await discoverGooglePlacePhotoCandidates();
  return NextResponse.json({
    state: commons.state === 'ready' || google.state === 'ready' ? 'ready' : 'not-configured',
    checked: commons.checked + google.checked,
    candidates: commons.candidates + google.candidates,
    sources: { wikimediaCommons: commons, googlePlaces: google },
  });
}
