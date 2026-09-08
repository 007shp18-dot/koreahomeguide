import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { SiteHeader } from '../components/site-header';
import {
  homepageCopy,
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

const globalLabels = ['Explore', 'Rankings', 'Tools', 'News & Insights', 'Guides'] as const;

describe('signedprice public navigation', () => {
  it('renders the same five global destinations in the same order', () => {
    for (const copy of [homepageCopy.header, header]) {
      const html = renderToStaticMarkup(<SiteHeader copy={copy} />);
      const positions = globalLabels.map((label) => html.indexOf(`>${label.replace('&', '&amp;')}</`));

      expect(positions.every((position) => position >= 0)).toBe(true);
      expect(positions).toEqual([...positions].sort((left, right) => left - right));
      expect(html).not.toMatch(/>Properties<|>Community<|>Invest</);
    }
  });

  it('keeps saved places and offer checking alongside the language controls', () => {
    const html = renderToStaticMarkup(<SiteHeader copy={header} />);
    expect(html).toMatch(/<a[^>]*href="\/kr\/seoul\/shortlist\/?"[^>]*>Saved<\/a>/);
    expect(html).toMatch(/<a[^>]*href="\/kr\/seoul\/check\/?"[^>]*>Check an offer<\/a>/);
    expect(html).toContain('aria-label="Language navigation"');
  });

  it('recognises Tokyo without assigning Seoul market navigation or actions', () => {
    const html = renderToStaticMarkup(<SiteHeader copy={{
      ...homepageCopy.header,
      marketLabel: 'Tokyo',
      links: [{ label: 'Tokyo', href: '/jp/tokyo/', isCurrent: true }],
    }} />);
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*href="\/jp\/tokyo\/?"[^>]*>Tokyo<\/a>/);
    expect(html).toContain('data-market-context="jp-tokyo"');
    expect(html).not.toContain('aria-label="Seoul market navigation"');
    expect(html).not.toMatch(/class="site-header__action[^>]*href="\/kr\/seoul\/(?:check|shortlist)/);
    expect(html).not.toMatch(/class="site-header__action[^>]*href="\/jp\/tokyo/);
    expect(html).not.toContain('aria-label="Quick actions"');
    expect(html).toMatch(/href="\/tools\/?"[^>]*>Tools<\/a>/);
  });

  it('opens the unified News & Insights hub and keeps it selected across editorial routes', () => {
    for (const href of ['/insights/', '/insights/example/', '/news/']) {
      const html = renderToStaticMarkup(<SiteHeader copy={{ ...homepageCopy.header, links: [{ label: 'Editorial', href, isCurrent: true }] }} />);
      expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*href="\/news"[^>]*>News &amp; Insights</);
    }
  });

  it('marks the current destination inside the collapsed mobile menu', () => {
    const html = renderToStaticMarkup(<SiteHeader copy={{
      ...homepageCopy.header,
      links: [{ label: 'Guide', href: '/guides/rent-an-apartment-in-korea/', isCurrent: true }],
    }} />);
    const mobileNavigation = html.match(/<nav aria-label="Site menu">([\s\S]*?)<\/nav>/)?.[1];
    const guidesLink = mobileNavigation?.match(/<a[^>]*href="\/guides"[^>]*>Guides<\/a>/)?.[0];

    expect(guidesLink).toContain('aria-current="page"');
  });

  it('marks translated global destinations from their locale-prefixed paths', () => {
    const html = renderToStaticMarkup(<SiteHeader copy={{
      ...homepageCopy.header,
      languageLabel: 'KO',
      links: [{ label: 'Guide', href: '/ko/guides/example/', isCurrent: true }],
    }} />);
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*href="\/ko\/guides\/?"[^>]*>가이드<\/a>/);
  });

  it('keeps market-local destinations inside the compact city context menu', () => {
    const html = renderToStaticMarkup(<SiteHeader copy={header} />);

    expect(html.match(/<header\b/g)).toHaveLength(1);
    expect(html.match(/data-navigation-tier="global"/g)).toHaveLength(1);
    expect(html.match(/data-navigation-tier="market-local"/g)).toHaveLength(1);
    expect(html).toContain('class="site-header__context-menu site-header__context-menu--market"');
    expect(html).toContain('aria-label="Choose a city"');
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

  it('keeps compact selectors and their destinations at a usable control height', () => {
    const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

    expect(css).toMatch(/\.site-header__context-menu\s*>\s*summary\s*{[\s\S]*?min-height:\s*var\(--control-min\);/);
    expect(css).toMatch(/\.site-header__context-panel\s+a\s*{[\s\S]*?min-height:\s*var\(--control-min\);/);
    expect(css).toMatch(/\.market-local-nav__link\s*{[\s\S]*?min-height:\s*var\(--control-min\);/);
  });
});
