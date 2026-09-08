import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RankingMarketsHub } from '../components/rankings/ranking-markets-hub';

describe('ranking hierarchy', () => {
  it('describes the building-first Seoul destination accurately', () => {
    const html = renderToStaticMarkup(createElement(RankingMarketsHub));
    expect(html).toContain('Seoul · buildings');
    expect(html).toContain('Sale, jeonse and rent by building');
    expect(html).not.toContain('Seoul · districts');
  });
  it.each(['public-market/district-rankings', 'singapore/singapore-rankings'])('%s shares the restrained title scale', (path) => {
    const css = readFileSync(new URL(`../components/${path}.module.css`, import.meta.url), 'utf8');
    const rule = [...css.matchAll(/\.hero h1\s*\{([^}]+)\}/g)].at(-1)?.[1];
    expect(rule).toContain('font-size: var(--page-title-size)');
    expect(rule).toContain('max-width: 100%');
    expect(rule).toContain('line-height: 1.2');
  });
});
