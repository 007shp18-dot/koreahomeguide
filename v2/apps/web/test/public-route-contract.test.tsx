import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import Home from '../app/page';
import sitemap from '../app/sitemap';
import { generateStaticParams as marketStaticParams } from '../app/[country]/[city]/page';
import { generateStaticParams as intentStaticParams } from '../app/[country]/[city]/[intent]/page';
import { metadata as proofMetadata } from '../app/kr/seoul/tools/rent-check/page';
import { metadata as rankingsMetadata } from '../app/kr/seoul/rankings/page';
import {
  PUBLIC_SUMMARY_ARTIFACT_VERSION,
  buildKoreaPublicPageMetadata,
} from '../lib/public-market/route-model.server';

const period = '2026-01/2026-07';

function artifact(published: boolean) {
  const identity = {
    marketId: 'kr-seoul', area: 'seoul', parent: 'kr', deal: 'jeonse',
    band: '45-55sqm', period, n: published ? 20 : 4, published,
  };
  return {
    artifactVersion: PUBLIC_SUMMARY_ARTIFACT_VERSION,
    generatedAt: '2026-08-30T00:00:00.000Z',
    provenance: {
      marketId: 'kr-seoul', period, provider: 'MOLIT', endpointVersion: 'v1',
      parserVersion: 'kr-molit-rent-parser-v2', rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true,
    },
    summaries: [{
      ...identity,
      ...(published ? {
        min: 1_000_000, p25: 2_000_000, med: 3_000_000,
        p75: 4_000_000, max: 5_000_000, chg3m: null,
      } : {}),
    }],
  };
}

afterEach(() => vi.unstubAllEnvs());

describe('Korea-only public route availability', () => {
  it('generates Seoul overview, three intents, and exactly 25 district paths', () => {
    expect(marketStaticParams()).toEqual([{ country: 'kr', city: 'seoul' }]);
    expect(intentStaticParams()).toEqual([
      { country: 'kr', city: 'seoul', intent: 'rent' },
      { country: 'kr', city: 'seoul', intent: 'buy' },
      { country: 'kr', city: 'seoul', intent: 'invest' },
      ...SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => ({
        country: 'kr', city: 'seoul', intent: slug,
      })),
    ]);
    expect(JSON.stringify([marketStaticParams(), intentStaticParams()]))
      .not.toMatch(/singapore|dubai|\bsg\b|\bae\b/);
  });

  it('removes future-market destinations from public home navigation', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('/kr/seoul/');
    expect(html).not.toMatch(/href="\/(?:sg|ae)\//);
    expect(html).not.toMatch(/Explore (?:Singapore|Dubai)/);
  });
});

describe('public migration containment', () => {
  it.each([
    '/kr/',
    '/kr/check/seoul/',
    '/kr/seoul/',
  ])('keeps published Korea page %s noindex without migration metadata', (path) => {
    const metadata = buildKoreaPublicPageMetadata(path);

    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata).not.toHaveProperty('alternates');
  });

  it('keeps withheld Korea pages noindex with no canonical', () => {
    const metadata = buildKoreaPublicPageMetadata('/kr/check/seoul/');
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata).not.toHaveProperty('alternates');
  });

  it('keeps the protected exact-record proof noindex without canonical or hreflang', () => {
    expect(proofMetadata.robots).toEqual({ index: false, follow: true });
    expect(proofMetadata).not.toHaveProperty('alternates');
  });

  it('keeps Rankings noindex without canonical, hreflang, or sitemap promotion', () => {
    expect(rankingsMetadata.robots).toEqual({ index: false, follow: true });
    expect(rankingsMetadata).not.toHaveProperty('alternates');
    expect(sitemap()).toEqual([]);
  });

  it('keeps the published Korea cohort out of the sitemap before migration', () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT', JSON.stringify(artifact(true)));
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);
    expect(sitemap()).toEqual([]);
  });

  it('emits no sitemap URL for withheld or missing evidence', () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT', JSON.stringify(artifact(false)));
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);
    expect(sitemap()).toEqual([]);

    vi.unstubAllEnvs();
    expect(sitemap()).toEqual([]);
  });
});
