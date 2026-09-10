import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const calls = vi.hoisted(() => ({ publishSeoul: vi.fn(), publishProximity: vi.fn(), publishMedia: vi.fn(), coverage: vi.fn() }));
vi.mock('../lib/photos/photo-coverage-store.server', () => ({reconcilePhotoCoverage: calls.coverage}));
vi.mock('../lib/db/postgres.server', () => ({
  contentDatabase: () => ({ query: vi.fn() }),
}));
vi.mock('../lib/public-data/entity-projection-publisher.server', () => ({
  createPublicEntityProjectionPublisher: () => ({ publishSeoul: calls.publishSeoul, publishMedia: calls.publishMedia }),
}));
vi.mock('../lib/public-market/korea-proximity-database.server', () => ({
  publishInstalledKoreaProximityToDatabase: calls.publishProximity,
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
    calls.publishProximity.mockResolvedValue({ state: 'missing' });
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
      proximity: { state: 'missing' },
    });
  });

  it('runs after the nightly building enrichment job', () => {
    const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as {
      crons?: readonly Readonly<{ path: string; schedule: string }>[];
    };
    expect(config.crons).toContainEqual({
      path: '/api/internal/public-entity-projection/',
      schedule: '57 0 * * *',
    });
  });
});

it('publishes approved media in a six-hour batch without reloading proximity', async () => {
 vi.stubEnv('CRON_SECRET','expected-secret');calls.coverage.mockResolvedValue({updated:600,complete:true});
 const response=await projectionRoute.GET(new Request('https://signedprice.test/api/internal/public-entity-projection/?mediaOnly=1',{headers:{authorization:'Bearer expected-secret'}}));
 expect(response.status).toBe(200);expect(calls.publishMedia).toHaveBeenCalledOnce();expect(calls.coverage).toHaveBeenCalledOnce();expect(calls.publishProximity).not.toHaveBeenCalled();
 const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
 expect(config.crons).toContainEqual({path:'/api/internal/public-entity-projection/?mediaOnly=1',schedule:'57 */6 * * *'});
});
