import { describe, expect, it, vi, afterEach } from 'vitest';
import { createToolUsageHandler } from '../lib/tool-research/aggregate-route.server';
import { recordToolCompletion } from '../lib/tool-research/aggregate-client';

afterEach(() => vi.unstubAllGlobals());
const payload = { tool: 'singapore-check' as const, market: 'sg-singapore' as const };
const request = (body: unknown, extra: Record<string, string> = {}) => new Request('https://signedprice.com/api/tools/usage/', {
  method: 'POST', headers: { origin: 'https://signedprice.com', 'content-type': 'application/json', ...extra }, body: JSON.stringify(body),
});

describe('aggregate usage privacy boundary', () => {
  it('counts only fixed categories and returns no ownership cookie', async () => {
    const count = vi.fn(async () => {});
    const response = await createToolUsageHandler(count)(request(payload));
    expect(response.status).toBe(204);
    expect(count).toHaveBeenCalledWith('singapore-check', 'sg-singapore');
    expect(response.headers.get('set-cookie')).toBeNull();
  });
  it.each([
    { ...payload, price: 123456 }, { ...payload, consent: true },
    { ...payload, tool: 'my-address' }, { ...payload, market: 'my-project' },
  ])('rejects extra values or identifiers before storage: %j', async (body) => {
    const count = vi.fn(async () => {});
    expect((await createToolUsageHandler(count)(request(body))).status).toBe(400);
    expect(count).not.toHaveBeenCalled();
  });
  it('blocks cross-origin requests and honors privacy signals server-side', async () => {
    const count = vi.fn(async () => {}); const handler = createToolUsageHandler(count);
    expect((await handler(request(payload, { origin: 'https://other.test' }))).status).toBe(403);
    expect((await handler(request(payload, { 'sec-gpc': '1' }))).status).toBe(204);
    expect((await handler(request(payload, { dnt: '1' }))).status).toBe(204);
    expect(count).not.toHaveBeenCalled();
  });
  it('sends no cookie, referrer, input values or identifiers', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('window', { localStorage: { getItem: () => null } });
    vi.stubGlobal('navigator', {}); vi.stubGlobal('fetch', fetcher);
    await recordToolCompletion({ ...payload, price: 123456 } as typeof payload);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0]).toEqual(['/api/tools/usage/', expect.objectContaining({ credentials: 'omit', referrerPolicy: 'no-referrer', body: JSON.stringify(payload) })]);
  });
  it('does not count when analytics is disabled', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    vi.stubGlobal('window', { localStorage: { getItem: () => 'denied' } });
    vi.stubGlobal('navigator', {});
    await recordToolCompletion(payload);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
