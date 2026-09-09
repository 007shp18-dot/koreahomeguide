import { createJapanRepository, japanSqlPort } from '@/lib/japan/repository.server';
import { refreshJapan, scheduledJapanScope } from '@/lib/japan/refresh.server';
import { parseJapanScope } from '@/lib/japan/source.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
function json(body: unknown, status = 200) { return Response.json(body, { status, headers: { 'cache-control': 'no-store' } }); }
async function execute(request: Request, operator: boolean) {
  const secret = (operator ? process.env.CONTENT_ADMIN_SECRET : process.env.CRON_SECRET)?.trim() ?? '';
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return json({ error: 'unauthorized' }, 401);
  const query = new URL(request.url).searchParams;
  if ([...query].some(([key]) => !['city','year','quarter', ...(operator ? ['allowLargeReduction'] : [])].includes(key)
    || query.getAll(key).length !== 1)) return json({ error: 'invalid_query' }, 400);
  const explicit = ['city','year','quarter'].filter(key => query.has(key));
  if (explicit.length !== 0 && explicit.length !== 3) return json({ error: 'invalid_query' }, 400);
  if (query.has('allowLargeReduction') && query.get('allowLargeReduction') !== 'true') return json({ error: 'invalid_query' }, 400);
  let scope;
  try { scope = explicit.length ? parseJapanScope(query) : scheduledJapanScope(); }
  catch { return json({ error: 'invalid_query' }, 400); }
  if (!operator && process.env.SIGNEDPRICE_JAPAN_REFRESH_ENABLED !== 'true') return json({ state: 'skipped', reason: 'job_disabled' });
  const key = process.env.SIGNEDPRICE_REINFOLIB_API_KEY?.trim();
  if (!key) return json({ state: 'skipped', reason: 'configuration_missing' }, 503);
  const port = japanSqlPort();
  if (!port) return json({ error: 'database_not_configured' }, 503);
  try {
    const result = await refreshJapan(createJapanRepository(port), scope, key,
      { allowLargeReduction: operator && query.get('allowLargeReduction') === 'true' });
    return json(result, result.state === 'failed' ? 502 : result.state === 'busy' ? 202 : 200);
  } catch { return json({ error: 'storage_unavailable' }, 503); }
}
export function GET(request: Request) { return execute(request, false); }
export function POST(request: Request) { return execute(request, true); }
