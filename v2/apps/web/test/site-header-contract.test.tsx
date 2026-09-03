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
  it('renders one compact two-tier header with market context', () => {
    const html = renderToStaticMarkup(<SiteHeader copy={header} />);

    expect(html.match(/<header\b/g)).toHaveLength(1);
    expect(html).toContain('class="site-header__market-tier"');
    expect(html).toContain('data-navigation-tier="product"');
    expect(html).toContain('class="site-header__context"');
    expect(html).toContain('Seoul · reported filings');
  });

  it('locks the approved compact two-tier geometry and active tab', () => {
    const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

    expect(css).toMatch(/\.site-header__market-tier\s*{[\s\S]*?height:\s*25px;/);
    expect(css).toMatch(/\.site-header__inner\s*{[\s\S]*?height:\s*50px;/);
    expect(css).toMatch(/\.site-header__links\s*{[\s\S]*?height:\s*50px;/);
    expect(css).toMatch(/\.site-header__product-link\s*{[\s\S]*?height:\s*50px;/);
  });
});
