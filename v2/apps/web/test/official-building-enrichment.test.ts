import { describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('../lib/db/postgres.server', () => ({ contentDatabase: () => null }));

import { enrichOfficialBuildingFacts } from '../lib/public-market/official-building-enrichment.server';

describe('official building facts enrichment', () => {
  test('stores installed K-apt facts even when the OpenAPI key is unavailable', async () => {
    const facts = {
      status: 'ready' as const,
      source: { apartment: 'K-apt weekly', register: null, nearby: 'K-apt detail' },
      match: { kaptCode: 'A10024564', bjdCode: '1168010300' },
      apartment: {
        name: '개포래미안포레스트', legalAddress: '서울특별시 강남구 개포동 1282', roadAddress: null,
        households: 2296, buildings: 31, heating: '지역난방', corridorType: '혼합식', saleType: '혼합',
        approvalDate: '2020-09-28', totalAreaSqm: 422390, parkingSpaces: 3961,
      },
      register: null,
      nearby: { subwayLine: '3호선', subwayStation: null, subwayWalkTime: null, busWalkTime: '5분이내', educationFacility: '초등학교(구룡초, 포이초)', convenientFacility: null },
    };
    const candidate = {
      buildingKey: 'seoul:gangnam-gu-54w9ma', districtSlug: 'gangnam-gu',
      buildingId: 'gangnam-gu-54w9ma', districtLawdCd: '11680', neighborhoodName: '개포동',
      officialName: '개포래미안포레스트', housingType: 'apartment', facts,
    };
    const store = vi.fn().mockResolvedValue(undefined);
    const recordAttempt = vi.fn().mockResolvedValue(undefined);
    const loadOnlineCandidates = vi.fn().mockResolvedValue([]);

    const result = await enrichOfficialBuildingFacts(10, {
      loadSnapshotCandidates: vi.fn().mockResolvedValue([candidate]),
      loadOnlineCandidates,
      store,
      recordAttempt,
      serviceKey: 'configured-but-not-needed',
    });

    expect(result).toEqual({ state: 'ready', checked: 1, stored: 1, unavailable: 0 });
    expect(store).toHaveBeenCalledWith(candidate, facts);
    expect(recordAttempt).toHaveBeenCalledWith(candidate.buildingKey, 'succeeded', null, 30);
    expect(loadOnlineCandidates).not.toHaveBeenCalled();
  });

  test('reports a healthy no-op when the installed snapshot has no stale candidates', async () => {
    const result = await enrichOfficialBuildingFacts(10, {
      loadSnapshotCandidates: vi.fn().mockResolvedValue([]),
      snapshotAvailable: () => true,
      loadOnlineCandidates: vi.fn(),
      serviceKey: '',
    });

    expect(result).toEqual({ state: 'ready', checked: 0, stored: 0, unavailable: 0 });
  });

  test('bounds online provider work and concurrency for a large scheduled batch', async () => {
    const candidates = Array.from({ length: 30 }, (_, index) => ({
      buildingKey: `seoul:building-${index}`,
      districtSlug: 'gangnam-gu',
      buildingId: `gangnam-gu-${index}`,
      districtLawdCd: '11680',
      neighborhoodName: '역삼동',
      officialName: `테스트아파트${index}`,
      housingType: 'apartment',
    }));
    let active = 0;
    let maximumConcurrency = 0;
    const loadOnline = vi.fn(async () => {
      active += 1;
      maximumConcurrency = Math.max(maximumConcurrency, active);
      await new Promise((resolve) => setTimeout(resolve, 2));
      active -= 1;
      return { status: 'unavailable' as const, reason: 'apartment_not_found' as const };
    });
    const loadOnlineCandidates = vi.fn(async (limit: number) => candidates.slice(0, limit));
    const recordAttempt = vi.fn().mockResolvedValue(undefined);

    const result = await enrichOfficialBuildingFacts(250, {
      loadSnapshotCandidates: vi.fn().mockResolvedValue([]),
      snapshotAvailable: () => false,
      loadOnlineCandidates,
      loadOnline,
      recordAttempt,
      serviceKey: 'configured',
    });

    expect(loadOnlineCandidates).toHaveBeenCalledWith(10);
    expect(loadOnline).toHaveBeenCalledTimes(10);
    expect(maximumConcurrency).toBeLessThanOrEqual(5);
    expect(result).toEqual({ state: 'ready', checked: 10, stored: 0, unavailable: 10 });
  });
});
