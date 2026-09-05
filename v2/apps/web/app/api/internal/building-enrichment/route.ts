import { NextResponse } from 'next/server';

import { contentDatabaseConfigured } from '@/lib/db/postgres.server';
import {
  discoverGooglePlacePhotoCandidates,
  discoverWikimediaCommonsPhotoCandidates,
} from '@/lib/photos/building-photo-store.server';
import { enrichOfficialBuildingFacts } from '@/lib/public-market/official-building-enrichment.server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type EnrichmentSource = 'all' | 'wikimedia' | 'google' | 'official';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!contentDatabaseConfigured()) return NextResponse.json({ error: 'database_not_configured' }, { status: 503 });
  const parameters = new URL(request.url).searchParams;
  const market = parameters.get('market');
  const scheduledSource = request.headers.get('x-vercel-cron-schedule') === '7 * * * *'
    ? 'wikimedia'
    : 'all';
  const source = parameters.get('source') ?? scheduledSource;
  const limit = Number(parameters.get('limit') ?? (source === 'wikimedia' ? 30 : 12));
  if ((market !== null && market !== 'seoul' && market !== 'singapore')
    || !['all', 'wikimedia', 'google', 'official'].includes(source)
    || !Number.isInteger(limit) || limit < 1 || limit > 30) {
    return NextResponse.json({ error: 'invalid_scope' }, { status: 400 });
  }
  const selectedSource = source as EnrichmentSource;
  const markets: readonly ('seoul' | 'singapore')[] = market === null
    ? ['seoul', 'singapore']
    : [market as 'seoul' | 'singapore'];
  const scopedLimit = market === null && selectedSource === 'all' ? Math.min(limit, 6) : limit;
  const photoRuns = Promise.all(markets.flatMap((marketKey) => [
    ...(['all', 'wikimedia'].includes(selectedSource)
      ? [discoverWikimediaCommonsPhotoCandidates(scopedLimit, marketKey)
        .then((result) => ({ market: marketKey, source: 'wikimediaCommons' as const, result }))]
      : []),
    ...(['all', 'google'].includes(selectedSource)
      ? [discoverGooglePlacePhotoCandidates(scopedLimit, marketKey)
        .then((result) => ({ market: marketKey, source: 'googlePlaces' as const, result }))]
      : []),
  ]));
  const officialRun = market === 'singapore' || !['all', 'official'].includes(selectedSource)
    ? Promise.resolve(null)
    : enrichOfficialBuildingFacts(scopedLimit);
  const [runs, official] = await Promise.all([photoRuns, officialRun]);
  const aggregate = (source: 'wikimediaCommons' | 'googlePlaces') => {
    const selected = runs.filter((run) => run.source === source);
    return Object.freeze({
      state: selected.some((run) => run.result.state === 'ready') ? 'ready' as const : 'not-configured' as const,
      checked: selected.reduce((sum, run) => sum + run.result.checked, 0),
      candidates: selected.reduce((sum, run) => sum + run.result.candidates, 0),
    });
  };
  const commons = aggregate('wikimediaCommons');
  const google = aggregate('googlePlaces');
  return NextResponse.json({
    state: commons.state === 'ready' || google.state === 'ready' || official?.state === 'ready'
      ? 'ready'
      : 'not-configured',
    source: selectedSource,
    checked: commons.checked + google.checked,
    candidates: commons.candidates + google.candidates,
    sources: { wikimediaCommons: commons, googlePlaces: google },
    markets: Object.fromEntries(markets.map((marketKey) => [marketKey, Object.fromEntries(
      runs.filter((run) => run.market === marketKey).map((run) => [run.source, run.result]),
    )])),
    officialBuildingFacts: official,
  });
}
