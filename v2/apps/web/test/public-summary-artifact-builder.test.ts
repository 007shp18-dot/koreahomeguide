import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  buildPublicSummaryArtifact,
} from '../lib/public-market/artifact-builder.server';
import {
  PUBLIC_SUMMARY_ARTIFACT_VERSION,
  parsePublicSummaryArtifact,
} from '../lib/public-market/summary-schema';
import type { KoreaPublicSummaryFinalization } from '@signedprice/korea-rent';

const period = '2026-01/2026-07';

function finalization(): KoreaPublicSummaryFinalization {
  return {
    summary: {
      marketId: 'kr-seoul',
      area: 'seoul',
      parent: 'kr',
      deal: 'jeonse',
      band: '45-55sqm',
      period,
      n: 20,
      published: true,
      min: 100_000_000,
      p25: 200_000_000,
      med: 300_000_000,
      p75: 400_000_000,
      max: 500_000_000,
      chg3m: 10,
    },
    period,
    generatedAt: '2026-08-30T00:00:00.000Z',
    completedCoordinates: 700,
    eligibleRecords: 20,
    activeRecords: 18,
    unknownStatusRecords: 2,
    newContracts: 12,
    renewalContracts: 6,
    unknownContracts: 2,
  };
}

describe('public summary artifact builder', () => {
  it('builds canonical validated v2 JSON without private source material', async () => {
    expect(PUBLIC_SUMMARY_ARTIFACT_VERSION).toBe('signedprice-public-summary-v2');

    const built = await buildPublicSummaryArtifact(finalization());

    expect(built.artifact).toEqual({
      artifactVersion: 'signedprice-public-summary-v2',
      generatedAt: '2026-08-30T00:00:00.000Z',
      provenance: {
        marketId: 'kr-seoul',
        period,
        provider: 'MOLIT',
        endpointVersion: 'v1',
        parserVersion: 'kr-molit-rent-parser-v2',
        rightsPolicyId: 'kr-molit-rent-v1',
        sourceComplete: true,
      },
      summaries: [finalization().summary],
    });
    expect(Object.isFrozen(built)).toBe(true);
    expect(Object.isFrozen(built.artifact)).toBe(true);
    expect(Object.isFrozen(built.artifact.provenance)).toBe(true);
    expect(Object.isFrozen(built.artifact.summaries)).toBe(true);
    expect(Object.isFrozen((built.artifact.summaries as readonly object[])[0])).toBe(true);
    expect(built.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(parsePublicSummaryArtifact(JSON.parse(built.serialized), {
      artifactVersion: PUBLIC_SUMMARY_ARTIFACT_VERSION,
      marketId: 'kr-seoul',
      period,
    }).summaries).toEqual([finalization().summary]);
    expect(built.serialized).not.toMatch(
      /serviceKey|apis\.data\.go\.kr|sourceRecordId|cache key|evidenceRef/i,
    );
  });
});
