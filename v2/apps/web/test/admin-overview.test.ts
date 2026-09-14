import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ query: vi.fn(), database: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('../lib/db/postgres.server', () => ({ contentDatabase: mocks.database }));
import { GET } from '../app/api/internal/admin-overview/route';
import { issueSession, SESSION_COOKIE, SESSION_SECONDS } from '../lib/evidence-pool/auth.server';
import { overviewTotals, type AdminOverview } from '../lib/admin/overview';
const secret = 'local-admin-overview-test-secret-123456789';
function request(city = 'all', token = issueSession(secret)) {
  return new Request(`https://www.signedprice.com/api/internal/admin-overview/?city=${city}`, { headers: { cookie: `${SESSION_COOKIE}=${token}` } });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('EVIDENCE_ADMIN_SECRET', secret);
  mocks.database.mockReturnValue({ query: mocks.query });
  mocks.query.mockImplementation(async (sql: string, params?: string[]) => {
    if (sql.includes('market_data_refresh_runs')) return [
      { job: 'kr-seoul-sale', state: 'succeeded', inserted: 7, updated: 3, received: 15, started_at: '2026-09-10T00:00:00Z' },
      { job: 'sg-private-rent', state: 'failed', inserted: 900, updated: 100, started_at: '2026-09-14T00:00:00Z' },
      { job: 'jp-tokyo-sale', state: 'succeeded', inserted: 2, updated: 1, started_at: '2026-09-11T00:00:00Z' },
    ];
    if (sql.includes('FROM classified')) return params?.[0] === 'tokyo' ? [] : [{ market: params?.[0] === 'all' ? 'seoul' : params?.[0], quality: 'qualified', count: 4 }];
    return [{ slug: 'story', title: 'Article', locale: 'en', market: params?.[0], state: 'draft', total: 12 }];
  });
});
afterEach(() => vi.unstubAllEnvs());
describe('admin overview', () => {
  it.each(['', 'invalid', issueSession(secret, Date.now() - SESSION_SECONDS * 1000 - 1000)])('rejects absent, forged or expired sessions before database access (%s)', async token => {
    const response = await GET(request('all', token));
    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(mocks.database).not.toHaveBeenCalled();
  });
  it('validates city before querying', async () => {
    expect((await GET(request('unsupported'))).status).toBe(400);
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it('reports a missing database as unavailable', async () => {
    mocks.database.mockReturnValue(null);
    expect((await GET(request())).status).toBe(503);
  });
  it.each(['seoul', 'singapore', 'dubai', 'tokyo'])('keeps %s data in scope', async city => {
    const data: AdminOverview = await (await GET(request(city))).json();
    const prefixes: Record<string, string> = { seoul: 'kr-seoul', singapore: 'sg-private', dubai: 'ae-dubai', tokyo: 'jp-tokyo' };
    expect(data.city).toBe(city);
    const expectedJobs: Record<string,string[]> = {seoul:['kr-seoul-sale','kr-seoul-rent'],singapore:['sg-private-sale','sg-private-rent'],dubai:['ae-dubai-transaction','ae-dubai-rent'],tokyo:['jp-tokyo-sale']};
    expect(data.jobs?.map(job=>job.job)).toEqual(expectedJobs[city]);
    expect(data.jobs?.every(job => job.job.startsWith(prefixes[city]!))).toBe(true);
    expect(mocks.query.mock.calls.filter(call => call[1]).map(call => call[1])).toEqual([[city], [city]]);
    if (city === 'tokyo') expect(data.issues).toEqual([]);
  });
  it('counts latest successful writes separately from review and publication queues', async () => {
    const data: AdminOverview = await (await GET(request())).json();
    expect(overviewTotals(data)).toEqual({ succeeded: 2, stored: 13, pending: 4, articles: 12 });
    const issueSql = mocks.query.mock.calls.find(call => call[0].includes('FROM classified'))![0];
    const articleSql = mocks.query.mock.calls.find(call => call[0].includes('editorial_publication_queue'))![0];
    expect(issueSql).toContain("e.status='pending'");
    expect(articleSql).toContain("state IN ('draft','failed','cancelled')");
    expect(articleSql).toContain('count(*) OVER ()');
  });
  it.each(['market_data_refresh_runs', 'FROM classified', 'editorial_publication_queue'])('isolates failed %s reads without exposing database errors', async failed => {
    const normal = mocks.query.getMockImplementation()!;
    mocks.query.mockImplementation(async (sql: string, params?: string[]) => {
      if (sql.includes(failed)) throw new Error('private connection details');
      return normal(sql, params);
    });
    const response = await GET(request());
    const data: AdminOverview = await response.json();
    expect(response.status).toBe(200);
    expect(data.unavailable).toHaveLength(1);
    expect(JSON.stringify(data)).not.toContain('private connection');
    const totals = overviewTotals(data);
    expect(totals.stored).toBe(failed === 'market_data_refresh_runs' ? null : 13);
    expect(totals.pending).toBe(failed === 'FROM classified' ? null : 4);
    expect(totals.articles).toBe(failed === 'editorial_publication_queue' ? null : 12);
  });
  it('distinguishes an empty database from failed queries', async () => {
    mocks.query.mockResolvedValue([]);
    const data: AdminOverview = await (await GET(request())).json();
    expect(overviewTotals(data)).toEqual({ succeeded: 0, stored: 0, pending: 0, articles: 0 });
    expect(data.unavailable).toEqual([]);
  });
});
