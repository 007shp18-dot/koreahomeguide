export const PUBLIC_SUMMARY_TEST_PERIOD = '2026-01/2026-07';

export const PUBLIC_SUMMARY_TEST_ARTIFACT = JSON.stringify({
  artifactVersion: 'signedprice-public-summary-v2',
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
    deal: 'jeonse',
    band: '45-55sqm',
    period: PUBLIC_SUMMARY_TEST_PERIOD,
    n: 20,
    published: true,
    min: 180_000_000,
    p25: 280_000_000,
    med: 380_000_000,
    p75: 480_000_000,
    max: 580_000_000,
    chg3m: null,
  }],
});
