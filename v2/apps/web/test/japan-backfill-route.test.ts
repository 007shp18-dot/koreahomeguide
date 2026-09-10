import { afterEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const service = vi.hoisted(() => ({ status: vi.fn(), run: vi.fn() }));
vi.mock('../lib/japan/backfill.server', () => ({ readJapanBackfillStatus: service.status, runJapanBackfill: service.run }));
import { GET, POST } from '../app/api/internal/japan-backfill/route';
import { issueSession } from '../lib/evidence-pool/auth.server';
const url = 'https://example.com/api/internal/japan-backfill/';
function session() {
  const secret = 's'.repeat(48); vi.stubEnv('EVIDENCE_ADMIN_SECRET', secret);
  return `sp_evidence_session=${issueSession(secret)}`;
}
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });
it('does not expose data collection to anonymous callers', async () => {
  vi.stubEnv('EVIDENCE_ADMIN_SECRET', '');
  expect((await GET(new Request(url))).status).toBe(401);
  expect((await POST(new Request(url, { method: 'POST' }))).status).toBe(401);
  expect(service.run).not.toHaveBeenCalled(); expect(service.status).not.toHaveBeenCalled();
});
it.each<Record<string, string>>([{}, { origin: 'https://hostile.example' }, { origin: 'https://example.com', 'sec-fetch-site': 'cross-site' }])('rejects cross-site writes with a valid session %j', async headers => {
  expect((await POST(new Request(url, { method: 'POST', headers: { ...headers, cookie: session() } }))).status).toBe(403);
  expect(service.run).not.toHaveBeenCalled();
});
it('runs a bounded batch with the configured key only for the authenticated administrator', async () => {
  vi.stubEnv('SIGNEDPRICE_REINFOLIB_API_KEY', 'test-key');
  service.run.mockResolvedValue({ state: 'partial', remaining: 10 });
  const response = await POST(new Request(url, { method: 'POST', headers: { cookie: session(), origin: 'https://example.com' } }));
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(service.run).toHaveBeenCalledWith({ apiKey: 'test-key', maxScopes: 3, maxDurationMs: 75_000 });
});
it('does not expose credentials in errors', async () => {
  vi.stubEnv('SIGNEDPRICE_REINFOLIB_API_KEY', 'test-key');
  service.run.mockRejectedValue(new Error('secret internal error'));
  const response = await POST(new Request(url, { method: 'POST', headers: { cookie: session(), origin: 'https://example.com' } }));
  expect(await response.json()).toEqual({ error: 'storage_unavailable' });
});
