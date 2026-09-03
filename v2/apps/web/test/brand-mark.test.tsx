import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { BrandMark, BrandWordmark } from '../components/brand-mark';
import { ContractCheckWorkspace } from '../components/contract-check/contract-check-workspace';
import { SiteHeader } from '../components/site-header';
import type { ContractCheckRouteModel } from '../lib/contract-check/route-model.server';
import type { SiteHeaderModel } from '../lib/site-copy';

const headerCopy: SiteHeaderModel = {
  brand: 'signedprice',
  homeLabel: 'SignedPrice home',
  navigationLabel: 'Primary',
  links: [],
};

const unavailableContractModel: ContractCheckRouteModel = {
  status: 'unavailable',
  message: 'Verified transaction evidence is unavailable.',
  navigation: [],
};

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

describe('SignedPrice brand mark', () => {
  test('renders the supplied three-path geometry with square line caps', () => {
    const html = renderToStaticMarkup(<BrandMark size={32} />);

    expect(html.match(/<path\b/g)).toHaveLength(3);
    expect(html).toContain('d="M4 9 L28 23"');
    expect(html.match(/d="M4 23 L28 9"/g)).toHaveLength(2);
    expect(html.match(/stroke-linecap="square"/g)).toHaveLength(3);
  });

  test('renders the exact ink, separation, and orange stroke widths', () => {
    const html = renderToStaticMarkup(<BrandMark size={32} />);

    expect([...html.matchAll(/stroke-width="([^"]+)"/g)].map((match) => match[1])).toEqual([
      '5.5',
      '10',
      '5.5',
    ]);
  });

  test('keeps the signed and price wordmark weights independently addressable', () => {
    const html = renderToStaticMarkup(<BrandWordmark />);

    expect(html).toContain('data-brand-wordmark="true"');
    expect(html).toContain('class="brand-wordmark__signed">signed</span>');
    expect(html).toContain('class="brand-wordmark__price">price</span>');
    expect(css).toMatch(/\.brand-wordmark__signed\s*{[^}]*font-weight:\s*900;/);
    expect(css).toMatch(/\.brand-wordmark__price\s*{[^}]*font-weight:\s*500;/);
  });

  test('uses the shared wordmark in global and Contract Check headers', () => {
    const globalHeader = renderToStaticMarkup(<SiteHeader copy={headerCopy} />);
    const contractHeader = renderToStaticMarkup(
      <ContractCheckWorkspace model={unavailableContractModel} />,
    );

    expect(globalHeader).toContain('data-brand-wordmark="true"');
    expect(contractHeader).toContain('data-brand-wordmark="true"');
    expect(globalHeader.match(/<path\b/g)).toHaveLength(3);
    expect(contractHeader.match(/<path\b/g)).toHaveLength(3);
  });

  test('renders six roadmap destinations before compact market context', () => {
    const html = renderToStaticMarkup(<SiteHeader copy={{
      ...headerCopy,
      links: [{ label: 'Explore', href: '/kr/seoul/explore/', isCurrent: true }],
    }} />);

    expect(html).toContain('data-navigation-tier="market"');
    expect(html).toContain('data-navigation-tier="product"');
    expect(html.indexOf('data-navigation-tier="product"')).toBeLessThan(
      html.indexOf('data-navigation-tier="market"'),
    );
    expect(html).toContain('class="site-header__product-inner"');
    expect(html).toContain('aria-label="Market navigation"');
    expect(html).toContain('>Seoul<');
    expect(html).toContain('>Singapore<');
    expect(html).toContain('>Dubai<');
    expect(html.match(/data-product-index=/g)).toHaveLength(6);
    expect(html).toContain('data-product-index="01"');
    expect(html).toContain('data-product-index="06"');
    expect(html).toContain('href="/properties"');
    expect(html).toContain('href="/invest"');
    expect(html).toMatch(/<a[^>]+aria-current="page"[^>]+href="\/prices"/);
    expect(html).toMatch(/<a[^>]+aria-current="page"[^>]+href="\/kr\/seoul\/explore"/);
  });
});
