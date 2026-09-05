import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { SiteHeader } from '../components/site-header';
import {
  homepageCopy,
  productNavigationLinks,
  type SiteHeaderModel,
} from '../lib/site-copy';

const header: SiteHeaderModel = {
  brand: 'signedprice',
  homeLabel: 'signedprice home',
  navigationLabel: 'Seoul product navigation',
  marketLabel: 'Seoul',
  languageLabel: 'EN',
  languageSwitch: { label: 'KO', href: '/ko/kr/seoul/explore/', hrefLang: 'ko' },
  links: [{ label: 'Explore', href: '/kr/seoul/explore/', isCurrent: true }],
};

const globalLabels = ['Markets', 'Prices', 'News', 'Guides'] as const;

describe('signedprice public navigation', () => {
  it('renders the same four global destinations in the same order', () => {
    expect(productNavigationLinks.map(({ label }) => label)).toEqual(globalLabels);

    for (const copy of [homepageCopy.header, header]) {
      const html = renderToStaticMarkup(<SiteHeader copy={copy} />);
      const positions = globalLabels.map((label) => html.indexOf(`>${label}</`));

      expect(positions.every((position) => position >= 0)).toBe(true);
      expect(positions).toEqual([...positions].sort((left, right) => left - right));
      expect(html).not.toMatch(/>Properties<|>Community<|>Invest<|>Insights</);
    }
  });

  it('renders one global header and a separate market-local navigation', () => {
    const html = renderToStaticMarkup(<SiteHeader copy={header} />);

    expect(html.match(/<header\b/g)).toHaveLength(1);
    expect(html.match(/data-navigation-tier="global"/g)).toHaveLength(1);
    expect(html.match(/data-navigation-tier="market-local"/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Seoul market navigation"');
    for (const label of ['Overview', 'Explore', 'Check', 'Rankings', 'Corrections']) {
      expect(html).toContain(`>${label}</`);
    }
  });

  it('does not render a market-local navigation on global pages', () => {
    const html = renderToStaticMarkup(<SiteHeader copy={homepageCopy.header} />);

    expect(html.match(/data-navigation-tier="global"/g)).toHaveLength(1);
    expect(html).not.toContain('data-navigation-tier="market-local"');
  });

  it('locks the global and 48px market-local geometry', () => {
    const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

    expect(css).toMatch(/\.site-header__inner\s*{[\s\S]*?min-height:\s*64px;/);
    expect(css).toMatch(/\.market-local-nav\s*{[\s\S]*?height:\s*48px;/);
    expect(css).toMatch(/\.market-local-nav__link\s*{[\s\S]*?min-height:\s*var\(--control-min\);/);
  });
});
