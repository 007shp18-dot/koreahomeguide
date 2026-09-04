import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import Home from '../app/(en)/page';
import { RotatingHeroBuilding } from '../components/home-building-showcase';

const homeCss = readFileSync(
  new URL('../components/home-editorial.module.css', import.meta.url),
  'utf8',
);
const homeBuildingShowcase = readFileSync(
  new URL('../components/home-building-showcase.tsx', import.meta.url),
  'utf8',
);

describe('signedprice public editorial homepage', () => {
  it('keeps the retired market composition bounded for routes that still use it', () => {
    for (const selector of ['.heroGrid', '.snapshotGrid', '.marketGrid', '.buildingGrid', '.insightGrid', '.propertyGrid', '.bottomGrid']) {
      expect(homeCss).toContain(selector);
    }
    expect(homeCss).not.toMatch(/(?:heroGrid|snapshotGrid|marketGrid|buildingGrid|insightGrid|propertyGrid|bottomGrid)[^{]*\{[^}]*100vw/);
  }, 10_000);

  it('uses one global headline before market selection, reporting, guides, and method', async () => {
    const markup = renderToStaticMarkup(await Home());
    const positions = [
      'id="three-market-home-title"',
      'aria-label="Choose a property market"',
      'data-home-section="insight"',
      'id="home-guides-title"',
      'id="home-method-title"',
    ].map((needle) => markup.indexOf(needle));

    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain('See the market before you make the move.');
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  }, 20_000);

  it('keeps navigation compact and separates surfaces, markets, and languages', async () => {
    const markup = renderToStaticMarkup(await Home());
    const navigation = markup.match(/<nav[^>]*aria-label="Primary navigation"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';

    expect(navigation.match(/<a /g) ?? []).toHaveLength(4);
    for (const destination of ['/markets', '/prices', '/insights', '/guides']) {
      expect(navigation).toContain(`href="${destination}"`);
    }
    expect(markup).toContain('aria-label="Language navigation"');
    expect(markup).toContain('aria-label="Market navigation"');
    expect(markup).toContain('href="/zh-cn/kr/seoul"');
    expect(markup).not.toContain('data-navigation-tier="product"');
  });

  it('keeps real Seoul tools and the Journal crawlable from the first screen', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('data-active-market="kr-seoul"');
    expect(markup).toContain('href="/kr/seoul/check"');
    expect(markup).toContain('href="/kr/seoul/explore"');
    expect(markup).toContain('href="/insights"');
    expect(markup).not.toContain('/design-review/');
  });

  it('keeps homepage building media stable and never falls back to street views or maps', () => {
    expect(homeBuildingShowcase).toContain('MarketRepresentativePhoto');
    expect(homeBuildingShowcase).not.toContain('NaverBuildingStreetView');
    expect(homeBuildingShowcase).not.toContain('GoogleBuildingStreetView');
    expect(homeBuildingShowcase).not.toContain('setInterval');
  });

  it('labels a curated fallback as representative while keeping manual building controls', () => {
    const markup = renderToStaticMarkup(createElement(RotatingHeroBuilding, {
      buildings: [
        { id: 'one', name: 'One Residence', market: 'Seoul', countryCode: 'KR', location: 'Seoul', provider: 'naver', observationLabel: '8 contracts', periodLabel: '2026', facts: [], href: '/one', mapHref: '/one' },
        { id: 'two', name: 'Two Residence', market: 'Singapore', countryCode: 'SG', location: 'Singapore', provider: 'google', observationLabel: '9 contracts', periodLabel: '2026', facts: [], href: '/two', mapHref: '/two' },
      ],
      naverMapClientId: null,
      googleMapsBrowserKey: null,
    }));

    expect(markup).toContain('Representative Seoul image');
    expect(markup).toContain('aria-label="Previous building"');
    expect(markup).toContain('aria-label="Next building"');
    expect(markup).toContain('1 / 2');
  });

  it('keeps Singapore and Dubai in the same first-screen market selector', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('href="/sg">Singapore</a>');
    expect(markup).toContain('href="/ae/dubai">Dubai</a>');
    expect(markup).toContain('data-market-id="sg-singapore"');
    expect(markup).toContain('data-market-id="ae-dubai"');
  });

  it('closes with guides, methodology, privacy, and contact', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('Guides for renting and buying');
    expect(markup).toContain('How this evidence works');
    expect(markup).toContain('href="/trust/">Method</a>');
    expect(markup).toContain('href="/privacy/">Privacy</a>');
    expect(markup).toContain('href="/contact/">Contact</a>');
  });
});
