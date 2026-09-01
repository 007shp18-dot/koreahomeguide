import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import type { KoreaPublicBuildingRecord } from '@signedprice/korea-rent';
import { buildPublicBuildingSummaryArtifact } from '../lib/public-market/building-artifact-builder.server';
import { parsePublicBuildingSummaryArtifact } from '../lib/public-market/building-summary-schema';

const period = '2026-01/2026-07';
const generatedAt = '2026-08-31T01:13:24.787Z';

function distribution() {
  return {
    n: 6, published: true as const, min: 300_000_000, p25: 310_000_000,
    med: 320_000_000, p75: 330_000_000, max: 340_000_000, chg3m: 1.2,
  };
}

function record(): KoreaPublicBuildingRecord {
  return {
    buildingId: 'gangnam-evidence-tower', districtSlug: 'gangnam-gu',
    neighborhoodId: 'yeoksam-dong', neighborhoodName: '역삼동',
    name: 'Evidence Tower', latitude: 37.5001, longitude: 127.0352,
    housingType: 'apartment', period, generatedAt, publicationMinimum: 5,
    groups: {
      all: distribution(), new: { n: 3, published: false }, renewal: { n: 2, published: false },
    },
    unknownContractCount: 1,
    areaBands: [{ band: '45-55sqm', summary: distribution() }],
    recentContracts: [{
      filedMonth: '2026-07', areaSqm: 50, deal: 'jeonse', depositWon: 320_000_000,
      monthlyRentWon: 0, contractType: 'new',
    }],
  };
}

describe('public building artifact builder', () => {
  it('builds a canonical, validated v2 artifact without raw source fields', async () => {
    const built = await buildPublicBuildingSummaryArtifact({ period, generatedAt, records: [record()] });
    const decoded = JSON.parse(built.serialized);
    const verified = parsePublicBuildingSummaryArtifact(decoded, { marketId: 'kr-seoul', period });

    expect(verified.records[0]).toMatchObject({
      neighborhoodName: '역삼동', latitude: 37.5001, longitude: 127.0352,
      groups: { all: { n: 6 }, new: { n: 3 }, renewal: { n: 2 } },
      unknownContractCount: 1,
    });
    expect(built.sha256).toBe(createHash('sha256').update(built.serialized).digest('hex'));
    expect(built.serialized).not.toMatch(/serviceKey|sourceRecordId|monthlyRentWon|raw xml/i);
  });

  it('rejects mixed periods before serialization', async () => {
    await expect(buildPublicBuildingSummaryArtifact({
      period, generatedAt, records: [{ ...record(), period: '2025-01/2025-07' }],
    })).rejects.toThrow('Public building summary is incomplete.');
  });
});
