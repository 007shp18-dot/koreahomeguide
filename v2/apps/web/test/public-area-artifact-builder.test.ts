import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  SEOUL_RENT_CHECK_DISTRICTS,
  type KoreaPublicAreaSummaryFinalization,
  type KoreaPublicAreaSummaryGroup,
} from '@signedprice/korea-rent';
import { buildPublicAreaSummaryArtifact } from '../lib/public-market/area-artifact-builder.server';
import { parsePublicAreaSummaryArtifact } from '../lib/public-market/area-summary-schema';

const period = '2026-01/2026-07';

type BuiltArtifactShape = Readonly<{
  artifactVersion: string;
  provenance: Readonly<Record<string, unknown>>;
  groups: Readonly<Record<'all' | 'new' | 'renewal', Readonly<{
    citySummary: Readonly<{ n: number }>;
    districtSummaries: readonly Readonly<Record<string, unknown>>[];
  }>>>;
  unknownContractCounts: Readonly<{ city: number; districts: readonly number[] }>;
}>;

function summary(
  area: string,
  parent: string,
  index: number,
  n: number,
  offset = 0,
) {
  const base = 100_000_000 + offset + index * 10_000_000;
  return {
    marketId: 'kr-seoul' as const,
    area,
    parent,
    deal: 'jeonse',
    band: '45-55sqm',
    period,
    n,
    published: true as const,
    min: base,
    p25: base + 10_000_000,
    med: base + 20_000_000,
    p75: base + 30_000_000,
    max: base + 40_000_000,
    chg3m: null,
  };
}

function group(n: number, offset: number): KoreaPublicAreaSummaryGroup {
  return {
    citySummary: summary('seoul', 'kr', 0, n * 25, offset),
    districtSummaries: SEOUL_RENT_CHECK_DISTRICTS.map((district, index) =>
      summary(district.slug, 'seoul', index, n, offset)),
  };
}

function finalization(): KoreaPublicAreaSummaryFinalization {
  return {
    groups: {
      all: group(11, 0),
      new: group(5, -20_000_000),
      renewal: group(5, 20_000_000),
    },
    unknownContractCounts: {
      city: 25,
      districts: Array.from({ length: 25 }, () => 1),
    },
    period,
    generatedAt: '2026-08-31T01:13:24.787Z',
    completedCoordinates: 700,
    eligibleRecords: 275,
  };
}

describe('public area summary artifact builder', () => {
  it('builds canonical validated v2 JSON and an independently reproducible digest', async () => {
    const built = await buildPublicAreaSummaryArtifact(finalization());
    const artifact = built.artifact as unknown as BuiltArtifactShape;

    expect(Object.keys(artifact)).toEqual([
      'artifactVersion',
      'generatedAt',
      'provenance',
      'groups',
      'unknownContractCounts',
    ]);
    expect(artifact.artifactVersion).toBe('signedprice-public-area-summary-v2');
    expect(artifact.provenance).toEqual({
      marketId: 'kr-seoul',
      period,
      provider: 'MOLIT',
      endpointVersion: 'v1',
      parserVersion: 'kr-molit-rent-parser-v2',
      rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true,
    });
    expect(Object.keys(artifact.groups)).toEqual(['all', 'new', 'renewal']);
    expect(artifact.groups.all.citySummary.n).toBe(275);
    expect(artifact.groups.new.citySummary.n).toBe(125);
    expect(artifact.groups.renewal.citySummary.n).toBe(125);
    expect(artifact.groups.all.districtSummaries).toHaveLength(25);
    expect(artifact.unknownContractCounts).toEqual({
      city: 25,
      districts: Array.from({ length: 25 }, () => 1),
    });
    expect(Object.isFrozen(built)).toBe(true);
    expect(Object.isFrozen(built.artifact)).toBe(true);
    expect(Object.isFrozen(artifact.provenance)).toBe(true);
    expect(Object.isFrozen(artifact.groups)).toBe(true);
    expect(Object.isFrozen(artifact.groups.all)).toBe(true);
    expect(Object.isFrozen(artifact.groups.all.citySummary)).toBe(true);
    expect(Object.isFrozen(artifact.groups.all.districtSummaries)).toBe(true);
    expect(artifact.groups.all.districtSummaries.every(Object.isFrozen)).toBe(true);
    expect(Object.isFrozen(artifact.unknownContractCounts)).toBe(true);
    expect(Object.isFrozen(artifact.unknownContractCounts.districts)).toBe(true);

    expect(parsePublicAreaSummaryArtifact(JSON.parse(built.serialized), {
      marketId: 'kr-seoul',
      period,
    }).groups.all.districtSummaries).toHaveLength(25);
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

  it.each([
    ['coordinate coverage', {
      ...finalization(),
      completedCoordinates: 699 as 700,
    }],
    ['eligible total', {
      ...finalization(),
      eligibleRecords: 274,
    }],
  ])('refuses incomplete %s before serialization', async (_name, value) => {
    await expect(buildPublicAreaSummaryArtifact(value))
      .rejects.toThrow('Public area summary finalization is incomplete.');
  });
});
