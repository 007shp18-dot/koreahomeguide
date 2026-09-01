import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('server-only', () => ({}));
import Home, { metadata as homeMetadata } from '../app/page';
import {
  homepageCopy,
  homepageIntentGroups,
  homepageMarketCards,
} from '../lib/site-copy';
import {
  createPublicAreaV2Fixture,
  PUBLIC_AREA_FIXTURE_PERIOD,
} from './public-area-fixture';

describe('signedprice homepage copy', () => {
  it('uses the approved identity and avoids unsupported claims', () => {
    expect(homepageCopy.brand).toBe('signedprice');
    expect(homepageCopy.headline).toBe('Real prices. Better property decisions.');
    expect(homepageCopy.marketIds).toEqual(['kr-seoul']);
    expect(JSON.stringify(homepageCopy)).not.toMatch(
      /millions of listings|guaranteed return|licensed broker/i,
    );
  });

  it('keeps the root neutral and exports the indexable homepage metadata on the page', async () => {
    const layoutModule = await import('../app/layout');

    expect(layoutModule.metadata).toEqual({
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
    expect(
      homepageMarketCards.map((market) => ({
        id: market.id,
        productDepth: market.productDepth,
        capabilities: market.dataCapabilities,
      })),
    ).toEqual([
      {
        id: 'kr-seoul',
        productDepth: 'Evidence hub',
        capabilities: [
          {
            label: 'Official rent and sale intelligence',
            state: 'available',
            stateLabel: 'Live evidence',
          },
        ],
      },
    ]);
  });

  it('derives each intent decision state and route from the market registry', () => {
    expect(
      homepageMarketCards.map((market) => ({
        id: market.id,
        rent: market.intentCapabilities.rent,
        buy: market.intentCapabilities.buy,
      })),
    ).toEqual([
      {
        id: 'kr-seoul',
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
    ]);
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

    expect(markup).toContain('>signedprice</a>');
    expect(markup).toContain('>Real prices. Better property decisions.</h1>');
    expect(markup).toContain('>Market truth</h3>');
    expect(markup).toContain('>Decision tools</h3>');
    expect(markup).toContain('>Verified connections</h3>');
    expect(markup).toContain('>Evidence hub</span>');
    expect(markup).toContain('>Live evidence</span>');

    for (const href of [
      '/kr/seoul/',
      '/kr/seoul/rent/',
      '/kr/seoul/buy/',
      '/kr/seoul/invest/',
    ]) {
      expect(markup).toContain(`href="${href}"`);
    }
    expect(markup).not.toMatch(/href="\/(?:sg|ae)\//);

    expect(markup).not.toMatch(/enquir|sign[ -]?in|create account/i);
  });

  it('keeps the default rent decision link when the full-product display label changes', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain(
      '<a class="market-card__intent-link" href="/kr/seoul/rent/">Rent in Seoul',
    );
  });

  it('puts the shipped Seoul evidence products on the root entry page', async () => {
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT',
      JSON.stringify(createPublicAreaV2Fixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_FIXTURE_PERIOD);

    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('Seoul live');
    expect(markup).toContain('New contracts');
    expect(markup).toContain('Renewals');
    for (const href of [
      '/kr',
      '/kr/seoul/explore',
      '/kr/seoul/rankings',
      '/kr/seoul/news',
      '/kr/seoul/guide',
    ]) {
      expect(markup).toContain(`href="${href}"`);
    }

    vi.unstubAllEnvs();
  });

  it('renders live Seoul evidence before the generic portal hero', async () => {
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT',
      JSON.stringify(createPublicAreaV2Fixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_FIXTURE_PERIOD);

    const markup = renderToStaticMarkup(await Home());
    const liveEvidenceIndex = markup.indexOf('data-seoul-live="ready"');
    const portalHeroIndex = markup.indexOf('id="home-headline"');

    expect(liveEvidenceIndex).toBeGreaterThanOrEqual(0);
    expect(portalHeroIndex).toBeGreaterThanOrEqual(0);
    expect(liveEvidenceIndex).toBeLessThan(portalHeroIndex);

    vi.unstubAllEnvs();
  });

  it('keeps the approved English decision model while changing only its presentation', async () => {
    const markup = renderToStaticMarkup(await Home());

    for (const label of ['Rent', 'Buy', 'Invest']) {
      expect(markup).toContain(`>${label}</span>`);
    }
    expect(markup).toContain('>Seoul</a></h3>');
    expect(markup).not.toMatch(/>(?:Singapore|Dubai)<\/a><\/h3>/);
    for (const rule of ['Market truth', 'Decision tools', 'Verified connections']) {
      expect(markup).toContain(`>${rule}</h3>`);
    }

    expect(homepageCopy.metadata.robots).toEqual({ index: true, follow: true });
  });
});
