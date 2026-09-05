import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const calls = vi.hoisted(() => ({ publishSeoul: vi.fn() }));
vi.mock('../lib/db/postgres.server', () => ({
  contentDatabase: () => ({ query: vi.fn() }),
}));
vi.mock('../lib/public-data/entity-projection-publisher.server', () => ({
  createPublicEntityProjectionPublisher: () => ({ publishSeoul: calls.publishSeoul }),
}));

import * as projectionRoute from '../app/api/internal/public-entity-projection/route';

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('public entity projection route authorization', () => {
  it('accepts only the exact configured CRON bearer', () => {
    expect(projectionRoute.isPublicEntityProjectionRequestAuthorized(
      new Request('https://signedprice.test/api/internal/public-entity-projection', {
        headers: { authorization: 'Bearer expected-secret' },
      }),
      'expected-secret',
    )).toBe(true);
    expect(projectionRoute.isPublicEntityProjectionRequestAuthorized(
      new Request('https://signedprice.test/api/internal/public-entity-projection', {
        headers: { authorization: 'Bearer wrong-secret' },
      }),
      'expected-secret',
    )).toBe(false);
    expect(projectionRoute.isPublicEntityProjectionRequestAuthorized(
      new Request('https://signedprice.test/api/internal/public-entity-projection'),
      '',
    )).toBe(false);
  });

  it('serves the authorized GET request sent by Vercel Cron', async () => {
    vi.stubEnv('CRON_SECRET', 'expected-secret');
    calls.publishSeoul.mockResolvedValue({
      published: 12,
      provisional: 0,
      rejected: 0,
      rightsBlocked: 0,
      mediaPublished: 1,
    });
    const handler = (projectionRoute as unknown as Readonly<Record<string, unknown>>).GET;
    expect(typeof handler).toBe('function');
    const response = await (handler as typeof projectionRoute.POST)(new Request(
      'https://signedprice.test/api/internal/public-entity-projection',
      { headers: { authorization: 'Bearer expected-secret' } },
    ));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      state: 'ready',
      published: 12,
      provisional: 0,
      rejected: 0,
      rightsBlocked: 0,
      mediaPublished: 1,
    });
  });

  it('runs after the nightly building enrichment job', () => {
    const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as {
      crons?: readonly Readonly<{ path: string; schedule: string }>[];
    };
    expect(config.crons).toContainEqual({
      path: '/api/internal/public-entity-projection',
      schedule: '57 0 * * *',
    });
  });
});
