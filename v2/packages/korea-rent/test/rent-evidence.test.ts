import { describe, expect, it } from 'vitest';

import {
  buildKoreaRentEvidence,
  type KoreaRentEvidenceAreaRecord,
  type KoreaRentEvidenceBuildingRecord,
  type KoreaRentEvidenceCohort,
  type KoreaRentRecord,
  type SeoulDistrictSlug,
} from '../src';

const COMPLETED_MONTHS = [
  '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07',
] as const;

function record(
  input: Partial<KoreaRentRecord> & Pick<KoreaRentRecord, 'areaSqm' | 'depositWon' | 'monthlyRentWon'>,
): KoreaRentRecord {
  return {
    sourceHousingType: 'apartment',
    contractDate: '2026-07-15',
    contractType: 'new',
    recordStatus: 'active',
    legalDong: '대치동',
    buildingLabel: '검증아파트',
    ...input,
  };
}

function source(
  districtSlug: SeoulDistrictSlug,
  rentRecord: KoreaRentRecord,
) {
  return { districtSlug, record: rentRecord } as const;
}

function areaRecord(
  records: readonly KoreaRentEvidenceAreaRecord[],
  districtSlug: SeoulDistrictSlug | null,
  housingType: KoreaRentEvidenceAreaRecord['housingType'],
) {
  const result = records.find((item) => (
    item.districtSlug === districtSlug && item.housingType === housingType
  ));
  expect(result).toBeDefined();
  return result!;
}

function cohort(
  recordWithCohorts: Readonly<{ cohorts: readonly KoreaRentEvidenceCohort[] }>,
  input: Pick<KoreaRentEvidenceCohort, 'transaction' | 'areaBand' | 'contractGroup'>,
) {
  const result = recordWithCohorts.cohorts.find((item) => (
    item.transaction === input.transaction
    && item.areaBand === input.areaBand
    && item.contractGroup === input.contractGroup
  ));
  expect(result).toBeDefined();
  return result!;
}

function building(
  records: readonly KoreaRentEvidenceBuildingRecord[],
  name: string,
) {
  const result = records.find(({ officialName }) => officialName === name);
  expect(result).toBeDefined();
  return result!;
}

function fixture() {
  const records = [
    ...[100, 200, 300, 400, 500].map((million, index) => source('gangnam-gu', record({
      areaSqm: 45 + index,
      depositWon: million * 1_000_000,
      monthlyRentWon: 0,
      sourceRecordId: `a-jeonse-${index}`,
    }))),
    source('gangnam-gu', record({
      areaSqm: 30,
      depositWon: 80_000_000,
      monthlyRentWon: 0,
      sourceRecordId: 'a-jeonse-under',
    })),
    source('gangnam-gu', record({
      areaSqm: 70,
      depositWon: 600_000_000,
      monthlyRentWon: 0,
      sourceRecordId: 'a-jeonse-60',
    })),
    source('gangnam-gu', record({
      areaSqm: 90,
      depositWon: 700_000_000,
      monthlyRentWon: 0,
      sourceRecordId: 'a-jeonse-85',
    })),
    ...[50, 60, 70, 80, 90].map((rentManwon, index) => source('gangnam-gu', record({
      areaSqm: 50,
      depositWon: (50 - index * 10) * 1_000_000,
      monthlyRentWon: rentManwon * 10_000,
      sourceRecordId: `a-monthly-${index}`,
      contractType: index === 4 ? 'renewal' : 'new',
    }))),
    ...[100, 110, 120, 130].map((rentManwon, index) => source('mapo-gu', record({
      areaSqm: 90,
      depositWon: 10_000_000,
      monthlyRentWon: rentManwon * 10_000,
      legalDong: '연남동',
      buildingLabel: '표본부족빌라',
      sourceHousingType: 'villa',
      sourceRecordId: `b-monthly-${index}`,
      contractType: 'unknown',
    }))),
    source('mapo-gu', record({
      areaSqm: 90,
      depositWon: 10_000_000,
      monthlyRentWon: 9_900_000,
      legalDong: '연남동',
      buildingLabel: '표본부족빌라',
      sourceHousingType: 'villa',
      sourceRecordId: 'b-cancelled',
      recordStatus: 'cancelled',
    })),
    ...Array.from({ length: 5 }, (_, index) => source('jongno-gu', record({
      areaSqm: 75,
      depositWon: 250_000_000 + index * 10_000_000,
      monthlyRentWon: 0,
      legalDong: '청운동',
      buildingLabel: '단독다가구',
      sourceHousingType: 'detached',
      sourceRecordId: `c-jeonse-${index}`,
    }))),
    ...Array.from({ length: 5 }, (_, index) => source('gangnam-gu', record({
      areaSqm: 50,
      depositWon: 50_000_000 + index * 10_000_000,
      monthlyRentWon: 0,
      legalDong: undefined,
      buildingLabel: undefined,
      sourceRecordId: `unmatched-${index}`,
    }))),
  ] as const;

  return buildKoreaRentEvidence({
    period: '2026-01/2026-07',
    completedMonths: COMPLETED_MONTHS,
    generatedAt: '2026-08-01T00:00:00.000Z',
    records,
  });
}

describe('Korea multi-cohort rental evidence', () => {
  it('builds every Seoul district and housing scope while keeping exact cohorts unique', () => {
    const evidence = fixture();

    expect(evidence.areaRecords).toHaveLength(26 * 5);
    expect(new Set(evidence.areaRecords.map(({ areaId }) => areaId))).toHaveLength(26 * 5);
    for (const area of evidence.areaRecords) {
      expect(area.cohorts).toHaveLength(2 * 5 * 4);
      expect(new Set(area.cohorts.map((item) => (
        `${item.transaction}:${item.areaBand}:${item.contractGroup}`
      )))).toHaveLength(area.cohorts.length);
    }
  });

  it('publishes all-area jeonse without replacing exact area bands', () => {
    const evidence = fixture();
    const gangnamAll = areaRecord(evidence.areaRecords, 'gangnam-gu', 'all');

    expect(cohort(gangnamAll, {
      transaction: 'jeonse', areaBand: 'all', contractGroup: 'all',
    }).primary).toMatchObject({ n: 13, published: true });
    expect(cohort(gangnamAll, {
      transaction: 'jeonse', areaBand: '40-60', contractGroup: 'all',
    }).primary).toMatchObject({ n: 10, published: true });
    expect(cohort(gangnamAll, {
      transaction: 'jeonse', areaBand: 'under-40', contractGroup: 'all',
    }).primary).toEqual({ n: 1, published: false });
  });

  it('supports unmatched valid contracts in regional evidence but never fabricates a building', () => {
    const evidence = fixture();
    const apartment = building(evidence.buildingRecords, '검증아파트');
    const buildingAllJeonse = cohort(apartment, {
      transaction: 'jeonse', areaBand: 'all', contractGroup: 'all',
    });

    expect(buildingAllJeonse.primary).toMatchObject({ n: 8, published: true });
    expect(evidence.buildingRecords).toHaveLength(3);
    expect(evidence.stats.missingIdentityRecordCount).toBe(5);
  });

  it('publishes monthly rent and filed deposit as separate distributions', () => {
    const evidence = fixture();
    const apartment = building(evidence.buildingRecords, '검증아파트');
    const monthly = cohort(apartment, {
      transaction: 'monthly', areaBand: 'all', contractGroup: 'all',
    });

    expect(monthly.primaryMetric).toBe('monthly-rent');
    expect(monthly.primary).toMatchObject({
      n: 5,
      published: true,
      min: 500_000,
      med: 700_000,
      max: 900_000,
    });
    expect(monthly.filedDeposit).toMatchObject({
      n: 5,
      published: true,
      min: 10_000_000,
      med: 30_000_000,
      max: 50_000_000,
    });
    expect(apartment.recentTransactions.filter(({ transaction }) => transaction === 'monthly'))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({
          depositWon: 50_000_000,
          monthlyRentWon: 500_000,
          areaSqm: 50,
        }),
      ]));
  });

  it('keeps a thin building and withholds only its price distributions', () => {
    const evidence = fixture();
    const villa = building(evidence.buildingRecords, '표본부족빌라');
    const monthly = cohort(villa, {
      transaction: 'monthly', areaBand: 'all', contractGroup: 'all',
    });

    expect(monthly.primary).toEqual({ n: 4, published: false });
    expect(monthly.filedDeposit).toEqual({ n: 4, published: false });
    expect(villa.recentTransactions).toHaveLength(4);
  });

  it('retains detached identities and reconciles exclusions and transaction totals', () => {
    const evidence = fixture();
    expect(building(evidence.buildingRecords, '단독다가구').housingType).toBe('detached');
    expect(evidence.stats).toMatchObject({
      sourceRecordCount: 28,
      eligibleRecordCount: 27,
      jeonseRecordCount: 18,
      monthlyRecordCount: 9,
      cancelledRecordCount: 1,
      invalidPaymentRecordCount: 0,
      missingIdentityRecordCount: 5,
      observedBuildingCount: 3,
    });
    expect(evidence.stats.eligibleRecordCount).toBe(
      evidence.stats.jeonseRecordCount + evidence.stats.monthlyRecordCount,
    );
    expect(evidence.stats.sourceRecordCount).toBe(
      evidence.stats.eligibleRecordCount
      + evidence.stats.cancelledRecordCount
      + evidence.stats.invalidPaymentRecordCount,
    );
    expect(evidence.stats.publishedCohortCount + evidence.stats.withheldCohortCount)
      .toBe(evidence.stats.areaCohortCount + evidence.stats.buildingCohortCount);
  });

  it('excludes zero-value active filings without discarding valid rent evidence', () => {
    const valid = source('gangnam-gu', record({
      areaSqm: 50,
      depositWon: 300_000_000,
      monthlyRentWon: 0,
      sourceRecordId: 'valid-jeonse',
    }));
    const invalidPayment = source('gangnam-gu', record({
      areaSqm: 50,
      depositWon: 0,
      monthlyRentWon: 0,
      sourceRecordId: 'zero-value-active',
    }));
    const cancelled = source('gangnam-gu', record({
      areaSqm: 50,
      depositWon: 0,
      monthlyRentWon: 0,
      sourceRecordId: 'zero-value-cancelled',
      recordStatus: 'cancelled',
    }));

    const evidence = buildKoreaRentEvidence({
      period: '2026-01/2026-07',
      completedMonths: COMPLETED_MONTHS,
      generatedAt: '2026-08-01T00:00:00.000Z',
      records: [valid, invalidPayment, cancelled],
    });

    expect(evidence.stats).toMatchObject({
      sourceRecordCount: 3,
      eligibleRecordCount: 1,
      jeonseRecordCount: 1,
      monthlyRecordCount: 0,
      cancelledRecordCount: 1,
      invalidPaymentRecordCount: 1,
      observedBuildingCount: 1,
    });
    expect(evidence.buildingRecords[0]?.recentTransactions).toHaveLength(1);
  });

  it('fails closed when period, generation time or record coverage is invalid', () => {
    expect(() => buildKoreaRentEvidence({
      period: '2026-01/2026-06',
      completedMonths: COMPLETED_MONTHS,
      generatedAt: '2026-08-01T00:00:00.000Z',
      records: [],
    })).toThrow('period');
    expect(() => buildKoreaRentEvidence({
      period: '2026-01/2026-07',
      completedMonths: COMPLETED_MONTHS,
      generatedAt: 'not-an-instant',
      records: [],
    })).toThrow('generation');
    expect(() => buildKoreaRentEvidence({
      period: '2026-01/2026-07',
      completedMonths: COMPLETED_MONTHS,
      generatedAt: '2026-08-01T00:00:00.000Z',
      records: [source('gangnam-gu', record({
        areaSqm: 50,
        depositWon: 100_000_000,
        monthlyRentWon: 0,
        contractDate: '2026-08-01',
      }))],
    })).toThrow('completed source period');
  });
});
