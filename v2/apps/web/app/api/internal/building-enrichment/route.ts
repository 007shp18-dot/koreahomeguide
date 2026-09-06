import { NextResponse } from 'next/server';

import { contentDatabaseConfigured } from '@/lib/db/postgres.server';
import { runPhotoBackfillSlice, type PhotoBackfillOptions } from '@/lib/photos/photo-backfill.server';
import { enrichOfficialBuildingFacts } from '@/lib/public-market/official-building-enrichment.server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type EnrichmentSource = 'all' | 'wikimedia' | 'google' | 'naver' | 'official';

function finiteEnvironmentNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function googleDailyRequestCap(): number {
  return Math.max(1, Math.floor(finiteEnvironmentNumber('PHOTO_GOOGLE_DAILY_REQUEST_CAP', 5)));
}

export function allocateProviderLimit(total: number, index: number, count: number): number {
  if (!Number.isSafeInteger(total) || total < 0 || !Number.isSafeInteger(index)
    || !Number.isSafeInteger(count) || count < 1 || index < 0 || index >= count) return 0;
  return Math.floor(total / count) + (index < total % count ? 1 : 0);
}

function providerOptions(
  market: 'kr-seoul' | 'sg-singapore',
  provider: 'wikimedia' | 'google' | 'naver-search',
  limit: number,
): PhotoBackfillOptions {
  return Object.freeze({
    market,
    provider,
    limit,
    dailyRequestCap: provider === 'google'
      ? googleDailyRequestCap()
      : provider === 'naver-search'
        ? Math.max(1, Math.floor(finiteEnvironmentNumber('PHOTO_NAVER_DAILY_REQUEST_CAP', 25_000)))
        : 100_000,
    dailySpendCapUsd: provider === 'google'
      ? finiteEnvironmentNumber('PHOTO_GOOGLE_DAILY_SPEND_CAP_USD', 0.16)
      : 0,
    dryRun: false,
  });
}

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
  const limit = Number(parameters.get('limit') ?? (source === 'wikimedia' ? 60 : 12));
  const maxLimit = source === 'official' ? 250 : source === 'naver' ? 100 : source === 'wikimedia' ? 60 : 30;
  if ((market !== null && market !== 'seoul' && market !== 'singapore')
    || !['all', 'wikimedia', 'google', 'naver', 'official'].includes(source)
    || !Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
    return NextResponse.json({ error: 'invalid_scope' }, { status: 400 });
  }
  const selectedSource = source as EnrichmentSource;
  const markets: readonly ('seoul' | 'singapore')[] = market === null
    ? ['seoul', 'singapore']
    : [market as 'seoul' | 'singapore'];
  const scopedLimit = market === null && selectedSource === 'all' ? Math.min(limit, 6) : limit;
  const sharedGoogleLimit = market === null
    ? Math.min(scopedLimit, googleDailyRequestCap())
    : scopedLimit;
  const runPhotoProvidersForMarket = async (marketKey: 'seoul' | 'singapore') => {
    const photoMarket = marketKey === 'seoul' ? 'kr-seoul' : 'sg-singapore';
    const providers = [
      ...(['all', 'wikimedia'].includes(selectedSource)
        ? [{ provider: 'wikimedia' as const, source: 'wikimediaCommons' as const }]
        : []),
      ...(['all', 'google'].includes(selectedSource)
        ? [{ provider: 'google' as const, source: 'googlePlaces' as const }]
        : []),
      ...(['all', 'naver'].includes(selectedSource)
        ? [{ provider: 'naver-search' as const, source: 'naverImageSearch' as const }]
        : []),
    ];
    const results = [];
    for (const { provider, source: providerSource } of providers) {
      const providerLimit = provider === 'google' && market === null && selectedSource === 'google'
        ? allocateProviderLimit(sharedGoogleLimit, markets.indexOf(marketKey), markets.length)
        : scopedLimit;
      if (providerLimit === 0) continue;
      const result = await runPhotoBackfillSlice(providerOptions(photoMarket, provider, providerLimit));
      results.push({ market: marketKey, source: providerSource, result });
    }
    return results;
  };
  const photoRuns = selectedSource === 'google'
    ? (async () => {
      const runs = [];
      for (const marketKey of markets) runs.push(...await runPhotoProvidersForMarket(marketKey));
      return runs;
    })()
    : Promise.all(markets.map(runPhotoProvidersForMarket)).then((runs) => runs.flat());
  const officialRun = market === 'singapore' || !['all', 'official'].includes(selectedSource)
    ? Promise.resolve(null)
    : enrichOfficialBuildingFacts(scopedLimit);
  const [runs, official] = await Promise.all([photoRuns, officialRun]);
  const aggregate = (source: 'wikimediaCommons' | 'googlePlaces' | 'naverImageSearch') => {
    const selected = runs.filter((run) => run.source === source);
    return Object.freeze({
      state: selected.some((run) => run.result.state === 'ready') ? 'ready' as const
        : selected.some((run) => run.result.state === 'provider-paused') ? 'provider-paused' as const
          : 'not-configured' as const,
      checked: selected.reduce((sum, run) => sum + run.result.checked, 0),
      candidates: selected.reduce((sum, run) => sum + run.result.candidates, 0),
    });
  };
  const commons = aggregate('wikimediaCommons');
  const google = aggregate('googlePlaces');
  const naver = aggregate('naverImageSearch');
  return NextResponse.json({
    state: commons.state === 'ready' || google.state === 'ready' || naver.state === 'ready' || official?.state === 'ready'
      ? 'ready'
      : 'not-configured',
    source: selectedSource,
    checked: commons.checked + google.checked + naver.checked,
    candidates: commons.candidates + google.candidates + naver.candidates,
    sources: { wikimediaCommons: commons, googlePlaces: google, naverImageSearch: naver },
    markets: Object.fromEntries(markets.map((marketKey) => [marketKey, Object.fromEntries(
      runs.filter((run) => run.market === marketKey).map((run) => [run.source, run.result]),
    )])),
    officialBuildingFacts: official,
  });
}
