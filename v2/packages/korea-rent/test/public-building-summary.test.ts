import { describe, expect, it } from 'vitest';

import {
  buildKoreaPublicBuildingSummaries,
  type KoreaPublicBuildingSourceRecord,
  type KoreaRentRecord,
} from '../src';

function record(
  depositWon: number,
  overrides: Partial<KoreaRentRecord> = {},
): KoreaPublicBuildingSourceRecord {
  return {
    districtSlug: 'gangnam-gu',
    record: {
      sourceHousingType: 'apartment',
      buildingLabel: '래미안 대치팰리스',
      legalDong: '대치동',
      areaSqm: 50,
      depositWon,
      monthlyRentWon: 0,
      contractDate: '2026-07-15',
      contractType: 'new',
      recordStatus: 'active',
      ...overrides,
    },
  };
}

describe('Korea public building summaries', () => {
  it('groups normalized official buildings and computes independent contract groups', () => {
    const records = [
      ...[300, 310, 320, 330, 340].map((value) => record(value * 1_000_000)),
      ...[400, 410, 420, 430, 440].map((value) => record(value * 1_000_000, {
        contractType: 'renewal',
        buildingLabel: '  래미안   대치팰리스  ',
      })),
      record(350_000_000, { contractType: 'unknown' }),
      record(990_000_000, { recordStatus: 'cancelled' }),
      record(980_000_000, { monthlyRentWon: 1 }),
      record(970_000_000, { areaSqm: 55.1 }),
    ];

    const result = buildKoreaPublicBuildingSummaries({
      period: '2026-01/2026-07',
      generatedAt: '2026-09-01T00:00:00.000Z',
      records,
      geocodes: [{
        districtSlug: 'gangnam-gu',
        neighborhoodName: '대치동',
        buildingName: '래미안 대치팰리스',
        latitude: 37.4995,
        longitude: 127.0574,
      }],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      districtSlug: 'gangnam-gu',
      neighborhoodName: '대치동',
      name: '래미안 대치팰리스',
      latitude: 37.4995,
      longitude: 127.0574,
      housingType: 'apartment',
      unknownContractCount: 1,
      groups: {
        all: { n: 11, published: true, med: 350_000_000 },
        new: { n: 5, published: true, med: 320_000_000 },
        renewal: { n: 5, published: true, med: 420_000_000 },
      },
    });
    expect(result[0]!.groups.all.n).toBe(
      result[0]!.groups.new.n + result[0]!.groups.renewal.n
      + result[0]!.unknownContractCount,
    );
    expect(result[0]!.recentContracts).toHaveLength(10);
  });

  it('keeps unresolved geocodes listable but never invents marker coordinates', () => {
    const result = buildKoreaPublicBuildingSummaries({
      period: '2026-01/2026-07',
      generatedAt: '2026-09-01T00:00:00.000Z',
      records: [100, 110, 120, 130, 140].map((value) => record(value * 1_000_000)),
      geocodes: [],
    });

    expect(result[0]).toMatchObject({ latitude: null, longitude: null });
    expect(result[0]!.neighborhoodId).toMatch(/^gangnam-gu-dong-/);
    expect(result[0]!.buildingId).toMatch(/^gangnam-gu-/);
  });

  it('omits records without a building and neighborhood identity or a supported housing type', () => {
    const result = buildKoreaPublicBuildingSummaries({
      period: '2026-01/2026-07',
      generatedAt: '2026-09-01T00:00:00.000Z',
      records: [
        record(100_000_000, { buildingLabel: undefined }),
        record(110_000_000, { legalDong: undefined }),
        record(120_000_000, { sourceHousingType: 'detached' }),
      ],
      geocodes: [],
    });

    expect(result).toEqual([]);
  });
});
