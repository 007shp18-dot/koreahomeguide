import { describe, expect, it } from 'vitest';
import {
  KR_MOLIT_RENT_RIGHTS,
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
  buildKoreaPublicMarketSummary,
  type KoreaPublicSummaryInput,
  type KoreaRentRecord,
} from '../src';

const COMPLETED_MONTHS = [
  '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07',
] as const;

function jeonse(
  depositWon: number,
  month = '2026-07',
  overrides: Partial<KoreaRentRecord> = {},
): KoreaRentRecord {
  return {
    sourceHousingType: 'apartment',
    areaSqm: 50,
    depositWon,
    monthlyRentWon: 0,
    contractDate: `${month}-15`,
    contractType: 'new',
    recordStatus: 'active',
    ...overrides,
  };
}

function input(
  records: readonly KoreaRentRecord[],
  overrides: Partial<KoreaPublicSummaryInput> = {},
): KoreaPublicSummaryInput {
  return {
    area: 'seoul',
    parent: 'kr',
    band: '45-55sqm',
    period: '2026-01/2026-07',
    completedMonths: COMPLETED_MONTHS,
    sourceComplete: true,
    source: {
      marketId: 'kr-seoul',
      provider: 'MOLIT',
      endpointVersion: MOLIT_ENDPOINT_VERSION,
      parserVersion: MOLIT_PARSER_VERSION,
      rightsPolicyId: MOLIT_RIGHTS_POLICY_ID,
    },
    rightsLookup: (policyId) => policyId === KR_MOLIT_RENT_RIGHTS.id
      ? KR_MOLIT_RENT_RIGHTS
      : undefined,
    records,
    contractGroup: 'all',
    ...overrides,
  };
}

describe('Korea public market summary adapter', () => {
  it('publishes nothing monetary below five eligible jeonse contracts', () => {
    const summary = buildKoreaPublicMarketSummary(input([
      jeonse(100_000_000), jeonse(200_000_000), jeonse(300_000_000), jeonse(400_000_000),
    ]));

    expect(summary).toEqual({
      marketId: 'kr-seoul',
      area: 'seoul',
      parent: 'kr',
      deal: 'jeonse',
      band: '45-55sqm',
      period: '2026-01/2026-07',
      n: 4,
      published: false,
    });
    expect(JSON.stringify(summary)).not.toMatch(/min|p25|med|p75|max|chg3m/);
  });

  it('publishes the ordered seven-month deposit distribution at five', () => {
    const summary = buildKoreaPublicMarketSummary(input([
      jeonse(100_000_000), jeonse(200_000_000), jeonse(300_000_000),
      jeonse(400_000_000), jeonse(500_000_000),
    ]));

    expect(summary).toEqual({
      marketId: 'kr-seoul',
      area: 'seoul',
      parent: 'kr',
      deal: 'jeonse',
      band: '45-55sqm',
      period: '2026-01/2026-07',
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

  it('calculates even percentiles before whole-won rounding', () => {
    const summary = buildKoreaPublicMarketSummary(input([
      jeonse(100_000_001), jeonse(200_000_001), jeonse(300_000_001),
      jeonse(400_000_001), jeonse(500_000_001), jeonse(600_000_001),
    ]));

    expect(summary).toMatchObject({
      n: 6,
      published: true,
      p25: 225_000_001,
      med: 350_000_001,
      p75: 475_000_001,
    });
  });

  it('includes only zero-rent jeonse records within the inclusive 45-55sqm band', () => {
    const summary = buildKoreaPublicMarketSummary(input([
      jeonse(100_000_000, '2026-07', { areaSqm: 45 }),
      jeonse(200_000_000), jeonse(300_000_000), jeonse(400_000_000),
      jeonse(500_000_000, '2026-07', { areaSqm: 55 }),
      jeonse(900_000_000, '2026-07', { areaSqm: 44.99 }),
      jeonse(910_000_000, '2026-07', { areaSqm: 55.01 }),
      jeonse(920_000_000, '2026-07', { monthlyRentWon: 1 }),
    ]));

    expect(summary).toMatchObject({
      n: 5,
      published: true,
      min: 100_000_000,
      max: 500_000_000,
    });
  });

  it('includes unknown status and contract type but excludes known cancellations', () => {
    const summary = buildKoreaPublicMarketSummary(input([
      jeonse(100_000_000),
      jeonse(200_000_000, '2026-07', { recordStatus: 'unknown' }),
      jeonse(300_000_000, '2026-07', { contractType: 'unknown' }),
      jeonse(400_000_000), jeonse(500_000_000),
      jeonse(990_000_000, '2026-07', { recordStatus: 'cancelled' }),
    ]));

    expect(summary).toMatchObject({ n: 5, published: true, max: 500_000_000 });
  });

  it('computes all, new and renewal distributions from only their contract groups', () => {
    const records = [
      ...[100, 110, 120, 130, 140, 150].map((value) =>
        jeonse(value * 1_000_000, '2026-07', { contractType: 'new' })),
      ...[400, 410, 420, 430, 440].map((value) =>
        jeonse(value * 1_000_000, '2026-07', { contractType: 'renewal' })),
      ...[250, 260, 270, 280].map((value) =>
        jeonse(value * 1_000_000, '2026-07', { contractType: 'unknown' })),
    ];

    expect(buildKoreaPublicMarketSummary(input(records, {
      contractGroup: 'all',
    }))).toMatchObject({ n: 15, published: true, med: 260_000_000 });
    expect(buildKoreaPublicMarketSummary(input(records, {
      contractGroup: 'new',
    }))).toMatchObject({ n: 6, published: true, med: 125_000_000 });
    expect(buildKoreaPublicMarketSummary(input(records, {
      contractGroup: 'renewal',
    }))).toMatchObject({ n: 5, published: true, med: 420_000_000 });
  });

  it('computes three-month change independently for each contract group', () => {
    const records = [
      ...Array.from({ length: 5 }, () =>
        jeonse(100_000_000, '2026-04', { contractType: 'new' })),
      ...Array.from({ length: 5 }, () =>
        jeonse(110_000_000, '2026-07', { contractType: 'new' })),
      ...Array.from({ length: 5 }, () =>
        jeonse(200_000_000, '2026-04', { contractType: 'renewal' })),
      ...Array.from({ length: 5 }, () =>
        jeonse(200_000_000, '2026-07', { contractType: 'renewal' })),
    ];

    expect(buildKoreaPublicMarketSummary(input(records, {
      contractGroup: 'new',
    }))).toMatchObject({ n: 10, published: true, chg3m: 10 });
    expect(buildKoreaPublicMarketSummary(input(records, {
      contractGroup: 'renewal',
    }))).toMatchObject({ n: 10, published: true, chg3m: 0 });
  });

  it('computes one-decimal change from the preceding three months to the latest three', () => {
    const summary = buildKoreaPublicMarketSummary(input([
      ...Array.from({ length: 5 }, () => jeonse(200_000_000, '2026-04')),
      ...Array.from({ length: 5 }, () => jeonse(220_000_000, '2026-07')),
    ]));

    expect(summary).toMatchObject({ n: 10, published: true, chg3m: 10 });
  });

  it('withholds change when either comparison window has fewer than five records', () => {
    const summary = buildKoreaPublicMarketSummary(input([
      ...Array.from({ length: 4 }, () => jeonse(200_000_000, '2026-04')),
      ...Array.from({ length: 5 }, () => jeonse(220_000_000, '2026-07')),
    ]));

    expect(summary).toMatchObject({ n: 9, published: true, chg3m: null });
  });

  it.each([
    [{ sourceComplete: false }, 'complete'],
    [{ period: '2026-01/2026-06', completedMonths: COMPLETED_MONTHS.slice(0, 6) }, 'seven'],
    [{ period: '2026-01/2026-08', completedMonths: [...COMPLETED_MONTHS, '2026-08'] }, 'seven'],
    [{ period: '2026-01/2026-08' }, 'period'],
    [{ completedMonths: ['2026-01', '2026-02', '2026-03', '2026-05', '2026-06', '2026-07', '2026-08'] }, 'contiguous'],
    [{ band: 'all-homes' }, '45-55sqm'],
    [{ source: { marketId: 'kr-seoul', provider: 'MOLIT', endpointVersion: MOLIT_ENDPOINT_VERSION, parserVersion: 'old', rightsPolicyId: MOLIT_RIGHTS_POLICY_ID } }, 'provenance'],
    [{ source: { marketId: 'kr-seoul', provider: 'MOLIT', endpointVersion: MOLIT_ENDPOINT_VERSION, parserVersion: MOLIT_PARSER_VERSION, rightsPolicyId: 'unknown' } }, 'provenance'],
    [{ rightsLookup: () => undefined }, 'permitted'],
    [{ contractGroup: 'other' }, 'contract group'],
  ] as const)('fails closed on invalid source boundary %#', (overrides, message) => {
    expect(() => buildKoreaPublicMarketSummary(input([
      jeonse(100_000_000), jeonse(200_000_000), jeonse(300_000_000),
      jeonse(400_000_000), jeonse(500_000_000),
    ], overrides as Partial<KoreaPublicSummaryInput>))).toThrow(message);
  });

  it('rejects a record outside the completed source period', () => {
    expect(() => buildKoreaPublicMarketSummary(input([
      jeonse(100_000_000, '2026-08'),
    ]))).toThrow('completed source period');
  });

  it('rejects an impossible calendar date even when its month is completed', () => {
    expect(() => buildKoreaPublicMarketSummary(input([
      jeonse(100_000_000, '2026-06', { contractDate: '2026-06-31' }),
    ]))).toThrow('calendar date');
  });

  it('keeps the server adapter out of the browser export', async () => {
    const browser = await import('../src/browser');
    expect(browser).not.toHaveProperty('buildKoreaPublicMarketSummary');
    expect(JSON.stringify(Object.keys(browser))).not.toMatch(/MOLIT_RENT_ENDPOINTS|fetchMolit/);
  });
});
