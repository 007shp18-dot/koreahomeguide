import { describe, expect, it } from 'vitest';

import {
  loadKaptNearbyPlaceSeed,
  parseKaptSchoolRows,
  parseKaptStationRows,
  parseKaptWalkingMinutes,
} from '../scripts/kapt-nearby-place-source.mjs';

type NearbyPlaceSeedRow = Readonly<{
  buildingKey: string;
  distanceMeters: number | null;
  latitude: number | null;
  longitude: number | null;
  identityKey: string;
}>;

describe('K-apt nearby-place seed source', () => {
  it('extracts subway stations, their lines and an upper walking-time bound', () => {
    expect(parseKaptStationRows({
      buildingKey: 'seoul:building-1',
      kaptCode: 'A0001',
      subwayStation: '1호선(수도권,녹천) 4호선(수도권,창동역, 쌍문)',
      subwayWalkTime: '5분이내',
    })).toEqual([
      expect.objectContaining({ name: '녹천', lines: ['1호선(수도권)'], walkingMinutes: 5 }),
      expect.objectContaining({ name: '창동', lines: ['4호선(수도권)'], walkingMinutes: 5 }),
      expect.objectContaining({ name: '쌍문', lines: ['4호선(수도권)'], walkingMinutes: 5 }),
    ]);
    expect(parseKaptWalkingMinutes('10~15분이내')).toBe(15);
    expect(parseKaptWalkingMinutes('20분초과')).toBeNull();
  });

  it('extracts distinct named schools and ignores empty official values', () => {
    expect(parseKaptSchoolRows({
      buildingKey: 'seoul:building-1',
      kaptCode: 'A0001',
      educationFacility: '초등학교(창일초등, 월천초등) 중학교(노곡중, 창일중) 고등학교(서울외고,) 대학교',
    }).map(({ name }: { name: string }) => name)).toEqual([
      '노곡중', '서울외고', '월천초등', '창일중', '창일초등',
    ]);
  });

  it('loads a deterministic Seoul-only projection without invented distances', () => {
    const first = loadKaptNearbyPlaceSeed();
    const second = loadKaptNearbyPlaceSeed();
    const rows = first.rows as readonly NearbyPlaceSeedRow[];

    expect(rows.length).toBeGreaterThan(500);
    expect(first.summary).toEqual(second.summary);
    expect(first.summary.digest).toMatch(/^[a-f0-9]{64}$/u);
    expect(rows.every(({ buildingKey, distanceMeters, latitude, longitude }) =>
      buildingKey.startsWith('seoul:')
      && distanceMeters === null && latitude === null && longitude === null)).toBe(true);
    expect(new Set(rows.map(({ identityKey }) => identityKey)).size).toBe(rows.length);
  });
});
