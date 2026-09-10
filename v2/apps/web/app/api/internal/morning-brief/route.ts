import { authorized, equalSecret, sameOrigin } from '@/lib/evidence-pool/auth.server';
import { listBriefs, runMorningBrief } from '@/lib/operations/morning-brief.server';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const cron = Boolean(secret && equalSecret(request.headers.get('authorization') ?? '', `Bearer ${secret}`));
  if (!cron && !authorized(request)) return reply({ error: 'unauthorized' }, 401);
  if (cron && process.env.VERCEL_ENV !== 'production') return reply({ error: 'production_only' }, 403);
  try { return reply(cron ? await runMorningBrief() : { reports: await listBriefs() }); }
  catch { return reply({ error: 'report_unavailable' }, 503); }
}
export async function POST(request: Request) {
  if (!authorized(request)) return reply({ error: 'unauthorized' }, 401);
  if (!sameOrigin(request)) return reply({ error: 'invalid_origin' }, 403);
  if (process.env.VERCEL_ENV !== 'production') return reply({ error: 'production_only' }, 403);
  try { return reply(await runMorningBrief()); }
  catch { return reply({ error: 'report_unavailable' }, 503); }
}
