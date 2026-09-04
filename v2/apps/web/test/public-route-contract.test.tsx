import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import Home from '../app/(en)/page';
import sitemap from '../app/sitemap';
import { generateStaticParams as marketStaticParams } from '../app/(en)/[country]/[city]/page';
import { generateStaticParams as intentStaticParams } from '../app/(en)/[country]/[city]/[intent]/page';
import { metadata as proofMetadata } from '../app/(en)/kr/seoul/tools/rent-check/page';
import { metadata as rankingsMetadata } from '../app/(en)/kr/seoul/rankings/page';
import { metadata as explorerMetadata } from '../app/(en)/kr/seoul/explore/page';
import { metadata as newsMetadata } from '../app/(en)/kr/seoul/news/page';
import { metadata as trustMetadata } from '../app/(en)/trust/page';
import { metadata as compareMetadata } from '../app/(en)/compare/page';
import { EDITORIAL_PORTFOLIO } from '../content/portfolio-manifest';
import { homepageCopy } from '../lib/site-copy';
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
const portfolioUrls = EDITORIAL_PORTFOLIO.map(({ canonicalHref }) => `https://www.signedprice.com${canonicalHref}`);

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

describe('released local route availability', () => {
  it('generates Seoul and Dubai overviews, three Seoul intents, and exactly 25 district paths', () => {
    expect(marketStaticParams()).toEqual([
      { country: 'kr', city: 'seoul' },
      { country: 'ae', city: 'dubai' },
    ]);
    expect(intentStaticParams()).toEqual([
      { country: 'kr', city: 'seoul', intent: 'rent' },
      { country: 'kr', city: 'seoul', intent: 'buy' },
      { country: 'kr', city: 'seoul', intent: 'invest' },
      ...SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => ({
        country: 'kr', city: 'seoul', intent: slug,
      })),
    ]);
    expect(JSON.stringify(intentStaticParams())).not.toMatch(/singapore|dubai|\bsg\b|\bae\b/);
  });

  it('keeps the global market roadmap visible with a rights-safe Dubai overview', async () => {
    vi.stubEnv('SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS', 'false');
    const html = renderToStaticMarkup(await Home());
    expect(html).toContain('/kr/seoul/');
    expect(html).toContain('href="/sg"');
    expect(html).toContain('href="/sg/singapore/explore"');
    expect(html).toContain('href="/ae/dubai"');
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
      locale: 'ko_KR',
      imagePath: '/og/ko/',
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
    expect(korean.openGraph).toMatchObject({
      type: 'website',
      locale: 'ko_KR',
      url: 'https://www.signedprice.com/ko/kr/seoul/explore/',
      images: ['https://www.signedprice.com/og/ko/'],
    });
    expect(korean.twitter).toMatchObject({
      card: 'summary_large_image',
      images: ['https://www.signedprice.com/og/ko/'],
    });
  });

  it('has completed Korean route modules before advertising hreflang', () => {
    for (const route of [
      '../app/(ko)/ko/kr/seoul/page.tsx',
      '../app/(ko)/ko/kr/seoul/check/page.tsx',
      '../app/(ko)/ko/kr/seoul/explore/page.tsx',
      '../app/(ko)/ko/kr/seoul/rankings/page.tsx',
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

  it('renders Korean evidence routes that do not require conversion evidence', async () => {
    const routes = [
      ['../app/(ko)/ko/kr/seoul/page', '서울 주거 계약 근거'],
      ['../app/(ko)/ko/kr/seoul/explore/page', '검증된 구별 자료를 확인할 수 없습니다.'],
      ['../app/(ko)/ko/kr/seoul/rankings/page', '서울 구별 근거 순위'],
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
  ])('indexes published Korea page %s with one self canonical', (path) => {
    const metadata = buildKoreaPublicPageMetadata(path);

    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates?.canonical).toBe(`https://www.signedprice.com${path}`);
    expect(metadata.alternates?.languages).toEqual({
      en: 'https://www.signedprice.com/kr/seoul/check/',
      ko: 'https://www.signedprice.com/ko/kr/seoul/check/',
      'x-default': 'https://www.signedprice.com/kr/seoul/check/',
    });
  });

  it('refuses metadata for paths outside the approved Korea cohort', () => {
    expect(() => buildKoreaPublicPageMetadata('/kr/unknown/')).toThrow(
      'Unknown Korea public canonical path.',
    );
  });

  it('describes canonical Contract Check without appraisal or accuracy claims', () => {
    const metadata = buildKoreaPublicPageMetadata('/kr/seoul/check/');

    expect(metadata.title).toBe('Check a Seoul sale, jeonse or rent quote | signedprice');
    expect(metadata.description).toContain('sale, jeonse or monthly-rent asking quote');
    expect(JSON.stringify(metadata)).not.toMatch(/appraisal|valuation|predict|accurate/i);
  });

  it('indexes the working Rent Check with one self canonical', () => {
    expect(proofMetadata.robots).toEqual({ index: true, follow: true });
    expect(proofMetadata.alternates).toEqual({
      canonical: 'https://www.signedprice.com/kr/seoul/tools/rent-check/',
    });
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
      if (path === '/') {
        expect(metadata.alternates?.languages).toMatchObject({
          en: 'https://www.signedprice.com/',
          'zh-Hans': 'https://www.signedprice.com/zh-cn/kr/seoul/',
        });
      } else if (path === '/kr/seoul/explore/' || path === '/kr/seoul/rankings/') {
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
      'https://www.signedprice.com/markets/',
      'https://www.signedprice.com/prices/',
      'https://www.signedprice.com/news/',
      'https://www.signedprice.com/news/policy/',
      'https://www.signedprice.com/zh-cn/news/',
      'https://www.signedprice.com/zh-cn/guides/',
      'https://www.signedprice.com/zh-cn/kr/seoul/',
      'https://www.signedprice.com/community/',
      'https://www.signedprice.com/guides/',
      'https://www.signedprice.com/privacy/',
      'https://www.signedprice.com/contact/',
      'https://www.signedprice.com/sg/',
      'https://www.signedprice.com/sg/singapore/explore/',
      'https://www.signedprice.com/sg/singapore/explore/ccr/',
      'https://www.signedprice.com/sg/singapore/explore/rcr/',
      'https://www.signedprice.com/sg/singapore/explore/ocr/',
      ...portfolioUrls,
      'https://www.signedprice.com/',
      'https://www.signedprice.com/compare/',
      'https://www.signedprice.com/trust/',
      'https://www.signedprice.com/kr/seoul/check/',
      'https://www.signedprice.com/kr/seoul/check/compare/',
      'https://www.signedprice.com/kr/seoul/tools/rent-check/',
      'https://www.signedprice.com/kr/seoul/',
      'https://www.signedprice.com/kr/seoul/news/',
      'https://www.signedprice.com/kr/seoul/news/how-signedprice-reads-reported-rental-contracts/',
      'https://www.signedprice.com/ko/kr/seoul/',
      'https://www.signedprice.com/ko/kr/seoul/check/',
      'https://www.signedprice.com/ko/kr/seoul/check/compare/',
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

  it('publishes honest content dates and alternates only for real localized counterparts', () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT', JSON.stringify(artifact(true)));
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT',
      JSON.stringify(createPublicAreaV2Fixture()),
    );

    const entries = new Map(sitemap().map((entry) => [entry.url, entry] as const));
    const localizedExplore = {
      en: 'https://www.signedprice.com/kr/seoul/explore/',
      ko: 'https://www.signedprice.com/ko/kr/seoul/explore/',
      'x-default': 'https://www.signedprice.com/kr/seoul/explore/',
    };

    expect(entries.get('https://www.signedprice.com/kr/seoul/')).toMatchObject({
      lastModified: new Date('2026-08-30T00:00:00.000Z'),
      alternates: {
        languages: {
          en: 'https://www.signedprice.com/kr/seoul/',
          ko: 'https://www.signedprice.com/ko/kr/seoul/',
          'x-default': 'https://www.signedprice.com/kr/seoul/',
        },
      },
    });
    expect(entries.get('https://www.signedprice.com/kr/seoul/explore/')).toMatchObject({
      lastModified: new Date('2026-08-31T01:13:24.787Z'),
      alternates: { languages: localizedExplore },
    });
    expect(entries.get('https://www.signedprice.com/ko/kr/seoul/explore/')).toMatchObject({
      lastModified: new Date('2026-08-31T01:13:24.787Z'),
      alternates: { languages: localizedExplore },
    });
    expect(entries.get(
      'https://www.signedprice.com/kr/seoul/explore/gangnam-gu/',
    )).toEqual({
      url: 'https://www.signedprice.com/kr/seoul/explore/gangnam-gu/',
      lastModified: new Date('2026-08-31T01:13:24.787Z'),
    });
    expect(entries.get('https://www.signedprice.com/kr/seoul/news/')).toMatchObject({
      lastModified: new Date('2026-08-31T01:00:00.000Z'),
    });
    expect(entries.get('https://www.signedprice.com/guides/compare-seoul-district-prices/')).toMatchObject({
      lastModified: new Date('2026-09-04T00:00:00.000Z'),
    });
  });

  it('keeps evidence-dependent Korea pages out when evidence is withheld or missing', () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT', JSON.stringify(artifact(false)));
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);
    expect(sitemap().map(({ url }) => url)).toEqual([
      'https://www.signedprice.com/markets/',
      'https://www.signedprice.com/prices/',
      'https://www.signedprice.com/news/',
      'https://www.signedprice.com/news/policy/',
      'https://www.signedprice.com/zh-cn/news/',
      'https://www.signedprice.com/zh-cn/guides/',
      'https://www.signedprice.com/zh-cn/kr/seoul/',
      'https://www.signedprice.com/community/',
      'https://www.signedprice.com/guides/',
      'https://www.signedprice.com/privacy/',
      'https://www.signedprice.com/contact/',
      'https://www.signedprice.com/sg/',
      'https://www.signedprice.com/sg/singapore/explore/',
      'https://www.signedprice.com/sg/singapore/explore/ccr/',
      'https://www.signedprice.com/sg/singapore/explore/rcr/',
      'https://www.signedprice.com/sg/singapore/explore/ocr/',
      ...portfolioUrls,
      'https://www.signedprice.com/',
      'https://www.signedprice.com/compare/',
      'https://www.signedprice.com/trust/',
      'https://www.signedprice.com/kr/seoul/check/',
      'https://www.signedprice.com/kr/seoul/check/compare/',
      'https://www.signedprice.com/kr/seoul/tools/rent-check/',
      'https://www.signedprice.com/kr/seoul/news/',
      'https://www.signedprice.com/kr/seoul/news/how-signedprice-reads-reported-rental-contracts/',
      'https://www.signedprice.com/ko/kr/seoul/',
      'https://www.signedprice.com/ko/kr/seoul/check/',
      'https://www.signedprice.com/ko/kr/seoul/check/compare/',
    ]);

    vi.unstubAllEnvs();
    expect(sitemap().map(({ url }) => url)).toEqual([
      'https://www.signedprice.com/markets/',
      'https://www.signedprice.com/prices/',
      'https://www.signedprice.com/news/',
      'https://www.signedprice.com/news/policy/',
      'https://www.signedprice.com/zh-cn/news/',
      'https://www.signedprice.com/zh-cn/guides/',
      'https://www.signedprice.com/zh-cn/kr/seoul/',
      'https://www.signedprice.com/community/',
      'https://www.signedprice.com/guides/',
      'https://www.signedprice.com/privacy/',
      'https://www.signedprice.com/contact/',
      'https://www.signedprice.com/sg/',
      'https://www.signedprice.com/sg/singapore/explore/',
      'https://www.signedprice.com/sg/singapore/explore/ccr/',
      'https://www.signedprice.com/sg/singapore/explore/rcr/',
      'https://www.signedprice.com/sg/singapore/explore/ocr/',
      ...portfolioUrls,
      'https://www.signedprice.com/',
      'https://www.signedprice.com/compare/',
      'https://www.signedprice.com/trust/',
      'https://www.signedprice.com/kr/seoul/check/',
      'https://www.signedprice.com/kr/seoul/check/compare/',
      'https://www.signedprice.com/kr/seoul/tools/rent-check/',
      'https://www.signedprice.com/kr/seoul/news/',
      'https://www.signedprice.com/kr/seoul/news/how-signedprice-reads-reported-rental-contracts/',
      'https://www.signedprice.com/ko/kr/seoul/',
      'https://www.signedprice.com/ko/kr/seoul/check/',
      'https://www.signedprice.com/ko/kr/seoul/check/compare/',
    ]);
  });
});
