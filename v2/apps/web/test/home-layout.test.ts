import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import Home from '../app/(en)/page';

const homeCss = readFileSync(
  new URL('../components/home-editorial.module.css', import.meta.url),
  'utf8',
);

function declarationsFor(source: string, selector: string): Record<string, string> {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = source.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  if (!rule?.[1]) throw new Error(`Missing CSS rule ${selector}`);
  return Object.fromEntries(
    rule[1]
      .split(';')
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const splitAt = declaration.indexOf(':');
        return [declaration.slice(0, splitAt).trim(), declaration.slice(splitAt + 1).trim()];
      }),
  );
}

describe('signedprice Evidence Editorial homepage', () => {
  it('centres every primary section in the standard content frame', () => {
    const expectedWidth = 'min(calc(100% - (2 * var(--page-gutter))), var(--content-frame))';

    for (const selector of [
      '.heroGrid', '.liveStrip', '.decisionSection', '.exploreSection',
      '.briefSection', '.trustBoundary',
    ]) {
      expect(declarationsFor(homeCss, selector)).toMatchObject({
        width: expectedWidth,
        'margin-inline': 'auto',
      });
    }

    expect(declarationsFor(homeCss, '.exploreSection')).toMatchObject({
      'min-height': '540px',
      'grid-template-columns': 'minmax(0, 1.16fr) minmax(320px, .84fr)',
    });
    expect(homeCss).not.toMatch(/(?:heroGrid|liveStrip|decisionSection|exploreSection|briefSection|trustBoundary)[^{]*\{[^}]*100vw/);
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
