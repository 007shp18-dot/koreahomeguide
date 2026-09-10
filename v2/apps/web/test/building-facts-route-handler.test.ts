import { describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createBuildingFactsGetHandler, supplementStoredNearbyFacts } from '../lib/public-market/building-facts-route-handler.server';
import { OBSERVED_BUILDING_INVENTORY_TEST_ARTIFACT } from '../../../tests/e2e/observed-building-inventory-fixture';
import { PUBLIC_AREA_SUMMARY_TEST_PERIOD } from '../../../tests/e2e/public-area-summary-fixture';
import { PUBLIC_BUILDING_TEST_ID } from '../../../tests/e2e/public-building-summary-fixture';

describe('building facts API handler', () => {
  test('resolves trusted installed identity before calling official providers', async () => {
    const load = vi.fn().mockResolvedValue({
      status: 'ready', match: { kaptCode: 'A1', bjdCode: '1168010100' },
      apartment: { name: '래미안 역삼' }, register: null,
    });
    const handler = createBuildingFactsGetHandler({
      serviceKey: 'server-secret', load,
      resolveIdentity: () => ({
        districtLawdCd: '11680', neighborhoodName: '역삼동',
        officialName: '래미안 역삼', housingType: 'apartment',
      }),
    });

    const response = await handler(new Request(
      'https://www.signedprice.com/api/markets/kr-seoul/building-facts?district=gangnam-gu&building=alpha',
    ));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=86400');
    expect(load).toHaveBeenCalledWith(expect.objectContaining({
      serviceKey: 'server-secret', officialName: '래미안 역삼',
    }));
    expect(await response.text()).not.toContain('server-secret');
  });

  test('rejects repeated, unknown and uninstalled building identifiers', async () => {
    const load = vi.fn();
    const handler = createBuildingFactsGetHandler({
      serviceKey: 'secret', load, resolveIdentity: () => null,
    });
    for (const url of [
      'https://x.test/api?district=a&district=b&building=c',
      'https://x.test/api?district=gangnam-gu&building=unknown',
      'https://x.test/api?district=gangnam-gu&building=bad%2Fid',
    ]) {
      const response = await handler(new Request(url));
      expect([400, 404]).toContain(response.status);
    }
    expect(load).not.toHaveBeenCalled();
  });

  test('reuses attached database facts before calling the upstream providers', async () => {
    const storedFacts = {
      status: 'ready' as const,
      source: {
        apartment: 'K-apt weekly apartment profile (2026-09-04)',
        register: null,
        nearby: 'K-apt complex detail (2026-09-04)',
      },
      match: { kaptCode: 'A1', bjdCode: '1168010100' },
      apartment: { name: '래미안 역삼', legalAddress: '서울 강남구 역삼동 1' },
      register: null,
    };
    const load = vi.fn();
    const loadStored = vi.fn().mockResolvedValue(storedFacts);
    const handler = createBuildingFactsGetHandler({
      serviceKey: 'server-secret',
      load,
      loadStored,
      resolveIdentity: () => ({
        districtLawdCd: '11680', neighborhoodName: '역삼동',
        officialName: '래미안 역삼', housingType: 'apartment',
      }),
    });

    const response = await handler(new Request(
      'https://www.signedprice.com/api/markets/kr-seoul/building-facts?district=gangnam-gu&building=alpha',
    ));
    expect(response.status).toBe(200);
    expect(loadStored).toHaveBeenCalledWith(expect.objectContaining({
      districtSlug: 'gangnam-gu', buildingId: 'alpha', officialName: '래미안 역삼',
    }));
    expect(load).not.toHaveBeenCalled();
    const body = await response.json();
    expect(body).toMatchObject({
      source: storedFacts.source,
      facts: storedFacts,
    });
  });

  test('attaches a verified upstream response to the database store', async () => {
    const readyFacts = {
      status: 'ready' as const,
      match: { kaptCode: 'A1', bjdCode: '1168010100' },
      apartment: { name: '래미안 역삼', legalAddress: '서울 강남구 역삼동 1' },
      register: null,
    };
    const storeReady = vi.fn().mockResolvedValue(undefined);
    const handler = createBuildingFactsGetHandler({
      serviceKey: 'server-secret',
      load: vi.fn().mockResolvedValue(readyFacts),
      storeReady,
      resolveIdentity: () => ({
        districtLawdCd: '11680', neighborhoodName: '역삼동',
        officialName: '래미안 역삼', housingType: 'apartment',
      }),
    });

    const response = await handler(new Request(
      'https://www.signedprice.com/api/markets/kr-seoul/building-facts?district=gangnam-gu&building=alpha',
    ));
    expect(response.status).toBe(200);
    expect(storeReady).toHaveBeenCalledWith(
      expect.objectContaining({ districtSlug: 'gangnam-gu', buildingId: 'alpha' }),
      readyFacts,
    );
    expect(await response.json()).toMatchObject({ source: { register: null } });
  });

  test('serves and attaches an exact installed K-apt match before calling OpenAPI', async () => {
    const installedFacts = {
      status: 'ready' as const,
      source: { apartment: 'K-apt weekly', register: null, nearby: 'K-apt detail' },
      match: { kaptCode: 'A10024564', bjdCode: '1168010300' },
      apartment: { name: '개포래미안포레스트', legalAddress: '서울 강남구 개포동 1282' },
      register: null,
      nearby: { subwayLine: '3호선', subwayStation: null, subwayWalkTime: null, busWalkTime: null, educationFacility: '초등학교(구룡초)', convenientFacility: null },
    };
    const load = vi.fn();
    const storeReady = vi.fn().mockResolvedValue(undefined);
    const handler = createBuildingFactsGetHandler({
      serviceKey: 'server-secret', load,
      loadStored: vi.fn().mockResolvedValue(null),
      loadInstalled: vi.fn().mockReturnValue(installedFacts),
      storeReady,
      resolveIdentity: () => ({
        districtLawdCd: '11680', neighborhoodName: '개포동',
        officialName: '개포래미안포레스트', housingType: 'apartment',
      }),
    });

    const response = await handler(new Request(
      'https://www.signedprice.com/api/markets/kr-seoul/building-facts?district=gangnam-gu&building=gangnam-gu-54w9ma',
    ));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ facts: installedFacts, source: installedFacts.source });
    expect(load).not.toHaveBeenCalled();
    expect(storeReady).toHaveBeenCalledWith(
      expect.objectContaining({ buildingId: 'gangnam-gu-54w9ma' }), installedFacts,
    );
  });

  test('accepts an observed public building even when price repositories are fixture-isolated', async () => {
    vi.stubEnv('SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS', 'false');
    vi.stubEnv('SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT', OBSERVED_BUILDING_INVENTORY_TEST_ARTIFACT);
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_SUMMARY_TEST_PERIOD);
    vi.stubEnv('SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY', '');
    vi.stubEnv('DATA_GO_KR_SERVICE_KEY', '');
    vi.resetModules();

    const { GET } = await import('../app/api/markets/kr-seoul/building-facts/route');
    const response = await GET(new Request(
      `https://www.signedprice.com/api/markets/kr-seoul/building-facts?district=jongno-gu&building=${PUBLIC_BUILDING_TEST_ID}`,
    ));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      schemaVersion: 1,
      facts: { status: 'unavailable', reason: 'configuration_missing' },
    });
  });
});


describe('restoring existing nearby evidence', () => {
  test('recovers nearby schools from the installed facts only for the exact same K-apt identity', () => {
    const stored = {
      status: 'ready' as const, match: { kaptCode: 'A1', bjdCode: '1168010100' },
      apartment: { name: 'Example', legalAddress: '서울 강남구 역삼동 1', roadAddress: null, households: 120, buildings: 1, heating: null, corridorType: null, saleType: null, approvalDate: null, totalAreaSqm: null },
      register: null,
      nearby: { subwayLine: '2호선', subwayStation: '역삼역', subwayWalkTime: null, busWalkTime: null, educationFacility: null, convenientFacility: null },
    };
    const installed = { ...stored, source: { apartment: 'K-apt weekly', register: null, nearby: 'K-apt complex details' }, nearby: { ...stored.nearby, subwayStation: 'Older station value', educationFacility: '역삼초등학교' } };
    const result = supplementStoredNearbyFacts(stored, installed);
    expect(result).toMatchObject({ nearby: { subwayStation: '역삼역', educationFacility: '역삼초등학교' }, source: { nearby: 'K-apt complex details' } });
    expect(supplementStoredNearbyFacts(stored, { ...installed, match: { ...installed.match, kaptCode: 'OTHER' } })).toBe(stored);
  });

  test('delivers stored school and station distances even when apartment facts are unavailable', async () => {
    const proximity = { status: 'ready', coordinateStatus: 'ready', nearestStation: { sourceId: 'station-1', name: 'Taereung', lines: ['6'], distanceMeters: 210 }, nearestSchool: { sourceId: 'school-1', name: 'School', distanceMeters: 400 } } as const;
    const handler = createBuildingFactsGetHandler({
      resolveIdentity: () => ({ districtLawdCd: '11260', neighborhoodName: '묵동', officialName: '세이지움태릉입구역', housingType: 'apartment' }),
      load: vi.fn().mockResolvedValue({ status: 'unavailable', reason: 'apartment_not_found' }),
      loadProximity: vi.fn().mockResolvedValue(proximity),
    });
    const response = await handler(new Request('https://example.test/api?district=jungnang-gu&building=jungnang-gu-1giu390'));
    expect(await response.json()).toMatchObject({ facts: { status: 'unavailable' }, proximity });
  });

  test('a failed nearby database read preserves available official building facts', async () => {
    const handler = createBuildingFactsGetHandler({
      resolveIdentity: () => ({ districtLawdCd: '11260', neighborhoodName: '묵동', officialName: 'Example', housingType: 'apartment' }),
      load: vi.fn().mockResolvedValue({ status: 'unavailable', reason: 'configuration_missing' }),
      loadProximity: vi.fn().mockRejectedValue(new Error('database timeout')),
    });
    const response = await handler(new Request('https://example.test/api?district=jungnang-gu&building=jungnang-gu-1giu390'));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ proximity: null });
  });
});


test('retains K-apt named schools when the apartment provider is unavailable', async () => {
  const reportedNearby = [{ kind: 'school', sourceId: 'kapt:A1:school:1', name: '창일초', lines: [], walkingMinutesUpperBound: null, source: 'https://www.k-apt.go.kr/' }] as const;
  const handler = createBuildingFactsGetHandler({
    resolveIdentity: () => ({ districtLawdCd: '11320', neighborhoodName: '창동', officialName: '창동주공18단지', housingType: 'apartment' }),
    load: vi.fn().mockResolvedValue({ status: 'unavailable', reason: 'configuration_missing' }),
    loadReportedNearby: vi.fn().mockResolvedValue(reportedNearby),
  });
  const response = await handler(new Request('https://example.test/api?district=dobong-gu&building=dobong-gu-128wfm7'));
  expect(await response.json()).toMatchObject({ facts: { status: 'unavailable' }, reportedNearby });
});
