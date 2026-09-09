import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ read: vi.fn(), port: vi.fn(), repository: vi.fn(), refresh: vi.fn() }));
vi.mock('../lib/japan/publication-cache.server', () => ({ readCachedJapanPublication: mocks.read }));
vi.mock('../lib/japan/repository.server', () => ({ readJapanPublication: mocks.read,
  japanSqlPort: mocks.port, createJapanRepository: mocks.repository }));
vi.mock('../lib/japan/refresh.server', () => ({ refreshJapan: mocks.refresh,
  scheduledJapanScope: () => ({ city: '13123', year: '2025', quarter: '1' }) }));
import { GET as publicGet } from '../app/api/japan/transactions/route';
import { GET as cronGet, POST as operatorPost } from '../app/api/internal/japan-refresh/route';
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
const request = (query = '', token = '') => new Request(`https://example.test/api?${query}`, { headers: { authorization: token } });

describe('Japan published API', () => {
  it('rejects unbounded/duplicate queries before any database lookup', async () => {
    for (const query of ['city=99999', 'city=13103&city=13102', 'quarter=5', 'utm_source=campaign', 'gclid=test', 'url=https://example.test'])
      expect((await publicGet(request(query))).status).toBe(400);
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it('serves only durable publication metadata and preserves its original source retrieval time', async () => {
    mocks.read.mockResolvedValue({ releaseId: 'published', retrievedAt: '2025-12-01T00:00:00Z', sourceCount: 2, records: [] });
    const response = await publicGet(request('q=Azabu'));
    expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toBe('public, max-age=0, s-maxage=60'); expect((await response.json()).retrievedAt).toBe('2025-12-01T00:00:00Z');
    expect(mocks.read.mock.calls[0]?.[1]).toMatchObject({ q: 'Azabu' });
  });
  it('distinguishes unpublished scopes and failed storage from a published zero count', async () => {
    mocks.read.mockResolvedValue(null); expect((await publicGet(request())).status).toBe(404);
    mocks.read.mockRejectedValue(new Error('private connection details')); const failed = await publicGet(request());
    expect(failed.status).toBe(503); expect(await failed.text()).not.toContain('private');
    mocks.read.mockResolvedValue({ sourceCount: 0, records: [], retrievedAt: '2026-09-08T00:00:00Z' });
    expect((await publicGet(request())).status).toBe(200);
  });
});
describe('Japan internal refresh authorization and bounded schedule', () => {
  it('fails closed without a configured matching secret', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-test'); vi.stubEnv('CONTENT_ADMIN_SECRET', 'operator-test');
    expect((await cronGet(request('', 'Bearer wrong'))).status).toBe(401);
    expect((await operatorPost(request('', 'Bearer cron-test'))).status).toBe(401);
    expect(mocks.port).not.toHaveBeenCalled();
  });
  it('keeps scheduled collection disabled until explicitly enabled', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-test'); vi.stubEnv('SIGNEDPRICE_JAPAN_REFRESH_ENABLED', 'false');
    const response = await cronGet(request('', 'Bearer cron-test'));
    expect(await response.json()).toMatchObject({ state: 'skipped', reason: 'job_disabled' });
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it('executes one scheduled scope without requiring a Minato bootstrap publication', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-test'); vi.stubEnv('SIGNEDPRICE_JAPAN_REFRESH_ENABLED', 'true');
    vi.stubEnv('SIGNEDPRICE_REINFOLIB_API_KEY', 'source-test');
    const port = { query: vi.fn() };
    mocks.port.mockReturnValue(port); mocks.repository.mockReturnValue({}); mocks.refresh.mockResolvedValue({ state: 'ready' });
    mocks.read.mockRejectedValue(new Error('public scope is unavailable'));
    expect((await cronGet(request('', 'Bearer cron-test'))).status).toBe(200);
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(mocks.refresh.mock.calls[0]?.[1]).toEqual({ city: '13123', year: '2025', quarter: '1' });
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it('preserves explicit authenticated GET scopes without a bootstrap lookup', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-test'); vi.stubEnv('SIGNEDPRICE_JAPAN_REFRESH_ENABLED', 'true');
    vi.stubEnv('SIGNEDPRICE_REINFOLIB_API_KEY', 'source-test');
    mocks.port.mockReturnValue({}); mocks.repository.mockReturnValue({}); mocks.refresh.mockResolvedValue({ state: 'ready' });
    mocks.read.mockRejectedValue(new Error('database unavailable'));
    expect((await cronGet(request('city=13102&year=2025&quarter=3', 'Bearer cron-test'))).status).toBe(200);
    expect(mocks.read).not.toHaveBeenCalled();
    expect(mocks.refresh.mock.calls[0]?.[1]).toEqual({ city: '13102', year: '2025', quarter: '3' });
  });
  it('allows the authenticated initial ward-quarter and protects the large-reduction override', async () => {
    vi.stubEnv('CONTENT_ADMIN_SECRET', 'operator-test'); vi.stubEnv('SIGNEDPRICE_REINFOLIB_API_KEY', 'source-test');
    mocks.port.mockReturnValue({}); mocks.repository.mockReturnValue({}); mocks.refresh.mockResolvedValue({ state: 'ready' });
    const query = 'city=13103&year=2025&quarter=4&allowLargeReduction=true';
    expect((await operatorPost(request(query, 'Bearer operator-test'))).status).toBe(200);
    expect(mocks.refresh.mock.calls[0]?.[1]).toEqual({ city: '13103', year: '2025', quarter: '4' });
    expect(mocks.refresh.mock.calls[0]?.[3]).toEqual({ allowLargeReduction: true });
    expect((await operatorPost(request('city=13103', 'Bearer operator-test'))).status).toBe(400);
    vi.stubEnv('CRON_SECRET', 'cron-test');
    expect((await cronGet(request(query, 'Bearer cron-test'))).status).toBe(400);
  });
});
