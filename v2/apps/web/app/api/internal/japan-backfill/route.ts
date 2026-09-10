import { authorized, sameOrigin } from '../../../../lib/evidence-pool/auth.server';
import { readJapanBackfillStatus, runJapanBackfill } from '../../../../lib/japan/backfill.server';

export const runtime = 'nodejs';
export const maxDuration = 120;
const reply = (body: unknown, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'private, no-store' },
});

export async function GET(request: Request) {
  if (!authorized(request)) return reply({ error: 'unauthorized' }, 401);
  try { return reply(await readJapanBackfillStatus()); }
  catch { return reply({ error: 'storage_unavailable' }, 503); }
}

export async function POST(request: Request) {
  if (!authorized(request)) return reply({ error: 'unauthorized' }, 401);
  if (!sameOrigin(request)) return reply({ error: 'invalid_origin' }, 403);
  const apiKey = process.env.SIGNEDPRICE_REINFOLIB_API_KEY?.trim();
  if (!apiKey) return reply({ error: 'configuration_missing' }, 503);
  try { return reply(await runJapanBackfill({ apiKey, maxScopes: 3, maxDurationMs: 75_000 })); }
  catch { return reply({ error: 'storage_unavailable' }, 503); }
}
