import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../lib/db/postgres.server', () => ({ contentDatabase: vi.fn() }));
vi.mock('../lib/evidence-pool/auth.server', () => ({ authorized: vi.fn(), sameOrigin: vi.fn() }));
import { createHash } from 'node:crypto';
import { createEnquiryHandler } from '../lib/operator/enquiry-handler.server';
import { ENQUIRY_NOTICE, parsePurchaseEnquiry } from '../lib/operator/enquiry-contract';
import { GET, POST } from '../app/api/internal/purchase-enquiries/route';
import { authorized, sameOrigin } from '../lib/evidence-pool/auth.server';
import { contentDatabase } from '../lib/db/postgres.server';
const payload = { requestId: '56f30dc9-ec9e-4de9-b0cb-5a7f8e4e0454', email: 'buyer@example.com', city: 'tokyo', budget: '50000000', purpose: 'own-use', timing: 'soon', context: 'Compare these two homes', locale: 'en', consent: true, consentVersion: ENQUIRY_NOTICE };
const request = (body: unknown = payload, headers: Record<string, string> = {}) => new Request('https://www.signedprice.com/api/purchase-enquiries/', { method: 'POST', headers: { origin: 'https://www.signedprice.com', 'content-type': 'application/json', 'x-vercel-forwarded-for': '192.0.2.1', ...headers }, body: JSON.stringify(body) });
const secret = 'unit-test-enquiry-secret-at-least-32-characters';
beforeEach(() => vi.clearAllMocks());
describe('direct purchase enquiry', () => {
  it('validates the supported cities, consent, email and bounded values before storage', async () => {
    const query = vi.fn(); const handler = createEnquiryHandler(() => ({ db: { query }, secret }));
    for (const patch of [{ city: 'unknown' }, { city: ['tokyo'] }, { locale: ['en'] }, { consent: false }, { email: 'bad\r\naddress' }, { budget: '1e9' }, { context: 'x'.repeat(2001) }, { consentVersion: 'old' }, { requestId: 'invalid' }]) expect((await handler(request({ ...payload, ...patch }))).status).toBe(400);
    expect((await handler(request(payload, { origin: 'https://attacker.example' }))).status).toBe(403);
    expect((await handler(request(payload, { 'content-type': 'text/plain' }))).status).toBe(400);
    expect((await handler(request({ ...payload, junk: 'x'.repeat(12000) }))).status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
  it('returns a receipt only after storage and keeps the network address out of stored parameters', async () => {
    const query = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{ hits: 1 }]).mockResolvedValueOnce([{ id: payload.requestId }]);
    const response = await createEnquiryHandler(() => ({ db: { query }, secret }))(request());
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ state: 'received', reference: payload.requestId });
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(JSON.stringify(query.mock.calls)).not.toContain('192.0.2.1');
    const stored = JSON.parse(query.mock.calls[2]![1][2]);
    expect(stored.email).toBe(payload.email); expect(stored.budget).toBe('50000000');
    expect(stored.consentVersion).toBe(ENQUIRY_NOTICE);
  });
  it('acknowledges a retry without inserting again and rejects reuse with changed content', async () => {
    const hash = createHash('sha256').update(JSON.stringify(parsePurchaseEnquiry(payload))).digest('hex');
    const query = vi.fn().mockResolvedValue([{ payload_hash: hash }]);
    const handler = createEnquiryHandler(() => ({ db: { query }, secret }));
    expect((await handler(request())).status).toBe(200);
    expect(query).toHaveBeenCalledTimes(1);
    expect((await handler(request({ ...payload, email: 'other@example.com' }))).status).toBe(409);
    expect(query).toHaveBeenCalledTimes(2);
  });
  it('fails closed for unavailable storage or admin access, storage errors and rate limits', async () => {
    expect((await createEnquiryHandler(() => ({ db: null, secret }))(request())).status).toBe(503);
    const query = vi.fn();
    expect((await createEnquiryHandler(() => ({ db: { query }, secret: '' }))(request())).status).toBe(503);
    expect(query).not.toHaveBeenCalled();
    query.mockRejectedValueOnce(new Error('private storage error'));
    const handler = createEnquiryHandler(() => ({ db: { query }, secret }));
    expect(await (await handler(request())).json()).toEqual({ error: 'unavailable' });
    query.mockResolvedValueOnce([]).mockResolvedValueOnce([{ hits: 6 }]);
    expect((await handler(request())).status).toBe(429);
    expect(query).toHaveBeenCalledTimes(3);
  });
  it('does not claim receipt if the insert fails or conflicts', async () => {
    const query = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{ hits: 1 }]).mockRejectedValueOnce(new Error('database lost'));
    const handler = createEnquiryHandler(() => ({ db: { query }, secret }));
    expect((await handler(request())).status).toBe(503);
    query.mockResolvedValueOnce([]).mockResolvedValueOnce([{ hits: 1 }]).mockResolvedValueOnce([]);
    expect((await handler(request())).status).toBe(409);
  });
});
describe('private enquiry inbox', () => {
  it('requires an operator session for reads and mutations, plus same origin for mutations', async () => {
    vi.mocked(authorized).mockReturnValue(false);
    expect((await GET(request())).status).toBe(401); expect((await POST(request())).status).toBe(401);
    vi.mocked(authorized).mockReturnValue(true); vi.mocked(sameOrigin).mockReturnValue(false);
    expect((await POST(request())).status).toBe(403);
    expect(contentDatabase).not.toHaveBeenCalled();
  });
  it('paginates retained records with no public caching and deletes only the requested record', async () => {
    vi.mocked(authorized).mockReturnValue(true); vi.mocked(sameOrigin).mockReturnValue(true);
    const query = vi.fn().mockResolvedValueOnce(Array.from({ length: 26 }, (_, id) => ({ id }))).mockResolvedValueOnce([{ id: payload.requestId }]);
    vi.mocked(contentDatabase).mockReturnValue({ query } as unknown as NonNullable<ReturnType<typeof contentDatabase>>);
    const response = await GET(new Request('https://www.signedprice.com/api/internal/purchase-enquiries/?status=all&page=2'));
    expect((await response.json()).items).toHaveLength(25);
    expect(query.mock.calls[0]?.[0]).toContain('expires_at>now()');
    expect(query.mock.calls[0]?.[1]).toEqual(['all', 25]);
    expect(response.headers.get('cache-control')).toContain('private');
    expect((await POST(request({ id: payload.requestId, action: 'delete' }))).status).toBe(200);
    expect(query.mock.calls[1]).toEqual(['DELETE FROM purchase_enquiries WHERE id=$1 RETURNING id', [payload.requestId]]);
  });
});
