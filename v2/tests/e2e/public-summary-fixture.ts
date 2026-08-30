export const PUBLIC_SUMMARY_TEST_PERIOD = '2026-05/2026-07';

export const PUBLIC_SUMMARY_TEST_ARTIFACT = JSON.stringify({
  artifactVersion: 'signedprice-public-summary-v1',
  generatedAt: '2026-08-30T00:00:00.000Z',
  provenance: {
    marketId: 'kr-seoul',
    period: PUBLIC_SUMMARY_TEST_PERIOD,
    provider: 'MOLIT',
    endpointVersion: 'v1',
    parserVersion: 'kr-molit-rent-parser-v2',
    rightsPolicyId: 'kr-molit-rent-v1',
    sourceComplete: true,
  },
  summaries: [{
    marketId: 'kr-seoul',
    area: 'seoul',
    parent: 'kr',
    deal: 'rent',
    band: 'all-homes',
    period: PUBLIC_SUMMARY_TEST_PERIOD,
    n: 20,
    published: true,
    min: 1_000_000,
    p25: 2_000_000,
    med: 3_000_000,
    p75: 4_000_000,
    max: 5_000_000,
    chg3m: null,
  }],
});
