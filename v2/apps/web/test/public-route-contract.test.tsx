import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import Home from '../app/page';
import sitemap from '../app/sitemap';
import { generateStaticParams as marketStaticParams } from '../app/[country]/[city]/page';
import { generateStaticParams as intentStaticParams } from '../app/[country]/[city]/[intent]/page';
import { metadata as proofMetadata } from '../app/kr/seoul/tools/rent-check/page';
import {
  PUBLIC_SUMMARY_ARTIFACT_VERSION,
  buildKoreaPublicPageMetadata,
  buildKoreaPublicRouteModel,
} from '../lib/public-market/route-model.server';

const period = '2026-05/2026-07';

function artifact(published: boolean) {
  const identity = {
    marketId: 'kr-seoul', area: 'seoul', parent: 'kr', deal: 'rent',
    band: 'all-homes', period, n: published ? 20 : 4, published,
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

function model(published: boolean) {
  const routeModel = buildKoreaPublicRouteModel('seoul', {
    source: artifact(published),
    period,
  });
  if (routeModel === null) throw new Error('Expected Seoul route model');
  return routeModel;
}

afterEach(() => vi.unstubAllEnvs());

describe('Korea-only public route availability', () => {
  it('generates no Singapore or Dubai overview or intent path', () => {
    expect(marketStaticParams()).toEqual([{ country: 'kr', city: 'seoul' }]);
    expect(intentStaticParams()).toEqual([
      { country: 'kr', city: 'seoul', intent: 'rent' },
      { country: 'kr', city: 'seoul', intent: 'buy' },
      { country: 'kr', city: 'seoul', intent: 'invest' },
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

describe('public indexing cohorts', () => {
  it.each([
    ['/kr/', 'https://signedprice.com/kr/'],
    ['/kr/check/seoul/', 'https://signedprice.com/kr/check/seoul/'],
    ['/kr/seoul/', 'https://signedprice.com/kr/seoul/'],
  ])('indexes a published Korea page with its exact canonical', (path, canonical) => {
    expect(buildKoreaPublicPageMetadata(model(true), path)).toMatchObject({
      robots: { index: true, follow: true },
      alternates: { canonical },
    });
  });

  it('keeps withheld Korea pages noindex with no canonical', () => {
    const metadata = buildKoreaPublicPageMetadata(model(false), '/kr/check/seoul/');
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata).not.toHaveProperty('alternates');
  });

  it('keeps the protected exact-record proof noindex without canonical or hreflang', () => {
    expect(proofMetadata.robots).toEqual({ index: false, follow: true });
    expect(proofMetadata).not.toHaveProperty('alternates');
  });

  it('puts only the published Korea cohort in the sitemap', () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT', JSON.stringify(artifact(true)));
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);
    expect(sitemap()).toEqual([
      { url: 'https://signedprice.com/kr/' },
      { url: 'https://signedprice.com/kr/check/seoul/' },
      { url: 'https://signedprice.com/kr/seoul/' },
    ]);
  });

  it('emits no sitemap URL for withheld or missing evidence', () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT', JSON.stringify(artifact(false)));
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);
    expect(sitemap()).toEqual([]);

    vi.unstubAllEnvs();
    expect(sitemap()).toEqual([]);
  });
});
