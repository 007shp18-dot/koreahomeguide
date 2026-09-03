import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  buildHomeFeaturedBuildings,
  homeFeaturedAddressFor,
} from '../lib/public-market/home-featured-buildings.server';
import {
  createObservedBuildingInventoryFixture,
  OBSERVED_BUILDING_FIXTURE_PERIOD,
} from './observed-building-fixture';

afterEach(() => vi.unstubAllEnvs());

describe('home featured buildings', () => {
  it('uses coordinate-ready verified building identities for live map media', () => {
    vi.stubEnv(
      'SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT',
      JSON.stringify(createObservedBuildingInventoryFixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', OBSERVED_BUILDING_FIXTURE_PERIOD);

    expect(buildHomeFeaturedBuildings()).toEqual([
      {
        id: 'gangnam-evidence-tower',
        name: 'Evidence Tower',
        location: '역삼동 · Gangnam-gu',
        latitude: 37.5001,
        longitude: 127.0352,
        addressQuery: '서울특별시 강남구 역삼동 Evidence Tower',
        observationLabel: '8 reported contracts',
        periodLabel: '2026-01–2026-07',
        href: '/kr/seoul/explore/gangnam-gu/gangnam-evidence-tower/',
      },
    ]);
  });

  it('uses verified road addresses for the rotating production media pool', () => {
    expect(homeFeaturedAddressFor('songpa-gu-1j88w6f', 'fallback')).toBe(
      '서울특별시 송파구 송파대로 345',
    );
    expect(homeFeaturedAddressFor('songpa-gu-1lqiba6', 'fallback')).toBe(
      '서울특별시 송파구 올림픽로 99',
    );
    expect(homeFeaturedAddressFor('future-building', 'verified fallback')).toBe(
      'verified fallback',
    );
  });

  it('fails closed instead of inventing a photo or building when evidence is unavailable', () => {
    vi.stubEnv('SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS', 'false');
    vi.stubEnv('SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT', undefined);

    expect(buildHomeFeaturedBuildings()).toEqual([]);
  });
});
