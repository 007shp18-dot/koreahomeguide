import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { POST as approvePhoto } from '../app/api/internal/building-photo-approval/route';
import { GET as ingestNews } from '../app/api/internal/news-ingest/route';

afterEach(() => vi.unstubAllEnvs());

describe('persistent content administration routes', () => {
  it('keeps photo approvals server-authorized', async () => {
    vi.stubEnv('CONTENT_ADMIN_SECRET', 'private-admin-secret');
    const response = await approvePhoto(new Request('https://www.signedprice.com/api/internal/building-photo-approval', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    }));
    expect(response.status).toBe(401);
  });

  it('requires the cron bearer and a configured database', async () => {
    vi.stubEnv('CRON_SECRET', 'private-cron-secret');
    vi.stubEnv('DATABASE_URL', '');
    const unauthorized = await ingestNews(new Request('https://www.signedprice.com/api/internal/news-ingest'));
    expect(unauthorized.status).toBe(401);

    const unavailable = await ingestNews(new Request('https://www.signedprice.com/api/internal/news-ingest', {
      headers: { authorization: 'Bearer private-cron-secret' },
    }));
    expect(unavailable.status).toBe(503);
    expect(await unavailable.json()).toEqual({ error: 'database_not_configured' });
  });
});

