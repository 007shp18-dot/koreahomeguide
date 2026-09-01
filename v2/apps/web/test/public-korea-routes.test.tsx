import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('server-only', () => ({}));

import KoreaHomePage from '../app/(en)/kr/page';
import KoreaCheckPage from '../app/(en)/kr/check/[area]/page';
import KoreanContractCheckPage from '../app/(ko)/ko/kr/seoul/check/page';
import {
  PUBLIC_SUMMARY_ARTIFACT_VERSION,
  buildKoreaPublicRouteModel,
} from '../lib/public-market/route-model.server';
import { createPublicAreaV2Fixture } from './public-area-fixture';

const period = '2026-01/2026-07';
const conversionSha256 = 'a'.repeat(64);

function publishedSummary() {
  return {
    marketId: 'kr-seoul', area: 'seoul', parent: 'kr', deal: 'jeonse',
    band: '45-55sqm', period, n: 20, published: true,
    min: 180_000_000, p25: 280_000_000, med: 380_000_000,
    p75: 480_000_000, max: 580_000_000, chg3m: null,
  } as const;
}

function artifact(summary: Record<string, unknown> = publishedSummary()) {
  return {
    artifactVersion: PUBLIC_SUMMARY_ARTIFACT_VERSION,
    generatedAt: '2026-08-30T00:00:00.000Z',
    provenance: {
      marketId: 'kr-seoul', period, provider: 'MOLIT', endpointVersion: 'v1',
      parserVersion: 'kr-molit-rent-parser-v2', rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true,
    },
    summaries: [summary],
  };
}

function useArtifact(value = artifact()) {
  vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT', JSON.stringify(value));
  vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);
}

function useAreaArtifact() {
  vi.stubEnv(
    'SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT',
    JSON.stringify(createPublicAreaV2Fixture()),
  );
}

function useConversionArtifact() {
  vi.stubEnv('SIGNEDPRICE_CONVERSION_CURVE_ARTIFACT', JSON.stringify({
    artifactVersion: 1,
    generatedAt: '2026-08-30T00:00:00.000Z',
    provenance: {
      marketId: 'kr-seoul', period, provider: 'MOLIT', endpointVersion: 'v1',
      parserVersion: 'kr-molit-rent-parser-v2', rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true, sha256: conversionSha256,
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
  }));
  vi.stubEnv('SIGNEDPRICE_CONVERSION_CURVE_PERIOD', period);
  vi.stubEnv('SIGNEDPRICE_CONVERSION_CURVE_SHA256', conversionSha256);
}

afterEach(() => vi.unstubAllEnvs());

describe('Korea public route model', () => {
  it('accepts only the ready Seoul area and exact verified feed', () => {
    const model = buildKoreaPublicRouteModel('seoul', {
      source: artifact(),
      period,
    });
    expect(model?.summary).toEqual(publishedSummary());
    expect(model?.source).toEqual({
      evidence: {
        marketId: 'kr-seoul',
        provider: 'MOLIT',
        dataset: 'reported rent contracts',
        period,
        generatedAt: '2026-08-30T00:00:00.000Z',
        state: 'ready',
        publicationMinimum: 5,
        methodologyId: 'kr-jeonse-45-55-v1',
        rightsPolicyId: 'kr-molit-rent-v1',
      },
      provider: 'MOLIT',
      period,
      attribution: ['Ministry of Land, Infrastructure and Transport (MOLIT)'],
      band: '45–55㎡',
      publicationMinimum: 5,
      includesNewAndRenewal: true,
      includesUnknownContractType: true,
      includesUnknownRecordStatus: true,
      nextUpdate: null,
    });
    expect(model?.methodology).toEqual({
      label: 'Seven-month reported period · 45–55㎡ · zero-rent jeonse',
      disclosure: 'Amounts are reported refundable deposits; canceled contracts and contracts with monthly rent are excluded. The declared period may include filing-in-progress records; comparison claims require completed windows with retained counts.',
    });
    expect(buildKoreaPublicRouteModel('unknown', {
      source: artifact(),
      period,
    })).toBeNull();
  });

  it('fails closed when the feed is missing', () => {
    expect(() => buildKoreaPublicRouteModel('seoul', {
      source: undefined,
      period,
    })).toThrow('Verified public market summary is unavailable.');
  });
});

describe('Korea public SSR routes', () => {
  it('renders Korean Contract Check with a matching English language switch', () => {
    useConversionArtifact();
    const html = renderToStaticMarkup(<KoreanContractCheckPage />);

    expect(html).toContain('signedprice 홈');
    expect(html).toMatch(/hreflang="en"[^>]*href="\/kr\/seoul\/check"/i);
  });

  it('permanently redirects the legacy deposit check to the working Rent Check', async () => {
    await expect(KoreaCheckPage({
      params: Promise.resolve({ area: 'seoul' }),
    })).rejects.toMatchObject({
      digest: expect.stringContaining('/kr/seoul/tools/rent-check/'),
    });
  });

  it('redirects the legacy Korea entry to canonical Contract Check', async () => {
    useArtifact();
    useAreaArtifact();
    useConversionArtifact();
    await expect(KoreaHomePage()).rejects.toMatchObject({
      digest: expect.stringContaining('/kr/seoul/check/'),
    });
  });

  it('returns the Next 404 boundary for an unknown legacy check area', async () => {
    await expect(KoreaCheckPage({
      params: Promise.resolve({ area: 'unknown' }),
    })).rejects.toThrow(/404/);
  });

  it('keeps market-specific names out of the shared public template', async () => {
    const source = await import('node:fs').then(({ readFileSync }) => readFileSync(
      new URL('../components/public-market/public-market-page.tsx', import.meta.url),
      'utf8',
    ));
    expect(source).not.toMatch(/Korea|Seoul|KRW|MOLIT|jeonse|District/i);
  });
});
