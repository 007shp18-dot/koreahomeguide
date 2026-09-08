import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import Home, { metadata } from '../app/(en)/page';

vi.mock('../lib/design-review/editorial-growth-review-model.server', () => ({
  buildEditorialGrowthReviewModel: () => { throw new Error('Public home must not read the review database or price snapshots'); },
}));

describe('public editorial homepage', () => {
  it('renders one global decision promise with Seoul evidence links', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain('Somewhere worth knowing.');
    expect(markup).toContain('Somewhere worth knowing.');
    expect(markup).toContain('href="/tools"');
    expect(markup).toContain('href="/kr/seoul/explore"');
    expect(markup).toContain('href="/news"');
    expect(markup).not.toContain('/design-review/');
  });

  it('keeps Seoul, Singapore, Dubai and Tokyo visible in the first-screen selector', async () => {
    const markup = renderToStaticMarkup(await Home());
    const markets = markup.indexOf('data-home-region="markets"');
    const insight = markup.indexOf('data-home-section="insight"');

    expect(markets).toBeGreaterThan(0);
    expect(insight).toBeGreaterThan(markets);
    expect(markup).toContain('href="/kr/seoul"');
    expect(markup).toContain('href="/sg"');
    expect(markup).toContain('href="/ae/dubai"');
    expect(markup).toContain('data-market-id="kr-seoul"');
    expect(markup).toContain('data-market-id="sg-singapore"');
    expect(markup).toContain('data-market-id="ae-dubai"');
    expect(markup).toContain('data-market-id="jp-tokyo"');
    expect(markup).toContain('href="/jp/tokyo"');
    expect(markup).toContain('role="search"');
    expect(markup.indexOf('data-home-region="passport"')).toBeGreaterThan(insight);
  });

  it('opens with an honest market photograph instead of a decorative mock', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('seoul-residential.jpg');
    expect(markup).toContain('seoul-residential.jpg');
    expect(markup).toContain('Seoul apartment skyline with Namsan in the distance');
  });

  it('keeps global destinations and capability-safe market entry points crawlable', async () => {
    const markup = renderToStaticMarkup(await Home());

    for (const href of ['/prices', '/kr/seoul/rankings', '/news', '/guides']) {
      expect(markup).toContain(`href="${href}"`);
    }
    for (const href of [
      '/tools',
      '/kr/seoul/explore',
      '/sg/singapore/explore',
      '/guides',
    ]) {
      expect(markup).toContain(`href="${href}"`);
    }
    expect(markup).toContain('data-home-region="markets"');
    expect(markup).toContain('href="/ae/dubai/explore"');
  });

  it('keeps the root canonical and indexable', () => {
    expect(metadata).toMatchObject({
      robots: { index: true, follow: true },
      alternates: { canonical: 'https://www.signedprice.com/' },
    });
  });
});
