import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import type {
  KoreaPublicAreaSummaryFinalization,
} from '@signedprice/korea-rent';
import {
  createPublicAreaSummaryJobPostHandler,
  publicAreaSummaryJobMethodNotAllowed,
  type PublicAreaSummaryJobHandlerDependencies,
} from '../lib/public-market/area-job-handler.server';
import {
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaFixture,
} from './public-area-fixture';

const URL = 'https://signedprice-preview.vercel.app/api/internal/public-area-summary-job';
const REFERENCE = '2026-08-31T00:00:00.000Z';
const SECRET = 'server-only-secret-key';

function request(
  body: unknown,
  options: Readonly<{ method?: string; contentType?: string }> = {},
): Request {
  const method = options.method ?? 'POST';
  return new Request(URL, {
    method,
    headers: { 'Content-Type': options.contentType ?? 'application/json' },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  });
}

function finalization(): KoreaPublicAreaSummaryFinalization {
  const fixture = createPublicAreaFixture();
  return {
    citySummary: fixture.citySummary,
    districtSummaries: fixture.districtSummaries,
    period: PUBLIC_AREA_FIXTURE_PERIOD,
    generatedAt: REFERENCE,
    completedCoordinates: 700,
    eligibleRecords: fixture.citySummary.n,
  };
}

function dependencies(
  overrides: Partial<PublicAreaSummaryJobHandlerDependencies> = {},
): PublicAreaSummaryJobHandlerDependencies {
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
      return finalization();
    },
    async buildArtifact() {
      return {
        artifact: createPublicAreaFixture(),
        serialized: '{"artifactVersion":"signedprice-public-area-summary-v1"}',
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
  expect(JSON.stringify(value)).not.toMatch(new RegExp(
    `${SECRET}|DATA_GO_KR_SERVICE_KEY|serviceKey|apis\\.data\\.go\\.kr|RTMSDataSvc|sourceRecordId|cache key|raw xml`,
    'i',
  ));
}

describe('public area summary Preview job handler', () => {
  it.each(['production', 'development', undefined])(
    'returns a protected 404 outside Preview (%s)',
    async (vercelEnv) => {
      const response = await createPublicAreaSummaryJobPostHandler(
        dependencies({ vercelEnv }),
      )(request({ action: 'batch', referenceInstant: REFERENCE, cursor: 0 }));
      expect(response.status).toBe(404);
      expect(await expectProtected(response)).toEqual({
        status: 'error', code: 'not_found',
      });
    },
  );

  it.each([undefined, '', '   '])(
    'returns categorical 503 for a missing server key (%s)',
    async (serviceKey) => {
      const response = await createPublicAreaSummaryJobPostHandler(
        dependencies({ serviceKey }),
      )(request({ action: 'batch', referenceInstant: REFERENCE, cursor: 0 }));
      expect(response.status).toBe(503);
      expect(await expectProtected(response)).toEqual({
        status: 'error', code: 'configuration_missing',
      });
    },
  );

  it('refuses a non-JSON media type before reading the body', async () => {
    const response = await createPublicAreaSummaryJobPostHandler(dependencies())(
      request({ action: 'batch' }, { contentType: 'text/plain' }),
    );
    expect(response.status).toBe(415);
    expect(await expectProtected(response)).toEqual({
      status: 'error', code: 'unsupported_media_type',
    });
  });

  it('returns the same invalid-request envelope for malformed JSON', async () => {
    const malformed = new Request(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: '{',
    });
    const response = await createPublicAreaSummaryJobPostHandler(dependencies())(malformed);
    expect(response.status).toBe(400);
    expect(await expectProtected(response)).toEqual({
      status: 'error', code: 'invalid_request',
    });
  });

  it.each([
    { action: 'batch', referenceInstant: REFERENCE, cursor: 0, extra: true },
    { action: 'batch', referenceInstant: REFERENCE, cursor: -1 },
    { action: 'batch', referenceInstant: REFERENCE, cursor: 701 },
    { action: 'batch', referenceInstant: '2026-08-31', cursor: 0 },
    { action: 'finalize', referenceInstant: REFERENCE, cursor: 0 },
    { action: 'unknown', referenceInstant: REFERENCE },
  ])('returns 400 for non-exact input %#', async (body) => {
    const response = await createPublicAreaSummaryJobPostHandler(dependencies())(request(body));
    expect(response.status).toBe(400);
    expect(await expectProtected(response)).toEqual({
      status: 'error', code: 'invalid_request',
    });
  });

  it('returns only sanitized batch progress', async () => {
    const response = await createPublicAreaSummaryJobPostHandler(dependencies())(
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

  it.each([
    ['provider failure', 'retryable', 'source_timeout', 503],
    ['rights refusal', 'blocked', 'rights_blocked', 403],
  ] as const)('returns an exact categorical %s envelope', async (
    _label,
    status,
    code,
    expectedStatus,
  ) => {
    const response = await createPublicAreaSummaryJobPostHandler(dependencies({
      async runBatch() {
        return {
          status,
          nextCursor: 12,
          completedCoordinates: 12,
          totalCoordinates: 700,
          code,
          ...(status === 'retryable'
            ? { diagnostic: 'provider_access_denied' as const }
            : {}),
        };
      },
    }))(request({ action: 'batch', referenceInstant: REFERENCE, cursor: 12 }));

    expect(response.status).toBe(expectedStatus);
    const body = await expectProtected(response);
    expect(body).toEqual({
      status,
      nextCursor: 12,
      completedCoordinates: 12,
      totalCoordinates: 700,
      code,
    });
    expectNoLeak(body);
  });

  it('returns only canonical aggregate artifact text, digest, and count equality', async () => {
    const response = await createPublicAreaSummaryJobPostHandler(dependencies())(
      request({ action: 'finalize', referenceInstant: REFERENCE }),
    );
    expect(response.status).toBe(200);
    const body = await expectProtected(response);
    expect(body).toEqual({
      status: 'complete',
      period: PUBLIC_AREA_FIXTURE_PERIOD,
      generatedAt: REFERENCE,
      completedCoordinates: 700,
      cityN: 125,
      districtCount: 25,
      districtNSum: 125,
      artifact: '{"artifactVersion":"signedprice-public-area-summary-v1"}',
      sha256: 'a'.repeat(64),
    });
    expectNoLeak(body);
  });

  it('converts inconsistent finalization into one sanitized internal error', async () => {
    const response = await createPublicAreaSummaryJobPostHandler(dependencies({
      async finalize() {
        return { ...finalization(), completedCoordinates: 699 as 700 };
      },
    }))(request({ action: 'finalize', referenceInstant: REFERENCE }));
    expect(response.status).toBe(500);
    expect(await expectProtected(response)).toEqual({
      status: 'error', code: 'internal_error',
    });
  });
});

describe('public area summary unsupported methods', () => {
  it.each(['GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'])(
    'returns protected 405 for %s',
    async (method) => {
      const response = publicAreaSummaryJobMethodNotAllowed(
        request(undefined, { method }),
      );
      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('POST');
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
      if (method === 'HEAD') await expect(response.text()).resolves.toBe('');
      else await expect(response.json()).resolves.toEqual({
        status: 'error', code: 'method_not_allowed',
      });
    },
  );
});
