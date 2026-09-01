import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import Home from '../app/(en)/page';

describe('signedprice Evidence Editorial homepage', () => {
  it('keeps the wide hero copy gutter bounded on the panel side', () => {
    const css = readFileSync(
      new URL('../components/home-editorial.module.css', import.meta.url),
      'utf8',
    );
    const heroCopy = css.match(/\.heroCopy\s*\{([^}]+)\}/)?.[1] ?? '';

    expect(heroCopy).toContain(
      'padding-left: max(40px, calc((100vw - var(--site-width)) / 2))',
    );
    expect(heroCopy).toContain('padding-right: clamp(40px, 5vw, 80px)');
    expect(heroCopy).not.toMatch(
      /padding:\s*[^;]+max\(40px,\s*calc\(\(100vw - var\(--site-width\)\) \/ 2\)\)/,
    );
  });

  it('uses one decision headline before the evidence and deeper product sections', async () => {
    const markup = renderToStaticMarkup(await Home());
    const h1s = markup.match(/<h1/g) ?? [];
    const sections = ['home-decision', 'home-evidence', 'home-paths', 'home-explore', 'home-briefs', 'home-trust'];
    const positions = sections.map((id) => markup.indexOf(`id="${id}"`));

    expect(h1s).toHaveLength(1);
    expect(markup).toContain('<h1 id="home-headline">See what homes actually signed for.</h1>');
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('uses the global market navigation without a duplicate hero city tablist', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('data-navigation-tier="market"');
    expect(markup).not.toContain('aria-label="Choose a city"');
    expect(markup).not.toContain('id="market-tab-seoul"');
  });

  it('keeps five primary product destinations in the shared header', async () => {
    const markup = renderToStaticMarkup(await Home());
    const navigation = markup.match(/<nav aria-label="Primary navigation"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';

    expect(navigation.match(/<a /g) ?? []).toHaveLength(5);
    expect(navigation).toContain('data-product-index="01"');
    expect(navigation).toContain('href="/kr/seoul/rankings"');
    expect(navigation).toContain('data-product-index="05"');
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
    expect(markup).toContain('href="/compare?market=dubai">Dubai</a>');
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
