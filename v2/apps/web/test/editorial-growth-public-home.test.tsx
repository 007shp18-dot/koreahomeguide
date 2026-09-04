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

  it('keeps the root canonical and indexable', () => {
    expect(metadata).toMatchObject({
      robots: { index: true, follow: true },
      alternates: { canonical: 'https://www.signedprice.com/' },
    });
  });
});
