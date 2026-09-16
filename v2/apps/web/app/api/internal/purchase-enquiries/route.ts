import { contentDatabase } from '@/lib/db/postgres.server';
import { authorized, sameOrigin } from '@/lib/evidence-pool/auth.server';
import { enquiryId } from '@/lib/operator/enquiry-contract';
import { enquiryReply, readEnquiryJson } from '@/lib/operator/enquiry-handler.server';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  if (!authorized(request)) return enquiryReply({ error: 'unauthorized' }, 401);
  const params = new URL(request.url).searchParams, status = params.get('status') ?? 'new', page = Number(params.get('page') ?? 1);
  if (!['new', 'done', 'all'].includes(status) || !Number.isSafeInteger(page) || page < 1 || page > 10000) return enquiryReply({ error: 'invalid_payload' }, 400);
  const db = contentDatabase(); if (!db) return enquiryReply({ error: 'unavailable' }, 503);
  try {
    const rows = await db.query(`SELECT id,payload,status,created_at FROM purchase_enquiries WHERE expires_at>now() AND ($1='all' OR status=$1) ORDER BY created_at DESC,id DESC LIMIT 26 OFFSET $2`, [status, (page - 1) * 25]);
    return enquiryReply({ items: rows.slice(0, 25), hasMore: rows.length > 25 });
  } catch { return enquiryReply({ error: 'unavailable' }, 503); }
}
export async function POST(request: Request) {
  if (!authorized(request)) return enquiryReply({ error: 'unauthorized' }, 401);
  if (!sameOrigin(request)) return enquiryReply({ error: 'invalid_origin' }, 403);
  let body;
  try { body = await readEnquiryJson(request) as { id?: unknown; action?: unknown }; } catch { return enquiryReply({ error: 'invalid_payload' }, 400); }
  if (!body || !enquiryId(body.id) || !['new', 'done', 'delete'].includes(String(body.action))) return enquiryReply({ error: 'invalid_payload' }, 400);
  const db = contentDatabase(); if (!db) return enquiryReply({ error: 'unavailable' }, 503);
  try {
    const rows = body.action === 'delete'
      ? await db.query('DELETE FROM purchase_enquiries WHERE id=$1 RETURNING id', [body.id])
      : await db.query('UPDATE purchase_enquiries SET status=$2,updated_at=now() WHERE id=$1 AND expires_at>now() RETURNING id', [body.id, body.action]);
    return rows.length ? enquiryReply({ ok: true }) : enquiryReply({ error: 'not_found' }, 404);
  } catch { return enquiryReply({ error: 'unavailable' }, 503); }
}
