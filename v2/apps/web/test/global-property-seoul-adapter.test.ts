import { describe, expect, it } from 'vitest';

import { projectSeoulRentRecord } from '../lib/global-property/seoul-adapter';

describe('Seoul global property adapter', () => {
  it('preserves jeonse semantics, native KRW, area, status, and source identity', () => {
    const projection = projectSeoulRentRecord({
      districtSlug: 'mapo-gu',
      neighborhoodId: 'seogyo-dong',
      neighborhoodName: '서교동',
      buildingId: 'mapo-gu-seogyo-dong-example',
      buildingName: 'Example Apartments',
      housingType: 'apartment',
      record: {
        contractType: 'renewal',
        contractDate: '2026-07-14',
        areaSqm: 59.8,
        depositWon: 480_000_000,
        monthlyRentWon: 0,
        buildingLabel: 'Example Apartments',
        sourceHousingType: 'apartment',
        recordStatus: 'active',
        legalDong: '서교동',
        sourceRecordId: 'molit-rent-123',
      },
    });

    expect(projection.entity).toMatchObject({
      id: 'kr-seoul:estate:mapo-gu-seogyo-dong-example',
      marketId: 'kr-seoul',
      geographyId: 'kr-seoul:neighborhood:seogyo-dong',
      kind: 'estate',
      identityStatus: 'verified',
      localAttributes: { housingType: 'apartment', neighborhoodName: '서교동' },
    });
    expect(projection.sourceRecord).toEqual({
      datasetId: 'kr-molit-rent',
      businessKey: 'molit-rent-123',
    });
    expect(projection.observation).toMatchObject({
      kind: 'rent',
      stage: 'renewal',
      observedAt: '2026-07-14',
      currencyCode: 'KRW',
      depositMinor: 480_000_000,
      recurringAmountMinor: 0,
      frequency: 'monthly',
      propertyAreaSqm: 59.8,
      status: 'active',
    });
  });

  it('refuses to invent a source identity when MOLIT omitted it', () => {
    expect(() => projectSeoulRentRecord({
      districtSlug: 'mapo-gu',
      neighborhoodId: 'seogyo-dong',
      neighborhoodName: '서교동',
      buildingId: 'example',
      buildingName: 'Example',
      housingType: 'apartment',
      record: {
        contractType: 'new',
        contractDate: '2026-07-01',
        areaSqm: 50,
        depositWon: 10,
        monthlyRentWon: 1,
        sourceHousingType: 'apartment',
        recordStatus: 'active',
      },
    })).toThrow('sourceRecordId');
  });
});
