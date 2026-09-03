import { createHash } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  buildKoreaSaleEvidence,
  type KoreaSaleRecord,
} from '@signedprice/korea-rent';

import { buildKoreaSaleEvidenceArtifact } from '../lib/public-market/sale-evidence-artifact-builder.server';
import { parseKoreaSaleEvidenceArtifact } from '../lib/public-market/sale-evidence-schema';

const COMPLETED_MONTHS = [
  '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07',
] as const;

function saleRecord(priceWon: number, index: number): KoreaSaleRecord {
  return {
    sourceHousingType: 'apartment',
    areaSqm: 45 + index,
    priceWon,
    contractDate: `2026-07-${String(index + 1).padStart(2, '0')}`,
    recordStatus: 'active',
    legalDong: '대치동',
    buildingLabel: '검증아파트',
    sourceRecordId: `sale-${index}`,
    floor: index + 1,
    buildYear: 2020,
  };
}

function evidence() {
  return buildKoreaSaleEvidence({
    period: '2026-01/2026-07',
    completedMonths: COMPLETED_MONTHS,
    generatedAt: '2026-08-01T00:00:00.000Z',
    records: [100, 200, 300, 400, 500].map((value, index) => ({
      districtSlug: 'gangnam-gu' as const,
      record: saleRecord(value * 1_000_000, index),
    })),
  });
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) =>
    `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(',')}}`;
}

function resign(artifact: Record<string, unknown>): void {
  const unsigned = { ...artifact };
  delete unsigned.sha256;
  artifact.sha256 = createHash('sha256').update(canonicalJson(unsigned)).digest('hex');
}

describe('Korea sale evidence artifact boundary', () => {
  it('encodes and parses a strict digest-verified public sale projection', async () => {
    const built = await buildKoreaSaleEvidenceArtifact(evidence());
    const parsed = parseKoreaSaleEvidenceArtifact(built.artifact, {
      marketId: 'kr-seoul',
      period: '2026-01/2026-07',
    });
    expect(built.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(built.recordCount).toBe(131);
    expect(parsed).toMatchObject({
      marketId: 'kr-seoul', period: '2026-01/2026-07', publicationMinimum: 5,
    });
    expect(parsed.areaRecords).toHaveLength(130);
    expect(parsed.buildingRecords).toHaveLength(1);
    expect(parsed.stats.eligibleRecordCount).toBe(5);
    expect(JSON.stringify(built.artifact)).not.toMatch(
      /serviceKey|authorization|sourceRecordId|provider error|raw|buyer|seller/i,
    );
  });

  it('rejects unknown keys, cross-period installation, and digest tampering', async () => {
    const built = await buildKoreaSaleEvidenceArtifact(evidence());
    expect(() => parseKoreaSaleEvidenceArtifact({ ...built.artifact, unexpected: true }, {
      marketId: 'kr-seoul', period: '2026-01/2026-07',
    })).toThrow('Invalid Korea sale evidence artifact');
    expect(() => parseKoreaSaleEvidenceArtifact(built.artifact, {
      marketId: 'kr-seoul', period: '2026-02/2026-08',
    })).toThrow('Invalid Korea sale evidence artifact');
    const tampered = clone(built.artifact) as Record<string, unknown>;
    const tamperedStats = tampered.stats as Record<string, number>;
    tamperedStats.eligibleRecordCount = (tamperedStats.eligibleRecordCount ?? 0) + 1;
    expect(() => parseKoreaSaleEvidenceArtifact(tampered, {
      marketId: 'kr-seoul', period: '2026-01/2026-07',
    })).toThrow('Invalid Korea sale evidence artifact');
  });

  it('rejects incomplete area cohorts and malformed recent sale rows with a valid digest', async () => {
    const built = await buildKoreaSaleEvidenceArtifact(evidence());
    const incomplete = clone(built.artifact) as Record<string, unknown>;
    const areas = incomplete.areaRecords as Array<Record<string, unknown>>;
    (areas[0]!.cohorts as unknown[]).pop();
    resign(incomplete);
    expect(() => parseKoreaSaleEvidenceArtifact(incomplete, {
      marketId: 'kr-seoul', period: '2026-01/2026-07',
    })).toThrow('Invalid Korea sale evidence artifact');

    const recentMismatch = clone(built.artifact) as Record<string, unknown>;
    const buildings = recentMismatch.buildingRecords as Array<Record<string, unknown>>;
    const recent = buildings[0]!.recentSales as Array<Record<string, unknown>>;
    recent[0]!.priceWon = 0;
    resign(recentMismatch);
    expect(() => parseKoreaSaleEvidenceArtifact(recentMismatch, {
      marketId: 'kr-seoul', period: '2026-01/2026-07',
    })).toThrow('Invalid Korea sale evidence artifact');
  });

  it('rejects count reconciliation drift even after a new internal digest', async () => {
    const built = await buildKoreaSaleEvidenceArtifact(evidence());
    const drifted = clone(built.artifact) as Record<string, unknown>;
    const stats = drifted.stats as Record<string, number>;
    stats.cancelledRecordCount = (stats.cancelledRecordCount ?? 0) + 1;
    resign(drifted);
    expect(() => parseKoreaSaleEvidenceArtifact(drifted, {
      marketId: 'kr-seoul', period: '2026-01/2026-07',
    })).toThrow('Invalid Korea sale evidence artifact');
  });
});
