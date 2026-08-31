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
import { metadata as explorerMetadata } from '../app/kr/seoul/explore/page';
import { metadata as trustMetadata } from '../app/trust/page';
import { metadata as compareMetadata } from '../app/compare/page';
import { homepageCopy } from '../lib/site-copy';
import { GUIDES } from '../lib/guide/guide-content';
import { createPublicAreaFixture } from './public-area-fixture';
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

  it('removes future-market destinations from public home navigation', async () => {
    const html = renderToStaticMarkup(await Home());
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
  ])('indexes published Korea page %s with one self canonical', (path) => {
    const metadata = buildKoreaPublicPageMetadata(path);

    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates).toEqual({
      canonical: `https://www.signedprice.com${path}`,
    });
  });

  it('refuses metadata for paths outside the approved Korea cohort', () => {
    expect(() => buildKoreaPublicPageMetadata('/kr/unknown/')).toThrow(
      'Unknown Korea public canonical path.',
    );
  });

  it('keeps the protected exact-record proof noindex without canonical or hreflang', () => {
    expect(proofMetadata.robots).toEqual({ index: false, follow: true });
    expect(proofMetadata).not.toHaveProperty('alternates');
  });

  it('indexes the global and verified Korea discovery surfaces with self canonicals', () => {
    for (const [metadata, path] of [
      [homepageCopy.metadata, '/'],
      [compareMetadata, '/compare/'],
      [trustMetadata, '/trust/'],
      [explorerMetadata, '/kr/seoul/explore/'],
      [rankingsMetadata, '/kr/seoul/rankings/'],
    ] as const) {
      expect(metadata.robots).toEqual({ index: true, follow: true });
      expect(metadata.alternates).toEqual({
        canonical: `https://www.signedprice.com${path}`,
      });
    }
  });

  it('publishes only the approved global, Korea, and guide cohort in the sitemap', () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT', JSON.stringify(artifact(true)));
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);
    const urls = sitemap().map(({ url }) => url);
    expect(urls).toEqual([
      'https://www.signedprice.com/',
      'https://www.signedprice.com/compare/',
      'https://www.signedprice.com/trust/',
      'https://www.signedprice.com/kr/',
      'https://www.signedprice.com/kr/check/seoul/',
      'https://www.signedprice.com/kr/seoul/',
      'https://www.signedprice.com/kr/seoul/guide/',
      ...GUIDES.map(({ slug }) => `https://www.signedprice.com/kr/seoul/guide/${slug}/`),
    ]);
  });

  it('adds Explore, Rankings, and only published canonical district URLs with area evidence', () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT', JSON.stringify(artifact(true)));
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);
    vi.stubEnv('SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT', JSON.stringify(
      createPublicAreaFixture({
        publishedMedians: {
          'jongno-gu': 300_000_000,
          'gangnam-gu': 500_000_000,
        },
      }),
    ));

    const urls = sitemap().map(({ url }) => url);
    expect(urls).toContain('https://www.signedprice.com/kr/seoul/explore/');
    expect(urls).toContain('https://www.signedprice.com/kr/seoul/rankings/');
    expect(urls).toContain('https://www.signedprice.com/kr/seoul/explore/jongno-gu/');
    expect(urls).toContain('https://www.signedprice.com/kr/seoul/explore/gangnam-gu/');
    expect(urls).not.toContain('https://www.signedprice.com/kr/seoul/explore/mapo-gu/');
    expect(urls).not.toContain('https://www.signedprice.com/kr/seoul/gangnam-gu/');
  });

  it('keeps evidence-dependent Korea pages out when evidence is withheld or missing', () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT', JSON.stringify(artifact(false)));
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);
    expect(sitemap().map(({ url }) => url)).toEqual([
      'https://www.signedprice.com/',
      'https://www.signedprice.com/compare/',
      'https://www.signedprice.com/trust/',
      'https://www.signedprice.com/kr/seoul/guide/',
      ...GUIDES.map(({ slug }) => `https://www.signedprice.com/kr/seoul/guide/${slug}/`),
    ]);

    vi.unstubAllEnvs();
    expect(sitemap().map(({ url }) => url)).toEqual([
      'https://www.signedprice.com/',
      'https://www.signedprice.com/compare/',
      'https://www.signedprice.com/trust/',
      'https://www.signedprice.com/kr/seoul/guide/',
      ...GUIDES.map(({ slug }) => `https://www.signedprice.com/kr/seoul/guide/${slug}/`),
    ]);
  });
});
