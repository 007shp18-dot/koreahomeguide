import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import Home from '../app/page';

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

function declarationsFor(source: string, selector: string): Record<string, string> {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = source.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  if (!rule?.[1]) {
    throw new Error(`Missing CSS rule ${selector}`);
  }

  return Object.fromEntries(
    rule[1]
      .split(';')
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const separator = declaration.indexOf(':');
        return [
          declaration.slice(0, separator).trim(),
          declaration.slice(separator + 1).trim(),
        ];
      }),
  );
}

function cssBetween(start: string, end: string): string {
  const startIndex = css.indexOf(start);
  const endIndex = css.indexOf(end, startIndex + start.length);
  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Missing CSS range ${start} ... ${end}`);
  }

  return css.slice(startIndex, endIndex);
}

describe('signedprice hero layout structure', () => {
  it('keeps the headline and description in one flush-left editorial column', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain(
      '<div class="hero__copy"><div class="hero__statement"><h1 id="home-headline">Real prices. Better property decisions.</h1></div><p class="hero__description">',
    );
    expect(markup).not.toContain(
      '<p class="section-eyebrow">Property intelligence for Seoul, Singapore and Dubai</p>',
    );
    expect(markup).toContain('<div id="top">');

    expect(declarationsFor(css, '.hero__copy')).toMatchObject({
      display: 'block',
      'text-align': 'left',
    });
    expect(declarationsFor(css, '.hero h1')).toMatchObject({
      'max-width': '19ch',
      'font-size': 'clamp(38px, 5.6vw, 76px)',
      'line-height': '0.98',
    });
    expect(declarationsFor(css, '.hero__description')).toMatchObject({
      'max-width': '56ch',
    });
  });

  it('stacks the connected intent control on mobile without horizontal scrolling', () => {
    const mobileCss = cssBetween(
      '@media (max-width: 640px)',
      '@media (prefers-reduced-motion: reduce)',
    );

    expect(declarationsFor(mobileCss, '.intent-tabs')).toMatchObject({
      'grid-template-columns': '1fr',
    });
    expect(mobileCss).not.toMatch(/overflow-x:\s*(auto|scroll)/);
  });

  it('uses full-width ruled home sections with a forty-pixel left gutter', () => {
    expect(
      declarationsFor(
        css,
        '.hero.site-shell,\n.markets.site-shell,\n.principles.site-shell',
      ),
    ).toMatchObject({
      width: '100%',
      'max-width': 'none',
      margin: '0',
      'padding-inline': '40px',
    });
    expect(declarationsFor(css, '.hero')).toMatchObject({
      'border-bottom': '2px solid var(--ink)',
    });
    expect(declarationsFor(css, '.markets')).toMatchObject({
      'border-bottom': '2px solid var(--ink)',
    });
  });
});

describe('signedprice connected market surfaces', () => {
  it('renders three connected city tabs with Seoul visibly active', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup.match(/class="market-tabs__trigger/g)).toHaveLength(3);
    expect(
      markup.match(/<button[^>]+role="tab"[^>]+aria-selected="(?:true|false)"/g) ?? [],
    ).toHaveLength(3);
    expect(markup.match(/<button[^>]+aria-selected="true"/g) ?? []).toHaveLength(1);
    expect(markup).toContain('class="market-tabs__trigger market-tabs__trigger--active"');
    expect(declarationsFor(css, '.market-tabs__list')).toMatchObject({
      'grid-template-columns': 'repeat(3, minmax(0, 1fr))',
      gap: '0',
    });
    expect(declarationsFor(css, '.market-tabs__trigger--active')).toMatchObject({
      background: 'var(--accent)',
      color: 'var(--canvas)',
    });
    expect(declarationsFor(css, '.market-tabs__trigger')).toMatchObject({
      'min-height': '44px',
    });
    expect(declarationsFor(css, '.market-tabs__panel[hidden]')).toMatchObject({
      display: 'none',
    });
  });

  it('renders exactly two Modernist header controls', async () => {
    const markup = renderToStaticMarkup(await Home());
    const navigation = markup.match(
      /<nav aria-label="Primary navigation">([\s\S]*?)<\/nav>/,
    )?.[1] ?? '';

    expect(navigation.match(/<a /g) ?? []).toHaveLength(2);
    expect(navigation).toContain('aria-current="page">Global home</a>');
    expect(navigation).toContain('>Market overview</a>');
    expect(declarationsFor(css, '.site-header__links a[aria-current="page"]')).toMatchObject({
      color: 'var(--canvas)',
      background: 'var(--ink)',
    });
    expect(
      declarationsFor(css, '.site-header__links a[aria-current="page"]:focus-visible'),
    ).toMatchObject({
      'box-shadow': 'inset 0 0 0 2px var(--canvas)',
    });
    expect(css).not.toMatch(/\.site-header__links li:(first|last)-child a/);
  });

  it('renders six consistent product slots beneath the active city', async () => {
    const markup = renderToStaticMarkup(await Home());

    const seoulPanel = markup.match(
      /<section[^>]+id="market-panel-seoul"[\s\S]*?<\/section>/,
    )?.[0] ?? '';
    for (const label of ['Check', 'Explore', 'Rankings', 'News', 'Guide', 'Community']) {
      expect(seoulPanel).toContain(`>${label}<`);
    }
    expect(seoulPanel.match(/class="market-product/g)).toHaveLength(6);
    expect(declarationsFor(css, '.market-products')).toMatchObject({
      'grid-template-columns': 'repeat(3, minmax(0, 1fr))',
      gap: '0',
      border: '2px solid var(--ink)',
    });
  });
});

describe('signedprice methodology and Trust disclosure', () => {
  it('presents the approved three-rule methodology row as one connected section', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('class="principles site-shell" id="principles"');
    expect(markup.match(/<article class="principle"/g)).toHaveLength(3);
    expect(declarationsFor(css, '.principles__grid')).toMatchObject({
      'grid-template-columns': 'repeat(3, minmax(0, 1fr))',
    });
  });

  it('separates Trust principles into a full-width dark section', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('class="trust-strip" id="methodology"');
    expect(markup).toContain('>Rights and method</dt>');
    expect(markup).toContain('>Corrections</dt>');
    expect(declarationsFor(css, '.trust-strip-wrap')).toMatchObject({
      width: '100%',
      'max-width': 'none',
    });
    expect(declarationsFor(css, '.trust-strip')).toMatchObject({
      background: 'var(--ink)',
      color: 'var(--canvas)',
      'border-radius': 'var(--radius)',
    });
  });
});
