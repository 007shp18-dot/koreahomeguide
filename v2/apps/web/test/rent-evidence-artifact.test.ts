import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  buildKoreaRentEvidence,
  type KoreaRentRecord,
} from '@signedprice/korea-rent';

import { buildKoreaRentEvidenceArtifact } from '../lib/public-market/rent-evidence-artifact-builder.server';
import { parseKoreaRentEvidenceArtifact } from '../lib/public-market/rent-evidence-schema';

const COMPLETED_MONTHS = [
  '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07',
] as const;

function rentRecord(
  depositWon: number,
  monthlyRentWon: number,
  index: number,
): KoreaRentRecord {
  return {
    sourceHousingType: 'apartment',
    areaSqm: 45 + index,
    depositWon,
    monthlyRentWon,
    contractDate: `2026-07-${String(index + 1).padStart(2, '0')}`,
    contractType: index === 4 ? 'renewal' : 'new',
    recordStatus: 'active',
    legalDong: '대치동',
    buildingLabel: '검증아파트',
    sourceRecordId: `record-${depositWon}-${monthlyRentWon}-${index}`,
  };
}

function evidence() {
  return buildKoreaRentEvidence({
    period: '2026-01/2026-07',
    completedMonths: COMPLETED_MONTHS,
    generatedAt: '2026-08-01T00:00:00.000Z',
    records: [
      ...[100, 200, 300, 400, 500].map((value, index) => ({
        districtSlug: 'gangnam-gu' as const,
        record: rentRecord(value * 1_000_000, 0, index),
      })),
      ...[50, 60, 70, 80, 90].map((value, index) => ({
        districtSlug: 'gangnam-gu' as const,
        record: rentRecord((50 - index * 10) * 1_000_000, value * 10_000, index),
      })),
    ],
  });
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe('Korea rent evidence artifact boundary', () => {
  it('encodes and parses one strict digest-verified public projection', async () => {
    const built = await buildKoreaRentEvidenceArtifact(evidence());
    const parsed = parseKoreaRentEvidenceArtifact(built.artifact, {
      marketId: 'kr-seoul',
      period: '2026-01/2026-07',
    });

    expect(built.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(built.recordCount).toBe(131);
    expect(parsed).toMatchObject({
      marketId: 'kr-seoul',
      period: '2026-01/2026-07',
      publicationMinimum: 5,
    });
    expect(parsed.areaRecords).toHaveLength(130);
    expect(parsed.buildingRecords).toHaveLength(1);
    expect(parsed.stats.eligibleRecordCount).toBe(10);
    expect(JSON.stringify(built.artifact)).not.toMatch(
      /serviceKey|authorization|sourceRecordId|provider error|raw/i,
    );
  });

  it('accepts a complete decline to zero in filed monthly-rent deposits', async () => {
    const records = [
      ...Array.from({ length: 5 }, (_, index) => ({
        districtSlug: 'gangnam-gu' as const,
        record: {
          ...rentRecord(10_000_000, 700_000, index),
          contractDate: `2026-04-${String(index + 1).padStart(2, '0')}`,
        },
      })),
      ...Array.from({ length: 5 }, (_, index) => ({
        districtSlug: 'gangnam-gu' as const,
        record: {
          ...rentRecord(0, 700_000, index + 5),
          areaSqm: 45 + index,
          contractDate: `2026-07-${String(index + 1).padStart(2, '0')}`,
        },
      })),
    ];
    const built = await buildKoreaRentEvidenceArtifact(buildKoreaRentEvidence({
      period: '2026-01/2026-07',
      completedMonths: COMPLETED_MONTHS,
      generatedAt: '2026-08-01T00:00:00.000Z',
      records,
    }));
    const monthly = (built.artifact.areaRecords as Array<{
      areaId: string;
      cohorts: Array<{
        transaction: string;
        areaBand: string;
        contractGroup: string;
        filedDeposit: { chg3m?: number } | null;
      }>;
    }>).find(({ areaId }) => areaId === 'seoul:all')!.cohorts.find((cohort) => (
      cohort.transaction === 'monthly'
      && cohort.areaBand === 'all'
      && cohort.contractGroup === 'all'
    ));

    expect(monthly?.filedDeposit?.chg3m).toBe(-100);
  });

  it('rejects unknown keys, cross-period installation and digest tampering', async () => {
    const built = await buildKoreaRentEvidenceArtifact(evidence());
    const unknownRoot = { ...built.artifact, unexpected: true };
    expect(() => parseKoreaRentEvidenceArtifact(unknownRoot, {
      marketId: 'kr-seoul',
      period: '2026-01/2026-07',
    })).toThrow('Invalid Korea rent evidence artifact');
    expect(() => parseKoreaRentEvidenceArtifact(built.artifact, {
      marketId: 'kr-seoul',
      period: '2026-02/2026-08',
    })).toThrow('Invalid Korea rent evidence artifact');

    const tampered = clone(built.artifact) as Record<string, unknown>;
    const stats = tampered.stats as Record<string, number>;
    stats.eligibleRecordCount = (stats.eligibleRecordCount ?? 0) + 1;
    expect(() => parseKoreaRentEvidenceArtifact(tampered, {
      marketId: 'kr-seoul',
      period: '2026-01/2026-07',
    })).toThrow('Invalid Korea rent evidence artifact');
  });

  it('rejects transaction-specific distribution and recent-row mismatches', async () => {
    const built = await buildKoreaRentEvidenceArtifact(evidence());
    const monthlyMissingDeposit = clone(built.artifact) as Record<string, unknown>;
    const buildings = monthlyMissingDeposit.buildingRecords as Array<Record<string, unknown>>;
    const cohorts = buildings[0]!.cohorts as Array<Record<string, unknown>>;
    const monthly = cohorts.find(({ transaction }) => transaction === 'monthly')!;
    monthly.filedDeposit = null;
    expect(() => parseKoreaRentEvidenceArtifact(monthlyMissingDeposit, {
      marketId: 'kr-seoul',
      period: '2026-01/2026-07',
    })).toThrow('Invalid Korea rent evidence artifact');

    const mismatchedRecent = clone(built.artifact) as Record<string, unknown>;
    const mismatchBuildings = mismatchedRecent.buildingRecords as Array<Record<string, unknown>>;
    const recent = mismatchBuildings[0]!.recentTransactions as Array<Record<string, unknown>>;
    const jeonse = recent.find(({ transaction }) => transaction === 'jeonse')!;
    jeonse.monthlyRentWon = 1;
    expect(() => parseKoreaRentEvidenceArtifact(mismatchedRecent, {
      marketId: 'kr-seoul',
      period: '2026-01/2026-07',
    })).toThrow('Invalid Korea rent evidence artifact');
  });

  it('rejects count reconciliation drift even with a recomputed outer encoding', async () => {
    const built = await buildKoreaRentEvidenceArtifact(evidence());
    const drifted = clone(built.artifact) as Record<string, unknown>;
    const stats = drifted.stats as Record<string, number>;
    stats.monthlyRecordCount = (stats.monthlyRecordCount ?? 0) - 1;

    expect(() => parseKoreaRentEvidenceArtifact(drifted, {
      marketId: 'kr-seoul',
      period: '2026-01/2026-07',
    })).toThrow('Invalid Korea rent evidence artifact');
  });
});
