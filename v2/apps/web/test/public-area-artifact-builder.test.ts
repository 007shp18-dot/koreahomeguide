import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  SEOUL_RENT_CHECK_DISTRICTS,
  type KoreaPublicAreaSummaryFinalization,
} from '@signedprice/korea-rent';
import { buildPublicAreaSummaryArtifact } from '../lib/public-market/area-artifact-builder.server';
import { parsePublicAreaSummaryArtifact } from '../lib/public-market/area-summary-schema';

const period = '2026-01/2026-07';

type BuiltArtifactShape = Readonly<{
  artifactVersion: string;
  provenance: Readonly<Record<string, unknown>>;
  citySummary: Readonly<{ n: number }>;
  districtSummaries: readonly Readonly<Record<string, unknown>>[];
}>;

function summary(area: string, parent: string, index = 0) {
  const base = 100_000_000 + index * 10_000_000;
  return {
    marketId: 'kr-seoul' as const,
    area,
    parent,
    deal: 'jeonse',
    band: '45-55sqm',
    period,
    n: 5,
    published: true as const,
    min: base,
    p25: base + 10_000_000,
    med: base + 20_000_000,
    p75: base + 30_000_000,
    max: base + 40_000_000,
    chg3m: null,
  };
}

function finalization(): KoreaPublicAreaSummaryFinalization {
  return {
    citySummary: { ...summary('seoul', 'kr'), n: 125 },
    districtSummaries: SEOUL_RENT_CHECK_DISTRICTS.map((district, index) =>
      summary(district.slug, 'seoul', index)),
    period,
    generatedAt: '2026-08-31T01:13:24.787Z',
    completedCoordinates: 700,
    eligibleRecords: 125,
  };
}

describe('public area summary artifact builder', () => {
  it('builds canonical validated v1 JSON and an independently reproducible digest', async () => {
    const built = await buildPublicAreaSummaryArtifact(finalization());
    const artifact = built.artifact as unknown as BuiltArtifactShape;

    expect(Object.keys(artifact)).toEqual([
      'artifactVersion',
      'generatedAt',
      'provenance',
      'citySummary',
      'districtSummaries',
    ]);
    expect(artifact.artifactVersion).toBe('signedprice-public-area-summary-v1');
    expect(artifact.provenance).toEqual({
      marketId: 'kr-seoul',
      period,
      provider: 'MOLIT',
      endpointVersion: 'v1',
      parserVersion: 'kr-molit-rent-parser-v2',
      rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true,
    });
    expect(artifact.citySummary.n).toBe(125);
    expect(artifact.districtSummaries).toHaveLength(25);
    expect(Object.isFrozen(built)).toBe(true);
    expect(Object.isFrozen(built.artifact)).toBe(true);
    expect(Object.isFrozen(artifact.provenance)).toBe(true);
    expect(Object.isFrozen(artifact.citySummary)).toBe(true);
    expect(Object.isFrozen(artifact.districtSummaries)).toBe(true);
    expect(artifact.districtSummaries.every(Object.isFrozen)).toBe(true);

    expect(parsePublicAreaSummaryArtifact(JSON.parse(built.serialized), {
      marketId: 'kr-seoul',
      period,
    }).districtSummaries).toHaveLength(25);
    expect(built.sha256).toBe(
      createHash('sha256').update(built.serialized).digest('hex'),
    );
    expect(built.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(built.serialized).not.toMatch(
      /serviceKey|apis\.data\.go\.kr|sourceRecordId|cache key|evidenceRef|building|raw xml/i,
    );

    const repeated = await buildPublicAreaSummaryArtifact(finalization());
    expect(repeated.serialized).toBe(built.serialized);
    expect(repeated.sha256).toBe(built.sha256);
  });

  it('refuses incomplete finalization before serialization', async () => {
    await expect(buildPublicAreaSummaryArtifact({
      ...finalization(),
      completedCoordinates: 699 as 700,
    })).rejects.toThrow('Public area summary finalization is incomplete.');
  });
});
