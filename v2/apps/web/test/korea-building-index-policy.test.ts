import type {
  KoreaRentEvidenceBuildingRecord,
  KoreaRentEvidenceCohort,
} from '@signedprice/korea-rent';
import { describe, expect, it } from 'vitest';

import {
  KOREA_BUILDING_INDEX_MINIMUM,
  isKoreaBuildingIndexable,
  koreaBuildingEvidenceDepth,
  listIndexableKoreaBuildingRouteParams,
  listKoreaBuildingDirectory,
} from '@/lib/public-market/korea-building-index-policy';

function cohort(input: Readonly<{
  transaction?: 'jeonse' | 'monthly';
  areaBand?: 'all' | 'under-40' | '40-60';
  contractGroup?: 'all' | 'new' | 'renewal';
  n: number;
  published: boolean;
}>): KoreaRentEvidenceCohort {
  const primary = input.published
    ? {
        n: input.n,
        published: true as const,
        min: 1, p25: 2, med: 3, p75: 4, max: 5, chg3m: null,
      }
    : { n: input.n, published: false as const };
  return {
    transaction: input.transaction ?? 'jeonse',
    areaBand: input.areaBand ?? 'all',
    contractGroup: input.contractGroup ?? 'all',
    primaryMetric: 'deposit',
    primary,
    filedDeposit: null,
  } as KoreaRentEvidenceCohort;
}

function building(
  buildingId: string,
  districtSlug: string,
  cohorts: readonly KoreaRentEvidenceCohort[],
  identity: Readonly<{
    officialName?: string;
    neighborhoodName?: string;
  }> = {},
): KoreaRentEvidenceBuildingRecord {
  return {
    buildingId,
    districtSlug,
    neighborhoodId: 'n-1',
    neighborhoodName: identity.neighborhoodName ?? '가락동',
    officialName: identity.officialName ?? '헬리오시티',
    housingType: 'apartment',
    cohorts,
    recentTransactions: [],
  } as unknown as KoreaRentEvidenceBuildingRecord;
}

describe('koreaBuildingEvidenceDepth', () => {
  it('takes the widest published all/all cohort across transactions', () => {
    const record = building('b1', 'songpa-gu', [
      cohort({ transaction: 'jeonse', n: 12, published: true }),
      cohort({ transaction: 'monthly', n: 80, published: true }),
    ]);
    expect(koreaBuildingEvidenceDepth(record)).toBe(80);
  });

  it('does not sum overlapping cohorts', () => {
    // 40 jeonse contracts also appear in narrower bands and contract groups.
    // Summing would report a depth the page cannot actually show.
    const record = building('b2', 'songpa-gu', [
      cohort({ n: 40, published: true }),
      cohort({ areaBand: '40-60', n: 25, published: true }),
      cohort({ contractGroup: 'new', n: 22, published: true }),
    ]);
    expect(koreaBuildingEvidenceDepth(record)).toBe(40);
  });

  it('ignores withheld cohorts even when their sample is large', () => {
    const record = building('b3', 'songpa-gu', [
      cohort({ n: 400, published: false }),
    ]);
    expect(koreaBuildingEvidenceDepth(record)).toBe(0);
  });

  it('ignores narrower cohorts, which describe a slice and not the building', () => {
    const record = building('b4', 'songpa-gu', [
      cohort({ areaBand: '40-60', n: 90, published: true }),
      cohort({ contractGroup: 'renewal', n: 90, published: true }),
    ]);
    expect(koreaBuildingEvidenceDepth(record)).toBe(0);
  });
});

describe('isKoreaBuildingIndexable', () => {
  it('admits a building at the minimum and refuses the one below it', () => {
    const at = building('at', 'songpa-gu', [
      cohort({ n: KOREA_BUILDING_INDEX_MINIMUM, published: true }),
    ]);
    const below = building('below', 'songpa-gu', [
      cohort({ n: KOREA_BUILDING_INDEX_MINIMUM - 1, published: true }),
    ]);
    expect(isKoreaBuildingIndexable(at)).toBe(true);
    expect(isKoreaBuildingIndexable(below)).toBe(false);
  });

  it('accepts a wave minimum so the next wave is one argument', () => {
    const record = building('b', 'songpa-gu', [cohort({ n: 20, published: true })]);
    expect(isKoreaBuildingIndexable(record, 20)).toBe(true);
    expect(isKoreaBuildingIndexable(record, 21)).toBe(false);
  });
});

describe('listIndexableKoreaBuildingRouteParams', () => {
  const records = [
    building('z-deep', 'songpa-gu', [cohort({ n: 90, published: true })]),
    building('a-deep', 'gangnam-gu', [cohort({ n: 51, published: true })]),
    building('shallow', 'gangnam-gu', [cohort({ n: 6, published: true })]),
    building('withheld', 'gangnam-gu', [cohort({ n: 900, published: false })]),
  ];

  it('returns only the buildings the route will answer as indexable', () => {
    expect(listIndexableKoreaBuildingRouteParams(records)).toEqual([
      { district: 'gangnam-gu', buildingId: 'a-deep' },
      { district: 'songpa-gu', buildingId: 'z-deep' },
    ]);
  });

  it('is stable, so the sitemap does not churn between builds', () => {
    const once = listIndexableKoreaBuildingRouteParams(records);
    const again = listIndexableKoreaBuildingRouteParams([...records].reverse());
    expect(again).toEqual(once);
  });

  it('returns nothing when evidence is unavailable rather than guessing', () => {
    expect(listIndexableKoreaBuildingRouteParams([])).toEqual([]);
  });
});

describe('listKoreaBuildingDirectory', () => {
  const records = [
    building('same-name-b', 'songpa-gu', [cohort({ n: 70, published: true })], {
      officialName: '같은 이름',
      neighborhoodName: '잠실동',
    }),
    building('shallower', 'songpa-gu', [cohort({ n: 50, published: true })], {
      officialName: '가장 앞 이름',
    }),
    building('same-name-a', 'songpa-gu', [cohort({ n: 70, published: true })], {
      officialName: '같은 이름',
      neighborhoodName: '문정동',
    }),
    building('other-district', 'gangnam-gu', [cohort({ n: 80, published: true })]),
    building('below-gate', 'songpa-gu', [cohort({ n: 49, published: true })]),
  ];

  it('links exactly the district subset that the sitemap gate offers', () => {
    const sitemapHrefs = listIndexableKoreaBuildingRouteParams(records)
      .map(({ district, buildingId }) => `/kr/seoul/explore/${district}/${buildingId}/`)
      .sort();
    const directoryHrefs = [
      ...listKoreaBuildingDirectory(records, 'gangnam-gu'),
      ...listKoreaBuildingDirectory(records, 'songpa-gu'),
    ].map(({ href }) => href).sort();

    expect(directoryHrefs).toEqual(sitemapHrefs);
  });

  it('sorts by contracts descending, Korean name, then building id stably', () => {
    const expected = ['same-name-a', 'same-name-b', 'shallower'];

    expect(listKoreaBuildingDirectory(records, 'songpa-gu').map(({ buildingId }) => buildingId))
      .toEqual(expected);
    expect(listKoreaBuildingDirectory([...records].reverse(), 'songpa-gu')
      .map(({ buildingId }) => buildingId))
      .toEqual(expected);
  });

  it('returns complete entries and supports the next wave minimum', () => {
    expect(listKoreaBuildingDirectory(records, 'songpa-gu', 49)).toContainEqual({
      buildingId: 'below-gate',
      districtSlug: 'songpa-gu',
      name: '헬리오시티',
      neighborhoodName: '가락동',
      contracts: 49,
      href: '/kr/seoul/explore/songpa-gu/below-gate/',
    });
  });

  it('returns nothing when evidence is unavailable', () => {
    expect(listKoreaBuildingDirectory([], 'songpa-gu')).toEqual([]);
  });
});
