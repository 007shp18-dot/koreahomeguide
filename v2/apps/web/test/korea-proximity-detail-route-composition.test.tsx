import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { composeKoreaBuildingRoute } from '../app/(en)/kr/seoul/explore/[district]/[buildingId]/page';
import { koreaEvidenceRepositoriesFromEnvironment } from '../lib/public-market/korea-evidence-repositories.server';
import type { KoreaProximityRepositoryState } from '../lib/public-market/korea-proximity-repository.server';
import { buildObservedBuildingIdentityModel } from '../lib/public-market/observed-building-route-model.server';
import { PUBLIC_BUILDING_FIXTURE_PERIOD, createPublicBuildingFixture } from './public-building-fixture';
import { OBSERVED_BUILDING_FIXTURE_PERIOD, createObservedBuildingInventoryFixture } from './observed-building-fixture';

afterEach(() => vi.unstubAllEnvs());

const readyProximity = Object.freeze({
  state: 'ready' as const,
  repository: Object.freeze({
    listRecords: () => [],
    findByBuildingId: (buildingId: string) => Object.freeze({
      buildingId, status: 'ready' as const,
      nearestStation: Object.freeze({ sourceId: 'SEOUL:STN/001', name: 'Route station', lines: Object.freeze(['1호선']), distanceMeters: 250, bucketMeters: 250 }),
      nearestSchool: Object.freeze({ sourceId: 'SEOUL:SCH/001', name: 'Route school', distanceMeters: 500, bucketMeters: 500 }),
      stations: Object.freeze([]), schools: Object.freeze([]),
    }),
    getByBuildingId: (buildingId: string) => Object.freeze({
      buildingId, status: 'ready' as const,
      nearestStation: Object.freeze({ sourceId: 'SEOUL:STN/001', name: 'Route station', lines: Object.freeze(['1호선']), distanceMeters: 250, bucketMeters: 250 }),
      nearestSchool: Object.freeze({ sourceId: 'SEOUL:SCH/001', name: 'Route school', distanceMeters: 500, bucketMeters: 500 }),
      stations: Object.freeze([]), schools: Object.freeze([]),
    }),
    getArtifact: () => Object.freeze({
      stations: Object.freeze([Object.freeze({ sourceId: 'SEOUL:STN/001', name: 'Route station', lines: Object.freeze(['1호선']) })]),
      schools: Object.freeze([Object.freeze({ sourceId: 'SEOUL:SCH/001', name: 'Route school' })]),
      provenance: Object.freeze({
        stationSource: Object.freeze({ landingPage: 'https://stations.example.test/', sourceVersion: 'route-v1', asOf: '2026-08-31' }),
        schoolSource: Object.freeze({ landingPage: 'https://schools.example.test/', sourceVersion: 'route-v1', asOf: '2026-08-31' }),
        coordinateSource: Object.freeze({ landingPage: 'https://coordinates.example.test/', sourceVersion: 'route-v1', asOf: '2026-08-31' }),
        methodology: Object.freeze({ distance: 'WGS84 Haversine straight-line metres' }),
      }),
    }),
  }),
}) as unknown as KoreaProximityRepositoryState;

const query = Object.freeze({
  transaction: 'jeonse', district: 'gangnam-gu', neighborhood: 'yeoksam-dong',
  buildingId: 'gangnam-evidence-tower', q: 'route check', buildingPage: '2',
  station: 'SEOUL:STN/001', stationDistance: '500',
  school: 'SEOUL:SCH/001', schoolDistance: '750',
});

describe('Korea proximity Detail route composition', () => {
  it('exposes a dependency-injectable route composition boundary', () => {
    expect(composeKoreaBuildingRoute).toBeTypeOf('function');
  });

  it('composes the exact-evidence route with ready proximity facts and an encoded Detail return URL', () => {
    const repositories = koreaEvidenceRepositoriesFromEnvironment({
      useCheckedInSnapshot: true,
      retainLastVerified: false,
    });
    const exact = repositories.rent?.listBuildingRecords().find((building) => building.districtSlug === 'gangnam-gu');
    if (exact === undefined) throw new Error('Expected a checked-in Gangnam exact-evidence building.');
    const identity = buildObservedBuildingIdentityModel('gangnam-gu', 'gangnam-evidence-tower', {
      source: createObservedBuildingInventoryFixture(),
      period: OBSERVED_BUILDING_FIXTURE_PERIOD,
      proximityRepository: readyProximity,
    });
    if (identity === null) throw new Error('Expected observed identity fixture.');
    const html = renderToStaticMarkup(composeKoreaBuildingRoute({
      district: 'gangnam-gu', buildingId: exact.buildingId, query,
      dependencies: {
        evidenceRepositories: repositories,
        proximityRepository: readyProximity,
        buildObservedIdentityModel: () => Object.freeze({
          ...identity,
          building: Object.freeze({ ...identity.building, buildingId: exact.buildingId }),
        }),
      },
    }));
    expect(html).toContain('data-building-detail="exact-evidence"');
    expect(html).toContain('Route station · 1호선 · 250 m');
    const factsSection = html.slice(
      html.indexOf('data-building-section="official-facts"'),
      html.indexOf('</section>', html.indexOf('data-building-section="official-facts"')),
    );
    expect(factsSection).toContain('Observed build year');
    expect(factsSection).toContain('Route station · 1호선 · 250 m');
    expect(factsSection).toContain('Route school · 500 m');
    expect(html).toContain('station=SEOUL%3ASTN%2F001');
    expect(html).toContain('q=route+check');
  });

  it('composes the legacy-public route with the missing disclosure rather than hiding the Detail page', () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT', JSON.stringify(createPublicBuildingFixture()));
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_BUILDING_FIXTURE_PERIOD);
    vi.stubEnv('SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT', JSON.stringify(createObservedBuildingInventoryFixture()));
    const html = renderToStaticMarkup(composeKoreaBuildingRoute({
      district: 'gangnam-gu', buildingId: 'gangnam-evidence-tower', query,
      dependencies: { proximityRepository: Object.freeze({ state: 'missing' }) },
    }));
    expect(html).toContain('data-building-detail="ready"');
    expect(html).toContain('Proximity data unavailable');
    expect(html).toContain('q=route+check');
  });

  it('composes the Korean identity-only route with the invalid disclosure and localized return URL', () => {
    vi.stubEnv('SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT', JSON.stringify(createObservedBuildingInventoryFixture()));
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', OBSERVED_BUILDING_FIXTURE_PERIOD);
    const html = renderToStaticMarkup(composeKoreaBuildingRoute({
      district: 'jongno-gu', buildingId: 'jongno-monthly-home', query: {
        ...query, district: 'jongno-gu', neighborhood: 'sajik-dong', buildingId: 'jongno-monthly-home',
      }, locale: 'ko',
      dependencies: { proximityRepository: Object.freeze({ state: 'invalid' }) },
    }));
    expect(html).toContain('data-building-detail="identity-only"');
    expect(html).toContain('인접성 데이터를 확인할 수 없습니다.');
    expect(html).toContain('href="/ko/kr/seoul/explore?');
  });
});
