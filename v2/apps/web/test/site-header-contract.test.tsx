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

const globalLabels = ['Explore', 'Buying & renting', 'Insights', 'Rankings', 'News', 'Tools'] as const;

describe('signedprice public navigation', () => {
  it('keeps global navigation free of duplicate market-specific actions and uses decorative vector disclosure icons', () => {
    const html = renderToStaticMarkup(<SiteHeader copy={homepageCopy.header} />);
    expect(html).not.toContain('Check an offer');
    expect(html).not.toContain('⌄');
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"[^>]*data-ui-icon="chevron-down"/);
    expect(html).toContain('aria-label="Choose language"');
    expect(html).toContain('aria-label="Choose a city"');
  });
  it('prioritises Explore, Buying &amp; renting and Insights while keeping Community in More', () => {
    for (const copy of [homepageCopy.header, header]) {
      const html = renderToStaticMarkup(<SiteHeader copy={copy} />);
      const positions = globalLabels.map((label) => html.indexOf(`>${label.replace('&', '&amp;')}</`));
      const desktop = html.match(/<nav[^>]*aria-label="Primary navigation"[\s\S]*?<\/nav>/)?.[0] ?? '';
      const primaryDirect = desktop.slice(0, desktop.indexOf('<details'));
      const more = html.match(/<nav[^>]*aria-label="More navigation"[\s\S]*?<\/nav>/)?.[0] ?? '';
      const mobile = html.match(/<nav[^>]*aria-label="Site menu"[\s\S]*?<\/nav>/)?.[0] ?? '';

      expect(positions.every((position) => position >= 0)).toBe(true);
      expect(desktop.indexOf('>Explore</')).toBeLessThan(desktop.indexOf('>Buying &amp; renting</'));
      expect(desktop.indexOf('>Buying &amp; renting</')).toBeLessThan(desktop.indexOf('>Insights</'));
      expect(primaryDirect).not.toContain('>Community</');
      expect(more).toContain('>Community</');
      expect(mobile.indexOf('>Explore</')).toBeLessThan(mobile.indexOf('>Buying &amp; renting</'));
      expect(mobile.indexOf('>Buying &amp; renting</')).toBeLessThan(mobile.indexOf('>Insights</'));
      expect(html).toContain('aria-label="More navigation"');
      expect(html).not.toMatch(/>Properties<|>Invest</);
    }
  });

  it('keeps Explore as a direct destination without a lone Rankings submenu', () => {
    const html = renderToStaticMarkup(<SiteHeader copy={{ ...header, links: [{ label: 'Rankings', href: '/rankings/', isCurrent: true }] }} />);
    expect(html).not.toContain('aria-label="Explore options"');
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*href="\/rankings\/?"[^>]*>Rankings<\/a>/);
    expect(html).not.toContain('site-header__mobile-sub-link');
  });

  it('marks the ranking city in both menus and keeps switches on rankings', () => {
    for (const [city, id] of [['seoul', 'kr-seoul'], ['singapore', 'sg-singapore'], ['dubai', 'ae-dubai'], ['tokyo', 'jp-tokyo']] as const) {
      const html = renderToStaticMarkup(<SiteHeader copy={{ ...homepageCopy.header, languageLabel: 'KO',
        links: [{ label: '랭킹', href: `/ko/rankings/?city=${city}`, isCurrent: true }] }} />);
      expect(html).toContain(`data-market-context="${id}"`);
      for (const destination of ['seoul', 'singapore', 'dubai', 'tokyo']) {
        expect(html).toContain(`href="/ko/rankings?city=${destination}&amp;kind=sale&amp;order=highest"`);
      }
      expect(html.match(new RegExp(`aria-current="page"[^>]*href="/ko/rankings\\?city=${city}&amp;kind=sale&amp;order=highest"`, 'g'))).toHaveLength(2);
    }
  });

  it('keeps saved places and offer checking alongside the language controls', () => {
    const html = renderToStaticMarkup(<SiteHeader copy={header} />);
    expect(html).toMatch(/<a[^>]*href="\/saved\/?"[^>]*>Saved<\/a>/);
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
    expect(html).toMatch(/class="site-header__action[^>]*href="\/saved\/?"/);
    expect(html).toMatch(/href="\/tools\/property-scenario\/?\?market=jp-tokyo&amp;currency=JPY"[^>]*>Calculate costs<\/a>/);
    expect(html).toContain('aria-label="Quick actions"');
    expect(html).toMatch(/href="\/tools\/?"[^>]*>Tools<\/a>/);
  });

  it('keeps Tokyo quick actions and the wordmark inside the current locale', () => {
    for (const [locale, prefix, languageLabel, label] of [
      ['ko', '/ko', 'KO', '매입 비용 계산'], ['zh-CN', '/zh-cn', 'ZH', '计算购置成本'],
    ] as const) {
      const html = renderToStaticMarkup(<SiteHeader copy={{ ...homepageCopy.header, homeHref: `${prefix}/`, languageLabel,
        marketLabel: 'Tokyo', links: [{ label: 'Explore', href: `${prefix}/jp/tokyo/explore/`, isCurrent: true }] }} />);
      expect(html).toMatch(new RegExp(`class="wordmark"[^>]*href="${prefix}/?"`));
      expect(html).toContain(`href="${prefix}/saved`);
      expect(html).toContain(`href="${prefix}/tools/property-scenario?market=jp-tokyo&amp;currency=JPY">${label}`);
      expect(html).toContain(`href="${prefix}/news?type=news"`);
      expect(html).not.toContain('href="/kr/seoul/check');
      expect(html).toContain(locale === 'ko' ? '>도쿄<' : '>东京<');
    }
  });
  it('opens the unified News & Insights hub and keeps it selected across editorial routes', () => {
    for (const href of ['/insights/', '/insights/example/', '/news/']) {
      const html = renderToStaticMarkup(<SiteHeader copy={{ ...homepageCopy.header, links: [{ label: 'Editorial', href, isCurrent: true }] }} />);
      expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*href="\/news"[^>]*>Insights</);
    }
  });

  it('marks the current destination inside the collapsed mobile menu', () => {
    const html = renderToStaticMarkup(<SiteHeader copy={{
      ...homepageCopy.header,
      links: [{ label: 'Guide', href: '/guides/rent-an-apartment-in-korea/', isCurrent: true }],
    }} />);
    const mobileNavigation = html.match(/<nav aria-label="Site menu">([\s\S]*?)<\/nav>/)?.[1];
    const guidesLink = mobileNavigation?.match(/<a[^>]*href="\/guides"[^>]*>Buying &amp; renting<\/a>/)?.[0];

    expect(guidesLink).toContain('aria-current="page"');
  });

  it('keeps every published budget guide under Buying &amp; renting', () => {
    for (const slug of [
      'seoul-apartment-buying-budget-guide',
      'singapore-condo-buying-budget-guide',
      'dubai-ready-apartment-buying-budget-guide',
      'tokyo-apartment-buying-budget-guide',
    ]) {
      const html = renderToStaticMarkup(<SiteHeader copy={{
        ...homepageCopy.header,
        links: [{ label: 'Guide', href: `/guides/${slug}/`, isCurrent: true }],
      }} />);
      expect(html.match(/aria-current="page"[^>]*href="\/guides"[^>]*>Buying &amp; renting<\/a>/g)).toHaveLength(2);
      expect(html).not.toMatch(/aria-current="page"[^>]*href="\/news"[^>]*>Insights<\/a>/);
    }
  });

  it('marks translated global destinations from their locale-prefixed paths', () => {
    const html = renderToStaticMarkup(<SiteHeader copy={{
      ...homepageCopy.header,
      languageLabel: 'KO',
      links: [{ label: 'Guide', href: '/ko/guides/example/', isCurrent: true }],
    }} />);
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*href="\/ko\/guides\/?"[^>]*>구매·임대 절차<\/a>/);
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
