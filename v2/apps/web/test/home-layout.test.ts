import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import Home from '../app/(en)/page';

const homeCss = readFileSync(
  new URL('../components/home-editorial.module.css', import.meta.url),
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
  }, 10_000);

  it('keeps global market links inside the single header without a duplicate hero city tablist', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('data-navigation-tier="primary"');
    expect(markup).toContain('aria-label="Market navigation"');
    expect(markup).not.toContain('aria-label="Choose a city"');
    expect(markup).not.toContain('id="market-tab-seoul"');
  });

  it('keeps the six roadmap destinations in the shared header', async () => {
    const markup = renderToStaticMarkup(await Home());
    const navigation = markup.match(/<nav[^>]*aria-label="Primary navigation"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';

    expect(navigation.match(/<a /g) ?? []).toHaveLength(6);
    expect(navigation).toContain('>Markets</a>');
    expect(navigation).toContain('href="/properties"');
    expect(navigation).toContain('>Invest</a>');
    expect(navigation).toContain('href="/invest"');
  });

  it('keeps Seoul tools crawlable while using search as the primary hero action', async () => {
    const markup = renderToStaticMarkup(await Home());
    const seoulPanel = markup.slice(markup.indexOf('data-home-market="seoul"'));

    for (const label of ['Check a contract', 'Explore Seoul', 'District rankings', 'Market news', 'Buying guide']) {
      expect(seoulPanel).toContain(`>${label}</a>`);
    }
    expect(markup).toContain('role="search"');
    expect(markup).not.toContain('aria-label="Choose a property decision"');
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
