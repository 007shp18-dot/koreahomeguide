import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const database = vi.hoisted(() => ({ get: vi.fn(() => null) }));
vi.mock('../lib/db/postgres.server', () => ({ contentDatabase: database.get }));

import { GET, POST } from '../app/api/internal/onemap-locations/route';
import { issueSession } from '../lib/evidence-pool/auth.server';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('OneMap location route access', () => {
  it('does not authorize a missing cron secret', async () => {
    vi.stubEnv('CRON_SECRET', '');
    vi.stubEnv('EVIDENCE_ADMIN_SECRET', '');
    const response = await GET(new Request('https://example.com/api/internal/onemap-locations/', {
      headers: { authorization: 'Bearer undefined' },
    }));
    expect(response.status).toBe(401);
    expect(database.get).not.toHaveBeenCalled();
  });

  it('accepts the configured cron credential and fails closed without a database', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret');
    const response = await GET(new Request('https://example.com/api/internal/onemap-locations/', {
      headers: { authorization: 'Bearer cron-secret' },
    }));
    expect(response.status).toBe(503);
  });

  it('requires an authenticated same-origin session for mutations', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret');
    expect((await POST(new Request('https://example.com/api/internal/onemap-locations/', {
      method: 'POST',
      headers: { authorization: 'Bearer cron-secret' },
    }))).status).toBe(401);

    const secret = 's'.repeat(48);
    vi.stubEnv('EVIDENCE_ADMIN_SECRET', secret);
    expect((await POST(new Request('https://example.com/api/internal/onemap-locations/', {
      method: 'POST',
      headers: {
        cookie: `sp_evidence_session=${issueSession(secret)}`,
        origin: 'https://hostile.example',
      },
    }))).status).toBe(403);
  });
});
