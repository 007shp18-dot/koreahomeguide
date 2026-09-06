import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const calls = vi.hoisted(() => ({ run: vi.fn(), status: vi.fn() }));
vi.mock('../lib/photos/photo-backfill.server', () => ({
  runPhotoBackfillSlice: calls.run,
  readPhotoCoverageStatus: calls.status,
}));

import { GET, POST } from '../app/api/internal/photo-coverage/route';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

const authorized = { authorization: 'Bearer coverage-secret' };

describe('photo coverage operations route', () => {
  it('returns coverage, provider health, and usage only to an authorized operator', async () => {
    vi.stubEnv('CONTENT_ADMIN_SECRET', 'coverage-secret');
    calls.status.mockResolvedValue({
      coverage: { total: 62_872, exactPhoto: 12, providerPhoto: 2, parentPhoto: 0, streetView: 0, unavailable: 0, complete: 14 },
      providerHealth: [], dailyUsage: [], missingCoordinates: 10, reviewQueue: 36,
    });

    expect((await GET(new Request('https://example.com/api/internal/photo-coverage'))).status).toBe(401);
    const response = await GET(new Request('https://example.com/api/internal/photo-coverage', { headers: authorized }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ coverage: { total: 62_872, complete: 14 } });
  });

  it('runs a validated bounded slice and rejects Dubai', async () => {
    vi.stubEnv('CONTENT_ADMIN_SECRET', 'coverage-secret');
    calls.run.mockResolvedValue({ state: 'ready', checked: 2, candidates: 1, entityIds: ['a', 'b'] });
    const response = await POST(new Request('https://example.com/api/internal/photo-coverage', {
      method: 'POST', headers: { ...authorized, 'content-type': 'application/json' },
      body: JSON.stringify({
        market: 'kr-seoul', provider: 'google', limit: 2,
        dailyRequestCap: 20, dailySpendCapUsd: 2, dryRun: false,
      }),
    }));
    expect(response.status).toBe(200);
    expect(calls.run).toHaveBeenCalledWith({
      market: 'kr-seoul', provider: 'google', limit: 2,
      dailyRequestCap: 20, dailySpendCapUsd: 2, dryRun: false,
    });

    const rejected = await POST(new Request('https://example.com/api/internal/photo-coverage', {
      method: 'POST', headers: { ...authorized, 'content-type': 'application/json' },
      body: JSON.stringify({
        market: 'ae-dubai', provider: 'google', limit: 2,
        dailyRequestCap: 20, dailySpendCapUsd: 2, dryRun: false,
      }),
    }));
    expect(rejected.status).toBe(400);
  });
});
