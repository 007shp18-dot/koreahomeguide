import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createPublicBuildingJobPostHandler } from '../lib/public-market/building-job-handler.server';

const url = 'https://signedprice-preview.vercel.app/api/internal/public-building-summary-job';
const referenceInstant = '2026-08-31T00:00:00.000Z';

function request(body: unknown, origin = 'https://signedprice-preview.vercel.app') {
  return new Request(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  });
}

function dependencies() {
  return {
    vercelEnv: 'preview', serviceKey: 'server-only-key',
    async runBatch() {
      return { status: 'progress' as const, nextCursor: 20, completedCoordinates: 20, totalCoordinates: 700 as const };
    },
    async finalize() {
      return {
        records: Array.from({ length: 412 }, () => ({ latitude: null })) as never,
        period: '2026-01/2026-07', generatedAt: '2026-08-31T01:00:00.000Z',
        completedCoordinates: 700 as const, eligibleRecords: 13_026, publishedBuildings: 412,
      };
    },
    async buildArtifact() { return { serialized: '{"artifactVersion":"v2"}', sha256: 'a'.repeat(64) }; },
  };
}

describe('temporary building summary Preview handler', () => {
  it('is absent outside Preview and rejects cross-origin posts', async () => {
    const hidden = await createPublicBuildingJobPostHandler({ ...dependencies(), vercelEnv: 'production' })(
      request({ action: 'batch', referenceInstant, cursor: 0 }),
    );
    expect(hidden.status).toBe(404);
    const crossOrigin = await createPublicBuildingJobPostHandler(dependencies())(
      request({ action: 'batch', referenceInstant, cursor: 0 }, 'https://attacker.example'),
    );
    expect(crossOrigin.status).toBe(403);
  });

  it('returns bounded progress and sanitized final metrics', async () => {
    const handler = createPublicBuildingJobPostHandler(dependencies());
    expect(await (await handler(request({ action: 'batch', referenceInstant, cursor: 0 }))).json())
      .toEqual({ status: 'progress', nextCursor: 20, completedCoordinates: 20, totalCoordinates: 700 });
    expect(await (await handler(request({ action: 'finalize', referenceInstant }))).json())
      .toEqual({
        status: 'complete', period: '2026-01/2026-07', generatedAt: '2026-08-31T01:00:00.000Z',
        completedCoordinates: 700, eligibleRecords: 13_026, buildingCount: 412,
        markerCount: 0, unresolvedGeocodeCount: 412,
        artifact: '{"artifactVersion":"v2"}', sha256: 'a'.repeat(64),
      });
  });
});
