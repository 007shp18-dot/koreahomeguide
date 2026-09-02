import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createKoreaRentSnapshotJobHandler,
  createKoreaRentSnapshotPublicExportHandler,
  createKoreaRentSnapshotRunnerPage,
  createKoreaRentSnapshotRunnerToken,
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
      conversionRecords: [],
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
    buildConversionArtifact: vi.fn(async () => ({
      artifact: { artifactVersion: 1 },
      serialized: '{}',
      sha256: 'c'.repeat(64),
      eligiblePairCount: 240,
    })),
    ...overrides,
  };
}

describe('Korea rent snapshot internal job handler', () => {
  it('serves a secret-free Preview runner and stays absent in Production', async () => {
    const preview = createKoreaRentSnapshotRunnerPage('preview', token, {
      nowMs: () => 1_788_300_000_000,
      nonce: () => '0123456789abcdef0123456789abcdef',
    });
    const production = createKoreaRentSnapshotRunnerPage('production', token);
    const html = await preview.text();

    expect(preview.status).toBe(200);
    expect(html).toContain('data-korea-rent-snapshot-runner');
    expect(html).toContain('/api/internal/korea-rent-snapshot/');
    expect(html).toContain('Run 700-coordinate rent snapshot');
    expect(html).toContain('v1.1788321600.0123456789abcdef0123456789abcdef.');
    expect(html).not.toContain('Preview job token');
    expect(html).not.toContain(token);
    expect(html).not.toContain('provider-key');
    expect(production.status).toBe(404);
  });

  it('accepts only an unexpired runner delegation signed by the configured secret', async () => {
    const nowMs = 1_788_300_000_000;
    const delegated = createKoreaRentSnapshotRunnerToken(token, {
      nowMs: () => nowMs,
      nonce: () => 'abcdef0123456789abcdef0123456789',
    });
    const delegatedRequest = new Request(
      'https://preview.example/api/internal/korea-rent-snapshot/',
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${delegated}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ action: 'batch', referenceInstant, cursor: 0 }),
      },
    );

    expect((await createKoreaRentSnapshotJobHandler(dependencies({
      nowMs: () => nowMs,
    }) as never)(delegatedRequest.clone())).status).toBe(200);
    expect((await createKoreaRentSnapshotJobHandler(dependencies({
      token: 'different-preview-secret-with-enough-entropy',
      nowMs: () => nowMs,
    }) as never)(delegatedRequest.clone())).status).toBe(401);
    expect((await createKoreaRentSnapshotJobHandler(dependencies({
      nowMs: () => nowMs + (6 * 60 * 60 * 1_000) + 1_000,
    }) as never)(delegatedRequest)).status).toBe(401);
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

  it('returns all privacy-safe artifacts only after complete finalization', async () => {
    const deps = dependencies();
    const handler = createKoreaRentSnapshotJobHandler(deps as never);
    const response = await handler(request({ action: 'finalize', referenceInstant }));

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      status: 'ready',
      completedCoordinates: 700,
      period: '2026-01/2026-07',
      generatedAt: referenceInstant,
      artifacts: {
        rent: {
          dataset: 'kr-rent',
          sha256: 'a'.repeat(64),
          recordCount: 131,
          encoding: 'gzip+base64',
          compressedBytes: expect.any(Number),
          chunkCount: expect.any(Number),
        },
        buildingRegistry: {
          dataset: 'kr-building-registry',
          sha256: 'b'.repeat(64),
          recordCount: 1,
          encoding: 'gzip+base64',
          compressedBytes: expect.any(Number),
          chunkCount: expect.any(Number),
        },
        conversion: {
          dataset: 'kr-conversion',
          sha256: 'c'.repeat(64),
          recordCount: 240,
          encoding: 'gzip+base64',
          compressedBytes: expect.any(Number),
          chunkCount: expect.any(Number),
        },
      },
    });
    expect(JSON.stringify(payload)).not.toContain('artifactVersion');
    expect(JSON.stringify(payload)).not.toContain('"payload"');
    expect(deps.buildRentArtifact).toHaveBeenCalledOnce();
    expect(deps.buildInventoryArtifact).toHaveBeenCalledOnce();
    expect(deps.buildConversionArtifact).toHaveBeenCalledWith({
      records: [],
      period: '2026-01/2026-07',
      generatedAt: referenceInstant,
    });
  });

  it('returns one bounded encoded artifact chunk at a time', async () => {
    const handler = createKoreaRentSnapshotJobHandler(dependencies() as never);
    const response = await handler(request({
      action: 'artifact',
      referenceInstant,
      dataset: 'kr-rent',
      chunk: 0,
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      status: 'chunk',
      dataset: 'kr-rent',
      sha256: 'a'.repeat(64),
      recordCount: 131,
      encoding: 'gzip+base64',
      chunk: 0,
      chunkCount: 1,
      payload: expect.any(String),
    });
    expect(payload.payload.length).toBeLessThanOrEqual(512 * 1024);
  });

  it('publishes rent and buildings when conversion evidence misses its floor', async () => {
    const deps = dependencies({
      buildConversionArtifact: vi.fn(async () => {
        throw new TypeError(
          'Source data did not meet the publication floor for required conversion curves.',
        );
      }),
    });
    const handler = createKoreaRentSnapshotJobHandler(deps as never);
    const response = await handler(request({ action: 'finalize', referenceInstant }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: 'ready',
      artifacts: {
        rent: { dataset: 'kr-rent', sha256: 'a'.repeat(64), recordCount: 131 },
        buildingRegistry: {
          dataset: 'kr-building-registry',
          sha256: 'b'.repeat(64),
          recordCount: 1,
        },
        conversion: {
          dataset: 'kr-conversion',
          status: 'unavailable',
          code: 'publication_floor_not_met',
        },
      },
    });
    expect(deps.buildRentArtifact).toHaveBeenCalledOnce();
    expect(deps.buildInventoryArtifact).toHaveBeenCalledOnce();
  });

  it.each([
    ['buildRentArtifact', 'rent_artifact_unavailable'],
    ['buildInventoryArtifact', 'building_artifact_unavailable'],
    ['buildConversionArtifact', 'conversion_artifact_unavailable'],
  ] as const)('returns a safe diagnostic when %s fails', async (method, code) => {
    const handler = createKoreaRentSnapshotJobHandler(dependencies({
      [method]: vi.fn(async () => {
        throw new TypeError('invalid artifact');
      }),
    }) as never);
    const response = await handler(request({ action: 'finalize', referenceInstant }));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: 'error', code });
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

describe('Korea rent snapshot temporary public export', () => {
  function exportHandler(overrides: Record<string, unknown> = {}) {
    return createKoreaRentSnapshotPublicExportHandler({
      environment: 'production',
      token,
      referenceInstant,
      postHandler: vi.fn(async () => Response.json({ status: 'ready' })),
      ...overrides,
    });
  }

  it('exists in protected Preview and Production, but not local development', async () => {
    const url = 'https://www.signedprice.com/api/internal/korea-rent-snapshot/?export=manifest';

    expect((await exportHandler({ environment: 'preview' })(new Request(url))).status).toBe(200);
    expect((await exportHandler({ environment: 'development' })(new Request(url))).status)
      .toBe(404);
    expect((await exportHandler({ token: undefined })(new Request(url))).status).toBe(503);
  });

  it('accepts only exact read-only manifest and artifact requests', async () => {
    const invalidUrls = [
      'https://www.signedprice.com/api/internal/korea-rent-snapshot/',
      'https://www.signedprice.com/api/internal/korea-rent-snapshot/?export=batch',
      'https://www.signedprice.com/api/internal/korea-rent-snapshot/?export=artifact&dataset=kr-rent',
      'https://www.signedprice.com/api/internal/korea-rent-snapshot/?export=artifact&dataset=kr-sale&chunk=0',
      'https://www.signedprice.com/api/internal/korea-rent-snapshot/?export=artifact&dataset=kr-rent&chunk=-1',
    ];
    const handler = exportHandler();

    for (const url of invalidUrls) {
      expect((await handler(new Request(url))).status).toBe(400);
    }
    expect((await handler(new Request(invalidUrls[0]!, { method: 'POST' }))).status).toBe(405);
  });

  it('runs only an explicitly enabled fixed-plan collection cursor', async () => {
    const calls: Request[] = [];
    const postHandler = vi.fn(async (internalRequest: Request) => {
      calls.push(internalRequest);
      return Response.json({ status: 'progress', nextCursor: 12 });
    });
    const disabled = exportHandler({ postHandler });
    const enabled = exportHandler({ allowCollection: true, postHandler });
    const collectUrl = 'https://www.signedprice.com/api/internal/korea-rent-snapshot/'
      + '?export=collect&cursor=8';

    expect((await disabled(new Request(collectUrl))).status).toBe(400);
    expect((await enabled(new Request(collectUrl))).status).toBe(200);
    expect(await calls[0]!.json()).toEqual({
      action: 'batch', referenceInstant, cursor: 8,
    });
    for (const cursor of ['-1', '1', '700', '704']) {
      expect((await enabled(new Request(
        `https://www.signedprice.com/api/internal/korea-rent-snapshot/?export=collect&cursor=${cursor}`,
      ))).status).toBe(400);
    }
  });

  it('proxies a fixed manifest finalization without disclosing its bearer secret', async () => {
    const calls: Request[] = [];
    const handler = exportHandler({
      postHandler: vi.fn(async (internalRequest: Request) => {
        calls.push(internalRequest);
        return Response.json({ status: 'ready', period: '2026-02/2026-08' });
      }),
    });
    const response = await handler(new Request(
      'https://www.signedprice.com/api/internal/korea-rent-snapshot/?export=manifest',
    ));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ status: 'ready', period: '2026-02/2026-08' });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(calls).toHaveLength(1);
    expect(calls[0]!.method).toBe('POST');
    expect(calls[0]!.headers.get('authorization')).toBe(`Bearer ${token}`);
    expect(await calls[0]!.json()).toEqual({ action: 'finalize', referenceInstant });
    expect(JSON.stringify(payload)).not.toContain(token);
  });

  it('ignores only Vercel access query parameters added by the deployment fetcher', async () => {
    const postHandler = vi.fn(async (request: Request) => {
      void request;
      return Response.json({ status: 'ready' });
    });
    const handler = exportHandler({ postHandler });
    const response = await handler(new Request(
      'https://www.signedprice.com/api/internal/korea-rent-snapshot/'
      + '?export=manifest'
      + '&cursor=0'
      + '&x-vercel-protection-bypass=opaque'
      + '&x-vercel-set-bypass-cookie=true',
    ));

    expect(response.status).toBe(200);
    expect(postHandler).toHaveBeenCalledOnce();
  });

  it('proxies only an allowlisted artifact chunk at the fixed instant', async () => {
    const postHandler = vi.fn(async (request: Request) => {
      void request;
      return Response.json({
        status: 'chunk', dataset: 'kr-building-registry', chunk: 2, payload: 'safe',
      });
    });
    const handler = exportHandler({ postHandler });
    const response = await handler(new Request(
      'https://www.signedprice.com/api/internal/korea-rent-snapshot/?export=artifact&dataset=kr-building-registry&chunk=2',
    ));

    expect(response.status).toBe(200);
    const internalRequest = postHandler.mock.calls[0]![0] as Request;
    expect(await internalRequest.json()).toEqual({
      action: 'artifact',
      referenceInstant,
      dataset: 'kr-building-registry',
      chunk: 2,
    });
  });
});
