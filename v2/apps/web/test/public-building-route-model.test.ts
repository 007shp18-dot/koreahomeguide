import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createPublicBuildingRepository,
  PublicBuildingSummaryUnavailableError,
} from '../lib/public-market/building-summary-repository.server';
import { buildPublicBuildingModel } from '../lib/public-market/building-route-model.server';
import {
  PUBLIC_BUILDING_FIXTURE_PERIOD,
  createPublicBuildingFixture,
  createPublicBuildingRecord,
} from './public-building-fixture';

const expected = { marketId: 'kr-seoul' as const, period: PUBLIC_BUILDING_FIXTURE_PERIOD };

describe('public building repository', () => {
  it('lists only rights-cleared published building routes and preserves identity', () => {
    const withheld = createPublicBuildingRecord({
      buildingId: 'gangnam-withheld-tower',
      name: 'Withheld Tower',
      groups: {
        all: { n: 4, published: false },
        new: { n: 2, published: false },
        renewal: { n: 1, published: false },
      },
      unknownContractCount: 1,
      areaBands: [],
      recentContracts: [],
    });
    const repository = createPublicBuildingRepository({
      source: createPublicBuildingFixture([createPublicBuildingRecord(), withheld]),
      expected,
    });

    expect(repository.listByDistrict('gangnam-gu').map(({ buildingId }) => buildingId))
      .toEqual(['gangnam-evidence-tower']);
    expect(repository.listRouteParams()).toEqual([
      { district: 'gangnam-gu', buildingId: 'gangnam-evidence-tower' },
    ]);
    expect(repository.getById('gangnam-gu', 'gangnam-evidence-tower').name)
      .toBe('Evidence Tower');
    expect(() => repository.getById('gangnam-gu', 'gangnam-withheld-tower'))
      .toThrow(PublicBuildingSummaryUnavailableError);
  });

  it('sanitizes invalid, missing, and cross-district lookups', () => {
    expect(() => createPublicBuildingRepository({ source: null, expected }))
      .toThrow(PublicBuildingSummaryUnavailableError);
    const repository = createPublicBuildingRepository({
      source: createPublicBuildingFixture(), expected,
    });
    expect(() => repository.getById('jongno-gu', 'gangnam-evidence-tower'))
      .toThrow('Verified public building summary is unavailable.');
  });
});

describe('public building route model', () => {
  it('derives a complete money-safe display model from one building record', () => {
    const model = buildPublicBuildingModel('gangnam-gu', 'gangnam-evidence-tower', {
      source: createPublicBuildingFixture(),
      period: PUBLIC_BUILDING_FIXTURE_PERIOD,
    });

    expect(model).toMatchObject({
      status: 'ready',
      district: { slug: 'gangnam-gu', nameEn: 'Gangnam-gu' },
      building: {
        buildingId: 'gangnam-evidence-tower',
        name: 'Evidence Tower',
        housingType: 'apartment',
      },
      display: {
        sampleLabel: '6 reported contracts',
        medianLabel: '₩320,000,000',
      },
      evidence: {
        provider: 'MOLIT',
        period: PUBLIC_BUILDING_FIXTURE_PERIOD,
        publicationMinimum: 5,
      },
    });
    expect(Object.isFrozen(model)).toBe(true);
  });

  it('returns null for missing, mismatched, withheld, or invalid evidence', () => {
    const withheld = createPublicBuildingRecord({
      groups: {
        all: { n: 4, published: false },
        new: { n: 2, published: false },
        renewal: { n: 1, published: false },
      },
      unknownContractCount: 1,
      areaBands: [], recentContracts: [],
    });
    expect(buildPublicBuildingModel('gangnam-gu', 'gangnam-evidence-tower', {
      source: createPublicBuildingFixture([withheld]), period: PUBLIC_BUILDING_FIXTURE_PERIOD,
    })).toBeNull();
    expect(buildPublicBuildingModel('jongno-gu', 'gangnam-evidence-tower', {
      source: createPublicBuildingFixture(), period: PUBLIC_BUILDING_FIXTURE_PERIOD,
    })).toBeNull();
    expect(buildPublicBuildingModel('gangnam-gu', 'missing', {
      source: createPublicBuildingFixture(), period: PUBLIC_BUILDING_FIXTURE_PERIOD,
    })).toBeNull();
    expect(buildPublicBuildingModel('gangnam-gu', 'gangnam-evidence-tower', {
      source: { invalid: true }, period: PUBLIC_BUILDING_FIXTURE_PERIOD,
    })).toBeNull();
  });
});
