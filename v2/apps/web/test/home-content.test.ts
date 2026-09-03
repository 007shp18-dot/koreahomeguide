import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

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
  it('renders the approved evidence editorial journey in decision order', async () => {
    const markup = renderToStaticMarkup(await Home());
    const ids = [
      'home-decision',
      'markets',
      'home-explore',
      'home-prices',
      'home-briefs',
      'home-trust',
    ];
    const positions = ids.map((id) => markup.indexOf(`id="${id}"`));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(markup).toContain('>Know the market before you buy.</h1>');
    expect(markup).toContain('role="search"');
    expect(markup).toContain('Properties to explore');
    expect(markup).toContain('Invest · Service preparing');
    expect(markup).toMatch(/No approved brief yet|How SignedPrice reads reported rental contracts/);
  }, 10_000);

  it('uses the approved identity and avoids unsupported claims', () => {
    expect(homepageCopy.brand).toBe('signedprice');
    expect(homepageCopy.headline).toBe('Know the market before you buy.');
    expect(homepageCopy.marketIds).toEqual([
      'kr-seoul',
      'sg-singapore',
      'ae-dubai',
    ]);
    expect(JSON.stringify(homepageCopy)).not.toMatch(
      /millions of listings|guaranteed return|licensed broker/i,
    );
  });

  it('keeps the root neutral and exports the indexable homepage metadata on the page', async () => {
    const layoutModule = await import('../app/(en)/layout');

    expect(layoutModule.metadata).toEqual({
      metadataBase: new URL('https://www.signedprice.com'),
      title: 'signedprice | Real prices. Better property decisions.',
      description:
        'Verified Seoul property intelligence with official-source context and publication limits shown clearly.',
    });
    expect(layoutModule.metadata).not.toHaveProperty('alternates');
    expect(JSON.stringify(layoutModule.metadata)).not.toMatch(/canonical|languages|hreflang/i);
    expect(homeMetadata).toMatchObject({
      robots: { index: true, follow: true },
      alternates: { canonical: 'https://www.signedprice.com/' },
    });
  });

  it('keeps every visible model claim-safe with market-specific rights associations', async () => {
    const completeVisibleModel = JSON.stringify({
      homepageCopy,
      homepageIntentGroups,
      homepageMarketCards,
    });
    const markup = renderToStaticMarkup(await Home());

    expect(completeVisibleModel).not.toMatch(
      /DwellSpan|millions of listings|guaranteed return|licensed broker|enquir|create account|sign[ -]?in/i,
    );
    expect(markup).not.toMatch(
      /DwellSpan|millions of listings|guaranteed return|licensed broker|enquir|create account|sign[ -]?in/i,
    );
    expect(homepageMarketCards.map(({ id }) => id)).toEqual([
      'kr-seoul',
      'sg-singapore',
      'ae-dubai',
    ]);
  });

  it('keeps the shipped Seoul intent routes derived from the market registry', () => {
    const seoul = homepageMarketCards.find((market) => market.id === 'kr-seoul');

    expect(seoul).toMatchObject({
      id: 'kr-seoul',
      intentCapabilities: {
        rent: {
          label: 'Rent decision path',
          href: '/kr/seoul/rent/',
          state: 'available',
          stateLabel: 'Live evidence',
        },
        buy: {
          label: 'Buy decision path',
          href: '/kr/seoul/buy/',
          state: 'available',
          stateLabel: 'Live evidence',
        },
      },
    });
  });

  it('points readers to the published Trust policy without unsupported accuracy claims', async () => {
    const trustCopy = JSON.stringify(homepageCopy.trust);
    const markup = renderToStaticMarkup(await Home());

    expect(trustCopy).toMatch(/evidence/i);
    expect(trustCopy).toMatch(/rights/i);
    expect(trustCopy).toMatch(/correction/i);
    expect(trustCopy).toMatch(/methodology/i);
    expect(trustCopy).not.toMatch(/Phase 1|not yet published/i);
    expect(markup).toContain('href="/trust/"');
    expect(markup).not.toMatch(/191,067|8\.2%/);
  });

  it('renders an anonymous, navigable market and intent overview', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('data-brand-wordmark="true"');
    expect(markup).toContain('class="brand-wordmark__signed">signed</span>');
    expect(markup).toContain('class="brand-wordmark__price">price</span>');
    expect(markup).toContain('>Know the market before you buy.</h1>');
    expect(markup).toContain('>Markets at a glance</h2>');
    expect(markup).toContain('>Explore markets</h2>');
    expect(markup).toContain('>Recent building evidence</h2>');
    expect(markup).toContain('>Market insights</h2>');
    expect(markup).toContain('data-navigation-tier="market"');
    expect(markup).toContain('>Seoul</a>');
    expect(markup).toContain('>Singapore</a>');
    expect(markup).toContain('>Dubai</a>');

    const seoulHrefs = [
      '/kr/seoul/check/',
      '/kr/seoul/explore/',
      '/kr/seoul/rankings/',
      '/kr/seoul/news/',
      '/kr/seoul/guide/',
    ];
    expect(buildSeoulLiveModel().links.map(({ href }) => href)).toEqual(seoulHrefs);
    for (const href of seoulHrefs.filter((href) => href !== '/kr/seoul/rankings/')) {
      expect(markup).toContain(`href="${href.replace(/\/$/, '')}"`);
    }
    expect(markup).toContain('>District rankings</a>');
    expect(markup).toContain('href="/sg"');

    expect(markup).not.toMatch(/enquir|sign[ -]?in|create account/i);
  });

  it('routes staged markets through explicit global destinations', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('href="/sg">Singapore</a>');
    expect(markup).toContain('href="/ae/dubai">Dubai</a>');
  });

  it('puts the shipped Seoul evidence products on the root entry page', async () => {
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT',
      JSON.stringify(createPublicAreaV2Fixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_FIXTURE_PERIOD);

    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('Eligible contracts');
    expect(markup).toContain('Explore Seoul');
    for (const href of [
      '/kr/seoul/check/',
      '/kr/seoul/explore/',
      '/kr/seoul/news/',
      '/kr/seoul/guide/',
    ]) {
      expect(markup).toContain(`href="${href.replace(/\/$/, '')}"`);
    }
    expect(markup).toContain('>District rankings</a>');

    vi.unstubAllEnvs();
  });

  it('places the three-city selector before the selected Seoul evidence', async () => {
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT',
      JSON.stringify(createPublicAreaV2Fixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_FIXTURE_PERIOD);

    const markup = renderToStaticMarkup(await Home());
    const cityTabsIndex = markup.indexOf('data-navigation-tier="market"');
    const liveEvidenceIndex = markup.indexOf('data-seoul-live="ready"');

    expect(cityTabsIndex).toBeGreaterThanOrEqual(0);
    expect(liveEvidenceIndex).toBeGreaterThanOrEqual(0);
    expect(cityTabsIndex).toBeLessThan(liveEvidenceIndex);

    vi.unstubAllEnvs();
  });

  it('keeps all global markets visible while Seoul is current initially', async () => {
    const markup = renderToStaticMarkup(await Home());

    for (const label of ['Seoul', 'Singapore', 'Dubai']) {
      expect(markup).toContain(`>${label}</a>`);
    }
    expect(markup).toMatch(/aria-current="page" href="\/kr\/seoul">Seoul/);
    expect(markup).toContain('Invest · Service preparing');
    expect(markup).toContain('Not a live listing');

    expect(homepageCopy.metadata.robots).toEqual({ index: true, follow: true });
  });
});
