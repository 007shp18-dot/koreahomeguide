import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import EnglishRootLayout from '../app/(en)/layout';
import KoreanRootLayout from '../app/(ko)/layout';
import Home, { metadata as homeMetadata } from '../app/(en)/page';
import MarketOverviewPage, {
  generateMetadata as marketMetadata,
} from '../app/(en)/[country]/[city]/page';
import SeoulContractCheckPage, {
  generateMetadata as checkMetadata,
} from '../app/(en)/kr/seoul/check/page';
import KoreanContractCheckPage from '../app/(ko)/ko/kr/seoul/check/page';
import { metadata as offerComparisonMetadata } from '../app/(en)/kr/seoul/check/compare/page';
import { metadata as koreanOfferComparisonMetadata } from '../app/(ko)/ko/kr/seoul/check/compare/page';
import ExplorerPage, { metadata as exploreMetadata } from '../app/(en)/kr/seoul/explore/page';
import RankingsPage, { metadata as rankingsMetadata } from '../app/(en)/kr/seoul/rankings/page';
import {
  buildBreadcrumbJsonLd,
  publicSiteJsonLd,
  safeJsonLd,
} from '../lib/public-metadata';

afterEach(() => vi.unstubAllEnvs());

function canonical(metadata: Awaited<ReturnType<typeof marketMetadata>>): string | null {
  const value = metadata.alternates?.canonical;
  return typeof value === 'string' || value === null ? value : null;
}

describe('SignedPrice cohort zero SEO', () => {
  it('publishes distinct self-canonical metadata for every English hub', async () => {
    const market = await marketMetadata({
      params: Promise.resolve({ country: 'kr', city: 'seoul' }),
    });
    const entries = [
      homeMetadata,
      market,
      checkMetadata(),
      exploreMetadata,
      rankingsMetadata,
    ];

    expect(entries.map(({ title }) => title)).toEqual([
      'signedprice | Real prices. Better property decisions.',
      'Seoul property intelligence | signedprice',
      'Check a Seoul sale, jeonse or rent quote | signedprice',
      'Seoul sale, jeonse and monthly-rent evidence | signedprice',
      'Seoul sale, jeonse and monthly-rent rankings | signedprice',
    ]);
    expect(entries.map((entry) => canonical(entry))).toEqual([
      'https://www.signedprice.com/',
      'https://www.signedprice.com/kr/seoul/',
      'https://www.signedprice.com/kr/seoul/check/',
      'https://www.signedprice.com/kr/seoul/explore/',
      'https://www.signedprice.com/kr/seoul/rankings/',
    ]);
    expect(entries.every(({ description }) => (
      typeof description === 'string' && description.length >= 70
    ))).toBe(true);
  });

  it('publishes reciprocal locale-correct metadata for offer comparison', () => {
    const languages = {
      en: 'https://www.signedprice.com/kr/seoul/check/compare/',
      ko: 'https://www.signedprice.com/ko/kr/seoul/check/compare/',
      'x-default': 'https://www.signedprice.com/kr/seoul/check/compare/',
    };

    expect(offerComparisonMetadata.alternates).toEqual({
      canonical: 'https://www.signedprice.com/kr/seoul/check/compare/',
      languages,
    });
    expect(koreanOfferComparisonMetadata.alternates).toEqual({
      canonical: 'https://www.signedprice.com/ko/kr/seoul/check/compare/',
      languages,
    });
    expect(koreanOfferComparisonMetadata.openGraph).toMatchObject({
      locale: 'ko_KR',
      images: ['https://www.signedprice.com/og/ko/'],
    });
    expect(koreanOfferComparisonMetadata.twitter).toMatchObject({
      images: ['https://www.signedprice.com/og/ko/'],
    });
  });

  it('serializes one global WebSite and Organization graph without executable markup', () => {
    const html = renderToStaticMarkup(
      <EnglishRootLayout><main>{'<unsafe>'}</main></EnglishRootLayout>,
    );

    expect(html.match(/data-structured-data="site"/g)).toHaveLength(1);
    expect(html).toContain('"@type":"WebSite"');
    expect(html).toContain('"@type":"Organization"');
    expect(html).toContain('https://www.signedprice.com/#organization');
    expect(safeJsonLd({ value: '</script><script>alert(1)</script>' }))
      .toBe('{"value":"\\u003c/script>\\u003cscript>alert(1)\\u003c/script>"}');
  });

  it('emits the route language on the root document without losing the shared site graph', () => {
    const english = renderToStaticMarkup(<EnglishRootLayout><main /></EnglishRootLayout>);
    const korean = renderToStaticMarkup(<KoreanRootLayout><main /></KoreanRootLayout>);

    expect(english).toMatch(/^<html lang="en">/);
    expect(korean).toMatch(/^<html lang="ko">/);
    expect(english.match(/data-structured-data="site"/g)).toHaveLength(1);
    expect(korean.match(/data-structured-data="site"/g)).toHaveLength(1);
  });

  it('builds absolute, ordered BreadcrumbList data for Seoul hubs', () => {
    expect(buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Seoul', path: '/kr/seoul/' },
      { name: 'Explore', path: '/kr/seoul/explore/' },
    ])).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem', position: 1, name: 'Home',
          item: 'https://www.signedprice.com/',
        },
        {
          '@type': 'ListItem', position: 2, name: 'Seoul',
          item: 'https://www.signedprice.com/kr/seoul/',
        },
        {
          '@type': 'ListItem', position: 3, name: 'Explore',
          item: 'https://www.signedprice.com/kr/seoul/explore/',
        },
      ],
    });
    expect(publicSiteJsonLd()).toEqual({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://www.signedprice.com/#organization',
          name: 'SignedPrice',
          url: 'https://www.signedprice.com/',
        },
        {
          '@type': 'WebSite',
          '@id': 'https://www.signedprice.com/#website',
          name: 'SignedPrice',
          url: 'https://www.signedprice.com/',
          inLanguage: ['en', 'ko'],
          publisher: { '@id': 'https://www.signedprice.com/#organization' },
        },
      ],
    });
  });

  it('makes the installed sale and rent Check primary while keeping offer comparison secondary', async () => {
    vi.stubEnv('SIGNEDPRICE_CONVERSION_CURVE_ARTIFACT', '');
    vi.stubEnv('SIGNEDPRICE_CONVERSION_CURVE_PERIOD', '');
    vi.stubEnv('SIGNEDPRICE_CONVERSION_CURVE_SHA256', '');
    for (const page of [SeoulContractCheckPage, KoreanContractCheckPage]) {
      const html = renderToStaticMarkup(await page({ searchParams: Promise.resolve({}) }));
      expect(html).toContain('data-primary-check="single-quote"');
      expect(html).toContain('/check/compare');
      expect(html).toContain('value="sale"');
      expect(html).toContain('value="jeonse"');
      expect(html).toContain('value="monthly"');
    }
  });

  it('renders breadcrumb data on available English Seoul hubs and crawlable home links', async () => {
    const routeMarkup = await Promise.all([
      MarketOverviewPage({ params: Promise.resolve({ country: 'kr', city: 'seoul' }) }),
      ExplorerPage({ searchParams: Promise.resolve({}) }),
      Promise.resolve(RankingsPage()),
    ]).then((pages) => pages.map((page) => renderToStaticMarkup(page)));
    expect(routeMarkup.every((html) => html.includes('"@type":"BreadcrumbList"'))).toBe(true);
    for (const [html, koreanHref] of [
      [routeMarkup[0], '/ko/kr/seoul/'],
      [routeMarkup[1], '/ko/kr/seoul/explore/'],
      [routeMarkup[2], '/ko/kr/seoul/rankings/'],
    ] as const) {
      expect(html).toContain(`href="${koreanHref.slice(0, -1)}"`);
      expect(html).toMatch(/hreflang="ko"/i);
    }

    const homeHtml = renderToStaticMarkup(await Home());
    for (const href of [
      '/kr/seoul/check',
      '/kr/seoul/explore',
      '/kr/seoul/rankings',
      '/kr/seoul/news',
      '/kr/seoul/guide',
    ]) {
      expect(homeHtml).toContain(`href="${href}"`);
    }
  });
});
