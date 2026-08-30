import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
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
  it('keeps the eyebrow and headline together opposite the description', () => {
    const markup = renderToStaticMarkup(createElement(Home));

    expect(markup).toContain(
      '<div class="hero__copy"><div class="hero__statement"><p class="section-eyebrow">Property intelligence for Seoul, Singapore and Dubai</p><h1 id="home-headline">Real prices. Better property decisions.</h1></div><p class="hero__description">',
    );
    expect(markup).toContain('<div id="top">');

    expect(declarationsFor(css, '.hero__copy')).toMatchObject({
      'grid-template-areas': '"statement description"',
    });
    expect(declarationsFor(css, '.hero__statement')).toMatchObject({
      'grid-area': 'statement',
    });
    expect(declarationsFor(css, '.hero__description')).toMatchObject({
      'grid-area': 'description',
    });
  });

  it('uses direct compact rules and stacks named areas on mobile', () => {
    const compactCss = cssBetween(
      '@media (min-width: 901px) and (max-height: 800px)',
      '@media (max-width: 900px)',
    );
    const mobileCss = cssBetween(
      '@media (max-width: 900px)',
      '@media (max-width: 640px)',
    );

    expect(declarationsFor(compactCss, '.site-header__inner')).toMatchObject({
      'min-height': '64px',
    });
    expect(declarationsFor(compactCss, '.hero')).toMatchObject({
      'padding-block': '24px 12px',
    });
    expect(declarationsFor(compactCss, '.hero__intents')).toMatchObject({
      'margin-top': '16px',
    });
    expect(declarationsFor(compactCss, '.markets')).toMatchObject({
      'padding-top': '20px',
    });
    expect(declarationsFor(compactCss, '.markets .section-heading')).toMatchObject({
      'margin-bottom': '16px',
    });
    expect(declarationsFor(mobileCss, '.hero__copy')).toMatchObject({
      'grid-template-areas': '"statement" "description"',
    });
  });
});
