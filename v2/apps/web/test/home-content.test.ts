import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import Home, { metadata as homeMetadata } from '../app/(en)/page';
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
      'See the market before you make the move.',
      'Choose the next useful step',
      'What changed',
      'Latest from the data desk',
      'Guides for renting and buying',
    ];
    const positions = needles.map((needle) => markup.indexOf(needle));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(markup).toContain('Research residential property in Seoul and Singapore');
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
      description: 'Verified Seoul property intelligence with official-source context and publication limits shown clearly.',
    });
    expect(layoutModule.metadata).not.toHaveProperty('alternates');
    expect(homeMetadata).toMatchObject({
      robots: { index: true, follow: true },
      alternates: { canonical: 'https://www.signedprice.com/' },
    });
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

    expect(markup).toContain('href="/trust/">Method</a>');
    expect(markup).toContain('publication limits');
    expect(markup).not.toMatch(/₩0|0 contracts/);
  });

  it('keeps the four public products and three markets navigable', async () => {
    const markup = renderToStaticMarkup(await Home());

    for (const href of ['/', '/news', '/kr/seoul/check', '/kr/seoul/explore', '/kr/seoul', '/sg', '/ae/dubai']) {
      expect(markup).toContain(`href="${href}"`);
    }
    expect(markup).toContain('aria-label="Primary navigation"');
    expect(markup).toContain('aria-label="Market navigation"');
    expect(markup).toContain('aria-label="Language navigation"');
    expect(markup).not.toContain('/design-review/');
  });

  it('puts current Seoul evidence on the root when the canonical fixture is available', async () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT', JSON.stringify(createPublicAreaV2Fixture()));
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_FIXTURE_PERIOD);

    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('Reported contracts');
    expect(markup).toContain(PUBLIC_AREA_FIXTURE_PERIOD);
    expect(markup).toContain('href="/kr/seoul/check"');
    expect(markup).toContain('href="/kr/seoul/explore"');

    vi.unstubAllEnvs();
  });

  it('presents all three cities before city-specific editorial content', async () => {
    const markup = renderToStaticMarkup(await Home());
    const globalPromise = markup.indexOf('See the market before you make the move.');
    const marketTabs = markup.indexOf('aria-label="Choose a property market"');
    const editorial = markup.indexOf('Latest from the data desk');

    expect(globalPromise).toBeGreaterThanOrEqual(0);
    expect(marketTabs).toBeGreaterThan(globalPromise);
    expect(editorial).toBeGreaterThan(marketTabs);
    expect(markup).toContain('data-market-id="kr-seoul"');
    expect(markup).toContain('data-market-id="sg-singapore"');
    expect(markup).toContain('data-market-id="ae-dubai"');
  });
});
