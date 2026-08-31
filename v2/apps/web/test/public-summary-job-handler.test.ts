import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createPublicSummaryJobPostHandler,
  publicSummaryJobMethodNotAllowed,
  type PublicSummaryJobHandlerDependencies,
} from '../lib/public-market/job-handler.server';

const URL = 'https://signedprice-preview.vercel.app/api/internal/public-summary-job';
const REFERENCE = '2026-08-30T00:00:00.000Z';
const SECRET = 'server-only-secret-key';

function request(body: unknown, method = 'POST'): Request {
  return new Request(URL, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  });
}

function dependencies(
  overrides: Partial<PublicSummaryJobHandlerDependencies> = {},
): PublicSummaryJobHandlerDependencies {
  return {
    vercelEnv: 'preview',
    serviceKey: SECRET,
    async runBatch(input) {
      return {
        status: 'progress',
        nextCursor: input.cursor + 4,
        completedCoordinates: input.cursor + 4,
        totalCoordinates: 700,
      };
    },
    async finalize() {
      return {
        summary: {
          marketId: 'kr-seoul', area: 'seoul', parent: 'kr', deal: 'jeonse',
          band: '45-55sqm', period: '2026-01/2026-07', n: 5, published: true,
          min: 100_000_000, p25: 200_000_000, med: 300_000_000,
          p75: 400_000_000, max: 500_000_000, chg3m: null,
        },
        period: '2026-01/2026-07',
        generatedAt: REFERENCE,
        completedCoordinates: 700,
        eligibleRecords: 5,
        activeRecords: 4,
        unknownStatusRecords: 1,
        newContracts: 3,
        renewalContracts: 1,
        unknownContracts: 1,
      };
    },
    async buildArtifact(finalization) {
      return {
        artifact: {
          artifactVersion: 'signedprice-public-summary-v2',
          generatedAt: finalization.generatedAt,
          provenance: {
            marketId: 'kr-seoul',
            period: finalization.period,
            provider: 'MOLIT',
            endpointVersion: 'v1',
            parserVersion: 'kr-molit-rent-parser-v2',
            rightsPolicyId: 'kr-molit-rent-v1',
            sourceComplete: true,
          },
          summaries: [finalization.summary],
        },
        serialized: '{"artifactVersion":"signedprice-public-summary-v2"}',
        sha256: 'a'.repeat(64),
      };
    },
    ...overrides,
  };
}

async function expectProtected(response: Response): Promise<unknown> {
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  return response.json();
}

function expectNoLeak(value: unknown): void {
  expect(JSON.stringify(value)).not.toMatch(
    new RegExp(`${SECRET}|DATA_GO_KR_SERVICE_KEY|serviceKey|apis\\.data\\.go\\.kr|RTMSDataSvc|records|cache`, 'i'),
  );
}

describe('public summary Preview job handler', () => {
  it.each(['production', 'development', undefined])(
    'returns 404 outside Preview (%s)',
    async (vercelEnv) => {
      const response = await createPublicSummaryJobPostHandler(
        dependencies({ vercelEnv }),
      )(request({ action: 'batch', referenceInstant: REFERENCE, cursor: 0 }));
      expect(response.status).toBe(404);
      expectNoLeak(await expectProtected(response));
    },
  );

  it('returns categorical 503 when the server key is missing', async () => {
    const response = await createPublicSummaryJobPostHandler(
      dependencies({ serviceKey: undefined }),
    )(request({ action: 'batch', referenceInstant: REFERENCE, cursor: 0 }));
    expect(response.status).toBe(503);
    expect(await expectProtected(response)).toEqual({
      status: 'error',
      code: 'configuration_missing',
    });
  });

  it.each([
    { action: 'batch', referenceInstant: REFERENCE, cursor: 0, extra: true },
    { action: 'batch', referenceInstant: REFERENCE, cursor: -1 },
    { action: 'batch', referenceInstant: '2026-08-30', cursor: 0 },
    { action: 'finalize', referenceInstant: REFERENCE, cursor: 0 },
    { action: 'unknown', referenceInstant: REFERENCE },
  ])('returns 400 for non-exact input %#', async (body) => {
    const response = await createPublicSummaryJobPostHandler(dependencies())(request(body));
    expect(response.status).toBe(400);
    expectNoLeak(await expectProtected(response));
  });

  it('returns sanitized batch progress', async () => {
    const response = await createPublicSummaryJobPostHandler(dependencies())(
      request({ action: 'batch', referenceInstant: REFERENCE, cursor: 8 }),
    );
    expect(response.status).toBe(200);
    const body = await expectProtected(response);
    expect(body).toEqual({
      status: 'progress',
      nextCursor: 12,
      completedCoordinates: 12,
      totalCoordinates: 700,
    });
    expectNoLeak(body);
  });

  it('returns a sanitized retryable provider failure', async () => {
    const response = await createPublicSummaryJobPostHandler(dependencies({
      async runBatch() {
        return {
          status: 'retryable',
          nextCursor: 12,
          completedCoordinates: 12,
          totalCoordinates: 700,
          code: 'source_timeout',
        };
      },
    }))(request({ action: 'batch', referenceInstant: REFERENCE, cursor: 12 }));
    expect(response.status).toBe(503);
    const body = await expectProtected(response);
    expect(body).toMatchObject({ status: 'retryable', code: 'source_timeout' });
    expectNoLeak(body);
  });

  it('preserves a categorical parser diagnostic without exposing provider data', async () => {
    const response = await createPublicSummaryJobPostHandler(dependencies({
      async runBatch() {
        return {
          status: 'retryable',
          nextCursor: 84,
          completedCoordinates: 84,
          totalCoordinates: 700,
          code: 'source_malformed',
          diagnostic: 'provider_access_denied',
        };
      },
    }))(request({ action: 'batch', referenceInstant: REFERENCE, cursor: 84 }));

    expect(response.status).toBe(503);
    const body = await expectProtected(response);
    expect(body).toEqual({
      status: 'retryable',
      nextCursor: 84,
      completedCoordinates: 84,
      totalCoordinates: 700,
      code: 'source_malformed',
      diagnostic: 'provider_access_denied',
    });
    expectNoLeak(body);
  });

  it('returns only the aggregate artifact and operational report on finalization', async () => {
    const response = await createPublicSummaryJobPostHandler(dependencies())(
      request({ action: 'finalize', referenceInstant: REFERENCE }),
    );
    expect(response.status).toBe(200);
    const body = await expectProtected(response) as Record<string, unknown>;
    expect(body).toMatchObject({
      status: 'complete',
      artifact: { artifactVersion: 'signedprice-public-summary-v2' },
      sha256: 'a'.repeat(64),
      report: {
        period: '2026-01/2026-07',
        completedCoordinates: 700,
        eligibleRecords: 5,
      },
    });
    expect(JSON.stringify(body)).not.toMatch(
      new RegExp(`${SECRET}|DATA_GO_KR_SERVICE_KEY|serviceKey|apis\\.data\\.go\\.kr|RTMSDataSvc|sourceRecordId|cache`, 'i'),
    );
  });
});

describe('public summary unsupported methods', () => {
  it.each(['GET', 'HEAD', 'OPTIONS'])('returns 405 for %s', async (method) => {
    const response = publicSummaryJobMethodNotAllowed(request(undefined, method));
    expect(response.status).toBe(405);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    if (method === 'HEAD') await expect(response.text()).resolves.toBe('');
    else await expect(response.json()).resolves.toMatchObject({ code: 'method_not_allowed' });
  });
});
