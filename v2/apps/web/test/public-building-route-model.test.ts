import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createPublicBuildingRepository,
  PublicBuildingSummaryUnavailableError,
} from '../lib/public-market/building-summary-repository.server';
import {
  buildFloorCoefficientModel,
  buildPublicBuildingModel,
} from '../lib/public-market/building-route-model.server';
import {
  PUBLIC_BUILDING_FIXTURE_PERIOD,
  createPublicBuildingFixture,
  createPublicBuildingRecord,
} from './public-building-fixture';

const expected = { marketId: 'kr-seoul' as const, period: PUBLIC_BUILDING_FIXTURE_PERIOD };
const REFERENCE_INSTANT = '2026-09-01T00:00:00.000Z';

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
  it('withholds five eligible floor pairs and publishes equality at six', () => {
    const basis = 'Compared filed contracts in the same building and exact floor area where floor was the differing retained field. Coefficients stay blank when fewer than six eligible pairs remain.';

    expect(buildFloorCoefficientModel({ pairCount: 5, coefficient: 1.4 })).toEqual({
      status: 'unavailable',
      pairCount: 5,
      coefficient: null,
      reason: 'Contract evidence insufficient',
      basis,
    });
    expect(buildFloorCoefficientModel({ pairCount: 6, coefficient: 1.4 })).toEqual({
      status: 'published',
      pairCount: 6,
      coefficient: 1.4,
      reason: null,
      basis,
    });
  });

  it('derives a money-safe distribution and fails the uncounted change closed', () => {
    const model = buildPublicBuildingModel('gangnam-gu', 'gangnam-evidence-tower', {
      source: createPublicBuildingFixture(),
      period: PUBLIC_BUILDING_FIXTURE_PERIOD,
      referenceInstant: REFERENCE_INSTANT,
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
        change: {
          status: 'not_assessable',
          label: '3-month change not assessable',
          sampleLabel: null,
          reasons: ['Prior/latest sample counts were not retained in this snapshot.'],
        },
        changeLabel: '3-month change not assessable',
      },
      distribution: {
        published: true,
        n: 6,
        min: 300_000_000,
        p25: 310_000_000,
        med: 320_000_000,
        p75: 330_000_000,
        max: 340_000_000,
        chg3m: null,
      },
      period: {
        caveat: 'The aggregate period distribution includes filing-in-progress months. It remains published, but no change comparison uses those months as anchors.',
      },
      evidence: {
        provider: 'MOLIT',
        period: PUBLIC_BUILDING_FIXTURE_PERIOD,
        publicationMinimum: 5,
      },
      floorCoefficient: {
        status: 'unavailable',
        pairCount: 0,
        coefficient: null,
        reason: 'Contract evidence insufficient',
      },
    });
    expect(model?.period.months.filter(({ state }) => state === 'complete')).toHaveLength(6);
    expect(model?.period.months.filter(({ state }) => state === 'filing_in_progress')).toHaveLength(1);
    expect(model?.display.changeLabel).not.toContain('+1.2%');
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
