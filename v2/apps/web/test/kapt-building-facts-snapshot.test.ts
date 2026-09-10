import { describe, expect, test, vi } from 'vitest';
import { gzipSync } from 'node:zlib';

vi.mock('server-only', () => ({}));

import { createKaptBuildingFactsSnapshot } from '../lib/public-market/kapt-building-facts-snapshot.server';
import * as snapshotModule from '../lib/public-market/kapt-building-facts-snapshot.server';

describe('installed K-apt building facts snapshot', () => {
  test('returns exact official facts with source and nearby facility provenance', () => {
    const snapshot = createKaptBuildingFactsSnapshot({
      schemaVersion: 'signedprice-kapt-building-facts-v1',
      generatedAt: '2026-09-06T05:00:00.000Z',
      asOf: '2026-09-04',
      source: {
        apartment: 'K-apt weekly apartment profile (2026-09-04)',
        nearby: 'K-apt complex detail (2026-09-04)',
      },
      records: [{
        buildingId: 'gangnam-gu-54w9ma',
        districtSlug: 'gangnam-gu',
        officialName: '개포래미안포레스트',
        match: { kaptCode: 'A10024564', bjdCode: '1168010300' },
        apartment: {
          name: '개포래미안포레스트',
          legalAddress: '서울특별시 강남구 개포동 1282 개포래미안포레스트',
          roadAddress: '서울특별시 강남구 개포로 264',
          households: 2296,
          buildings: 31,
          heating: '지역난방',
          corridorType: '혼합식',
          saleType: '혼합',
          approvalDate: '2020-09-28',
          totalAreaSqm: 422390,
          structure: '철골철근콘크리트구조',
          floorsAbove: 35,
          floorsBelow: 3,
          parkingSpaces: 3961,
        },
        nearby: {
          subwayLine: '3호선', subwayStation: null, subwayWalkTime: null,
          busWalkTime: '5분이내', educationFacility: '초등학교(구룡초, 포이초)',
          convenientFacility: '관공서(개포4동 주민센터) 공원(달터공원)',
        },
      }],
    });

    expect(snapshot.getByBuildingId('gangnam-gu-54w9ma')).toEqual(expect.objectContaining({
      status: 'ready',
      source: {
        apartment: 'K-apt weekly apartment profile (2026-09-04)',
        register: null,
        nearby: 'K-apt complex detail (2026-09-04)',
      },
      match: { kaptCode: 'A10024564', bjdCode: '1168010300' },
      apartment: expect.objectContaining({ households: 2296, parkingSpaces: 3961 }),
      nearby: expect.objectContaining({ subwayLine: '3호선', subwayStation: null }),
    }));
    expect(snapshot.getByBuildingId('gangnam-gu-missing')).toBeNull();
    expect((snapshot as { records?: () => unknown }).records?.()).toEqual([
      expect.objectContaining({
        buildingId: 'gangnam-gu-54w9ma',
        districtSlug: 'gangnam-gu',
        officialName: '개포래미안포레스트',
      }),
    ]);
  });

  test('rejects duplicate building identities instead of attaching ambiguous data', () => {
    const source = {
      schemaVersion: 'signedprice-kapt-building-facts-v1',
      generatedAt: '2026-09-06T05:00:00.000Z',
      asOf: '2026-09-04',
      source: { apartment: 'K-apt weekly', nearby: 'K-apt detail' },
      records: [
        { buildingId: 'same', districtSlug: 'gangnam-gu', officialName: 'A', match: { kaptCode: 'A1', bjdCode: '1168010300' }, apartment: { name: 'A', legalAddress: '서울 강남구 개포동 1' }, nearby: null },
        { buildingId: 'same', districtSlug: 'gangnam-gu', officialName: 'B', match: { kaptCode: 'A2', bjdCode: '1168010300' }, apartment: { name: 'B', legalAddress: '서울 강남구 개포동 2' }, nearby: null },
      ],
    };

    expect(() => createKaptBuildingFactsSnapshot(source)).toThrow(/duplicate/i);
  });

  test('loads the checked-in gzip artifact used by the production server', () => {
    const load = (snapshotModule as unknown as {
      loadKaptBuildingFactsSnapshot?: (source: Buffer) => ReturnType<typeof createKaptBuildingFactsSnapshot>;
    }).loadKaptBuildingFactsSnapshot;
    expect(load).toBeTypeOf('function');
    if (load === undefined) return;
    const source = gzipSync(JSON.stringify({
      schemaVersion: 'signedprice-kapt-building-facts-v1', generatedAt: '2026-09-06T05:00:00.000Z',
      asOf: '2026-09-04', source: { apartment: 'K-apt weekly', nearby: 'K-apt detail' },
      records: [{
        buildingId: 'gangnam-gu-54w9ma', districtSlug: 'gangnam-gu', officialName: '개포래미안포레스트',
        match: { kaptCode: 'A10024564', bjdCode: '1168010300' },
        apartment: { name: '개포래미안포레스트', legalAddress: '서울 강남구 개포동 1282' }, nearby: null,
      }],
    }));
    expect(load(source).getByBuildingId('gangnam-gu-54w9ma')).toMatchObject({
      status: 'ready', match: { kaptCode: 'A10024564', bjdCode: '1168010300' },
    });
  });
});
