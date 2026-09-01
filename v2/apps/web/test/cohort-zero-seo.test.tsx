import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import RootLayout from '../app/layout';
import Home, { metadata as homeMetadata } from '../app/page';
import MarketOverviewPage, {
  generateMetadata as marketMetadata,
} from '../app/[country]/[city]/page';
import SeoulContractCheckPage, {
  generateMetadata as checkMetadata,
} from '../app/kr/seoul/check/page';
import KoreanContractCheckPage from '../app/ko/kr/seoul/check/page';
import ExplorerPage, { metadata as exploreMetadata } from '../app/kr/seoul/explore/page';
import RankingsPage, { metadata as rankingsMetadata } from '../app/kr/seoul/rankings/page';
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
      'Compare Seoul rental contract offers | signedprice',
      'Seoul district jeonse evidence | signedprice',
      'Seoul district jeonse rankings | signedprice',
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

  it('serializes one global WebSite and Organization graph without executable markup', () => {
    const html = renderToStaticMarkup(
      <RootLayout><main>{'<unsafe>'}</main></RootLayout>,
    );

    expect(html.match(/data-structured-data="site"/g)).toHaveLength(1);
    expect(html).toContain('"@type":"WebSite"');
    expect(html).toContain('"@type":"Organization"');
    expect(html).toContain('https://www.signedprice.com/#organization');
    expect(safeJsonLd({ value: '</script><script>alert(1)</script>' }))
      .toBe('{"value":"\\u003c/script>\\u003cscript>alert(1)\\u003c/script>"}');
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

  it('redirects an unavailable comparison to the working Rent Check flow', () => {
    vi.stubEnv('SIGNEDPRICE_CONVERSION_CURVE_ARTIFACT', '');
    vi.stubEnv('SIGNEDPRICE_CONVERSION_CURVE_PERIOD', '');
    vi.stubEnv('SIGNEDPRICE_CONVERSION_CURVE_SHA256', '');
    for (const page of [SeoulContractCheckPage, KoreanContractCheckPage]) {
      let thrown: unknown;
      try {
        page();
      } catch (error) {
        thrown = error;
      }
      expect(thrown).toMatchObject({
        digest: expect.stringContaining('/kr/seoul/tools/rent-check/'),
      });
    }
  });

  it('renders breadcrumb data on available English Seoul hubs and crawlable home links', async () => {
    const routeMarkup = await Promise.all([
      MarketOverviewPage({ params: Promise.resolve({ country: 'kr', city: 'seoul' }) }),
      ExplorerPage({ searchParams: Promise.resolve({}) }),
      Promise.resolve(RankingsPage()),
    ]).then((pages) => pages.map((page) => renderToStaticMarkup(page)));
    expect(routeMarkup.every((html) => html.includes('"@type":"BreadcrumbList"'))).toBe(true);

    const homeHtml = renderToStaticMarkup(await Home());
    for (const href of [
      '/kr/seoul/check/',
      '/kr/seoul/explore/',
      '/kr/seoul/rankings/',
      '/kr/seoul/news/',
      '/kr/seoul/guide/',
    ]) {
      expect(homeHtml).toContain(`href="${href}"`);
    }
  });
});
