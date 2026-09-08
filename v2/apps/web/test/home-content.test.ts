import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import Home, { metadata as homeMetadata } from '../app/(en)/page';
import { metadata as koreanHomeMetadata } from '../app/(ko)/ko/page';
import { metadata as chineseHomeMetadata } from '../app/(zh-cn)/zh-cn/kr/seoul/page';
import { metadata as koreanShortlistMetadata } from '../app/(ko)/ko/kr/seoul/shortlist/page';
import {
  homepageCopy,
  homepageIntentGroups,
  homepageMarketCards,
} from '../lib/site-copy';
import { buildSeoulLiveModel } from '../lib/public-market/seoul-live-model.server';
import {
  createPublicAreaV2Fixture,
  PUBLIC_AREA_FIXTURE_PERIOD,
} from './public-area-fixture';

describe('signedprice homepage copy', () => {
  it('renders the approved editorial journey in decision order', async () => {
    const markup = renderToStaticMarkup(await Home());
    const needles = [
      'Where can your budget become a home?',
      'Explore a city',
      'Latest analysis',
      'Buying &amp; renting guides',
    ];
    const positions = needles.map((needle) => markup.indexOf(needle));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(markup).toContain('Enter your budget to compare property prices and estimated floor area');
    expect(markup).toContain('data-primary-action="explore"');
  }, 10_000);

  it('keeps the shared market registry and avoids unsupported claims', () => {
    expect(homepageCopy.brand).toBe('signedprice');
    expect(homepageMarketCards.map(({ id }) => id)).toEqual([
      'kr-seoul',
      'sg-singapore',
      'ae-dubai',
    ]);
    expect(JSON.stringify({ homepageCopy, homepageIntentGroups, homepageMarketCards })).not.toMatch(
      /millions of listings|guaranteed return|licensed broker/i,
    );
  });

  it('keeps the root neutral and exports indexable canonical metadata', async () => {
    const layoutModule = await import('../app/(en)/layout');

    expect(layoutModule.metadata).toEqual({
      metadataBase: new URL('https://www.signedprice.com'),
      title: 'signedprice | Real prices. Better property decisions.',
      description: 'Compare property prices, rents and buying costs in Seoul, Singapore and Dubai, with transaction dates and sources.',
    });
    expect(layoutModule.metadata).not.toHaveProperty('alternates');
    expect(homeMetadata).toMatchObject({
      robots: { index: true, follow: true },
      alternates: { canonical: 'https://www.signedprice.com/' },
    });
  });

  it('keeps the English, Korean, and Chinese homes mutually discoverable', () => {
    const languages = {
      en: 'https://www.signedprice.com/',
      ko: 'https://www.signedprice.com/ko/',
      'zh-Hans': 'https://www.signedprice.com/zh-cn/kr/seoul/',
      'x-default': 'https://www.signedprice.com/',
    };

    for (const metadata of [homeMetadata, koreanHomeMetadata, chineseHomeMetadata]) {
      expect(metadata.alternates?.languages).toEqual(languages);
    }
  });

  it('uses the Korean social image for the Korean Seoul shortlist', () => {
    expect(koreanShortlistMetadata.openGraph?.images).toEqual([
      'https://www.signedprice.com/og/ko/',
    ]);
    expect(koreanShortlistMetadata.twitter?.images).toEqual([
      'https://www.signedprice.com/og/ko/',
    ]);
  });

  it('keeps every visible claim anonymous and claim-safe', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).not.toMatch(
      /DwellSpan|millions of listings|guaranteed return|licensed broker|enquir|create account|\bsign[ -]?in\b/i,
    );
    expect(markup).not.toMatch(/191,067|8\.2%/);
  });

  it('keeps the shipped Seoul intent routes derived from the market registry', () => {
    const seoul = homepageMarketCards.find((market) => market.id === 'kr-seoul');

    expect(seoul).toMatchObject({
      id: 'kr-seoul',
      intentCapabilities: {
        rent: { href: '/kr/seoul/rent/', state: 'available' },
        buy: { href: '/kr/seoul/buy/', state: 'available' },
      },
    });
    expect(buildSeoulLiveModel().links.map(({ href }) => href)).toEqual([
      '/kr/seoul/check/',
      '/kr/seoul/explore/',
      '/kr/seoul/rankings/',
      '/kr/seoul/news/',
      '/kr/seoul/guide/',
    ]);
  });

  it('links the public methodology without inventing unavailable evidence', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('href="/trust">Method</a>');
    expect(markup).toContain('How our data works');
    expect(markup).not.toMatch(/₩0|0 contracts/);
  });

  it('keeps the four public products and three markets navigable', async () => {
    const markup = renderToStaticMarkup(await Home());

    for (const href of ['/', '/news?type=analysis', '/tools', '/kr/seoul/explore', '/kr/seoul', '/sg', '/ae/dubai']) {
      expect(markup).toContain(`href="${href}"`);
    }
    expect(markup).toContain('aria-label="Primary navigation"');
    expect(markup).toContain('aria-label="Market navigation"');
    expect(markup).toContain('aria-label="Language navigation"');
    expect(markup).not.toContain('/design-review/');
  });

  it('keeps detailed evidence in city tools and retains their routes when evidence is available', async () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT', JSON.stringify(createPublicAreaV2Fixture()));
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_FIXTURE_PERIOD);

    const markup = renderToStaticMarkup(await Home());

    expect(markup).not.toContain('Jeonse sample · 45–55 m²');
    expect(markup).toContain('data-home-region="markets"');
    expect(markup).toContain('href="/tools"');
    expect(markup).toContain('href="/kr/seoul/explore"');

    vi.unstubAllEnvs();
  });

  it('presents all three cities before city-specific editorial content', async () => {
    const markup = renderToStaticMarkup(await Home());
    const globalPromise = markup.indexOf('Where can your budget become a home?');
    const marketTabs = markup.indexOf('data-home-region="markets"');
    const editorial = markup.indexOf('Latest analysis');

    expect(globalPromise).toBeGreaterThanOrEqual(0);
    expect(marketTabs).toBeGreaterThan(globalPromise);
    expect(editorial).toBeGreaterThan(marketTabs);
    expect(markup).toContain('data-market-id="kr-seoul"');
    expect(markup).toContain('data-market-id="sg-singapore"');
    expect(markup).toContain('data-market-id="ae-dubai"');
  });
});
