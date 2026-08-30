import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  PUBLIC_SUMMARY_ARTIFACT_VERSION,
  PublicSummaryUnavailableError,
  createPublicSummaryRepository,
  type PublicSummaryArtifactInput,
} from '../lib/public-market/summary-repository.server';

const expected = {
  artifactVersion: PUBLIC_SUMMARY_ARTIFACT_VERSION,
  marketId: 'kr-seoul',
  period: '2026-01/2026-07',
} as const;

function publishedSummary() {
  return {
    marketId: 'kr-seoul',
    area: 'seoul',
    parent: 'kr',
    deal: 'jeonse',
    band: '45-55sqm',
    period: '2026-01/2026-07',
    n: 20,
    published: true,
    min: 1_000_000,
    p25: 2_000_000,
    med: 3_000_000,
    p75: 4_000_000,
    max: 5_000_000,
    chg3m: null,
  } as const;
}

function artifact(
  overrides: Record<string, unknown> = {},
): PublicSummaryArtifactInput {
  return {
    artifactVersion: PUBLIC_SUMMARY_ARTIFACT_VERSION,
    generatedAt: '2026-08-30T00:00:00.000Z',
    provenance: {
      marketId: 'kr-seoul',
      period: '2026-01/2026-07',
      provider: 'MOLIT',
      endpointVersion: 'v1',
      parserVersion: 'kr-molit-rent-parser-v2',
      rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true,
    },
    summaries: [publishedSummary()],
    ...overrides,
  };
}

function repository(...sources: [] | [unknown]) {
  return createPublicSummaryRepository({
    source: sources.length === 0 ? artifact() : sources[0],
    expected,
  });
}

describe('verified public summary repository', () => {
  it('refuses the retired v1 artifact contract', () => {
    expect(() => repository(artifact({
      artifactVersion: 'signedprice-public-summary-v1',
    }))).toThrow(PublicSummaryUnavailableError);
  });

  it('loads a published Seoul summary from the exact versioned artifact', () => {
    expect(repository().getSummary({
      area: 'seoul',
      deal: 'jeonse',
      band: '45-55sqm',
    })).toEqual(publishedSummary());
  });

  it('loads a withheld artifact without adding monetary keys', () => {
    const withheld = {
      marketId: 'kr-seoul',
      area: 'seoul',
      parent: 'kr',
      deal: 'jeonse',
      band: '45-55sqm',
      period: '2026-01/2026-07',
      n: 4,
      published: false,
    } as const;
    const summary = repository(artifact({ summaries: [withheld] })).getSummary({
      area: 'seoul',
      deal: 'jeonse',
      band: '45-55sqm',
    });

    expect(summary).toEqual(withheld);
    expect(JSON.stringify(summary)).not.toMatch(/min|p25|med|p75|max|chg3m/);
  });

  it.each([
    ['missing source', undefined],
    ['wrong artifact version', artifact({ artifactVersion: 'v0' })],
    ['wrong market', artifact({
      provenance: { ...artifact().provenance, marketId: 'sg-singapore' },
    })],
    ['wrong period', artifact({
      provenance: { ...artifact().provenance, period: '2026-04/2026-06' },
    })],
    ['missing provenance', artifact({ provenance: undefined })],
  ])('fails closed for %s', (_label, source) => {
    expect(() => repository(source)).toThrow(PublicSummaryUnavailableError);
  });

  it('rejects forbidden monetary keys on a withheld input artifact', () => {
    const poisoned = {
      ...publishedSummary(),
      n: 4,
      published: false,
    };

    expect(() => repository(artifact({ summaries: [poisoned] })))
      .toThrow(PublicSummaryUnavailableError);
  });

  it.each([
    ['published below the floor', { ...publishedSummary(), n: 4 }],
    ['missing change value', { ...publishedSummary(), chg3m: undefined }],
  ])('rejects a malformed published discriminant: %s', (_label, summary) => {
    expect(() => repository(artifact({ summaries: [summary] })))
      .toThrow(PublicSummaryUnavailableError);
  });

  it('rejects a summary whose market or period differs from provenance', () => {
    expect(() => repository(artifact({
      summaries: [{ ...publishedSummary(), period: '2026-04/2026-06' }],
    }))).toThrow(PublicSummaryUnavailableError);
  });

  it('fails closed for an absent area without revealing the lookup', () => {
    expect(() => repository().getSummary({
      area: 'secret-area',
      deal: 'jeonse',
      band: '45-55sqm',
    })).toThrow('Verified public market summary is unavailable.');
  });

  it('does not echo source URLs, credentials, or malformed values in errors', () => {
    const secret = 'https://apis.data.go.kr/raw?serviceKey=do-not-leak';
    let caught: unknown;
    try {
      repository(artifact({ providerUrl: secret }));
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(PublicSummaryUnavailableError);
    expect(String(caught)).not.toContain(secret);
    expect(String(caught)).not.toContain('serviceKey');
  });

  it('returns a deeply frozen public boundary', () => {
    const store = repository();
    const summary = store.getSummary({ area: 'seoul', deal: 'jeonse', band: '45-55sqm' });

    expect(Object.isFrozen(store)).toBe(true);
    expect(Object.isFrozen(summary)).toBe(true);
  });
});
