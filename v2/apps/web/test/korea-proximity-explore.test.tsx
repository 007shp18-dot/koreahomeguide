import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/kr/seoul/explore/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('next/script', () => ({
  default: () => null,
}));
vi.mock('../components/maps/naver-district-map', () => ({
  buildNaverBuildingAddressQuery: (
    districtNameKo: string,
    neighborhoodName: string,
    buildingName: string,
  ) => `${districtNameKo} ${neighborhoodName} ${buildingName}`,
  NaverDistrictMap: ({
    districts,
    fallback,
  }: Readonly<{
    districts: readonly Readonly<{ slug: string; href: string }>[];
    fallback: ReactNode;
  }>) => <div>{districts.map((district) => (
    <a key={district.slug} data-map-district-anchor={district.slug} href={district.href}>
      {district.slug}
    </a>
  ))}{fallback}</div>,
}));

import {
  AreaExplorer,
  createKoreaBuildingDetailHref,
  createKoreaDistrictHref,
  createExploreBuildingSelectionHref,
  createKoreaProximitySelectorHref,
  withKoreaProximityPairs,
} from '../components/public-market/area-explorer';
import {
  buildPublicAreaExploreModel,
  normalizeKoreaExploreProximitySelection,
} from '../lib/public-market/area-route-model.server';
import type { KoreaProximityRepositoryState } from '../lib/public-market/korea-proximity-repository.server';
import { koreaEvidenceRepositoriesFromEnvironment } from '../lib/public-market/korea-evidence-repositories.server';
import { buildKoreaExplorerEvidenceProjection } from '../lib/public-market/korea-explorer-evidence.server';
import { koreaBuildingProximityModel } from '../lib/public-market/korea-proximity-display.server';
import { observedBuildingRepositoryFromEnvironment } from '../lib/public-market/observed-building-repository.server';
import {
  createKoreaDetailBackHref,
  resolveKoreaEvidenceBuildingRoute,
} from '../app/(en)/kr/seoul/explore/[district]/[buildingId]/page';
import { createPublicAreaFixture, PUBLIC_AREA_FIXTURE_PERIOD } from './public-area-fixture';
import { createPublicBuildingFixture } from './public-building-fixture';
import { createObservedBuildingInventoryFixture } from './observed-building-fixture';
import { localizedSeoulHref } from '../lib/locale/product-copy';

const source = () => createPublicAreaFixture({
  publishedMedians: {
    'jongno-gu': 500_000_000,
    'jung-gu': 100_000_000,
    'yongsan-gu': 100_000_000,
    'seongdong-gu': 300_000_000,
    'gwangjin-gu': 700_000_000,
    'dongdaemun-gu': 400_000_000,
    'jungnang-gu': 200_000_000,
  },
});

const proximityRecords = Object.freeze([
  Object.freeze({
    buildingId: 'gangnam-evidence-tower', status: 'ready' as const,
    nearestStation: Object.freeze({ sourceId: 'station-a', name: 'Same name', lines: ['2호선'], distanceMeters: 250, bucketMeters: 250 }),
    nearestSchool: Object.freeze({ sourceId: 'school-a', name: 'School A', distanceMeters: 500, bucketMeters: 500 }),
    stations: Object.freeze([Object.freeze({ sourceId: 'station-a', name: 'Same name', lines: ['2호선'], distanceMeters: 250, bucketMeters: 250 })]),
    schools: Object.freeze([Object.freeze({ sourceId: 'school-a', name: 'School A', distanceMeters: 500, bucketMeters: 500 })]),
  }),
  Object.freeze({
    buildingId: 'gangnam-large-detached', status: 'ready' as const,
    nearestStation: Object.freeze({ sourceId: 'station-b', name: 'Same name', lines: ['경의중앙선'], distanceMeters: 750, bucketMeters: 750 }),
    nearestSchool: Object.freeze({ sourceId: 'school-a', name: 'School A', distanceMeters: 250, bucketMeters: 250 }),
    stations: Object.freeze([Object.freeze({ sourceId: 'station-b', name: 'Same name', lines: ['경의중앙선'], distanceMeters: 750, bucketMeters: 750 })]),
    schools: Object.freeze([Object.freeze({ sourceId: 'school-a', name: 'School A', distanceMeters: 250, bucketMeters: 250 })]),
  }),
  Object.freeze({ buildingId: 'jongno-monthly-home', status: 'pending_coordinate' as const }),
]);

const readyProximity = Object.freeze({
  state: 'ready' as const,
  repository: Object.freeze({
    listRecords: () => proximityRecords,
    findByBuildingId: (buildingId: string) => (
      proximityRecords.find((candidate) => candidate.buildingId === buildingId) ?? null
    ),
    getByBuildingId: (buildingId: string) => {
      const record = proximityRecords.find((candidate) => candidate.buildingId === buildingId);
      if (record === undefined) throw new Error('missing proximity record');
      return record;
    },
    getArtifact: () => Object.freeze({
      provenance: Object.freeze({
        stationSource: Object.freeze({ landingPage: 'https://data.seoul.go.kr/stations', sourceVersion: '2026-08', asOf: '2026-08-31' }),
        schoolSource: Object.freeze({ landingPage: 'https://school.example.test/', sourceVersion: '2026-08', asOf: '2026-08-31' }),
        coordinateSource: Object.freeze({ landingPage: 'https://coordinates.example.test/', sourceVersion: '2026-08', asOf: '2026-08-31' }),
        methodology: Object.freeze({ distance: 'WGS84 Haversine straight-line metres' }),
      }),
      stations: Object.freeze([
        Object.freeze({ sourceId: 'station-a', name: 'Same name', lines: ['2호선'] }),
        Object.freeze({ sourceId: 'station-b', name: 'Same name', lines: ['경의중앙선'] }),
      ]),
      schools: Object.freeze([Object.freeze({ sourceId: 'school-a', name: 'School A' })]),
    }),
  }),
}) as unknown as KoreaProximityRepositoryState;

const nonSlugReadyProximity = Object.freeze({
  state: 'ready' as const,
  repository: Object.freeze({
    getArtifact: () => Object.freeze({
      stations: Object.freeze([Object.freeze({ sourceId: 'SEOUL:STN/001', name: 'Official station', lines: ['1호선'] })]),
      schools: Object.freeze([Object.freeze({ sourceId: 'SEOUL:SCH/001', name: 'Official school' })]),
    }),
  }),
}) as unknown as KoreaProximityRepositoryState;

function dependencies(proximityRepository = readyProximity) {
  return {
    source: source(),
    period: PUBLIC_AREA_FIXTURE_PERIOD,
    buildingSource: createPublicBuildingFixture(),
    observedBuildingSource: createObservedBuildingInventoryFixture(),
    proximityRepository,
  };
}

describe('Korea Explore proximity route model', () => {
  it('keeps q, page, generic state, and both proximity pairs on a live Detail href', () => {
    const href = createKoreaBuildingDetailHref({
      id: 'jongno-monthly-home', districtSlug: 'jongno-gu', neighborhoodId: 'sajik-dong',
      neighborhoodName: '사직동', name: 'Monthly Home', housingType: 'officetel', latitude: null,
      longitude: null, evidenceStatus: 'unavailable', observationCount: 1, jeonseObservationCount: 0,
      monthlyObservationCount: 1, firstObservedMonth: '2026-06', lastObservedMonth: '2026-06',
      sampleLabel: '', medianLabel: null, newSampleLabel: '', newMedianLabel: null,
      renewalSampleLabel: '', renewalMedianLabel: null, unknownContractCount: 0, proximity: null,
      href: '/kr/seoul/explore/jongno-gu/jongno-monthly-home/',
    }, {
      market: 'kr', transaction: 'monthly', area: '60-85', propertyType: 'officetel',
      district: 'jongno-gu', neighborhood: 'sajik-dong', buildingId: 'jongno-monthly-home',
      contractType: 'all', view: 'table', station: 'station-a', stationDistance: 250,
      school: 'school-a', schoolDistance: 500,
    }, 'en', { query: 'monthly home', buildingPage: 2 });
    expect(href).toBe('/kr/seoul/explore/jongno-gu/jongno-monthly-home/?transaction=monthly&area=60-85&propertyType=officetel&district=jongno-gu&neighborhood=sajik-dong&buildingId=jongno-monthly-home&contractType=all&view=table&station=station-a&stationDistance=250&school=school-a&schoolDistance=500&q=monthly+home&buildingPage=2');
  });
  it('localizes dynamic Korea building-detail paths for Korean Detail routes', () => {
    expect(localizedSeoulHref('/kr/seoul/explore/gangnam-gu/gangnam-evidence-tower/?station=station-a&stationDistance=250', 'ko'))
      .toBe('/ko/kr/seoul/explore/gangnam-gu/gangnam-evidence-tower/?station=station-a&stationDistance=250');
  });
  it('round-trips validated non-slug proximity pairs through the Detail back-url builders', () => {
    const query = {
      transaction: 'monthly', area: '60-85', propertyType: 'apartment', district: 'gangnam-gu',
      neighborhood: 'yeoksam-dong', buildingId: 'gangnam-evidence-tower', contractType: 'renewal',
      view: 'table', q: 'tower', buildingPage: '2',
      station: 'SEOUL:STN/001', stationDistance: '500',
      school: 'SEOUL:SCH/001', schoolDistance: '750',
    };
    const selection = {
      market: 'kr' as const, transaction: 'monthly' as const, area: '60-85' as const,
      propertyType: 'apartment', district: 'gangnam-gu', neighborhood: 'yeoksam-dong',
      buildingId: 'gangnam-evidence-tower', contractType: 'renewal' as const, view: 'table' as const,
    };

    for (const branch of ['identity-only', 'legacy-public'] as const) {
      const href = createKoreaDetailBackHref(query, selection, nonSlugReadyProximity, 'ko');
      const target = new URL(href, 'https://signedprice.invalid');
      expect(target.pathname, branch).toBe('/ko/kr/seoul/explore/');
      expect(Object.fromEntries(target.searchParams), branch).toMatchObject({
        transaction: 'monthly', area: '60-85', propertyType: 'apartment', district: 'gangnam-gu',
        neighborhood: 'yeoksam-dong', buildingId: 'gangnam-evidence-tower', contractType: 'renewal',
        view: 'table', q: 'tower', buildingPage: '2',
        station: 'SEOUL:STN/001', stationDistance: '500',
        school: 'SEOUL:SCH/001', schoolDistance: '750',
      });
      expect(href).toContain('station=SEOUL%3ASTN%2F001');
    }
  });

  it('keeps validated proximity pairs on exact-evidence Detail return URLs', () => {
    const repositories = koreaEvidenceRepositoriesFromEnvironment({ useCheckedInSnapshot: true, retainLastVerified: false });
    const building = repositories.rent?.listBuildingRecords().find((record) => record.districtSlug === 'gangnam-gu');
    if (building === undefined) throw new Error('Expected checked-in Gangnam building.');
    const resolved = resolveKoreaEvidenceBuildingRoute(
      'gangnam-gu',
      building.buildingId,
      {
        transaction: 'jeonse', area: 'all', propertyType: building.housingType,
        district: 'gangnam-gu', neighborhood: building.neighborhoodId, buildingId: building.buildingId,
        contractType: 'all', station: 'SEOUL:STN/001', stationDistance: '500',
        school: 'SEOUL:SCH/001', schoolDistance: '750',
      },
      repositories,
      nonSlugReadyProximity,
      'en',
    );
    if (resolved === null) throw new Error('Expected exact Detail route.');
    expect(resolved.backHref).toContain('station=SEOUL%3ASTN%2F001&stationDistance=500');
    expect(resolved.backHref).toContain('school=SEOUL%3ASCH%2F001&schoolDistance=750');
  });

  it('keeps proximity controls touch-sized and contained at 390px', () => {
    const css = readFileSync(new URL('../components/public-market/area-explorer.module.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.proximityFilters select[\s\S]*min-height:\s*44px/);
    expect(css).toMatch(/@media \(max-width: 420px\)[\s\S]*\.proximityFilters/);
    expect(css).toMatch(/\.proximityFilters label,[\s\S]*min-width:\s*0/);
  });

  it('keeps a selected building token through a proximity control update for server reconciliation', () => {
    const target = new URL(createKoreaProximitySelectorHref(
      '/kr/seoul/explore/?district=gangnam-gu&buildingId=gangnam-evidence-tower&buildingPage=2',
      'station',
      'station-a',
      '250',
    ), 'https://signedprice.invalid');
    expect(target.searchParams.get('buildingId')).toBe('gangnam-evidence-tower');
    expect(target.searchParams.has('buildingPage')).toBe(false);
  });

  it('preserves both validated pairs through district and neighborhood action hrefs', () => {
    const selection = { market: 'kr' as const, transaction: 'jeonse' as const, station: 'station-a', stationDistance: 250 as const, school: 'school-a', schoolDistance: 500 as const };
    expect(withKoreaProximityPairs('/kr/seoul/explore/?district=jongno-gu', selection)).toBe('/kr/seoul/explore/?district=jongno-gu&station=station-a&stationDistance=250&school=school-a&schoolDistance=500');
    expect(withKoreaProximityPairs('/kr/seoul/explore/?district=gangnam-gu&neighborhood=yeoksam-dong', selection)).toContain('station=station-a&stationDistance=250&school=school-a&schoolDistance=500');
  });
  it('keeps district discovery on the canonical Explore workspace while preserving filter state', () => {
    expect(createKoreaDistrictHref('jongno-gu', {
      market: 'kr', transaction: 'monthly', area: '60-85', propertyType: 'apartment',
      district: 'gangnam-gu', neighborhood: 'yeoksam-dong', buildingId: 'tower',
      station: 'station-a', stationDistance: 250,
      school: 'school-a', schoolDistance: 500,
    }, 'en')).toBe('/kr/seoul/explore/?transaction=monthly&area=60-85&propertyType=apartment&district=jongno-gu&station=station-a&stationDistance=250&school=school-a&schoolDistance=500');
  });
  it('filters the full installed identity set before page slicing and reconciles excluded selections', () => {
    const repositories = koreaEvidenceRepositoriesFromEnvironment({ useCheckedInSnapshot: true, retainLastVerified: false });
    const identities = repositories.rent!.listBuildingRecords().filter((record) => record.districtSlug === 'gangnam-gu');
    expect(identities.length).toBeGreaterThan(50);
    const matched = new Set(identities.filter((_record, index) => index % 2 === 0).map(({ buildingId }) => buildingId));
    const proximity = {
      state: 'ready',
      repository: {
        listRecords: () => [],
        findByBuildingId: (buildingId: string) => ({ buildingId, status: 'ready', nearestStation: null, nearestSchool: null, stations: matched.has(buildingId) ? [{ sourceId: 'station-a', name: 'A', lines: ['1호선'], distanceMeters: 250, bucketMeters: 250 }] : [], schools: [] }),
        getByBuildingId: (buildingId: string) => ({ buildingId, status: 'ready', nearestStation: null, nearestSchool: null, stations: matched.has(buildingId) ? [{ sourceId: 'station-a', name: 'A', lines: ['1호선'], distanceMeters: 250, bucketMeters: 250 }] : [], schools: [] }),
        getArtifact: () => ({ stations: [{ sourceId: 'station-a', name: 'A', lines: ['1호선'] }], schools: [], provenance: { stationSource: { landingPage: 'https://example.test/stations', sourceVersion: 'v1', asOf: '2026-08-01' }, schoolSource: { landingPage: 'https://example.test/schools', sourceVersion: 'v1', asOf: '2026-08-01' }, coordinateSource: { landingPage: 'https://example.test/coordinates', sourceVersion: 'v1', asOf: '2026-08-01' }, methodology: { distance: 'WGS84 Haversine straight-line metres' } } }),
      },
    } as unknown as KoreaProximityRepositoryState;
    if (proximity.state !== 'ready') throw new Error('Expected ready proximity fixture.');
    const projection = buildKoreaExplorerEvidenceProjection(repositories, { transaction: 'jeonse', areaBand: 'all', housingType: 'all', contractGroup: 'all' }, { includeBuildings: true, includeBuildingStats: true, districtSlug: 'gangnam-gu', buildingPage: 2, selectedBuildingId: identities[1]!.buildingId, proximityRepository: proximity, proximitySelection: { station: { sourceId: 'station-a', distanceMeters: 250 }, school: null } });
    expect(projection.status).toBe('ready');
    if (projection.status !== 'ready' || projection.buildingPage === null) return;
    expect(projection.buildingPage.total).toBe(matched.size);
    expect(projection.buildingPage.page).toBe(2);
    expect(projection.buildingPage.buildings.every((building) => matched.has(building.buildingId))).toBe(true);
    expect(projection.buildingPage.buildings.some((building) => building.buildingId === identities[1]!.buildingId)).toBe(false);

    const retained = buildKoreaExplorerEvidenceProjection(repositories, { transaction: 'jeonse', areaBand: 'all', housingType: 'all', contractGroup: 'all' }, {
      includeBuildings: true, includeBuildingStats: true, districtSlug: 'gangnam-gu', buildingPage: 1,
      selectedBuildingId: identities[50]!.buildingId,
      proximityRepository: {
        ...proximity,
        repository: {
          ...proximity.repository,
          findByBuildingId: (buildingId: string) => ({ buildingId, status: 'ready', nearestStation: null, nearestSchool: null, stations: [{ sourceId: 'station-a', name: 'A', lines: ['1호선'], distanceMeters: 250, bucketMeters: 250 }], schools: [] }),
          getByBuildingId: (buildingId: string) => ({ buildingId, status: 'ready', nearestStation: null, nearestSchool: null, stations: [{ sourceId: 'station-a', name: 'A', lines: ['1호선'], distanceMeters: 250, bucketMeters: 250 }], schools: [] }),
        },
      } as unknown as KoreaProximityRepositoryState,
      proximitySelection: { station: { sourceId: 'station-a', distanceMeters: 250 }, school: null },
    });
    if (retained.status !== 'ready' || retained.buildingPage === null) return;
    expect(retained.buildingPage.page).toBe(2);
    expect(retained.buildingPage.buildings.some((building) => building.buildingId === identities[50]!.buildingId)).toBe(true);
  });

  it('keeps uncovered sale-only identities without a pair, excludes them with a pair, and reports unavailable coordinates', () => {
    const repositories = koreaEvidenceRepositoriesFromEnvironment({
      useCheckedInSnapshot: true,
      retainLastVerified: false,
    });
    const observedRepository = observedBuildingRepositoryFromEnvironment({
      useCheckedInSnapshot: true,
    });
    if (repositories.rent === null || repositories.sale === null || observedRepository === null) {
      throw new Error('Expected installed rent, sale, and observed repositories.');
    }
    const observedIds = new Set(observedRepository.listRecords().map(({ buildingId }) => buildingId));
    const saleOnly = repositories.sale.listBuildingRecords().filter(({ buildingId }) => (
      !observedIds.has(buildingId)
    ));
    expect(observedIds.size).toBe(48_999);
    expect(saleOnly).toHaveLength(8_916);
    const target = saleOnly[0]!;
    const recordFor = (buildingId: string) => observedIds.has(buildingId) ? Object.freeze({
      buildingId,
      status: 'ready' as const,
      nearestStation: Object.freeze({
        sourceId: 'station-observed', name: 'Observed station', lines: Object.freeze(['1호선']),
        distanceMeters: 100, bucketMeters: 250 as const,
      }),
      nearestSchool: null,
      stations: Object.freeze([Object.freeze({
        sourceId: 'station-observed', name: 'Observed station', lines: Object.freeze(['1호선']),
        distanceMeters: 100, bucketMeters: 250 as const,
      })]),
      schools: Object.freeze([]),
    }) : null;
    const proximity = Object.freeze({
      state: 'ready' as const,
      repository: Object.freeze({
        listRecords: () => Object.freeze([]),
        findByBuildingId: recordFor,
        getByBuildingId: (buildingId: string) => {
          const record = recordFor(buildingId);
          if (record === null) throw new Error('uncovered building');
          return record;
        },
        getArtifact: () => Object.freeze({
          stations: Object.freeze([Object.freeze({
            sourceId: 'station-observed', name: 'Observed station', lines: Object.freeze(['1호선']),
          })]),
          schools: Object.freeze([]),
          provenance: Object.freeze({
            stationSource: Object.freeze({ landingPage: 'https://example.test/stations', sourceVersion: 'v1', asOf: '2026-08-01' }),
            schoolSource: Object.freeze({ landingPage: 'https://example.test/schools', sourceVersion: 'v1', asOf: '2026-08-01' }),
            coordinateSource: Object.freeze({ landingPage: 'https://example.test/coordinates', sourceVersion: 'v1', asOf: '2026-08-01' }),
            methodology: Object.freeze({ distance: 'WGS84 Haversine straight-line metres' }),
          }),
        }),
      }),
    }) as unknown as KoreaProximityRepositoryState;
    const districtUnion = new Set([
      ...repositories.rent.listBuildingRecords(),
      ...repositories.sale.listBuildingRecords(),
    ].filter(({ districtSlug }) => districtSlug === target.districtSlug)
      .map(({ buildingId }) => buildingId));

    const withoutPair = buildKoreaExplorerEvidenceProjection(
      repositories,
      { transaction: 'sale', areaBand: 'all', housingType: 'all' },
      {
        includeBuildings: true,
        districtSlug: target.districtSlug,
        selectedBuildingId: target.buildingId,
        proximityRepository: proximity,
        proximitySelection: { station: null, school: null },
      },
    );
    if (withoutPair.status !== 'ready' || withoutPair.buildingPage === null) {
      throw new Error('Expected installed sale projection.');
    }
    expect(withoutPair.buildingPage.total).toBe(districtUnion.size);
    expect(withoutPair.buildingPage.buildings.some(({ buildingId }) => (
      buildingId === target.buildingId
    ))).toBe(true);

    const withPair = buildKoreaExplorerEvidenceProjection(
      repositories,
      { transaction: 'sale', areaBand: 'all', housingType: 'all' },
      {
        includeBuildings: true,
        districtSlug: target.districtSlug,
        selectedBuildingId: target.buildingId,
        proximityRepository: proximity,
        proximitySelection: {
          station: { sourceId: 'station-observed', distanceMeters: 250 },
          school: null,
        },
      },
    );
    if (withPair.status !== 'ready' || withPair.buildingPage === null) {
      throw new Error('Expected filtered installed sale projection.');
    }
    expect(withPair.buildingPage.total).toBe([...districtUnion].filter((buildingId) => (
      observedIds.has(buildingId)
    )).length);
    expect(withPair.buildingPage.buildings.some(({ buildingId }) => (
      buildingId === target.buildingId
    ))).toBe(false);
    expect(koreaBuildingProximityModel(target.buildingId, proximity)).toEqual({
      coordinateStatus: 'unavailable', nearestStation: null, nearestSchool: null,
    });
  });

  it.each([250, 500, 750, 1000] as const)('accepts the exact %sm distance values', (distance) => {
    expect(normalizeKoreaExploreProximitySelection({
      station: 'station-a', stationDistance: String(distance),
    }, readyProximity)).toEqual({ station: { sourceId: 'station-a', distanceMeters: distance }, school: null });
  });

  it.each([0, 249, 251, 999, 1001, '500m'] as const)('drops unsupported station distance %s atomically', (distance) => {
    expect(normalizeKoreaExploreProximitySelection({
      station: 'station-a', stationDistance: String(distance),
    }, readyProximity)).toEqual({ station: null, school: null });
  });

  it.each(['0250', '250.0', '+250', ' 250', '250 ', '2.5e2'] as const)(
    'drops the non-contract distance spelling %j for either independent pair',
    (distance) => {
      expect(normalizeKoreaExploreProximitySelection({
        station: 'station-a', stationDistance: distance,
        school: 'school-a', schoolDistance: '500',
      }, readyProximity)).toEqual({
        station: null,
        school: { sourceId: 'school-a', distanceMeters: 500 },
      });
      expect(normalizeKoreaExploreProximitySelection({
        station: 'station-a', stationDistance: '250',
        school: 'school-a', schoolDistance: distance,
      }, readyProximity)).toEqual({
        station: { sourceId: 'station-a', distanceMeters: 250 },
        school: null,
      });
    },
  );

  it('drops partial, duplicate, and unknown pairs without disturbing the valid independent pair', () => {
    expect(normalizeKoreaExploreProximitySelection({
      station: ['station-a', 'station-b'], stationDistance: '250',
      school: 'school-a', schoolDistance: '500',
    }, readyProximity)).toEqual({
      station: null,
      school: { sourceId: 'school-a', distanceMeters: 500 },
    });
    expect(normalizeKoreaExploreProximitySelection({
      station: 'unknown', stationDistance: '250', school: 'school-a', schoolDistance: '500',
    }, readyProximity)).toEqual({
      station: null,
      school: { sourceId: 'school-a', distanceMeters: 500 },
    });
  });

  it('accepts and URL-encodes official non-slug source IDs by exact catalog match', () => {
    const ready = readyProximity as Extract<KoreaProximityRepositoryState, { state: 'ready' }>;
    const nonSlugRepository = {
      ...ready,
      repository: {
        ...ready.repository,
        getArtifact: () => ({
          ...ready.repository.getArtifact(),
          stations: [{ sourceId: 'SEOUL:STN/001', name: 'Official station', lines: ['1호선'] }],
        }),
      },
    } as unknown as KoreaProximityRepositoryState;
    expect(normalizeKoreaExploreProximitySelection({ station: 'SEOUL:STN/001', stationDistance: '500' }, nonSlugRepository))
      .toEqual({ station: { sourceId: 'SEOUL:STN/001', distanceMeters: 500 }, school: null });
    const href = createExploreBuildingSelectionHref({ id: 'building', districtSlug: 'gangnam-gu', neighborhoodId: 'yeoksam-dong', neighborhoodName: '역삼동', name: 'Building', housingType: 'apartment', latitude: null, longitude: null, evidenceStatus: 'unavailable', observationCount: 0, jeonseObservationCount: 0, monthlyObservationCount: 0, firstObservedMonth: '', lastObservedMonth: '', sampleLabel: '', medianLabel: null, newSampleLabel: '', newMedianLabel: null, renewalSampleLabel: '', renewalMedianLabel: null, unknownContractCount: 0, proximity: null, href: '/kr/seoul/explore/gangnam-gu/building/' }, { market: 'kr', transaction: 'jeonse', station: 'SEOUL:STN/001', stationDistance: 500 }, 'en');
    expect(href).toContain('station=SEOUL%3ASTN%2F001');
  });

  it('uses source IDs to retain distinct same-name stations and filters before Explore totals', () => {
    const model = buildPublicAreaExploreModel('gangnam-gu', dependencies(), undefined, '', {}, 1, undefined, {
      station: 'station-a', stationDistance: '250', school: 'school-a', schoolDistance: '500',
    });
    expect(model.status).toBe('ready');
    if (model.status !== 'ready' || model.buildingAvailability.status !== 'ready') return;

    expect(model.proximity).toMatchObject({
      status: 'ready',
      stations: [
        { sourceId: 'station-a', name: 'Same name', lines: ['2호선'] },
        { sourceId: 'station-b', name: 'Same name', lines: ['경의중앙선'] },
      ],
      selection: {
        station: { sourceId: 'station-a', distanceMeters: 250 },
        school: { sourceId: 'school-a', distanceMeters: 500 },
      },
    });
    expect(model.buildingAvailability.total).toBe(1);
    expect(model.buildingAvailability.buildings.map(({ id }) => id)).toEqual(['gangnam-evidence-tower']);
    expect(model.buildingAvailability.buildings[0]?.proximity).toMatchObject({
      coordinateStatus: 'ready',
      nearestStation: { sourceId: 'station-a', distanceMeters: 250 },
      nearestSchool: { sourceId: 'school-a', distanceMeters: 500 },
    });
    const html = renderToStaticMarkup(<AreaExplorer model={model} />);
    expect(html).toContain('Nearest station · straight-line distance');
    expect(html).toContain('Same name · 2호선 · 250 m');
    expect(html).toContain('School proximity · straight-line distance');
    expect(html).toContain('School A · 500 m');
    expect(html).toContain('href="/kr/seoul/explore/?district=gangnam-gu&amp;station=station-a&amp;stationDistance=250&amp;school=school-a&amp;schoolDistance=500"');
  });

  it('renders deterministic station lines for both distinct same-name building facts', () => {
    const model = buildPublicAreaExploreModel('gangnam-gu', dependencies());
    if (model.status !== 'ready') throw new Error('Expected ready Explore model.');
    const html = renderToStaticMarkup(<AreaExplorer model={model} />);

    expect(html).toContain('Same name · 2호선 · 250 m');
    expect(html).toContain('Same name · 경의중앙선 · 750 m');
  });

  it('localizes and serializes Explore view anchors with both proximity pairs', () => {
    const model = buildPublicAreaExploreModel(
      'gangnam-gu', dependencies(), undefined, '', {}, 1, undefined,
      { station: 'station-a', stationDistance: '250', school: 'school-a', schoolDistance: '500' },
    );
    if (model.status !== 'ready') throw new Error('Expected ready Explore model.');
    const html = renderToStaticMarkup(<AreaExplorer
      model={model}
      locale="ko"
      initialSelection={{
        market: 'kr', transaction: 'monthly', area: '60-85', propertyType: 'apartment',
        district: 'gangnam-gu', neighborhood: 'yeoksam-dong', buildingId: 'gangnam-evidence-tower',
        contractType: 'renewal', sort: 'median-asc', view: 'table',
      }}
    />);

    expect(html).toContain('data-explore-view="table"');
    expect(html).toContain('aria-label="탐색 보기"');
    for (const parameter of [
      'transaction=monthly',
      'area=60-85',
      'propertyType=apartment',
      'district=gangnam-gu',
      'contractType=renewal',
      'sort=median-asc',
      'station=station-a',
      'stationDistance=250',
      'school=school-a',
      'schoolDistance=500',
    ]) expect(html).toContain(parameter);
    expect(html).not.toContain('data-map-district-anchor');
  });

  it('renders evidence and contract-group actions with the full active Explore state', () => {
    const model = buildPublicAreaExploreModel(
      'gangnam-gu', dependencies(), undefined, 'tower',
      { transaction: 'monthly', areaBand: '60-85', housingType: 'apartment', contractGroup: 'renewal' },
      2,
      'gangnam-evidence-tower',
      { station: 'station-a', stationDistance: '250', school: 'school-a', schoolDistance: '500' },
    );
    expect(model.status).toBe('ready');
    if (model.status !== 'ready') return;
    const html = renderToStaticMarkup(<AreaExplorer
      model={model}
      initialQuery="tower"
      initialSelection={{
        market: 'kr', transaction: 'monthly', area: '60-85', propertyType: 'apartment',
        district: 'gangnam-gu', neighborhood: 'yeoksam-dong', buildingId: 'gangnam-evidence-tower',
        contractType: 'renewal', view: 'table',
      }}
    />);
    expect(html).toContain('q=tower');
    expect(html).toContain('view=table');
    expect(html).toContain('station=station-a');
    expect(html).toContain('school=school-a');
  });

  it.each([
    ['station-only', { station: 'station-a', stationDistance: '250' }, ['gangnam-evidence-tower']],
    ['school-only', { school: 'school-a', schoolDistance: '500' }, ['gangnam-evidence-tower', 'gangnam-large-detached']],
    ['station-and-school', { station: 'station-a', stationDistance: '250', school: 'school-a', schoolDistance: '500' }, ['gangnam-evidence-tower']],
  ] as const)('applies %s thresholds before the Explore total and page', (_label, query, expected) => {
    const model = buildPublicAreaExploreModel('gangnam-gu', dependencies(), undefined, '', {}, 1, undefined, query);
    expect(model.status).toBe('ready');
    if (model.status !== 'ready' || model.buildingAvailability.status !== 'ready') return;
    expect(model.buildingAvailability.total).toBe(expected.length);
    expect(model.buildingAvailability.buildings.map(({ id }) => id)).toEqual(expected);
  });

  it('keeps pending-coordinate buildings in normal Explore output and labels their distance as unconfirmed', () => {
    const model = buildPublicAreaExploreModel('jongno-gu', dependencies());
    expect(model.status).toBe('ready');
    if (model.status !== 'ready' || model.buildingAvailability.status !== 'ready') return;
    expect(model.buildingAvailability.buildings[0]?.proximity).toEqual({
      coordinateStatus: 'pending_coordinate', nearestStation: null, nearestSchool: null,
    });
    expect(renderToStaticMarkup(<AreaExplorer model={model} />)).toContain('Distance not confirmed');
  });

  it('updates and clears each proximity pair atomically while retaining unrelated selection state', () => {
    const href = '/kr/seoul/explore/?transaction=monthly&area=60-85&propertyType=apartment&district=gangnam-gu&neighborhood=yeoksam-dong&buildingId=gangnam-evidence-tower&contractType=renewal&view=table&q=tower&buildingPage=2&station=station-a&stationDistance=250&school=school-a&schoolDistance=500';
    const stationChanged = new URL(createKoreaProximitySelectorHref(href, 'station', 'station-b', '750'), 'https://signedprice.invalid');
    expect(Object.fromEntries(stationChanged.searchParams)).toMatchObject({
      transaction: 'monthly', area: '60-85', propertyType: 'apartment', district: 'gangnam-gu',
      neighborhood: 'yeoksam-dong', buildingId: 'gangnam-evidence-tower', contractType: 'renewal',
      view: 'table', q: 'tower', station: 'station-b', stationDistance: '750', school: 'school-a', schoolDistance: '500',
    });
    expect(stationChanged.searchParams.has('buildingPage')).toBe(false);

    const stationCleared = new URL(createKoreaProximitySelectorHref(stationChanged.pathname + stationChanged.search, 'station', '', '750'), 'https://signedprice.invalid');
    expect(stationCleared.searchParams.has('station')).toBe(false);
    expect(stationCleared.searchParams.has('stationDistance')).toBe(false);
    expect(stationCleared.searchParams.get('school')).toBe('school-a');
    expect(stationCleared.searchParams.get('buildingId')).toBe('gangnam-evidence-tower');

    const schoolCleared = new URL(createKoreaProximitySelectorHref(stationCleared.pathname + stationCleared.search, 'school', 'school-a', ''), 'https://signedprice.invalid');
    expect(schoolCleared.searchParams.has('school')).toBe(false);
    expect(schoolCleared.searchParams.has('schoolDistance')).toBe(false);
  });

  it('preserves both proximity pairs across building selection links', () => {
    const model = buildPublicAreaExploreModel('gangnam-gu', dependencies());
    if (model.status !== 'ready' || model.buildingAvailability.status !== 'ready') throw new Error('expected ready buildings');
    expect(createExploreBuildingSelectionHref(
      model.buildingAvailability.buildings[0]!,
      {
        market: 'kr', transaction: 'jeonse', district: 'gangnam-gu',
        station: 'station-a', stationDistance: 250,
        school: 'school-a', schoolDistance: 500,
      },
      'en',
    )).toContain('station=station-a&stationDistance=250&school=school-a&schoolDistance=500');
  });

  it('keeps existing Explore content usable and disables filters when proximity is unavailable', () => {
    const model = buildPublicAreaExploreModel('gangnam-gu', dependencies(Object.freeze({ state: 'missing' })), undefined, '', {}, 1, undefined, {
      station: 'station-a', stationDistance: '250',
    });
    expect(model.status).toBe('ready');
    if (model.status !== 'ready' || model.buildingAvailability.status !== 'ready') return;
    expect(model.buildingAvailability.total).toBe(2);
    const html = renderToStaticMarkup(<AreaExplorer model={model} />);
    expect(html).toContain('Proximity data unavailable');
    expect(html).not.toContain('data-proximity-selectors="enabled"');
  });

  it('keeps Explore usable and explicitly marks an invalid configured proximity source', () => {
    const model = buildPublicAreaExploreModel('gangnam-gu', dependencies(Object.freeze({ state: 'invalid' })), undefined, '', {}, 1, undefined, {
      station: 'station-a', stationDistance: '250',
    });
    expect(model.status).toBe('ready');
    if (model.status !== 'ready' || model.buildingAvailability.status !== 'ready') return;
    expect(model.buildingAvailability.total).toBe(2);
    const html = renderToStaticMarkup(<AreaExplorer model={model} />);
    expect(html).toContain('data-proximity-state="invalid"');
    expect(html).toContain('Proximity data unavailable.');
    expect(html).not.toContain('data-proximity-selectors="enabled"');
  });
});
