import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import Home, { metadata } from '../app/(en)/page';

const source = readFileSync(new URL('../app/(en)/page.tsx', import.meta.url), 'utf8');

describe('public editorial homepage', () => {
  it('uses the approved canonical editorial composition', () => {
    expect(source).toContain('buildEditorialGrowthReviewModel');
    expect(source).toContain('EditorialGrowthPublicShell');
    expect(source).not.toContain('HomeMarketBrowser');
    expect(source).not.toContain('HomeEditorialSections');
  });

  it('renders one Korea decision promise with public evidence links', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain('Understand the real cost of renting in Korea.');
    expect(markup).toContain('href="/kr/seoul/check"');
    expect(markup).toContain('href="/kr/seoul/explore"');
    expect(markup).toContain('href="/insights"');
    expect(markup).not.toContain('/design-review/');
  });

  it('keeps Seoul, Singapore, and Dubai visible in the homepage decision flow', async () => {
    const markup = renderToStaticMarkup(await Home());
    const evidence = markup.indexOf('Current evidence');
    const markets = markup.indexOf('data-home-section="markets"');
    const insight = markup.indexOf('data-home-section="insight"');

    expect(markets).toBeGreaterThan(evidence);
    expect(insight).toBeGreaterThan(markets);
    expect(markup).toContain('href="/kr/seoul"');
    expect(markup).toContain('href="/sg"');
    expect(markup).toContain('href="/ae/dubai"');
    expect(markup).toContain('>Seoul<');
    expect(markup).toContain('>Singapore<');
    expect(markup).toContain('>Dubai<');
  });

  it('opens with an honest market photograph instead of a decorative mock', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('data-home-hero-media="market-photo"');
    expect(markup).toContain('data-building-media="curated-market-photo"');
    expect(markup).toContain('src="/assets/markets/seoul-residential.jpg"');
    expect(markup).toContain('Seoul apartment skyline with Namsan in the distance');
  });

  it('connects each market to the functions that are actually available', async () => {
    const markup = renderToStaticMarkup(await Home());

    for (const href of ['/markets', '/prices', '/insights', '/guides', '/compare']) {
      expect(markup).toContain(`href="${href}"`);
    }
    for (const href of [
      '/kr/seoul/check',
      '/kr/seoul/explore',
      '/kr/seoul/rankings',
      '/kr/seoul/guide',
    ]) {
      expect(markup).toContain(`href="${href}"`);
    }
    for (const href of [
      '/sg/singapore/check',
      '/sg/singapore/explore',
      '/sg/singapore/rankings',
    ]) {
      expect(markup).toContain(`href="${href}"`);
    }
    expect(markup).toContain('aria-label="Seoul tools"');
    expect(markup).toContain('aria-label="Singapore tools"');
    expect(markup).toContain('aria-label="Dubai tools"');
  });

  it('keeps the root canonical and indexable', () => {
    expect(metadata).toMatchObject({
      robots: { index: true, follow: true },
      alternates: { canonical: 'https://www.signedprice.com/' },
    });
  });
});
