import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { createHistoryHandler } from '../lib/public-market/korea-sale-history.server';
import { createKoreaSaleSnapshotRunnerToken } from '../lib/public-market/korea-sale-job-handler.server';
const token = 'history-test-token-at-least-24-characters';
const body = { lawdCd: '11110', dealYmd: '202001', pageNo: 1 };
function request(value: unknown = body, auth = token) {
 return new Request('https://preview.test/api/internal/korea-sale-history/', { method: 'POST', headers: { authorization: `Bearer ${auth}` }, body: JSON.stringify(value) });
}
const xml = '<response><header><resultCode>000</resultCode><resultMsg>OK</resultMsg></header><body><items></items><numOfRows>1000</numOfRows><pageNo>1</pageNo><totalCount>0</totalCount></body></response>';
function setup(environment = 'preview') {
 const fetch = vi.fn(async () => new Response(xml));
 return { fetch, handler: createHistoryHandler({environment, token, serviceKey: 'dummy-key==', fetch, now: () => new Date('2026-09-07T00:00:00Z')}) };
}
it('denies production and unauthenticated requests without contacting MOLIT', async () => {
 const a = setup('production'); expect((await a.handler(request())).status).toBe(403); expect(a.fetch).not.toHaveBeenCalled();
 const b = setup(); expect((await b.handler(request(body, 'wrong'))).status).toBe(401); expect(b.fetch).not.toHaveBeenCalled();
});
it('rejects foreign districts, invalid months, future months and pages before fetching', async () => {
 const a = setup();
 for (const change of [{lawdCd:'26110'}, {dealYmd:'202013'}, {dealYmd:'202610'}, {pageNo:0}]) expect((await a.handler(request({...body,...change}))).status).toBe(400);
 expect(a.fetch).not.toHaveBeenCalled();
});
it('accepts delegated runner credentials and exports verified complete source pages', async () => {
 const a = setup(); const auth = createKoreaSaleSnapshotRunnerToken(token);
 const r = await a.handler(request(body,auth)); expect(r.status).toBe(200);
 expect(await r.json()).toMatchObject({lawdCd:'11110',dealYmd:'202001',pageNo:1,totalCount:0,xml});
 expect(r.headers.get('cache-control')).toBe('no-store');
});
it('rejects malformed provider payloads rather than exporting them', async () => {
 const a = setup(); a.fetch.mockResolvedValue(new Response('<error>bad provider response</error>'));
 expect((await a.handler(request())).status).toBe(502);
});

it('preserves numeric provider Retry-After without exposing the provider body', async () => {
 const a = setup(); a.fetch.mockResolvedValue(new Response('private upstream error',{status:429,headers:{'retry-after':'300'}}));
 const r = await a.handler(request()); expect(r.status).toBe(502);
 expect(await r.json()).toEqual({code:'provider_http_error',providerStatus:429,retryAfterSeconds:300});
});
