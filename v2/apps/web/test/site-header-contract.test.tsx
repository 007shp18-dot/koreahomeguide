import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { SiteHeader } from '../components/site-header';
import type { SiteHeaderModel } from '../lib/site-copy';

const header: SiteHeaderModel = {
  brand: 'signedprice',
  homeLabel: 'signedprice home',
  navigationLabel: 'Seoul product navigation',
  marketLabel: 'Seoul',
  languageLabel: 'EN',
  languageSwitch: { label: 'KO', href: '/ko/kr/seoul/explore/', hrefLang: 'ko' },
  links: [{ label: 'Explore', href: '/kr/seoul/explore/', isCurrent: true }],
};

describe('final mockup site header', () => {
  it('renders one 54px navigation bar with market context', () => {
    const html = renderToStaticMarkup(<SiteHeader copy={header} />);

    expect(html.match(/<header\b/g)).toHaveLength(1);
    expect(html).toContain('data-navigation-tier="primary"');
    expect(html).not.toContain('data-navigation-tier="market"');
    expect(html).not.toContain('data-navigation-tier="product"');
    expect(html).toContain('class="site-header__context"');
    expect(html).toContain('Seoul · reported filings');
  });

  it('locks the approved single-row geometry and compact active tab', () => {
    const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

    expect(css).toMatch(/\.site-header__inner\s*{[\s\S]*?height:\s*54px;/);
    expect(css).toMatch(/\.site-header__links\s*{[\s\S]*?height:\s*54px;/);
    expect(css).toMatch(/\.site-header__product-link\s*{[\s\S]*?min-height:\s*44px;/);
    expect(css).not.toMatch(/\.site-header__market-tier\s*{/);
    expect(css).not.toMatch(/\.site-header__product-tier\s*{/);
  });
});
