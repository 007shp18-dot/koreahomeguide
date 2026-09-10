import { describe, expect, it } from 'vitest';

import {
  buildKoreaObservedBuildingInventory,
  type KoreaPublicBuildingSourceRecord,
  type KoreaRentRecord,
} from '../src';

function source(
  buildingLabel: string | undefined,
  overrides: Partial<KoreaRentRecord> = {},
): KoreaPublicBuildingSourceRecord {
  return {
    districtSlug: 'gangnam-gu',
    record: {
      sourceHousingType: 'apartment',
      buildingLabel,
      legalDong: '대치동',
      areaSqm: 84.9,
      depositWon: 500_000_000,
      monthlyRentWon: 0,
      contractDate: '2026-07-15',
      contractType: 'new',
      recordStatus: 'active',
      ...overrides,
    },
  };
}

describe('Korea observed building inventory', () => {
  it('keeps every valid observed building independently from price-publication filters', () => {
    const result = buildKoreaObservedBuildingInventory({
      period: '2026-01/2026-07',
      generatedAt: '2026-09-01T00:00:00.000Z',
      records: [
        source('  래미안   대치팰리스 ', {
          depositWon: 20_000_000,
          monthlyRentWon: 1_700_000,
          areaSqm: 17.5,
          contractDate: '2026-01-10',
        }),
        source('래미안 대치팰리스', {
          areaSqm: 84.9,
          contractDate: '2026-07-15',
        }),
        source('대치 단독주택', {
          sourceHousingType: 'detached',
          areaSqm: 180,
          contractDate: '2026-06-20',
        }),
        source('취소 건물', { recordStatus: 'cancelled' }),
        source(undefined),
      ],
      geocodes: [{
        districtSlug: 'gangnam-gu',
        neighborhoodName: '대치동',
        buildingName: '래미안 대치팰리스',
        latitude: 37.4995,
        longitude: 127.0574,
      }],
    });

    expect(result.stats).toEqual({
      sourceRecordCount: 5,
      observedRecordCount: 3,
      observedBuildingCount: 2,
      cancelledRecordCount: 1,
      missingIdentityRecordCount: 1,
      coordinateReadyCount: 1,
      coordinatePendingCount: 1,
    });
    expect(result.records).toHaveLength(2);
    expect(result.records.find((record) => record.housingType === 'apartment')).toMatchObject({
      officialName: '래미안 대치팰리스',
      observationCount: 2,
      jeonseObservationCount: 1,
      monthlyObservationCount: 1,
      firstObservedMonth: '2026-01',
      lastObservedMonth: '2026-07',
      coordinate: {
        state: 'ready',
        latitude: 37.4995,
        longitude: 127.0574,
      },
    });
    expect(result.records.find((record) => record.housingType === 'detached')).toMatchObject({
      officialName: '대치 단독주택',
      observationCount: 1,
      coordinate: { state: 'pending', reason: 'coordinate_not_resolved' },
    });
    expect(Object.isFrozen(result.records)).toBe(true);
    expect(Object.isFrozen(result.stats)).toBe(true);
  });
});
