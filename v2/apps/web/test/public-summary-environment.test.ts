import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  PUBLIC_SUMMARY_ARTIFACT_VERSION,
  diagnosePublicSummaryEnvironment,
} from '../lib/public-market/route-model.server';

const period = '2026-01/2026-07';

function artifact(summaries: readonly unknown[] = [summary()]) {
  return {
    artifactVersion: PUBLIC_SUMMARY_ARTIFACT_VERSION,
    generatedAt: '2026-08-30T00:00:00.000Z',
    provenance: {
      marketId: 'kr-seoul',
      period,
      provider: 'MOLIT',
      endpointVersion: 'v1',
      parserVersion: 'kr-molit-rent-parser-v2',
      rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true,
    },
    summaries,
  };
}

function summary() {
  return {
    marketId: 'kr-seoul',
    area: 'seoul',
    parent: 'kr',
    deal: 'jeonse',
    band: '45-55sqm',
    period,
    n: 20,
    published: true,
    min: 1_000_000,
    p25: 2_000_000,
    med: 3_000_000,
    p75: 4_000_000,
    max: 5_000_000,
    chg3m: null,
  };
}

describe('public summary Preview diagnostics', () => {
  it.each([
    ['artifact_missing', undefined, period],
    ['period_missing', JSON.stringify(artifact()), undefined],
    ['artifact_json_invalid', '{"secret":"do-not-leak"', period],
    ['artifact_contract_invalid', JSON.stringify({
      ...artifact(),
      artifactVersion: 'signedprice-public-summary-v0',
    }), period],
    ['required_summary_missing', JSON.stringify(artifact([{
      ...summary(),
      band: 'apartments',
    }])), period],
    ['ready', JSON.stringify(artifact()), period],
  ] as const)('returns %s without echoing either input', (code, serialized, expectedPeriod) => {
    const result = diagnosePublicSummaryEnvironment(serialized, expectedPeriod);

    expect(result).toEqual({ code });
    expect(JSON.stringify(result)).not.toContain(serialized ?? 'not-present');
    expect(JSON.stringify(result)).not.toContain(expectedPeriod ?? 'not-present');
  });
});
