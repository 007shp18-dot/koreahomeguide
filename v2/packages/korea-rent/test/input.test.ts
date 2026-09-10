import { describe, expect, test } from 'vitest';

import {
  HOUSING_TYPE_PRESETS,
  SEOUL_RENT_CHECK_DISTRICTS,
  canonicalAreaFromPyeong,
  parseSeoulRentCheckQuery,
  type SeoulRentCheckEnvelope,
  type SeoulRentCheckErrorCode,
  type SeoulRentCheckErrorEnvelope,
} from '../src/index';

const SEOUL_LAWD_CODES = [
  '11110',
  '11140',
  '11170',
  '11200',
  '11215',
  '11230',
  '11260',
  '11290',
  '11305',
  '11320',
  '11350',
  '11380',
  '11410',
  '11440',
  '11470',
  '11500',
  '11530',
  '11545',
  '11560',
  '11590',
  '11620',
  '11650',
  '11680',
  '11710',
  '11740',
] as const;

const fullEnvelope = {
  marketId: 'kr-seoul',
  status: 'success',
  requestedHousingType: 'studio',
  sourceHousingType: 'detached',
  typeMapping: {
    applied: true,
    explanation: 'Studio is compared with detached/multi-unit source records.',
  },
  source: {
    provider: 'MOLIT',
    dataset: 'Detached house rental contracts',
    endpointVersion: 'v1',
    parserVersion: 'kr-molit-rent-parser-v2',
    rightsPolicyId: 'kr-molit-rent-v1',
    attribution: ['Ministry of Land, Infrastructure and Transport'],
  },
  coverage: {
    basis: 'contract_date',
    timezone: 'Asia/Seoul',
    coverageThroughMonth: '2026-07',
    latestContractMonth: '2026-07',
    sourceRetrievedAt: {
      earliest: '2026-08-01T00:00:00.000Z',
      latest: '2026-08-01T00:05:00.000Z',
    },
    responseGeneratedAt: '2026-08-01T00:06:00.000Z',
    monthsUsed: 3,
  },
  methodology: {
    policyId: 'kr-rent-check-quote-normalization',
    version: 1,
    annualDepositRate: 0.05,
    verdictBasis: 'typical-range',
    contractSelection: 'new_only',
    eligibleContractTypeCounts: { new: 5, renewal: 1, unknown: 1 },
    selectedContractTypeCounts: { new: 5, renewal: 0, unknown: 0 },
    sourceRecordStatusCounts: { active: 6, cancelled: 1, unknown: 1 },
  },
  result: {
    rating: 'fair',
    comparisonMode: 'monthly-rent',
    comparisonBasis: 'deposit-adjusted-monthly-rent',
    askingValueWon: 900_000,
    medianValueWon: 910_000,
    minValueWon: 800_000,
    p25ValueWon: 850_000,
    p75ValueWon: 950_000,
    maxValueWon: 1_000_000,
    differencePct: -1.1,
    percentileRank: 40,
    verdictBasis: 'typical-range',
    confidence: 'medium',
    comparableCount: 5,
    monthsUsed: 3,
    tier: 1,
  },
  comparables: [
    {
      buildingLabel: 'Sample building',
      areaSqm: 28,
      depositWon: 10_000_000,
      monthlyRentWon: 900_000,
      contractDate: '2026-07-15',
      contractType: 'new',
      recordStatus: 'active',
    },
  ],
  limitations: ['Official contracts do not describe every property feature.'],
} satisfies SeoulRentCheckEnvelope;

const errorCodes = [
  'invalid_request',
  'untrusted_request',
  'rate_limited',
  'configuration_missing',
  'rights_blocked',
  'source_timeout',
  'source_malformed',
  'source_unavailable',
  'internal_error',
] as const satisfies readonly SeoulRentCheckErrorCode[];

const errorEnvelopes: readonly SeoulRentCheckErrorEnvelope[] = errorCodes.map((code) => ({
  status: 'error',
  error: {
    code,
    message: 'Rent Check is unavailable.',
    retryable: code === 'source_timeout' || code === 'source_unavailable',
    retryAfterSeconds: code === 'source_timeout' ? 5 : null,
  },
}));

function validParams(overrides: Record<string, string> = {}): URLSearchParams {
  return new URLSearchParams({
    lawdCd: '11590',
    type: 'studio',
    deposit: '10000000',
    rent: '900000',
    area: '28',
    ...overrides,
  });
}

function expectInvalid(params: URLSearchParams): void {
  expect(() => parseSeoulRentCheckQuery(params)).toThrow(TypeError);
}

describe('Seoul Rent Check registries and public contracts', () => {
  test('publishes all 25 verified Seoul lawdCd values exactly once', () => {
    expect(SEOUL_RENT_CHECK_DISTRICTS.map((district) => district.lawdCd)).toEqual(
      SEOUL_LAWD_CODES,
    );
    expect(new Set(SEOUL_RENT_CHECK_DISTRICTS.map((district) => district.lawdCd)).size).toBe(25);
  });

  test('publishes the five housing types with their type-specific square-metre presets', () => {
    expect(HOUSING_TYPE_PRESETS).toEqual({
      apartment: [35, 60, 85],
      officetel: [15, 20, 30],
      villa: [20, 35, 60],
      detached: [20, 35, 50],
      studio: [15, 20, 25],
    });
  });

  test('keeps the complete success and typed error envelopes constructible', () => {
    expect(fullEnvelope.result.rating).toBe('fair');
    expect(errorEnvelopes.map((envelope) => envelope.error.code)).toEqual(errorCodes);
  });
});

describe('parseSeoulRentCheckQuery', () => {
  test('returns the canonical Korea quote and maps the studio alias server-side', () => {
    expect(parseSeoulRentCheckQuery(validParams())).toEqual({
      lawdCd: '11590',
      requestedHousingType: 'studio',
      sourceHousingType: 'detached',
      depositWon: 10_000_000,
      monthlyRentWon: 900_000,
      areaSqm: 28,
    });
  });

  test.each([
    ['apartment', 'apartment'],
    ['officetel', 'officetel'],
    ['villa', 'villa'],
    ['detached', 'detached'],
    ['studio', 'detached'],
  ] as const)('accepts requested type %s and resolves source type %s', (requested, source) => {
    expect(parseSeoulRentCheckQuery(validParams({ type: requested }))).toMatchObject({
      requestedHousingType: requested,
      sourceHousingType: source,
    });
  });

  test.each(SEOUL_LAWD_CODES)('accepts verified district %s', (lawdCd) => {
    expect(parseSeoulRentCheckQuery(validParams({ lawdCd })).lawdCd).toBe(lawdCd);
  });

  test('requires every calculation parameter exactly once', () => {
    for (const name of ['lawdCd', 'type', 'deposit', 'rent', 'area']) {
      const missing = validParams();
      missing.delete(name);
      expectInvalid(missing);
    }

    const repeatedArea = validParams();
    repeatedArea.append('area', '29');
    expectInvalid(repeatedArea);
  });

  test.each([
    ['deposit', '01'],
    ['rent', '1e6'],
    ['deposit', '-0'],
    ['rent', '1.5'],
    ['deposit', '9007199254740992'],
  ])('rejects non-canonical or unsafe integer KRW %s=%s', (name, value) => {
    expectInvalid(validParams({ [name]: value }));
  });

  test('enforces Korea KRW upper bounds and rejects the all-zero quote', () => {
    expect(parseSeoulRentCheckQuery(validParams({ deposit: '20000000000' })).depositWon).toBe(
      20_000_000_000,
    );
    expect(parseSeoulRentCheckQuery(validParams({ rent: '100000000' })).monthlyRentWon).toBe(
      100_000_000,
    );
    expectInvalid(validParams({ deposit: '20000000001' }));
    expectInvalid(validParams({ rent: '100000001' }));
    expectInvalid(validParams({ deposit: '0', rent: '0' }));
  });

  test.each(['-0', '0', '01', '.5', '28.', '28.001', '1e2', '2000.01'])(
    'rejects non-canonical or out-of-range area=%s',
    (area) => {
      expectInvalid(validParams({ area }));
    },
  );

  test('accepts positive area through 2,000 square metres with at most two decimals', () => {
    expect(parseSeoulRentCheckQuery(validParams({ area: '0.01' })).areaSqm).toBe(0.01);
    expect(parseSeoulRentCheckQuery(validParams({ area: '28.25' })).areaSqm).toBe(28.25);
    expect(parseSeoulRentCheckQuery(validParams({ area: '2000' })).areaSqm).toBe(2_000);
  });

  test('rejects unknown Seoul districts, unknown housing types, and extra parameters', () => {
    expectInvalid(validParams({ lawdCd: '99999' }));
    expectInvalid(validParams({ type: 'one-room' }));

    const extra = validParams();
    extra.set('utm_source', 'test');
    expectInvalid(extra);
  });
});

describe('canonicalAreaFromPyeong', () => {
  test('converts pyeong once to canonical square metres at two decimals', () => {
    expect(canonicalAreaFromPyeong(8.5)).toBe(28.1);
  });

  test.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects an invalid pyeong value %s',
    (pyeong) => {
      expect(() => canonicalAreaFromPyeong(pyeong)).toThrow(TypeError);
    },
  );
});
