import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createKoreaSaleSnapshotJobHandler,
  createKoreaSaleSnapshotRunnerPage,
  createKoreaSaleSnapshotRunnerToken,
} from '../lib/public-market/korea-sale-job-handler.server';

const token = 'preview-sale-snapshot-token-with-enough-entropy';
const referenceInstant = '2026-08-30T00:00:00.000Z';

function request(body: unknown, init: RequestInit = {}): Request {
  return new Request('https://preview.example/api/internal/korea-sale-snapshot/', {
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
      period: '2026-01/2026-07',
      generatedAt: referenceInstant,
      completedCoordinates: 700 as const,
    })),
    buildSaleArtifact: vi.fn(async () => ({
      artifact: { artifactVersion: 'signedprice-korea-sale-evidence-v1' },
      serialized: '{}',
      sha256: 'c'.repeat(64),
      recordCount: 131,
    })),
    ...overrides,
  };
}

describe('Korea sale snapshot internal job handler', () => {
  it('serves a secret-free Preview runner and stays absent in Production', async () => {
    const preview = createKoreaSaleSnapshotRunnerPage('preview', token, {
      nowMs: () => 1_788_300_000_000,
      nonce: () => '0123456789abcdef0123456789abcdef',
    });
    const production = createKoreaSaleSnapshotRunnerPage('production', token);
    const html = await preview.text();
    expect(preview.status).toBe(200);
    expect(html).toContain('data-korea-sale-snapshot-runner');
    expect(html).toContain('/api/internal/korea-sale-snapshot/');
    expect(html).toContain('Run 700-coordinate sale snapshot');
    expect(html).toContain('v1.1788321600.0123456789abcdef0123456789abcdef.');
    expect(html).not.toContain('Preview job token');
    expect(html).not.toContain(token);
    expect(html).not.toContain('provider-key');
    expect(production.status).toBe(404);
  });

  it('accepts only an unexpired runner delegation signed by the configured secret', async () => {
    const nowMs = 1_788_300_000_000;
    const delegated = createKoreaSaleSnapshotRunnerToken(token, {
      nowMs: () => nowMs,
      nonce: () => 'abcdef0123456789abcdef0123456789',
    });
    const delegatedRequest = new Request(
      'https://preview.example/api/internal/korea-sale-snapshot/',
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${delegated}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ action: 'batch', referenceInstant, cursor: 0 }),
      },
    );

    expect((await createKoreaSaleSnapshotJobHandler(dependencies({
      nowMs: () => nowMs,
    }) as never)(delegatedRequest.clone())).status).toBe(200);
    expect((await createKoreaSaleSnapshotJobHandler(dependencies({
      token: 'different-preview-secret-with-enough-entropy',
      nowMs: () => nowMs,
    }) as never)(delegatedRequest.clone())).status).toBe(401);
    expect((await createKoreaSaleSnapshotJobHandler(dependencies({
      nowMs: () => nowMs + (6 * 60 * 60 * 1_000) + 1_000,
    }) as never)(delegatedRequest)).status).toBe(401);
  });

  it('requires Preview, POST, exact bearer authentication, and server configuration', async () => {
    const handler = createKoreaSaleSnapshotJobHandler(dependencies() as never);
    expect((await handler(new Request('https://preview.example', { method: 'GET' }))).status)
      .toBe(405);
    expect((await handler(request(
      { action: 'batch', referenceInstant, cursor: 0 },
      { headers: { authorization: 'Bearer wrong', 'content-type': 'application/json' } },
    ))).status).toBe(401);
    expect((await createKoreaSaleSnapshotJobHandler(dependencies({
      environment: 'production',
    }) as never)(request({ action: 'batch', referenceInstant, cursor: 0 }))).status).toBe(403);
    expect((await createKoreaSaleSnapshotJobHandler(dependencies({
      token: undefined,
    }) as never)(request({ action: 'batch', referenceInstant, cursor: 0 }))).status).toBe(503);
    expect((await createKoreaSaleSnapshotJobHandler(dependencies({
      serviceKey: undefined,
    }) as never)(request({ action: 'batch', referenceInstant, cursor: 0 }))).status).toBe(503);
  });

  it('validates the canonical resumable cursor and returns only safe progress', async () => {
    const deps = dependencies();
    const handler = createKoreaSaleSnapshotJobHandler(deps as never);
    expect((await handler(request({ action: 'batch', referenceInstant, cursor: 701 }))).status)
      .toBe(400);
    const response = await handler(request({ action: 'batch', referenceInstant, cursor: 0 }));
    const payload = await response.json();
    expect(payload).toEqual({
      status: 'progress', nextCursor: 4, completedCoordinates: 4, totalCoordinates: 700,
    });
    expect(JSON.stringify(payload)).not.toMatch(/provider-key|preview-sale|serviceKey/i);
    expect(deps.runBatch).toHaveBeenCalledWith({ referenceInstant, cursor: 0 });
  });

  it('returns the privacy-safe sale artifact only after complete finalization', async () => {
    const deps = dependencies();
    const handler = createKoreaSaleSnapshotJobHandler(deps as never);
    const response = await handler(request({ action: 'finalize', referenceInstant }));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      status: 'ready',
      completedCoordinates: 700,
      period: '2026-01/2026-07',
      generatedAt: referenceInstant,
      artifacts: {
        sale: {
          dataset: 'kr-sale',
          sha256: 'c'.repeat(64),
          recordCount: 131,
          encoding: 'gzip+base64',
          compressedBytes: expect.any(Number),
          chunkCount: expect.any(Number),
        },
      },
    });
    expect(JSON.stringify(payload)).not.toContain('artifactVersion');
    expect(JSON.stringify(payload)).not.toContain('"payload"');
    expect(deps.buildSaleArtifact).toHaveBeenCalledOnce();
  });

  it('returns the sale artifact in bounded encoded chunks', async () => {
    const handler = createKoreaSaleSnapshotJobHandler(dependencies() as never);
    const response = await handler(request({
      action: 'artifact',
      referenceInstant,
      dataset: 'kr-sale',
      chunk: 0,
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      status: 'chunk',
      dataset: 'kr-sale',
      sha256: 'c'.repeat(64),
      recordCount: 131,
      encoding: 'gzip+base64',
      chunk: 0,
      chunkCount: 1,
      payload: expect.any(String),
    });
    expect(payload.payload.length).toBeLessThanOrEqual(512 * 1024);
  });

  it('maps incomplete source coverage to conflict without leaking its internal reason', async () => {
    const handler = createKoreaSaleSnapshotJobHandler(dependencies({
      finalize: vi.fn(async () => {
        throw new TypeError('Sale summary source coverage is incomplete.');
      }),
    }) as never);
    const response = await handler(request({ action: 'finalize', referenceInstant }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      status: 'error', code: 'source_coverage_incomplete',
    });
  });
});
