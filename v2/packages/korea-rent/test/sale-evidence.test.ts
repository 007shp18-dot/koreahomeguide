import { describe, expect, it } from 'vitest';

import {
  buildKoreaSaleEvidence,
  type KoreaSaleEvidenceAreaRecord,
  type KoreaSaleEvidenceBuildingRecord,
  type KoreaSaleRecord,
  type SeoulDistrictSlug,
} from '../src';

const COMPLETED_MONTHS = [
  '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07',
] as const;

function record(input: Partial<KoreaSaleRecord> & Pick<KoreaSaleRecord, 'areaSqm' | 'priceWon'>): KoreaSaleRecord {
  return {
    sourceHousingType: 'apartment',
    contractDate: '2026-07-15',
    recordStatus: 'active',
    legalDong: '대치동',
    buildingLabel: '검증아파트',
    ...input,
  };
}

function source(districtSlug: SeoulDistrictSlug, saleRecord: KoreaSaleRecord) {
  return { districtSlug, record: saleRecord } as const;
}

function areaRecord(
  records: readonly KoreaSaleEvidenceAreaRecord[],
  districtSlug: SeoulDistrictSlug | null,
  housingType: KoreaSaleEvidenceAreaRecord['housingType'],
) {
  const result = records.find((item) =>
    item.districtSlug === districtSlug && item.housingType === housingType);
  expect(result).toBeDefined();
  return result!;
}

function building(records: readonly KoreaSaleEvidenceBuildingRecord[], name: string) {
  const result = records.find(({ officialName }) => officialName === name);
  expect(result).toBeDefined();
  return result!;
}

function fixture() {
  const records = [
    ...[100, 200, 300, 400, 500].map((million, index) => source('gangnam-gu', record({
      areaSqm: 45 + index,
      priceWon: million * 1_000_000,
      sourceRecordId: `apt-40-${index}`,
    }))),
    source('gangnam-gu', record({
      areaSqm: 30,
      priceWon: 80_000_000,
      sourceRecordId: 'apt-under-40',
    })),
    source('gangnam-gu', record({
      areaSqm: 70,
      priceWon: 600_000_000,
      sourceRecordId: 'apt-60-85',
    })),
    source('gangnam-gu', record({
      areaSqm: 90,
      priceWon: 700_000_000,
      sourceRecordId: 'apt-85-plus',
    })),
    ...[100, 110, 120, 130].map((million, index) => source('mapo-gu', record({
      areaSqm: 90,
      priceWon: million * 1_000_000,
      legalDong: '연남동',
      buildingLabel: '표본부족빌라',
      sourceHousingType: 'villa',
      sourceRecordId: `villa-${index}`,
    }))),
    source('mapo-gu', record({
      areaSqm: 90,
      priceWon: 9_900_000_000,
      legalDong: '연남동',
      buildingLabel: '표본부족빌라',
      sourceHousingType: 'villa',
      sourceRecordId: 'villa-cancelled',
      recordStatus: 'cancelled',
    })),
    ...Array.from({ length: 5 }, (_, index) => source('jongno-gu', record({
      areaSqm: 120,
      priceWon: 900_000_000 + index * 10_000_000,
      legalDong: '청운동',
      buildingLabel: '단독',
      sourceHousingType: 'detached',
      sourceRecordId: `detached-${index}`,
      floor: index,
      buildYear: 2000 + index,
    }))),
    ...Array.from({ length: 5 }, (_, index) => source('gangnam-gu', record({
      areaSqm: 50,
      priceWon: 50_000_000 + index * 10_000_000,
      legalDong: undefined,
      buildingLabel: undefined,
      sourceRecordId: `unmatched-${index}`,
    }))),
  ] as const;

  return buildKoreaSaleEvidence({
    period: '2026-01/2026-07',
    completedMonths: COMPLETED_MONTHS,
    generatedAt: '2026-08-01T00:00:00.000Z',
    records,
  });
}

describe('Korea multi-cohort sale evidence', () => {
  it('builds every city/district and housing scope with five exact area cohorts', () => {
    const evidence = fixture();
    expect(evidence.areaRecords).toHaveLength(26 * 5);
    expect(new Set(evidence.areaRecords.map(({ areaId }) => areaId))).toHaveLength(26 * 5);
    for (const area of evidence.areaRecords) {
      expect(area.cohorts).toHaveLength(5);
      expect(area.cohorts.map(({ areaBand }) => areaBand)).toEqual([
        'all', 'under-40', '40-60', '60-85', '85-plus',
      ]);
    }
  });

  it('publishes all positive areas together while keeping the exact selected band independent', () => {
    const gangnamAll = areaRecord(fixture().areaRecords, 'gangnam-gu', 'all');
    expect(gangnamAll.cohorts.find(({ areaBand }) => areaBand === 'all')?.price)
      .toMatchObject({ n: 13, published: true, med: 100_000_000 });
    expect(gangnamAll.cohorts.find(({ areaBand }) => areaBand === '40-60')?.price)
      .toMatchObject({ n: 10, published: true });
    expect(gangnamAll.cohorts.find(({ areaBand }) => areaBand === 'under-40')?.price)
      .toEqual({ n: 1, published: false });
  });

  it('keeps thin and detached building identities but withholds only thin price evidence', () => {
    const evidence = fixture();
    const villa = building(evidence.buildingRecords, '표본부족빌라');
    expect(villa.cohorts.find(({ areaBand }) => areaBand === 'all')?.price)
      .toEqual({ n: 4, published: false });
    expect(villa.recentSales).toHaveLength(4);
    expect(building(evidence.buildingRecords, '단독')).toMatchObject({
      housingType: 'detached',
      recentSales: expect.arrayContaining([
        expect.objectContaining({ floor: 4, buildYear: 2004 }),
      ]),
    });
  });

  it('counts unmatched regional sales without fabricating a building and reconciles exclusions', () => {
    const evidence = fixture();
    expect(evidence.buildingRecords).toHaveLength(3);
    expect(evidence.stats).toMatchObject({
      sourceRecordCount: 23,
      eligibleRecordCount: 22,
      cancelledRecordCount: 1,
      missingIdentityRecordCount: 5,
      observedBuildingCount: 3,
    });
    expect(evidence.stats.eligibleRecordCount + evidence.stats.cancelledRecordCount)
      .toBe(evidence.stats.sourceRecordCount);
    expect(evidence.stats.publishedCohortCount + evidence.stats.withheldCohortCount)
      .toBe(evidence.stats.areaCohortCount + evidence.stats.buildingCohortCount);
  });

  it('fails closed on an invalid period, instant, source month, price, or area', () => {
    const base = {
      period: '2026-01/2026-07',
      completedMonths: COMPLETED_MONTHS,
      generatedAt: '2026-08-01T00:00:00.000Z',
      records: [] as const,
    };
    expect(() => buildKoreaSaleEvidence({ ...base, period: '2026-01/2026-06' }))
      .toThrow('period');
    expect(() => buildKoreaSaleEvidence({ ...base, generatedAt: 'bad' }))
      .toThrow('generation');
    expect(() => buildKoreaSaleEvidence({
      ...base,
      records: [source('gangnam-gu', record({
        areaSqm: 50,
        priceWon: 100_000_000,
        contractDate: '2026-08-01',
      }))],
    })).toThrow('completed source period');
    expect(() => buildKoreaSaleEvidence({
      ...base,
      records: [source('gangnam-gu', record({ areaSqm: 50, priceWon: 0 }))],
    })).toThrow('price');
    expect(() => buildKoreaSaleEvidence({
      ...base,
      records: [source('gangnam-gu', record({ areaSqm: 0, priceWon: 1 }))],
    })).toThrow('area');
  });
});
