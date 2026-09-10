import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  buildPublicPropertyTypeModel,
  listPublicPropertyTypeRouteParams,
} from '../lib/public-market/property-type-route-model.server';
import {
  createPublicBuildingFixture,
  createPublicBuildingRecord,
  PUBLIC_BUILDING_FIXTURE_PERIOD,
} from './public-building-fixture';

const won = 100_000_000;

function recentContracts(values: readonly number[]) {
  return values.map((depositWon, index) => ({
    filedMonth: `2026-${String(7 - index).padStart(2, '0')}`,
    areaSqm: 50,
    contractType: index < 3 ? 'new' : 'renewal',
    depositWon,
  }));
}

function publishedRecord(overrides: Readonly<Record<string, unknown>> = {}) {
  return createPublicBuildingRecord({
    recentContracts: recentContracts([6, 5, 4, 3, 2, 1].map((value) => value * won)),
    ...overrides,
  });
}

const dependencies = (records: readonly Record<string, unknown>[]) => ({
  source: createPublicBuildingFixture(records),
  period: PUBLIC_BUILDING_FIXTURE_PERIOD,
});

describe('public district property-type route model', () => {
  it('aggregates only retained recent contracts into a distinct apartment distribution', () => {
    const model = buildPublicPropertyTypeModel(
      'gangnam-gu',
      'apartment',
      dependencies([publishedRecord()]),
    );

    expect(model).toMatchObject({
      status: 'ready',
      district: { slug: 'gangnam-gu', nameEn: 'Gangnam-gu' },
      propertyType: {
        slug: 'apartment',
        sourceValue: 'apartment',
        label: 'Apartments',
      },
      coverage: {
        retainedBuildings: 1,
        contributingBuildings: 1,
        retainedContracts: 6,
        publicationMinimum: 5,
      },
      distribution: {
        n: 6,
        min: 100_000_000,
        p25: 225_000_000,
        med: 350_000_000,
        p75: 475_000_000,
        max: 600_000_000,
        chg3m: null,
      },
      evidence: {
        provider: 'MOLIT',
        dataset: 'reported rent contracts',
        period: PUBLIC_BUILDING_FIXTURE_PERIOD,
        coverageNote: 'Distribution uses 6 retained recent contracts from 1 published building; it is not the complete district/type contract history.',
      },
    });
    expect(model?.buildings).toEqual([
      {
        id: 'gangnam-evidence-tower',
        name: 'Evidence Tower',
        neighborhoodName: '역삼동',
        sampleCount: 6,
        href: '/kr/seoul/explore/gangnam-gu/gangnam-evidence-tower/',
      },
    ]);
  });

  it('maps villa to villa_multifamily while rejecting unsupported public slugs', () => {
    const villa = publishedRecord({
      buildingId: 'gangnam-villa-evidence',
      housingType: 'villa_multifamily',
      name: 'Villa Evidence',
    });
    expect(buildPublicPropertyTypeModel(
      'gangnam-gu', 'villa', dependencies([villa]),
    )?.propertyType).toEqual({
      slug: 'villa',
      sourceValue: 'villa_multifamily',
      label: 'Villas and multifamily homes',
    });
    expect(buildPublicPropertyTypeModel(
      'gangnam-gu', 'studio', dependencies([villa]),
    )).toBeNull();
  });

  it('withholds a combination below the retained-contract publication minimum', () => {
    const sparse = publishedRecord({
      recentContracts: recentContracts([4, 3, 2, 1].map((value) => value * won)),
    });
    expect(buildPublicPropertyTypeModel(
      'gangnam-gu', 'apartment', dependencies([sparse]),
    )).toBeNull();
  });

  it('lists only evidence-ready district and public property-type combinations', () => {
    const records = [
      publishedRecord(),
      publishedRecord({
        buildingId: 'gangnam-office-evidence',
        housingType: 'officetel',
        name: 'Office Evidence',
      }),
      publishedRecord({
        buildingId: 'gangnam-villa-evidence',
        housingType: 'villa_multifamily',
        name: 'Villa Evidence',
      }),
      publishedRecord({
        buildingId: 'jongno-sparse-office',
        districtSlug: 'jongno-gu',
        neighborhoodId: 'jongno-dong',
        neighborhoodName: '종로동',
        housingType: 'officetel',
        recentContracts: recentContracts([4, 3, 2, 1].map((value) => value * won)),
      }),
    ];

    expect(listPublicPropertyTypeRouteParams(dependencies(records))).toEqual([
      { district: 'gangnam-gu', propertyType: 'apartment' },
      { district: 'gangnam-gu', propertyType: 'officetel' },
      { district: 'gangnam-gu', propertyType: 'villa' },
    ]);
  });

  it('fails closed for invalid artifacts and cross-district requests', () => {
    expect(buildPublicPropertyTypeModel('gangnam-gu', 'apartment', {
      source: { invalid: true },
      period: PUBLIC_BUILDING_FIXTURE_PERIOD,
    })).toBeNull();
    expect(buildPublicPropertyTypeModel(
      'jongno-gu', 'apartment', dependencies([publishedRecord()]),
    )).toBeNull();
  });
});
