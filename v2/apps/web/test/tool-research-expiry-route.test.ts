import { readFileSync } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import * as publicRoute from '../app/api/tools/research/route';
import { createToolResearchExpiryHandler } from '../lib/tool-research/expiry-handler.server';
import type { ToolResearchRepository } from '../lib/tool-research/repository.server';

function repository(overrides: Partial<ToolResearchRepository> = {}): ToolResearchRepository {
  return {
    submit: overrides.submit ?? (async () => ({ state: 'stored', expiresAt: '' })),
    deleteOwner: overrides.deleteOwner ?? (async () => 0),
    expire: overrides.expire ?? (async () => 0),
    summarizeRetained: overrides.summarizeRetained ?? (async () => []),
  };
}

describe('tool research public route surface', () => {
  it('exposes initialization, submission and owner deletion without a public read method', () => {
    expect(publicRoute.PUT).toBeTypeOf('function');
    expect(publicRoute.POST).toBeTypeOf('function');
    expect(publicRoute.DELETE).toBeTypeOf('function');
    expect('GET' in publicRoute).toBe(false);
  });
});

describe('tool research expiry cron', () => {
  const endpoint = 'https://www.signedprice.com/api/internal/tool-research-expiry/';

  it('requires the existing cron bearer secret', async () => {
    const expire = vi.fn<ToolResearchRepository['expire']>();
    const handler = createToolResearchExpiryHandler({
      repository: repository({ expire }), secret: 'cron-value',
    });
    const response = await handler(new Request(endpoint));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'unauthorized' });
    expect(expire).not.toHaveBeenCalled();
  });

  it('physically expires records at the supplied current instant', async () => {
    const expire = vi.fn<ToolResearchRepository['expire']>(async () => 3);
    const now = new Date('2026-09-09T18:00:00.000Z');
    const handler = createToolResearchExpiryHandler({
      repository: repository({ expire }), secret: 'cron-value', now: () => now,
    });
    const response = await handler(new Request(endpoint, {
      headers: { Authorization: 'Bearer cron-value' },
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ state: 'expired', deletedCount: 3 });
    expect(expire).toHaveBeenCalledWith(now);
  });

  it('returns a redacted unavailable response for missing or failed storage', async () => {
    const missing = createToolResearchExpiryHandler({ repository: null, secret: 'cron-value' });
    expect((await missing(new Request(endpoint, { headers: { Authorization: 'Bearer cron-value' } }))).status).toBe(503);
    const failed = createToolResearchExpiryHandler({
      repository: repository({ expire: async () => { throw new Error('postgres://secret'); } }),
      secret: 'cron-value',
    });
    const response = await failed(new Request(endpoint, { headers: { Authorization: 'Bearer cron-value' } }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'storage_unavailable' });
  });

  it('runs daily through Vercel cron', () => {
    const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as {
      crons: readonly { path: string; schedule: string }[];
    };
    expect(config.crons).toContainEqual({
      path: '/api/internal/tool-research-expiry/', schedule: '43 0 * * *',
    });
  });

  it('checks current aggregates only after expiry and reports aggregation failures', async () => {
    const calls: string[] = [];
    const now = new Date('2026-09-10T00:43:00Z');
    const aggregate = vi.fn(async () => { calls.push('aggregate'); throw new Error('secret'); });
    const handler = createToolResearchExpiryHandler({
      repository: repository({ expire: async () => { calls.push('expire'); return 2; } }),
      secret: 'cron-value', now: () => now, aggregate,
    });
    expect((await handler(new Request(endpoint))).status).toBe(401);
    expect(aggregate).not.toHaveBeenCalled();
    const response = await handler(new Request(endpoint, { headers: { Authorization: 'Bearer cron-value' } }));
    expect(calls).toEqual(['expire', 'aggregate']);
    expect(aggregate).toHaveBeenCalledWith(now);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'storage_unavailable' });
  });
});
