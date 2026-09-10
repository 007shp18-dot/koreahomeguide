export const CONVERSION_TEST_PERIOD = '2026-03/2026-08' as const;
export const CONVERSION_TEST_SHA256 = 'a'.repeat(64);

export const CONVERSION_TEST_ARTIFACT = JSON.stringify({
  artifactVersion: 1,
  generatedAt: '2026-08-31T00:00:00.000Z',
  provenance: {
    marketId: 'kr-seoul',
    period: CONVERSION_TEST_PERIOD,
    provider: 'MOLIT',
    endpointVersion: 'v1',
    parserVersion: 'kr-molit-rent-parser-v2',
    rightsPolicyId: 'kr-molit-rent-v1',
    sourceComplete: true,
    sha256: CONVERSION_TEST_SHA256,
  },
  readiness: {
    state: 'ready',
    maximumAgeDays: 45,
    minimumPairsPerAnchor: 120,
  },
  totals: {
    eligiblePairCount: 620,
    excluded: {
      cancelled: 4,
      invalidMoney: 2,
      differentBuildingOrArea: 10,
    },
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
});
