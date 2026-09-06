import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const calls = vi.hoisted(() => ({
  contentDatabase: vi.fn(),
  createRepository: vi.fn(),
  createService: vi.fn(),
  run: vi.fn(),
}));

vi.mock('../lib/db/postgres.server', () => ({
  contentDatabase: calls.contentDatabase,
}));

vi.mock('../lib/market-data/refresh-repository.server', () => ({
  createMarketRefreshRepository: calls.createRepository,
}));

vi.mock('../lib/market-data/refresh-service.server', () => ({
  createMarketDataRefreshService: calls.createService,
}));

import * as refreshRoute from '../app/api/internal/market-data-refresh/route';

beforeEach(() => {
  const sql = Object.assign(vi.fn(), {
    query: vi.fn(),
    transaction: vi.fn(),
  });
  calls.contentDatabase.mockReturnValue(sql);
  calls.createRepository.mockReturnValue({ repository: 'test' });
  calls.createService.mockReturnValue({ run: calls.run });
  calls.run.mockResolvedValue({ state: 'busy', job: 'kr-seoul-sale' });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('market data refresh route request validation', () => {
  it('accepts only an exact non-empty bearer secret', () => {
    const authorized = new Request(
      'https://signedprice.test/api/internal/market-data-refresh/?job=kr-seoul-sale',
      { headers: { authorization: 'Bearer expected-secret' } },
    );
    expect(refreshRoute.isMarketDataRefreshRequestAuthorized(
      authorized,
      'expected-secret',
    )).toBe(true);
    expect(refreshRoute.isMarketDataRefreshRequestAuthorized(
      authorized,
      'other-secret',
    )).toBe(false);
    expect(refreshRoute.isMarketDataRefreshRequestAuthorized(authorized, '')).toBe(false);
  });

  it('requires one known job parameter and rejects parameter smuggling', () => {
    expect(refreshRoute.parseMarketDataRefreshJob(new Request(
      'https://signedprice.test/api/internal/market-data-refresh/?job=sg-private-rent',
    ))).toBe('sg-private-rent');
    expect(refreshRoute.parseMarketDataRefreshJob(new Request(
      'https://signedprice.test/api/internal/market-data-refresh/?job=unknown',
    ))).toBeNull();
    expect(refreshRoute.parseMarketDataRefreshJob(new Request(
      'https://signedprice.test/api/internal/market-data-refresh/?job=kr-seoul-sale&job=sg-private-sale',
    ))).toBeNull();
    expect(refreshRoute.parseMarketDataRefreshJob(new Request(
      'https://signedprice.test/api/internal/market-data-refresh/?job=kr-seoul-sale&debug=true',
    ))).toBeNull();
  });
});

describe('scheduled market data refresh route', () => {
  it('requires the Vercel cron bearer before touching the database', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret');
    const response = await refreshRoute.GET(new Request(
      'https://signedprice.test/api/internal/market-data-refresh/?job=kr-seoul-sale',
    ));

    expect(response.status).toBe(401);
    expect(calls.contentDatabase).not.toHaveBeenCalled();
    expect(calls.run).not.toHaveBeenCalled();
  });

  it('runs the requested job and returns only the stable service result', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret');
    calls.run.mockResolvedValue({
      state: 'ready',
      job: 'sg-private-sale',
      sourceAsOf: '2026-09-06T00:00:00.000Z',
      counters: { received: 3, inserted: 2, updated: 0, unchanged: 1, unlinked: 0 },
    });

    const response = await refreshRoute.GET(new Request(
      'https://signedprice.test/api/internal/market-data-refresh/?job=sg-private-sale',
      { headers: { authorization: 'Bearer cron-secret' } },
    ));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({
      state: 'ready',
      job: 'sg-private-sale',
      sourceAsOf: '2026-09-06T00:00:00.000Z',
      counters: { received: 3, inserted: 2, updated: 0, unchanged: 1, unlinked: 0 },
    });
    expect(calls.run).toHaveBeenCalledWith('sg-private-sale');
  });

  it('returns accepted when the exact job already has an active lease', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret');
    calls.run.mockResolvedValue({ state: 'busy', job: 'ae-dubai-rent' });

    const response = await refreshRoute.GET(new Request(
      'https://signedprice.test/api/internal/market-data-refresh/?job=ae-dubai-rent',
      { headers: { authorization: 'Bearer cron-secret' } },
    ));
    expect(response.status).toBe(202);
  });

  it('fails closed when the content database is absent', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret');
    calls.contentDatabase.mockReturnValue(null);

    const response = await refreshRoute.GET(new Request(
      'https://signedprice.test/api/internal/market-data-refresh/?job=kr-seoul-rent',
      { headers: { authorization: 'Bearer cron-secret' } },
    ));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: 'database_not_configured' });
  });
});

describe('operator Dubai CSV refresh route', () => {
  it('accepts a protected Dubai CSV upload and forwards it without logging the body', async () => {
    vi.stubEnv('CONTENT_ADMIN_SECRET', 'admin-secret');
    calls.run.mockResolvedValue({
      state: 'ready',
      job: 'ae-dubai-transaction',
      sourceAsOf: '2026-09-06T00:00:00.000Z',
      counters: { received: 1, inserted: 1, updated: 0, unchanged: 0, unlinked: 0 },
    });
    const csv = 'TRANSACTION_NUMBER,INSTANCE_DATE\nT-1,2026-09-06';

    const response = await refreshRoute.POST(new Request(
      'https://signedprice.test/api/internal/market-data-refresh/?job=ae-dubai-transaction',
      {
        method: 'POST',
        headers: {
          authorization: 'Bearer admin-secret',
          'content-type': 'text/csv; charset=utf-8',
        },
        body: csv,
      },
    ));

    expect(response.status).toBe(200);
    expect(calls.run).toHaveBeenCalledWith('ae-dubai-transaction', { uploadedCsv: csv });
  });

  it('does not allow CSV uploads for Seoul or Singapore jobs', async () => {
    vi.stubEnv('CONTENT_ADMIN_SECRET', 'admin-secret');
    const response = await refreshRoute.POST(new Request(
      'https://signedprice.test/api/internal/market-data-refresh/?job=sg-private-rent',
      {
        method: 'POST',
        headers: { authorization: 'Bearer admin-secret', 'content-type': 'text/csv' },
        body: 'private,data',
      },
    ));

    expect(response.status).toBe(400);
    expect(calls.run).not.toHaveBeenCalled();
  });

  it('rejects an unsupported upload media type before reading or running it', async () => {
    vi.stubEnv('CONTENT_ADMIN_SECRET', 'admin-secret');
    const response = await refreshRoute.POST(new Request(
      'https://signedprice.test/api/internal/market-data-refresh/?job=ae-dubai-rent',
      {
        method: 'POST',
        headers: { authorization: 'Bearer admin-secret', 'content-type': 'application/json' },
        body: '{"csv":"hidden"}',
      },
    ));

    expect(response.status).toBe(415);
    expect(calls.run).not.toHaveBeenCalled();
  });

  it('rejects bodies above the Vercel function request limit before reading them', async () => {
    vi.stubEnv('CONTENT_ADMIN_SECRET', 'admin-secret');
    const response = await refreshRoute.POST(new Request(
      'https://signedprice.test/api/internal/market-data-refresh/?job=ae-dubai-rent',
      {
        method: 'POST',
        headers: {
          authorization: 'Bearer admin-secret',
          'content-type': 'text/csv',
          'content-length': String(5 * 1024 * 1024),
        },
        body: 'header\nrow',
      },
    ));

    expect(response.status).toBe(413);
    expect(calls.run).not.toHaveBeenCalled();
  });
});
