import { describe, expect, it } from 'vitest';

import {
  buildRentEvidenceDistribution,
  classifyAreaBand,
  selectRentEvidenceRecords,
  type KoreaEvidenceAreaBand,
  type KoreaRentRecord,
} from '../src';

const COMPLETED_MONTHS = [
  '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07',
] as const;

function rentRecord(
  areaSqm: number,
  depositWon: number,
  monthlyRentWon: number,
  overrides: Partial<KoreaRentRecord> = {},
): KoreaRentRecord {
  return {
    sourceHousingType: 'apartment',
    areaSqm,
    depositWon,
    monthlyRentWon,
    contractDate: '2026-07-15',
    contractType: 'new',
    recordStatus: 'active',
    ...overrides,
  };
}

describe('Korea evidence area bands', () => {
  it.each([
    [1, 'under-40'],
    [39.999, 'under-40'],
    [40, '40-60'],
    [59.999, '40-60'],
    [60, '60-85'],
    [84.999, '60-85'],
    [85, '85-plus'],
    [2_000, '85-plus'],
  ] as const)('classifies %s㎡ as %s', (areaSqm, expected) => {
    expect(classifyAreaBand(areaSqm)).toBe(expected);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid area %s',
    (areaSqm) => {
      expect(() => classifyAreaBand(areaSqm)).toThrow('positive finite');
    },
  );
});

describe('Korea rental evidence selection', () => {
  const records = [
    rentRecord(39, 100_000_000, 0, { sourceRecordId: 'jeonse-under' }),
    rentRecord(40, 200_000_000, 0, { sourceRecordId: 'jeonse-40' }),
    rentRecord(60, 300_000_000, 0, { sourceRecordId: 'jeonse-60' }),
    rentRecord(85, 400_000_000, 0, { sourceRecordId: 'jeonse-85' }),
    rentRecord(39, 10_000_000, 700_000, { sourceRecordId: 'monthly-under' }),
    rentRecord(40, 20_000_000, 800_000, {
      sourceRecordId: 'monthly-renewal',
      contractType: 'renewal',
    }),
    rentRecord(60, 30_000_000, 900_000, {
      sourceRecordId: 'monthly-unknown',
      contractType: 'unknown',
    }),
    rentRecord(85, 40_000_000, 1_000_000, {
      sourceRecordId: 'monthly-cancelled',
      recordStatus: 'cancelled',
    }),
  ] as const;

  it('keeps every positive area in the explicit all-area cohort', () => {
    const selected = selectRentEvidenceRecords({
      records,
      transaction: 'jeonse',
      areaBand: 'all',
      contractGroup: 'all',
    });

    expect(selected.map(({ sourceRecordId }) => sourceRecordId)).toEqual([
      'jeonse-under', 'jeonse-40', 'jeonse-60', 'jeonse-85',
    ]);
  });

  it.each([
    ['under-40', 'jeonse-under'],
    ['40-60', 'jeonse-40'],
    ['60-85', 'jeonse-60'],
    ['85-plus', 'jeonse-85'],
  ] as const)('keeps only the exact %s cohort', (areaBand, sourceRecordId) => {
    const selected = selectRentEvidenceRecords({
      records,
      transaction: 'jeonse',
      areaBand,
      contractGroup: 'all',
    });

    expect(selected.map((record) => record.sourceRecordId)).toEqual([sourceRecordId]);
  });

  it('keeps filed deposit and monthly rent together without mixing in jeonse', () => {
    const selected = selectRentEvidenceRecords({
      records,
      transaction: 'monthly',
      areaBand: 'all',
      contractGroup: 'all',
    });

    expect(selected.map(({ depositWon, monthlyRentWon }) => ({
      depositWon,
      monthlyRentWon,
    }))).toEqual([
      { depositWon: 10_000_000, monthlyRentWon: 700_000 },
      { depositWon: 20_000_000, monthlyRentWon: 800_000 },
      { depositWon: 30_000_000, monthlyRentWon: 900_000 },
    ]);
  });

  it.each([
    ['new', ['monthly-under']],
    ['renewal', ['monthly-renewal']],
    ['unknown', ['monthly-unknown']],
    ['all', ['monthly-under', 'monthly-renewal', 'monthly-unknown']],
  ] as const)('selects the %s rental contract group', (contractGroup, expected) => {
    const selected = selectRentEvidenceRecords({
      records,
      transaction: 'monthly',
      areaBand: 'all',
      contractGroup,
    });

    expect(selected.map(({ sourceRecordId }) => sourceRecordId)).toEqual(expected);
  });

  it.each([
    rentRecord(0, 100_000_000, 0),
    rentRecord(50, -1, 0),
    rentRecord(50, 1, -1),
    rentRecord(50, 0, 0),
    rentRecord(50, Number.MAX_SAFE_INTEGER + 1, 0),
  ])('fails closed on an invalid source row', (record) => {
    expect(() => selectRentEvidenceRecords({
      records: [record],
      transaction: 'jeonse',
      areaBand: 'all',
      contractGroup: 'all',
    })).toThrow();
  });
});

describe('Korea rental evidence distributions', () => {
  function distribution(
    records: readonly KoreaRentRecord[],
    overrides: Partial<{
      transaction: 'jeonse' | 'monthly';
      areaBand: KoreaEvidenceAreaBand;
      contractGroup: 'all' | 'new' | 'renewal' | 'unknown';
      metric: 'primary' | 'filed-deposit';
    }> = {},
  ) {
    return buildRentEvidenceDistribution({
      records,
      completedMonths: COMPLETED_MONTHS,
      transaction: 'jeonse',
      areaBand: 'all',
      contractGroup: 'all',
      metric: 'primary',
      ...overrides,
    });
  }

  it('withholds every monetary field below five exact-cohort records', () => {
    const result = distribution([
      rentRecord(20, 100_000_000, 0),
      rentRecord(50, 200_000_000, 0),
      rentRecord(70, 300_000_000, 0),
      rentRecord(90, 400_000_000, 0),
    ]);

    expect(result).toEqual({ n: 4, published: false });
    expect(JSON.stringify(result)).not.toMatch(/min|p25|med|p75|max|chg3m/);
  });

  it('publishes all-area jeonse deposits without the legacy 45–55㎡ filter', () => {
    const result = distribution([
      rentRecord(20, 100_000_000, 0),
      rentRecord(40, 200_000_000, 0),
      rentRecord(60, 300_000_000, 0),
      rentRecord(85, 400_000_000, 0),
      rentRecord(120, 500_000_000, 0),
    ]);

    expect(result).toEqual({
      n: 5,
      published: true,
      min: 100_000_000,
      p25: 200_000_000,
      med: 300_000_000,
      p75: 400_000_000,
      max: 500_000_000,
      chg3m: null,
    });
  });

  it('publishes monthly rent as the primary metric and filed deposit separately', () => {
    const records = [
      rentRecord(50, 50_000_000, 500_000),
      rentRecord(50, 40_000_000, 600_000),
      rentRecord(50, 30_000_000, 700_000),
      rentRecord(50, 20_000_000, 800_000),
      rentRecord(50, 10_000_000, 900_000),
    ];

    expect(distribution(records, { transaction: 'monthly' })).toMatchObject({
      min: 500_000,
      med: 700_000,
      max: 900_000,
    });
    expect(distribution(records, {
      transaction: 'monthly',
      metric: 'filed-deposit',
    })).toMatchObject({
      min: 10_000_000,
      med: 30_000_000,
      max: 50_000_000,
    });
  });

  it('calculates signed three-month change inside the selected cohort only', () => {
    const records = [
      ...Array.from({ length: 5 }, () => rentRecord(50, 100_000_000, 0, {
        contractDate: '2026-04-10',
      })),
      ...Array.from({ length: 5 }, () => rentRecord(50, 90_000_000, 0, {
        contractDate: '2026-07-10',
      })),
      ...Array.from({ length: 8 }, () => rentRecord(90, 900_000_000, 0, {
        contractDate: '2026-07-10',
      })),
    ];

    expect(distribution(records, { areaBand: '40-60' })).toMatchObject({
      n: 10,
      chg3m: -10,
    });
  });

  it('rejects records outside the seven completed months', () => {
    expect(() => distribution([
      rentRecord(50, 100_000_000, 0, { contractDate: '2026-08-01' }),
    ])).toThrow('completed source period');
  });
});
