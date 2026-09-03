import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createObservedBuildingJobHandler,
  createObservedBuildingRunnerPage,
} from '../lib/public-market/observed-building-job-handler.server';

const token = 'preview-secret-token-with-enough-entropy';
const referenceInstant = '2026-08-30T00:00:00.000Z';

function request(body: unknown, init: RequestInit = {}): Request {
  return new Request('https://preview.example/api/internal/observed-building-inventory', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
    ...init,
  });
}

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    environment: 'preview',
    token,
    serviceKey: 'provider-key',
    runBatch: vi.fn(async () => ({
      status: 'progress' as const,
      nextCursor: 4,
      completedCoordinates: 4,
      totalCoordinates: 700 as const,
    })),
    finalize: vi.fn(async () => ({
      inventory: { marketId: 'kr-seoul', period: '2026-01/2026-07' },
      period: '2026-01/2026-07',
      generatedAt: referenceInstant,
      completedCoordinates: 700 as const,
    })),
    buildArtifact: vi.fn(async () => ({
      artifact: { artifactVersion: 'signedprice-observed-building-inventory-v1' },
      serialized: '{}',
      sha256: 'a'.repeat(64),
    })),
    ...overrides,
  };
}

describe('observed building internal job handler', () => {
  it('serves a secret-free runner in Preview and stays absent in Production', async () => {
    const preview = createObservedBuildingRunnerPage('preview');
    const production = createObservedBuildingRunnerPage('production');
    const html = await preview.text();

    expect(preview.status).toBe(200);
    expect(preview.headers.get('content-type')).toContain('text/html');
    expect(html).toContain('data-observed-building-runner');
    expect(html).toContain('/api/internal/observed-building-inventory/');
    expect(html).toContain("method: 'POST'");
    expect(html).toContain("type=\"password\"");
    expect(html).not.toContain(token);
    expect(html).not.toContain('provider-key');
    expect(production.status).toBe(404);
  });

  it('allows POST only and requires exact bearer authentication', async () => {
    const handler = createObservedBuildingJobHandler(dependencies() as never);
    const get = await handler(new Request('https://preview.example', { method: 'GET' }));
    const unauthorized = await handler(request(
      { action: 'batch', referenceInstant, cursor: 0 },
      { headers: { authorization: 'Bearer wrong', 'content-type': 'application/json' } },
    ));

    expect(get.status).toBe(405);
    expect(get.headers.get('allow')).toBe('POST');
    expect(unauthorized.status).toBe(401);
    expect(await unauthorized.text()).not.toContain(token);
  });

  it('refuses production and a missing server configuration', async () => {
    const production = createObservedBuildingJobHandler(dependencies({ environment: 'production' }) as never);
    const productionWithoutToken = createObservedBuildingJobHandler(dependencies({
      environment: 'production', token: undefined,
    }) as never);
    const unconfigured = createObservedBuildingJobHandler(dependencies({ token: undefined }) as never);

    expect((await production(request({ action: 'batch', referenceInstant, cursor: 0 }))).status)
      .toBe(403);
    expect((await productionWithoutToken(new Request('https://production.example', {
      method: 'POST', body: '{}',
    }))).status).toBe(403);
    expect((await unconfigured(request({ action: 'batch', referenceInstant, cursor: 0 }))).status)
      .toBe(503);
  });

  it('validates the canonical batch cursor and returns only safe progress', async () => {
    const deps = dependencies();
    const handler = createObservedBuildingJobHandler(deps as never);
    const invalid = await handler(request({ action: 'batch', referenceInstant, cursor: 1.5 }));
    const response = await handler(request({ action: 'batch', referenceInstant, cursor: 0 }));

    expect(invalid.status).toBe(400);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual({
      status: 'progress', nextCursor: 4, completedCoordinates: 4, totalCoordinates: 700,
    });
    expect(JSON.stringify(payload)).not.toMatch(
      /provider-key|preview-secret|serviceKey/i,
    );
    expect(deps.runBatch).toHaveBeenCalledWith({ referenceInstant, cursor: 0 });
  });

  it('refuses a batch when the source key is absent', async () => {
    const handler = createObservedBuildingJobHandler(dependencies({ serviceKey: undefined }) as never);
    const response = await handler(request({ action: 'batch', referenceInstant, cursor: 0 }));

    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('provider-key');
  });

  it('maps incomplete finalization to conflict and returns a signed privacy-safe artifact', async () => {
    const incomplete = createObservedBuildingJobHandler(dependencies({
      finalize: vi.fn(async () => { throw new TypeError('Public summary source coverage is incomplete.'); }),
    }) as never);
    expect((await incomplete(request({ action: 'finalize', referenceInstant }))).status).toBe(409);

    const deps = dependencies();
    const ready = createObservedBuildingJobHandler(deps as never);
    const response = await ready(request({ action: 'finalize', referenceInstant }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: 'ready',
      completedCoordinates: 700,
      period: '2026-01/2026-07',
      generatedAt: referenceInstant,
      sha256: 'a'.repeat(64),
      artifact: { artifactVersion: 'signedprice-observed-building-inventory-v1' },
    });
    expect(deps.buildArtifact).toHaveBeenCalledOnce();
  });
});
