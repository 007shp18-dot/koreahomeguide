import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createKoreaRentSnapshotJobHandler,
  createKoreaRentSnapshotRunnerPage,
} from '../lib/public-market/korea-rent-job-handler.server';

const token = 'preview-rent-snapshot-token-with-enough-entropy';
const referenceInstant = '2026-08-30T00:00:00.000Z';

function request(body: unknown, init: RequestInit = {}): Request {
  return new Request('https://preview.example/api/internal/korea-rent-snapshot/', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
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
      evidence: {
        marketId: 'kr-seoul',
        period: '2026-01/2026-07',
        generatedAt: referenceInstant,
        areaRecords: Array.from({ length: 130 }, () => ({})),
        buildingRecords: [{}],
      },
      inventory: {
        marketId: 'kr-seoul',
        period: '2026-01/2026-07',
        records: [{}],
      },
      period: '2026-01/2026-07',
      generatedAt: referenceInstant,
      completedCoordinates: 700 as const,
    })),
    buildRentArtifact: vi.fn(async () => ({
      artifact: { artifactVersion: 'signedprice-korea-rent-evidence-v1' },
      serialized: '{}',
      sha256: 'a'.repeat(64),
      recordCount: 131,
    })),
    buildInventoryArtifact: vi.fn(async () => ({
      artifact: { artifactVersion: 'signedprice-observed-building-inventory-v1' },
      serialized: '{}',
      sha256: 'b'.repeat(64),
    })),
    ...overrides,
  };
}

describe('Korea rent snapshot internal job handler', () => {
  it('serves a secret-free Preview runner and stays absent in Production', async () => {
    const preview = createKoreaRentSnapshotRunnerPage('preview');
    const production = createKoreaRentSnapshotRunnerPage('production');
    const html = await preview.text();

    expect(preview.status).toBe(200);
    expect(html).toContain('data-korea-rent-snapshot-runner');
    expect(html).toContain('/api/internal/korea-rent-snapshot/');
    expect(html).toContain('Run 700-coordinate rent snapshot');
    expect(html).not.toContain(token);
    expect(html).not.toContain('provider-key');
    expect(production.status).toBe(404);
  });

  it('requires Preview, POST, exact bearer authentication and server configuration', async () => {
    const handler = createKoreaRentSnapshotJobHandler(dependencies() as never);
    expect((await handler(new Request('https://preview.example', { method: 'GET' }))).status)
      .toBe(405);
    expect((await handler(request(
      { action: 'batch', referenceInstant, cursor: 0 },
      { headers: { authorization: 'Bearer wrong', 'content-type': 'application/json' } },
    ))).status).toBe(401);
    expect((await createKoreaRentSnapshotJobHandler(dependencies({
      environment: 'production',
    }) as never)(request({ action: 'batch', referenceInstant, cursor: 0 }))).status).toBe(403);
    expect((await createKoreaRentSnapshotJobHandler(dependencies({
      token: undefined,
    }) as never)(request({ action: 'batch', referenceInstant, cursor: 0 }))).status).toBe(503);
    expect((await createKoreaRentSnapshotJobHandler(dependencies({
      serviceKey: undefined,
    }) as never)(request({ action: 'batch', referenceInstant, cursor: 0 }))).status).toBe(503);
  });

  it('validates the canonical resumable cursor and returns safe progress only', async () => {
    const deps = dependencies();
    const handler = createKoreaRentSnapshotJobHandler(deps as never);
    expect((await handler(request({ action: 'batch', referenceInstant, cursor: -1 }))).status)
      .toBe(400);
    const response = await handler(request({ action: 'batch', referenceInstant, cursor: 0 }));
    const payload = await response.json();

    expect(payload).toEqual({
      status: 'progress',
      nextCursor: 4,
      completedCoordinates: 4,
      totalCoordinates: 700,
    });
    expect(JSON.stringify(payload)).not.toMatch(/provider-key|preview-rent|serviceKey/i);
    expect(deps.runBatch).toHaveBeenCalledWith({ referenceInstant, cursor: 0 });
  });

  it('returns both privacy-safe artifacts only after complete finalization', async () => {
    const deps = dependencies();
    const handler = createKoreaRentSnapshotJobHandler(deps as never);
    const response = await handler(request({ action: 'finalize', referenceInstant }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: 'ready',
      completedCoordinates: 700,
      period: '2026-01/2026-07',
      generatedAt: referenceInstant,
      artifacts: {
        rent: {
          dataset: 'kr-rent',
          sha256: 'a'.repeat(64),
          recordCount: 131,
          artifact: { artifactVersion: 'signedprice-korea-rent-evidence-v1' },
        },
        buildingRegistry: {
          dataset: 'kr-building-registry',
          sha256: 'b'.repeat(64),
          recordCount: 1,
          artifact: { artifactVersion: 'signedprice-observed-building-inventory-v1' },
        },
      },
    });
    expect(deps.buildRentArtifact).toHaveBeenCalledOnce();
    expect(deps.buildInventoryArtifact).toHaveBeenCalledOnce();
  });

  it('maps incomplete coverage to conflict without leaking an internal reason', async () => {
    const handler = createKoreaRentSnapshotJobHandler(dependencies({
      finalize: vi.fn(async () => {
        throw new TypeError('Public summary source coverage is incomplete.');
      }),
    }) as never);
    const response = await handler(request({ action: 'finalize', referenceInstant }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      status: 'error',
      code: 'source_coverage_incomplete',
    });
  });
});
