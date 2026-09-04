import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { SiteHeader } from '../components/site-header';
import { resolveMarketNavigation } from '../lib/navigation/market-route-resolver';

describe('market route isolation', () => {
  it('keeps Singapore product navigation inside Singapore', () => {
    const navigation = resolveMarketNavigation({ market: 'singapore', locale: 'en', surface: 'check' });
    expect(navigation.links.find(({ isCurrent }) => isCurrent)?.href).toBe('/sg/singapore/check/');
    expect(navigation.links.map(({ href }) => href).join('\n')).not.toContain('/kr/seoul/');
  });

  it('keeps Seoul product navigation inside Seoul and preserves locale', () => {
    const english = resolveMarketNavigation({ market: 'seoul', locale: 'en', surface: 'explore' });
    const korean = resolveMarketNavigation({ market: 'seoul', locale: 'ko', surface: 'explore' });
    expect(english.links.find(({ isCurrent }) => isCurrent)?.href).toBe('/kr/seoul/explore/');
    expect(korean.links.find(({ isCurrent }) => isCurrent)?.href).toBe('/ko/kr/seoul/explore/');
    expect(english.links.map(({ href }) => href).join('\n')).not.toContain('/sg/singapore/');
  });

  it('distinguishes intentional market switching from product links', () => {
    const navigation = resolveMarketNavigation({ market: 'singapore', locale: 'en', surface: 'explore' });
    expect(navigation.marketSwitch).toEqual([
      { label: 'Seoul', href: '/kr/seoul/' },
      { label: 'Singapore', href: '/sg/' },
      { label: 'Dubai', href: '/ae/dubai/' },
    ]);
  });

  it('keeps Dubai honest by exposing overview and comparison instead of placeholder tools', () => {
    const navigation = resolveMarketNavigation({ market: 'dubai', locale: 'en', surface: 'home' });

    expect(navigation.links).toEqual([
      { label: 'Overview', href: '/ae/dubai/', isCurrent: true },
      { label: 'Compare markets', href: '/compare/?market=dubai' },
    ]);
    expect(navigation.links.map(({ href }) => href).join('\n')).not.toMatch(
      /\/ae\/dubai\/(?:check|explore|rankings|news|community|guide)\//,
    );
  });

  it('renders the supplied market contract without synthesizing unavailable routes', () => {
    const navigation = resolveMarketNavigation({ market: 'singapore', locale: 'en', surface: 'check' });
    const markup = renderToStaticMarkup(createElement(SiteHeader, {
      copy: {
        brand: 'signedprice',
        homeLabel: 'signedprice home',
        navigationLabel: 'Singapore evidence navigation',
        navigationVariant: 'supplied',
        marketLabel: 'Singapore',
        languageLabel: 'EN',
        links: navigation.links,
      },
    }));

    expect(markup).toContain('href="/sg/singapore/check"');
    expect(markup).toContain('href="/sg/singapore/corrections"');
    expect(markup).not.toContain('/sg/singapore/news/');
    expect(markup).not.toContain('/sg/singapore/community/');
    expect(markup).not.toContain('/sg/singapore/guide/');
  });

  it('uses market-safe primary actions', () => {
    const markup = renderToStaticMarkup(createElement(SiteHeader, {
      copy: {
        brand: 'signedprice',
        homeLabel: 'signedprice home',
        navigationLabel: 'Dubai navigation',
        navigationVariant: 'supplied',
        marketLabel: 'Dubai',
        languageLabel: 'EN',
        links: resolveMarketNavigation({ market: 'dubai', locale: 'en', surface: 'home' }).links,
      },
    }));

    expect(markup).toContain('href="/compare?market=dubai"');
    expect(markup).toContain('Compare markets');
    expect(markup).not.toContain('/ae/dubai/check/');
  });
});
