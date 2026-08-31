import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import type { KoreaPublicAreaSummaryFinalization } from '@signedprice/korea-rent';
import {
  createPublicAreaSummaryJobPostHandler,
  type PublicAreaSummaryJobHandlerDependencies,
} from '../lib/public-market/area-job-handler.server';
import {
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaV2Fixture,
} from './public-area-fixture';

const URL = 'https://signedprice-preview.vercel.app/api/internal/public-area-summary-job';
const REFERENCE = '2026-08-31T00:00:00.000Z';

function request(body: unknown): Request {
  return new Request(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function finalization(): KoreaPublicAreaSummaryFinalization {
  const fixture = createPublicAreaV2Fixture();
  return {
    groups: fixture.groups,
    unknownContractCounts: fixture.unknownContractCounts,
    period: PUBLIC_AREA_FIXTURE_PERIOD,
    generatedAt: fixture.generatedAt,
    completedCoordinates: 700,
    eligibleRecords: fixture.groups.all.citySummary.n,
  };
}

function dependencies(
  overrides: Partial<PublicAreaSummaryJobHandlerDependencies> = {},
): PublicAreaSummaryJobHandlerDependencies {
  return {
    vercelEnv: 'preview',
    serviceKey: 'server-only-test-key',
    async runBatch(input) {
      return {
        status: 'progress',
        nextCursor: Math.min(700, input.cursor + 20),
        completedCoordinates: Math.min(700, input.cursor + 20),
        totalCoordinates: 700,
      };
    },
    async finalize() {
      return finalization();
    },
    async buildArtifact() {
      return {
        serialized: '{"artifactVersion":"signedprice-public-area-summary-v2"}',
        sha256: 'a'.repeat(64),
      };
    },
    ...overrides,
  };
}

describe('temporary grouped area-summary Preview handler', () => {
  it('is absent outside Preview and keeps every response private', async () => {
    const response = await createPublicAreaSummaryJobPostHandler(
      dependencies({ vercelEnv: 'production' }),
    )(request({ action: 'batch', referenceInstant: REFERENCE, cursor: 0 }));

    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    await expect(response.json()).resolves.toEqual({ status: 'error', code: 'not_found' });
  });

  it('returns only bounded batch progress', async () => {
    const response = await createPublicAreaSummaryJobPostHandler(dependencies())(
      request({ action: 'batch', referenceInstant: REFERENCE, cursor: 680 }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 'progress',
      nextCursor: 700,
      completedCoordinates: 700,
      totalCoordinates: 700,
    });
  });

  it('returns a reconciled v2 artifact and split totals', async () => {
    const response = await createPublicAreaSummaryJobPostHandler(dependencies())(
      request({ action: 'finalize', referenceInstant: REFERENCE }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 'complete',
      period: PUBLIC_AREA_FIXTURE_PERIOD,
      generatedAt: '2026-08-31T01:13:24.787Z',
      completedCoordinates: 700,
      cityN: 275,
      newCityN: 125,
      renewalCityN: 125,
      unknownCityN: 25,
      districtCount: 25,
      districtNSum: 275,
      artifact: '{"artifactVersion":"signedprice-public-area-summary-v2"}',
      sha256: 'a'.repeat(64),
    });
  });

  it('fails closed when split counts do not reconcile', async () => {
    const response = await createPublicAreaSummaryJobPostHandler(dependencies({
      async finalize() {
        const value = finalization();
        return {
          ...value,
          unknownContractCounts: {
            ...value.unknownContractCounts,
            city: value.unknownContractCounts.city + 1,
          },
        };
      },
    }))(request({ action: 'finalize', referenceInstant: REFERENCE }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ status: 'error', code: 'internal_error' });
  });
});
