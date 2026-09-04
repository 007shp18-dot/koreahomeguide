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

describe('signedprice Evidence Editorial homepage', () => {
  it('centres every primary section in the standard content frame', () => {
    for (const selector of ['.heroGrid', '.snapshotGrid', '.marketGrid', '.buildingGrid', '.insightGrid', '.propertyGrid', '.bottomGrid']) {
      expect(homeCss).toContain(selector);
    }
    expect(homeCss).not.toMatch(/(?:heroGrid|snapshotGrid|marketGrid|buildingGrid|insightGrid|propertyGrid|bottomGrid)[^{]*\{[^}]*100vw/);
  }, 10_000);

  it('uses one decision headline before the evidence and deeper product sections', async () => {
    const markup = renderToStaticMarkup(await Home());
    const h1s = markup.match(/<h1/g) ?? [];
    const sections = ['home-decision', 'markets', 'home-explore', 'home-prices', 'home-briefs', 'home-trust'];
    const positions = sections.map((id) => markup.indexOf(`id="${id}"`));

    expect(h1s).toHaveLength(1);
    expect(markup).toContain('<h1 id="home-headline">Know the market before you buy.</h1>');
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  }, 20_000);

  it('keeps global market links inside the compact market tier without a duplicate hero city tablist', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('class="site-header__market-tier"');
    expect(markup).toContain('data-navigation-tier="product"');
    expect(markup).toContain('aria-label="Market navigation"');
    expect(markup).toContain('aria-label="Change language to 한국어"');
    expect(markup).toContain('href="/ko/kr/seoul"');
    expect(markup).toMatch(/hreflang="ko"/i);
    expect(markup).not.toContain('aria-label="Choose a city"');
    expect(markup).not.toContain('id="market-tab-seoul"');
  });

  it('keeps the seven roadmap destinations in the shared header', async () => {
    const markup = renderToStaticMarkup(await Home());
    const navigation = markup.match(/<nav[^>]*aria-label="Primary navigation"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';

    expect(navigation.match(/<a /g) ?? []).toHaveLength(7);
    expect(navigation).toContain('<strong>Markets</strong>');
    expect(navigation).toContain('href="/properties"');
    expect(navigation).toContain('<strong>Invest</strong>');
    expect(navigation).toContain('href="/invest"');
  });

  it('keeps Seoul tools crawlable while using search as the primary hero action', async () => {
    const markup = renderToStaticMarkup(await Home());
    const seoulPanel = markup.slice(markup.indexOf('data-market-panel="seoul"'));

    for (const label of ['Check', 'Explore', 'Rankings', 'News', 'Guide', 'Community']) {
      expect(seoulPanel).toContain(`>${label}<small>`);
    }
    expect(markup).toContain('role="search"');
    expect(markup).not.toContain('aria-label="Choose a property decision"');
    expect(markup).toContain('data-building-rotation="manual"');
    expect(markup).toContain('Otherwise a clearly labeled representative city image is shown.');
    expect(markup).not.toContain('Otherwise the verified map location is used.');
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

  it('moves staged markets to explicit global destinations', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('href="/sg">Singapore</a>');
    expect(markup).toContain('href="/ae/dubai">Dubai</a>');
  });

  it('closes with guides and a clearly gated investment roadmap', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('id="home-trust"');
    expect(markup).toContain('Buying property in another country?');
    expect(markup).toContain('Invest · Service preparing');
    expect(markup).toContain('Personalized recommendations remain unavailable');
    expect(markup).not.toContain('class="principles site-shell"');
  });
});
