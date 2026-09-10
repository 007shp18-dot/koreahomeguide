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

  it('keeps the homepage focused on city discovery', async () => {
    const markup = renderToStaticMarkup(await Home());
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain('data-home-region="markets"');
    expect(markup).not.toContain('data-home-region="analysis"');
    expect(markup).not.toContain('data-home-region="passport"');
  }, 20_000);

  it('gives each city a discovery destination and one daily article', async () => {
    const markup = renderToStaticMarkup(await Home());
    expect(markup.match(/data-contextual-action=/g)).toHaveLength(4);
    expect(markup.match(/data-editorial-content-id=/g)).toHaveLength(4);
    expect(markup).not.toMatch(/data-what-changed-item|data-lead-data-story|data-home-guide|three-market-home-title/);
    for (const city of ['kr-seoul', 'sg-singapore', 'ae-dubai', 'jp-tokyo']) {
      const card = markup.match(new RegExp('<li[^>]*data-contextual-action="' + city + '"[^>]*>([\\s\\S]*?)</li>'))?.[1] ?? '';
      expect(card.match(/<a /g)).toHaveLength(1);
      expect(card).toContain('/explore');
    }
  });

  it('keeps navigation compact and separates surfaces, markets, and languages', async () => {
    const markup = renderToStaticMarkup(await Home());
    const navigation = markup.match(/<nav[^>]*aria-label="Primary navigation"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';

    expect(navigation.match(/<a /g) ?? []).toHaveLength(4);
    for (const destination of ['/prices', '/tools', '/news', '/guides']) {
      expect(navigation).toContain(`href="${destination}"`);
    }
    expect(markup).toContain('aria-label="Language navigation"');
    expect(markup).toContain('aria-label="Market navigation"');
    expect(markup).toContain('href="/zh-cn/kr/seoul"');
    expect(markup).not.toContain('data-navigation-tier="product"');
  });

  it('keeps real Seoul tools and News crawlable from the first screen', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('data-market-id="kr-seoul"');
    expect(markup).toContain('href="/tools"');
    expect(markup).toContain('href="/kr/seoul/explore"');
    expect(markup).toContain('href="/news"');
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

    expect(markup).toContain('href="/guides"');
    expect(markup).toContain('href="/trust">Data &amp; sources</a>');
    expect(markup).toContain('href="/privacy">Privacy</a>');
    expect(markup).toContain('href="/contact">Contact</a>');
  });
});
