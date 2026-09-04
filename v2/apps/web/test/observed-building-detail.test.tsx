import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  BuildingProximityDisclosure,
  ObservedBuildingDetail,
} from '../components/public-market/observed-building-detail';
import BuildingRoute, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from '../app/(en)/kr/seoul/explore/[district]/[buildingId]/page';
import KoreanBuildingRoute from '../app/(ko)/ko/kr/seoul/explore/[district]/[buildingId]/page';
import { buildObservedBuildingIdentityModel } from '../lib/public-market/observed-building-route-model.server';
import type { KoreaProximityRepositoryState } from '../lib/public-market/korea-proximity-repository.server';
import {
  OBSERVED_BUILDING_FIXTURE_PERIOD,
  createObservedBuildingInventoryFixture,
} from './observed-building-fixture';

afterEach(() => vi.unstubAllEnvs());

function identityModel() {
  const model = buildObservedBuildingIdentityModel('jongno-gu', 'jongno-monthly-home', {
    source: createObservedBuildingInventoryFixture(),
    period: OBSERVED_BUILDING_FIXTURE_PERIOD,
  });
  if (model === null) throw new Error('Expected observed building identity model.');
  return model;
}

describe('observed building detail', () => {
  it('renders verified identity and observation counts without fabricating a price', () => {
    const html = renderToStaticMarkup(
      <ObservedBuildingDetail
        model={identityModel()}
        backHref="/kr/seoul/explore/?district=jongno-gu&contractType=monthly"
      />,
    );

    for (const value of [
      'Monthly Home', 'Jongno-gu', '사직동', 'officetel',
      '1 observed contract', 'Monthly rent', '2026-06',
      'MOLIT reported rent contracts', 'Price evidence unavailable',
      'Coordinate verification pending',
    ]) {
      expect(html).toContain(value);
    }
    expect(html).toContain('data-building-detail="identity-only"');
    expect(html).toContain('href="/kr/seoul/explore?district=jongno-gu&amp;contractType=monthly"');
    expect(html).toContain('href="/trust/"');
    expect(html).toContain('href="/kr/seoul/corrections/"');
    expect(html).not.toMatch(/₩|KRW|median|average price/i);
    expect(html).not.toContain('Check this contract');
    expect(html).not.toContain('role="tablist"');
  });

  it('resolves non-prerendered observed identities with noindex metadata', async () => {
    vi.stubEnv(
      'SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT',
      JSON.stringify(createObservedBuildingInventoryFixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', OBSERVED_BUILDING_FIXTURE_PERIOD);
    const params = Promise.resolve({
      district: 'jongno-gu', buildingId: 'jongno-monthly-home',
    });
    const searchParams = Promise.resolve({
      transaction: 'monthly',
      district: 'jongno-gu',
      neighborhood: 'sajik-dong',
      buildingId: 'jongno-monthly-home',
      contractType: 'all',
    });

    expect(dynamicParams).toBe(true);
    expect(generateStaticParams()).not.toContainEqual({
      district: 'jongno-gu', buildingId: 'jongno-monthly-home',
    });
    const metadata = await generateMetadata({ params, searchParams });
    expect(metadata).toMatchObject({
      title: 'Monthly Home observed building | signedprice',
      robots: { index: false, follow: true },
    });
    expect(metadata).not.toHaveProperty('alternates');

    const html = renderToStaticMarkup(await BuildingRoute({ params, searchParams }));
    expect(html).toContain('data-building-detail="identity-only"');
    expect(html).toContain('Monthly Home');
    expect(html).toContain(
      'href="/kr/seoul/explore?transaction=monthly&amp;district=jongno-gu&amp;neighborhood=sajik-dong&amp;buildingId=jongno-monthly-home&amp;contractType=all"',
    );
  });

  it('composes the Korean identity route with Korean proximity disclosure copy', async () => {
    vi.stubEnv(
      'SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT',
      JSON.stringify(createObservedBuildingInventoryFixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', OBSERVED_BUILDING_FIXTURE_PERIOD);
    const html = renderToStaticMarkup(await KoreanBuildingRoute({
      params: Promise.resolve({ district: 'jongno-gu', buildingId: 'jongno-monthly-home' }),
      searchParams: Promise.resolve({}),
    }));

    expect(html).toContain('인접성 데이터를 확인할 수 없습니다.');
    expect(html).not.toContain('Proximity data unavailable');
  });

  it('checks the approved-photo registry before the verified location fallback', async () => {
    vi.stubEnv(
      'SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT',
      JSON.stringify(createObservedBuildingInventoryFixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', OBSERVED_BUILDING_FIXTURE_PERIOD);
    vi.stubEnv('NAVER_MAP_CLIENT_ID', 'detail-naver-client');
    const html = renderToStaticMarkup(await BuildingRoute({
      params: Promise.resolve({
        district: 'gangnam-gu', buildingId: 'gangnam-large-detached',
      }),
      searchParams: Promise.resolve({}),
    }));

    expect(html).toContain('data-building-detail="identity-only"');
    expect(html).toContain('data-building-media="google-place-photo"');
    expect(html).toContain('Loading verified place photo');
    expect(html).not.toContain('not a listing photo');
  });

  it('renders English ready provenance and methodology without Korean copy', () => {
    const proximity = {
      status: 'ready' as const,
      coordinateStatus: 'ready' as const,
      nearestStation: { sourceId: 'SEOUL:STN/001', name: 'City Hall', lines: ['1', '2'], distanceMeters: 278.6 },
      nearestSchool: { sourceId: 'SEOUL:SCH/001', name: 'Seoul Elementary', distanceMeters: 341.2 },
      provenance: {
        stationSource: { landingPage: 'https://data.seoul.go.kr/stations', sourceVersion: '2026-08', asOf: '2026-08-31' },
        schoolSource: { landingPage: 'https://school.example.test/', sourceVersion: '2026-08', asOf: '2026-08-31' },
        coordinateSource: { landingPage: 'https://coordinates.example.test/', sourceVersion: '2026-08', asOf: '2026-08-31' },
        methodology: 'WGS84 Haversine straight-line metres' as const,
      },
    };
    const html = renderToStaticMarkup(<BuildingProximityDisclosure proximity={proximity} locale="en" />);

    for (const value of [
      'Nearest station · straight-line distance', 'School proximity · straight-line distance',
      'City Hall · 1, 2 · 279 m', 'Seoul Elementary · 341 m',
      'Station source', 'School source', 'Coordinate source', 'Methodology',
      'Version 2026-08', 'As of 2026-08-31', 'WGS84 Haversine straight-line metres',
      'School proximity is not an attendance-zone assignment.',
    ]) expect(html).toContain(value);
    expect(html).not.toContain('직선거리');
    expect(html).not.toContain('배정 학군');
  });

  it('renders Korean ready provenance and methodology without English disclosure copy', () => {
    const proximity = {
      status: 'ready' as const,
      coordinateStatus: 'ready' as const,
      nearestStation: { sourceId: 'SEOUL:STN/001', name: '시청역', lines: ['1', '2'], distanceMeters: 278.6 },
      nearestSchool: { sourceId: 'SEOUL:SCH/001', name: '서울초등학교', distanceMeters: 341.2 },
      provenance: {
        stationSource: { landingPage: 'https://data.seoul.go.kr/stations', sourceVersion: '2026-08', asOf: '2026-08-31' },
        schoolSource: { landingPage: 'https://school.example.test/', sourceVersion: '2026-08', asOf: '2026-08-31' },
        coordinateSource: { landingPage: 'https://coordinates.example.test/', sourceVersion: '2026-08', asOf: '2026-08-31' },
        methodology: 'WGS84 Haversine straight-line metres' as const,
      },
    };
    const html = renderToStaticMarkup(<BuildingProximityDisclosure proximity={proximity} locale="ko" />);

    for (const value of [
      '가까운 역 · 직선거리', '학교 인접성 · 직선거리',
      '시청역 · 1, 2 · 279 m', '서울초등학교 · 341 m',
      '역 출처', '학교 출처', '좌표 출처', '산정 방법', '버전 2026-08', '기준 2026-08-31',
      'WGS84 Haversine straight-line metres · 직선거리',
      '학교 인접성은 배정 학군이 아닙니다.',
    ]) expect(html).toContain(value);
    expect(html).not.toContain('Nearest station');
    expect(html).not.toContain('attendance-zone assignment');
  });

  it.each([
    ['en', 'pending_coordinate', 'Distance not confirmed'],
    ['ko', 'pending_coordinate', '거리 미확정'],
    ['en', 'missing', 'Proximity data unavailable'],
    ['ko', 'invalid', '인접성 데이터를 확인할 수 없습니다.'],
  ] as const)('renders %s %s proximity state', (locale, state, expected) => {
    const proximity = state === 'pending_coordinate'
      ? {
          status: 'ready' as const,
          coordinateStatus: 'pending_coordinate' as const,
          nearestStation: null,
          nearestSchool: null,
          provenance: {
            stationSource: { landingPage: 'https://data.seoul.go.kr/stations', sourceVersion: '2026-08', asOf: '2026-08-31' },
            schoolSource: { landingPage: 'https://school.example.test/', sourceVersion: '2026-08', asOf: '2026-08-31' },
            coordinateSource: { landingPage: 'https://coordinates.example.test/', sourceVersion: '2026-08', asOf: '2026-08-31' },
            methodology: 'WGS84 Haversine straight-line metres' as const,
          },
        }
      : { status: state, coordinateStatus: 'unavailable', nearestStation: null, nearestSchool: null } as const;
    const html = renderToStaticMarkup(<BuildingProximityDisclosure proximity={proximity} locale={locale} />);
    expect(html).toContain(expected);
  });

  it.each([
    ['SEOUL:STN/SHINCHON-2', '2호선'],
    ['SEOUL:STN/SHINCHON-RAIL', '경의중앙선'],
  ] as const)('renders the line for same-name station %s on Detail', (sourceId, line) => {
    const html = renderToStaticMarkup(<BuildingProximityDisclosure proximity={{
      status: 'ready',
      coordinateStatus: 'ready',
      nearestStation: { sourceId, name: '신촌역', lines: [line], distanceMeters: 320 },
      nearestSchool: null,
    }} locale="ko" />);

    expect(html).toContain(`신촌역 · ${line} · 320 m`);
  });

  it('maps coordinate provenance from a ready repository into the identity detail model', () => {
    const proximity = {
      state: 'ready',
      repository: {
        findByBuildingId: () => ({
          status: 'ready',
          nearestStation: null,
          nearestSchool: null,
        }),
        getByBuildingId: () => ({
          status: 'ready',
          nearestStation: null,
          nearestSchool: null,
        }),
        getArtifact: () => ({
          provenance: {
            stationSource: { landingPage: 'https://station.example.test/', sourceVersion: 'stations-v1', asOf: '2026-08-31' },
            schoolSource: { landingPage: 'https://school.example.test/', sourceVersion: 'schools-v1', asOf: '2026-08-31' },
            coordinateSource: { landingPage: 'https://coordinate.example.test/', sourceVersion: 'coordinates-v1', asOf: '2026-08-31' },
            methodology: { distance: 'WGS84 Haversine straight-line metres' },
          },
        }),
      },
    } as unknown as KoreaProximityRepositoryState;
    const model = buildObservedBuildingIdentityModel('jongno-gu', 'jongno-monthly-home', {
      source: createObservedBuildingInventoryFixture(),
      period: OBSERVED_BUILDING_FIXTURE_PERIOD,
      proximityRepository: proximity,
    });

    expect(model?.proximity?.provenance).toEqual({
      stationSource: { landingPage: 'https://station.example.test/', sourceVersion: 'stations-v1', asOf: '2026-08-31' },
      schoolSource: { landingPage: 'https://school.example.test/', sourceVersion: 'schools-v1', asOf: '2026-08-31' },
      coordinateSource: { landingPage: 'https://coordinate.example.test/', sourceVersion: 'coordinates-v1', asOf: '2026-08-31' },
      methodology: 'WGS84 Haversine straight-line metres',
    });
  });
});
