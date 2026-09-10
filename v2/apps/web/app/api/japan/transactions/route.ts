import { parseJapanScope } from '@/lib/japan/source.server';
import { parseJapanFilters } from '@/lib/japan/query';
import { readCachedJapanPublication } from '@/lib/japan/publication-cache.server';

export const runtime = 'nodejs';
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  let scope; let filters;
  try { scope = parseJapanScope(query); filters = parseJapanFilters(query); }
  catch { return Response.json({ error: 'invalid_query' }, { status: 400, headers: { 'cache-control': 'no-store' } }); }
  try {
    const data = await readCachedJapanPublication(scope, filters);
    if (data === null) return Response.json({ error: 'quarter_not_published', scope }, { status: 404, headers: { 'cache-control': 'no-store' } });
    return Response.json({ ...data, market: 'jp-tokyo', currency: 'JPY', periodPrecision: 'quarter',
      identityPrecision: 'anonymized_transaction', pageSize: 20,
      source: 'MLIT Real Estate Information Library XIT001; edited by SignedPrice' },
    { headers: { 'cache-control': 'public, max-age=0, s-maxage=60', 'x-content-type-options': 'nosniff' } });
  } catch { return Response.json({ error: 'published_data_unavailable' }, { status: 503, headers: { 'cache-control': 'no-store' } }); }
}
