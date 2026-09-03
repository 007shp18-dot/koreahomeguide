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
    for (const selector of ['.heroGrid', '.liveStrip', '.decisionSection', '.marketDirectory', '.evidenceSection', '.briefSection', '.trustBoundary']) {
      expect(homeCss).toContain(selector);
    }
    expect(homeCss).not.toMatch(/(?:heroGrid|liveStrip|decisionSection|marketDirectory|evidenceSection|briefSection|trustBoundary)[^{]*\{[^}]*100vw/);
  }, 10_000);

  it('uses one decision headline before the evidence and deeper product sections', async () => {
    const markup = renderToStaticMarkup(await Home());
    const h1s = markup.match(/<h1/g) ?? [];
    const sections = ['home-decision', 'home-evidence', 'markets', 'home-explore', 'home-prices', 'home-briefs', 'home-trust'];
    const positions = sections.map((id) => markup.indexOf(`id="${id}"`));

    expect(h1s).toHaveLength(1);
    expect(markup).toContain('<h1 id="home-headline">Know the market before you buy.</h1>');
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  }, 10_000);

  it('uses the global market navigation without a duplicate hero city tablist', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('data-navigation-tier="market"');
    expect(markup).not.toContain('aria-label="Choose a city"');
    expect(markup).not.toContain('id="market-tab-seoul"');
  });

  it('keeps the six roadmap destinations in the shared header', async () => {
    const markup = renderToStaticMarkup(await Home());
    const navigation = markup.match(/<nav aria-label="Primary navigation"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';

    expect(navigation.match(/<a /g) ?? []).toHaveLength(6);
    expect(navigation).toContain('data-product-index="01"');
    expect(navigation).toContain('href="/properties"');
    expect(navigation).toContain('data-product-index="06"');
    expect(navigation).toContain('href="/invest"');
  });

  it('keeps all six market slots while moving decisions to the hero', async () => {
    const markup = renderToStaticMarkup(await Home());
    const seoulPanel = markup.slice(markup.indexOf('data-home-market="seoul"'));

    for (const label of ['Check', 'Explore', 'Rankings', 'News', 'Guide', 'Community']) {
      expect(seoulPanel).toContain(`>${label}</strong>`);
    }
    expect(markup).toContain('aria-label="Choose a property decision"');
    expect(markup).toContain('aria-pressed="true">Rent</button>');
  });

  it('moves staged markets to explicit global destinations', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('href="/sg">Singapore</a>');
    expect(markup).toContain('href="/markets#dubai">Dubai</a>');
    expect(markup).not.toMatch(/href="\/ae\//);
  });

  it('closes with a compact trust boundary instead of filler principles', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('id="home-trust"');
    expect(markup).toContain('SignedPrice does not turn missing evidence into confident claims.');
    expect(markup).toContain('>Rights disclosed</span>');
    expect(markup).toContain('>Human-approved briefs</span>');
    expect(markup).not.toContain('class="principles site-shell"');
  });
});
