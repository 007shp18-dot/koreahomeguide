import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('server-only', () => ({}));
import Home, { metadata as homeMetadata } from '../app/page';
import {
  homepageCopy,
  homepageIntentGroups,
  homepageMarketCards,
} from '../lib/site-copy';

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
        productDepth: 'Full product',
        capabilities: [
          {
            label: 'Official rent and sale intelligence',
            state: 'available',
            stateLabel: 'Available',
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
          stateLabel: 'Available',
        },
        buy: {
          label: 'Buy decision path',
          href: '/kr/seoul/buy/',
          state: 'available',
          stateLabel: 'Available',
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
    expect(markup).toContain('>Full product</span>');
    expect(markup).toContain('>Available</span>');

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
