import { describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { KR_MOLIT_RENT_RIGHTS } from '@signedprice/korea-rent';

import {
  ConversionEvidenceUnavailableError,
  createConversionRepository,
} from '../lib/contract-check/conversion-repository.server';

const SHA256 = 'a'.repeat(64);
const REFERENCE_INSTANT = '2026-09-01T00:00:00.000Z';

function validSource(): Record<string, unknown> {
  return {
    artifactVersion: 1,
    generatedAt: '2026-08-31T00:00:00.000Z',
    provenance: {
      marketId: 'kr-seoul',
      period: '2026-03/2026-08',
      provider: 'MOLIT',
      endpointVersion: 'v1',
      parserVersion: 'kr-molit-rent-parser-v2',
      rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true,
      sha256: SHA256,
    },
    readiness: { state: 'ready', maximumAgeDays: 45, minimumPairsPerAnchor: 120 },
    totals: {
      eligiblePairCount: 620,
      excluded: { cancelled: 4, invalidMoney: 2, differentBuildingOrArea: 10 },
    },
    curves: [
      {
        housingType: 'apartment',
        observedMinDepositWon: 30_000_000,
        observedMaxDepositWon: 100_000_000,
        anchors: [
          { depositWon: 30_000_000, annualRate: 0.05, pairCount: 140 },
          { depositWon: 100_000_000, annualRate: 0.04, pairCount: 160 },
        ],
      },
      {
        housingType: 'officetel',
        observedMinDepositWon: 20_000_000,
        observedMaxDepositWon: 80_000_000,
        anchors: [
          { depositWon: 20_000_000, annualRate: 0.06, pairCount: 150 },
          { depositWon: 80_000_000, annualRate: 0.05, pairCount: 170 },
        ],
      },
    ],
  };
}

function repository(source: unknown = validSource()) {
  return createConversionRepository({
    source,
    expected: {
      marketId: 'kr-seoul',
      period: '2026-03/2026-08',
      sha256: SHA256,
      rightsLookup: (policyId) =>
        policyId === KR_MOLIT_RENT_RIGHTS.id ? KR_MOLIT_RENT_RIGHTS : undefined,
    },
    referenceInstant: REFERENCE_INSTANT,
  });
}

describe('conversion evidence repository', () => {
  test('returns immutable browser-safe curves by supported housing type', () => {
    const result = repository();

    expect(result.listCurves().map((curve) => curve.housingType)).toEqual([
      'apartment',
      'officetel',
    ]);
    expect(result.getCurve('apartment')).toMatchObject({
      period: '2026-03/2026-08',
      generatedAt: '2026-08-31T00:00:00.000Z',
      anchors: [
        { deposit: 30_000_000, annualRate: 0.05, pairCount: 140 },
        { deposit: 100_000_000, annualRate: 0.04, pairCount: 160 },
      ],
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.listCurves())).toBe(true);
    expect(JSON.stringify(result.listCurves())).not.toMatch(/MOLIT|sha256|rightsPolicyId/);
  });

  test('fails closed for malformed evidence and absent curves', () => {
    expect(() => repository({ nope: true })).toThrow(ConversionEvidenceUnavailableError);
    const single = validSource();
    single.curves = (single.curves as unknown[]).slice(0, 1);
    (single.totals as Record<string, unknown>).eligiblePairCount = 300;
    const result = repository(single);

    expect(() => result.getCurve('officetel')).toThrow(ConversionEvidenceUnavailableError);
  });

  test('fails closed when current rights no longer allow display', () => {
    expect(() => createConversionRepository({
      source: validSource(),
      expected: {
        marketId: 'kr-seoul',
        period: '2026-03/2026-08',
        sha256: SHA256,
        rightsLookup: () => undefined,
      },
      referenceInstant: REFERENCE_INSTANT,
    })).toThrow(ConversionEvidenceUnavailableError);
  });
});
