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

  it('renders one global decision promise with Seoul evidence links', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain('See the market before you make the move.');
    expect(markup).toContain('href="/kr/seoul/check"');
    expect(markup).toContain('href="/kr/seoul/explore"');
    expect(markup).toContain('href="/insights"');
    expect(markup).not.toContain('/design-review/');
  });

  it('keeps Seoul, Singapore, and Dubai visible in the first-screen selector', async () => {
    const markup = renderToStaticMarkup(await Home());
    const markets = markup.indexOf('aria-label="Choose a property market"');
    const insight = markup.indexOf('data-home-section="insight"');

    expect(markets).toBeGreaterThan(0);
    expect(insight).toBeGreaterThan(markets);
    expect(markup).toContain('href="/kr/seoul"');
    expect(markup).toContain('href="/sg"');
    expect(markup).toContain('href="/ae/dubai"');
    expect(markup).toContain('data-market-id="kr-seoul"');
    expect(markup).toContain('data-market-id="sg-singapore"');
    expect(markup).toContain('data-market-id="ae-dubai"');
  });

  it('opens with an honest market photograph instead of a decorative mock', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('data-home-hero-media="market-photo"');
    expect(markup).toContain('seoul-residential.jpg');
    expect(markup).toContain('Seoul apartment skyline with Namsan in the distance');
  });

  it('keeps global destinations and capability-safe market entry points crawlable', async () => {
    const markup = renderToStaticMarkup(await Home());

    for (const href of ['/markets', '/prices', '/insights', '/guides']) {
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
    expect(markup).toContain('aria-label="Choose a property market"');
    expect(markup).not.toContain('href="/ae/dubai/check"');
  });

  it('keeps the root canonical and indexable', () => {
    expect(metadata).toMatchObject({
      robots: { index: true, follow: true },
      alternates: { canonical: 'https://www.signedprice.com/' },
    });
  });
});
