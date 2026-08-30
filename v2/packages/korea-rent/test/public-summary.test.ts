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

function record(
  monthlyRentWon: number,
  overrides: Partial<KoreaRentRecord> = {},
): KoreaRentRecord {
  return {
    sourceHousingType: 'apartment',
    areaSqm: 60,
    depositWon: 0,
    monthlyRentWon,
    contractDate: '2026-07-15',
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
    band: 'all-homes',
    period: '2026-05/2026-07',
    completedMonths: ['2026-05', '2026-06', '2026-07'],
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
    ...overrides,
  };
}

describe('Korea public market summary adapter', () => {
  it('publishes nothing monetary below five eligible contracts', () => {
    const summary = buildKoreaPublicMarketSummary(input([
      record(1_000_000),
      record(2_000_000),
      record(3_000_000),
      record(4_000_000),
    ]));

    expect(summary).toEqual({
      marketId: 'kr-seoul',
      area: 'seoul',
      parent: 'kr',
      deal: 'rent',
      band: 'all-homes',
      period: '2026-05/2026-07',
      n: 4,
      published: false,
    });
    expect(JSON.stringify(summary)).not.toMatch(/min|p25|med|p75|max|chg3m/);
  });

  it('publishes the ordered five-number monthly-equivalent summary at five', () => {
    const summary = buildKoreaPublicMarketSummary(input([
      record(1_000_000),
      record(2_000_000),
      record(3_000_000),
      record(4_000_000),
      record(5_000_000),
    ]));

    expect(summary).toEqual({
      marketId: 'kr-seoul',
      area: 'seoul',
      parent: 'kr',
      deal: 'rent',
      band: 'all-homes',
      period: '2026-05/2026-07',
      n: 5,
      published: true,
      min: 1_000_000,
      p25: 2_000_000,
      med: 3_000_000,
      p75: 4_000_000,
      max: 5_000_000,
      chg3m: null,
    });
  });

  it('calculates even percentiles before whole-won rounding', () => {
    const summary = buildKoreaPublicMarketSummary(input([
      record(1_000_001),
      record(2_000_001),
      record(3_000_001),
      record(4_000_001),
      record(5_000_001),
      record(6_000_001),
    ]));

    expect(summary).toMatchObject({
      n: 6,
      published: true,
      p25: 2_250_001,
      med: 3_500_001,
      p75: 4_750_001,
    });
  });

  it('uses the signedprice 5% annual assumption for a zero-deposit monthly equivalent', () => {
    const summary = buildKoreaPublicMarketSummary(input([
      record(0, { depositWon: 120_000_000 }),
      record(1_000_000),
      record(2_000_000),
      record(3_000_000),
      record(4_000_000),
    ]));

    expect(summary).toMatchObject({
      n: 5,
      published: true,
      min: 500_000,
      med: 2_000_000,
    });
  });

  it('includes unknown status but excludes known cancellations', () => {
    const summary = buildKoreaPublicMarketSummary(input([
      record(1_000_000),
      record(2_000_000, { recordStatus: 'unknown' }),
      record(3_000_000),
      record(4_000_000),
      record(5_000_000),
      record(99_000_000, { recordStatus: 'cancelled' }),
    ]));

    expect(summary).toMatchObject({ n: 5, published: true, max: 5_000_000 });
  });

  it.each([
    [{ sourceComplete: false }, 'complete'],
    [{ period: '2026-04/2026-07' }, 'period'],
    [{ completedMonths: ['2026-05', '2026-07'] }, 'contiguous'],
    [{ source: { marketId: 'kr-seoul', provider: 'MOLIT', endpointVersion: MOLIT_ENDPOINT_VERSION, parserVersion: 'old', rightsPolicyId: MOLIT_RIGHTS_POLICY_ID } }, 'provenance'],
    [{ source: { marketId: 'kr-seoul', provider: 'MOLIT', endpointVersion: MOLIT_ENDPOINT_VERSION, parserVersion: MOLIT_PARSER_VERSION, rightsPolicyId: 'unknown' } }, 'provenance'],
    [{ rightsLookup: () => undefined }, 'permitted'],
  ] as const)('fails closed on invalid source boundary %#', (overrides, message) => {
    expect(() => buildKoreaPublicMarketSummary(input([
      record(1_000_000),
      record(2_000_000),
      record(3_000_000),
      record(4_000_000),
      record(5_000_000),
    ], overrides as Partial<KoreaPublicSummaryInput>))).toThrow(message);
  });

  it('rejects a record outside the completed source period', () => {
    expect(() => buildKoreaPublicMarketSummary(input([
      record(1_000_000, { contractDate: '2026-08-01' }),
    ]))).toThrow('completed source period');
  });

  it('rejects an impossible calendar date even when its month is completed', () => {
    expect(() => buildKoreaPublicMarketSummary(input([
      record(1_000_000, { contractDate: '2026-06-31' }),
    ]))).toThrow('calendar date');
  });

  it('keeps the server adapter out of the browser export', async () => {
    const browser = await import('../src/browser');
    expect(browser).not.toHaveProperty('buildKoreaPublicMarketSummary');
    expect(JSON.stringify(Object.keys(browser))).not.toMatch(/MOLIT_RENT_ENDPOINTS|fetchMolit/);
  });
});
