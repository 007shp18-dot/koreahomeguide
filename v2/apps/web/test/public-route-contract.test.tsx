import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync } from 'node:fs';
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
import { metadata as newsMetadata } from '../app/kr/seoul/news/page';
import { metadata as trustMetadata } from '../app/trust/page';
import { metadata as compareMetadata } from '../app/compare/page';
import { homepageCopy } from '../lib/site-copy';
import { GUIDES } from '../lib/guide/guide-content';
import {
  createPublicAreaFixture,
  createPublicAreaV2Fixture,
} from './public-area-fixture';
import {
  PUBLIC_SUMMARY_ARTIFACT_VERSION,
  buildKoreaPublicPageMetadata,
} from '../lib/public-market/route-model.server';
import { indexableMetadata } from '../lib/public-metadata';
import { buildMarketPageModel } from '../lib/route-model';

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
  it('publishes reciprocal self-canonical English and Korean alternates', () => {
    const english = indexableMetadata({
      path: '/kr/seoul/explore/',
      title: 'Seoul evidence',
      description: 'English evidence page.',
      languageAlternates: {
        en: '/kr/seoul/explore/',
        ko: '/ko/kr/seoul/explore/',
      },
    } as Parameters<typeof indexableMetadata>[0]);
    const korean = indexableMetadata({
      path: '/ko/kr/seoul/explore/',
      title: '서울 전세 근거',
      description: '한국어 근거 페이지.',
      languageAlternates: {
        en: '/kr/seoul/explore/',
        ko: '/ko/kr/seoul/explore/',
      },
    } as Parameters<typeof indexableMetadata>[0]);

    expect(english.alternates).toEqual({
      canonical: 'https://www.signedprice.com/kr/seoul/explore/',
      languages: {
        en: 'https://www.signedprice.com/kr/seoul/explore/',
        ko: 'https://www.signedprice.com/ko/kr/seoul/explore/',
        'x-default': 'https://www.signedprice.com/kr/seoul/explore/',
      },
    });
    expect(korean.alternates).toEqual({
      canonical: 'https://www.signedprice.com/ko/kr/seoul/explore/',
      languages: english.alternates?.languages,
    });
  });

  it('has completed Korean route modules before advertising hreflang', () => {
    for (const route of [
      '../app/ko/kr/seoul/page.tsx',
      '../app/ko/kr/seoul/check/page.tsx',
      '../app/ko/kr/seoul/explore/page.tsx',
      '../app/ko/kr/seoul/rankings/page.tsx',
    ]) {
      expect(existsSync(new URL(route, import.meta.url))).toBe(true);
    }
    expect(existsSync(new URL('../lib/locale/ko.ts', import.meta.url))).toBe(true);
  });

  it('formats won for Korean display without changing integer source values', async () => {
    let locale: typeof import('../lib/locale/ko') | null = null;
    try {
      locale = await import('../lib/locale/ko');
    } catch {
      // The assertion below keeps the RED phase an explicit missing-feature failure.
    }
    expect(locale).not.toBeNull();
    if (locale === null) return;

    expect(locale.formatKrwKo(300_000_000)).toBe('3.0억');
    expect(locale.formatKrwKo(325_000_000)).toBe('3억 2,500만원');
    expect(locale.formatKrwKo(50_000_000)).toBe('5,000만원');
    expect(locale.formatKrwKo(12_345)).toBe('1만 2,345원');
  });

  it('renders completed Korean evidence routes with Korean-first copy', async () => {
    const routes = [
      ['../app/ko/kr/seoul/page', '서울 주거 계약 근거'],
      ['../app/ko/kr/seoul/check/page', '두 계약 조건 비교'],
      ['../app/ko/kr/seoul/explore/page', '서울 25개 구 전세 근거'],
      ['../app/ko/kr/seoul/rankings/page', '서울 구별 근거 순위'],
    ] as const;
    for (const [modulePath, heading] of routes) {
      let route: { default: () => unknown } | null = null;
      try {
        route = await import(/* @vite-ignore */ modulePath) as { default: () => unknown };
      } catch {
        // The assertion below keeps missing routes visible in the RED phase.
      }
      expect(route, modulePath).not.toBeNull();
      if (route === null) continue;
      const output = await route.default();
      const html = renderToStaticMarkup(output as Parameters<typeof renderToStaticMarkup>[0]);
      expect(html).toContain(heading);
      expect(html).not.toMatch(/오를|내릴|전망|예상 가격|가장 정확|유일한|감정가|평가액/);
    }
  });
  it.each([
    '/kr/seoul/check/',
    '/kr/check/seoul/',
    '/kr/seoul/',
  ])('indexes published Korea page %s with one self canonical', (path) => {
    const metadata = buildKoreaPublicPageMetadata(path);

    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates?.canonical).toBe(`https://www.signedprice.com${path}`);
    if (path === '/kr/seoul/check/') {
      expect(metadata.alternates?.languages).toEqual({
        en: 'https://www.signedprice.com/kr/seoul/check/',
        ko: 'https://www.signedprice.com/ko/kr/seoul/check/',
        'x-default': 'https://www.signedprice.com/kr/seoul/check/',
      });
    } else {
      expect(metadata.alternates?.languages).toBeUndefined();
    }
  });

  it('refuses metadata for paths outside the approved Korea cohort', () => {
    expect(() => buildKoreaPublicPageMetadata('/kr/unknown/')).toThrow(
      'Unknown Korea public canonical path.',
    );
  });

  it('describes canonical Contract Check without appraisal or accuracy claims', () => {
    const metadata = buildKoreaPublicPageMetadata('/kr/seoul/check/');

    expect(metadata.title).toBe('Compare Seoul rental contract offers | signedprice');
    expect(metadata.description).toContain('filed deposit-and-rent offers');
    expect(JSON.stringify(metadata)).not.toMatch(/appraisal|valuation|predict|accurate/i);
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
      [newsMetadata, '/kr/seoul/news/'],
    ] as const) {
      expect(metadata.robots).toEqual({ index: true, follow: true });
      expect(metadata.alternates?.canonical).toBe(`https://www.signedprice.com${path}`);
      if (path === '/kr/seoul/explore/' || path === '/kr/seoul/rankings/') {
        expect(metadata.alternates?.languages).toMatchObject({
          en: `https://www.signedprice.com${path}`,
          ko: `https://www.signedprice.com/ko${path}`,
        });
      } else {
        expect(metadata.alternates?.languages).toBeUndefined();
      }
    }
  });

  it('indexes the standalone Seoul overview with a reciprocal Korean alternate', () => {
    const model = buildMarketPageModel('kr', 'seoul');
    expect(model?.metadata.robots).toEqual({ index: true, follow: true });
    expect(model?.metadata.alternates).toEqual({
      canonical: 'https://www.signedprice.com/kr/seoul/',
      languages: {
        en: 'https://www.signedprice.com/kr/seoul/',
        ko: 'https://www.signedprice.com/ko/kr/seoul/',
        'x-default': 'https://www.signedprice.com/kr/seoul/',
      },
    });
  });

  it('publishes only the approved global, Korea, and guide cohort in the sitemap', () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT', JSON.stringify(artifact(true)));
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);
    const urls = sitemap().map(({ url }) => url);
    expect(urls).toEqual([
      'https://www.signedprice.com/',
      'https://www.signedprice.com/compare/',
      'https://www.signedprice.com/trust/',
      'https://www.signedprice.com/kr/seoul/check/',
      'https://www.signedprice.com/kr/seoul/',
      'https://www.signedprice.com/kr/check/seoul/',
      'https://www.signedprice.com/kr/seoul/news/',
      'https://www.signedprice.com/kr/seoul/news/how-signedprice-reads-reported-rental-contracts/',
      'https://www.signedprice.com/kr/seoul/guide/',
      ...GUIDES.map(({ slug }) => `https://www.signedprice.com/kr/seoul/guide/${slug}/`),
      'https://www.signedprice.com/ko/kr/seoul/',
      'https://www.signedprice.com/ko/kr/seoul/check/',
    ]);
  });

  it('adds only artifact-reconciled numeric News detail routes', () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT',
      JSON.stringify(createPublicAreaV2Fixture()),
    );

    const items = sitemap();
    const numericBrief = items.find(({ url }) => (
      url === 'https://www.signedprice.com/kr/seoul/news/what-the-seoul-district-snapshot-covers/'
    ));
    expect(numericBrief).toMatchObject({
      lastModified: new Date('2026-08-31T01:00:00.000Z'),
    });

    vi.stubEnv('SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT', JSON.stringify({ invalid: true }));
    expect(sitemap().map(({ url }) => url)).not.toContain(
      'https://www.signedprice.com/kr/seoul/news/what-the-seoul-district-snapshot-covers/',
    );
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
    expect(urls).toContain('https://www.signedprice.com/ko/kr/seoul/explore/');
    expect(urls).toContain('https://www.signedprice.com/ko/kr/seoul/rankings/');
  });

  it('keeps evidence-dependent Korea pages out when evidence is withheld or missing', () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT', JSON.stringify(artifact(false)));
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);
    expect(sitemap().map(({ url }) => url)).toEqual([
      'https://www.signedprice.com/',
      'https://www.signedprice.com/compare/',
      'https://www.signedprice.com/trust/',
      'https://www.signedprice.com/kr/seoul/check/',
      'https://www.signedprice.com/kr/seoul/news/',
      'https://www.signedprice.com/kr/seoul/news/how-signedprice-reads-reported-rental-contracts/',
      'https://www.signedprice.com/kr/seoul/guide/',
      ...GUIDES.map(({ slug }) => `https://www.signedprice.com/kr/seoul/guide/${slug}/`),
      'https://www.signedprice.com/ko/kr/seoul/',
      'https://www.signedprice.com/ko/kr/seoul/check/',
    ]);

    vi.unstubAllEnvs();
    expect(sitemap().map(({ url }) => url)).toEqual([
      'https://www.signedprice.com/',
      'https://www.signedprice.com/compare/',
      'https://www.signedprice.com/trust/',
      'https://www.signedprice.com/kr/seoul/check/',
      'https://www.signedprice.com/kr/seoul/news/',
      'https://www.signedprice.com/kr/seoul/news/how-signedprice-reads-reported-rental-contracts/',
      'https://www.signedprice.com/kr/seoul/guide/',
      ...GUIDES.map(({ slug }) => `https://www.signedprice.com/kr/seoul/guide/${slug}/`),
      'https://www.signedprice.com/ko/kr/seoul/',
      'https://www.signedprice.com/ko/kr/seoul/check/',
    ]);
  });
});
