import 'server-only';
import { createHash, createHmac } from 'node:crypto';
import { parsePurchaseEnquiry, type PurchaseEnquiryInput } from './enquiry-contract';
export type EnquiryDatabase = { query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]> };
export const enquiryReply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });

export async function readEnquiryJson(request: Request): Promise<unknown> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? '')) throw new Error('invalid_payload');
  if (Number(request.headers.get('content-length')) > 12000) throw new Error('invalid_payload');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid_payload');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 12000) { await reader.cancel(); throw new Error('invalid_payload'); }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } finally { reader.releaseLock(); }
}

export function createEnquiryHandler(environment: () => { db: EnquiryDatabase | null; secret: string }) {
  return async (request: Request): Promise<Response> => {
    if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') return enquiryReply({ error: 'invalid_origin' }, 403);
    let input: PurchaseEnquiryInput | null;
    try { input = parsePurchaseEnquiry(await readEnquiryJson(request)); } catch { return enquiryReply({ error: 'invalid_payload' }, 400); }
    if (!input) return enquiryReply({ error: 'invalid_payload' }, 400);
    const { db, secret } = environment();
    if (!db || secret.length < 32) return enquiryReply({ error: 'unavailable' }, 503);
    const payload = JSON.stringify(input), hash = createHash('sha256').update(payload).digest('hex');
    try {
      // A retry after a lost response must not create another enquiry or consume the rate allowance.
      const previous = await db.query('SELECT payload_hash FROM purchase_enquiries WHERE id=$1 AND expires_at>now()', [input.requestId]);
      if (previous.length) return previous[0]?.payload_hash === hash ? enquiryReply({ state: 'received', reference: input.requestId }) : enquiryReply({ error: 'conflict' }, 409);
      // Vercel sets this header. No raw network address is stored or logged.
      const network = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      const networkKey = `enquiry:${createHmac('sha256', secret).update(`${new Date().toISOString().slice(0, 10)}:${network}`).digest('hex')}`;
      const allowance = await db.query(`INSERT INTO sp_qa_rate_limits(key,hits,expires_at) VALUES($1,1,now()+interval '1 hour')
        ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN sp_qa_rate_limits.expires_at<=now() THEN 1 ELSE sp_qa_rate_limits.hits+1 END,
        expires_at=CASE WHEN sp_qa_rate_limits.expires_at<=now() THEN now()+interval '1 hour' ELSE sp_qa_rate_limits.expires_at END RETURNING hits`, [networkKey]);
      if (!allowance[0] || Number(allowance[0].hits) > 5) return enquiryReply({ error: 'rate_limited' }, 429);
      const stored = await db.query(`INSERT INTO purchase_enquiries(id,payload_hash,payload) VALUES($1,$2,$3::jsonb)
        ON CONFLICT(id) DO UPDATE SET id=purchase_enquiries.id WHERE purchase_enquiries.payload_hash=EXCLUDED.payload_hash AND purchase_enquiries.expires_at>now() RETURNING id`, [input.requestId, hash, payload]);
      if (!stored.length) return enquiryReply({ error: 'conflict' }, 409);
      return enquiryReply({ state: 'received', reference: input.requestId }, 201);
    } catch { return enquiryReply({ error: 'unavailable' }, 503); }
  };
}
