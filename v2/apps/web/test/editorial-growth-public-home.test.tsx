import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import Home, { metadata } from '../app/(en)/page';
import { getPortfolioRecord } from '../content/portfolio-manifest';
import { PropertyHome } from '../components/design-review/editorial-growth-home';

vi.mock('../lib/design-review/editorial-growth-review-model.server', () => ({
  buildEditorialGrowthReviewModel: () => { throw new Error('Public home must not read the review database or price snapshots'); },
}));

describe('public editorial homepage', () => {
  it('keeps one page heading and separate functional destinations', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain('href="/tools"');
    expect(markup).toContain('href="/kr/seoul/explore"');
    expect(markup).toContain('href="/news"');
    expect(markup).not.toContain('/design-review/');
  });

  it('makes all four cities reachable alongside curated analysis without embedding tools', async () => {
    const markup = renderToStaticMarkup(await Home());
    const markets = markup.indexOf('data-home-region="markets"');

    expect(markets).toBeGreaterThan(0);
    expect(markup).toContain('href="/kr/seoul"');
    expect(markup).toContain('href="/sg"');
    expect(markup).toContain('href="/ae/dubai"');
    expect(markup).toContain('data-market-id="kr-seoul"');
    expect(markup).toContain('data-market-id="sg-singapore"');
    expect(markup).toContain('data-market-id="ae-dubai"');
    expect(markup).toContain('data-market-id="jp-tokyo"');
    expect(markup).toContain('href="/jp/tokyo"');
    const main = markup.slice(markup.indexOf('<main'), markup.indexOf('</main>'));
    expect(main.match(/data-buying-city=/g)).toHaveLength(4);
    const cityButtons = main.match(/<button\b[^>]*\bdata-buying-city="[^"]+"[^>]*>/g) ?? [];
    expect(cityButtons).toHaveLength(4);
    for (const button of cityButtons) expect(button).toContain('aria-pressed="false"');
    expect(main).not.toContain('data-home-region="passport"');
    expect(main.match(/data-editorial-content-id=/g)).toHaveLength(4);
    expect(main.match(/data-primary-action="explore"/g)).toHaveLength(4);
  });

  it('provides source and license links for every home photograph', async () => {
    const markup = renderToStaticMarkup(await Home());
    expect(markup.match(/data-photo-credit=/g)).toHaveLength(4);
    expect(markup.match(/href="https:\/\/unsplash.com\/photos\//g)).toHaveLength(4);
    expect(markup.match(/href="https:\/\/unsplash.com\/license"/g)).toHaveLength(4);
    expect(markup).toContain('seoul-ethan-yoo.jpg');
    expect(markup).toContain('singapore-filipe-freitas.jpg');
    expect(markup).toContain('dubai-waqas-sultan.jpg');
    expect(markup).toContain('tokyo-pjh.jpg');
    expect(markup).not.toContain('%2Fassets%2Fstories%2F');
    expect(markup).not.toContain('Wikimedia Commons');
    expect(markup).not.toContain('↗');
    expect(markup.match(/data-ui-icon="arrow-right"/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it.each([
    ['ko', ['/ko/kr/seoul/explore/', '/ko/sg/singapore/explore/', '/ko/ae/dubai/explore/', '/ko/jp/tokyo/explore/', '/ko/tools/', '/ko/news/', '/ko/guides/']],
    ['zh-CN', ['/zh-cn/kr/seoul/explore/', '/zh-cn/sg/singapore/explore/', '/zh-cn/ae/dubai/explore/', '/zh-cn/jp/tokyo/explore/', '/zh-cn/tools/', '/zh-cn/news/', '/zh-cn/guides/']],
  ] as const)('preserves supported market and section routes for %s', (locale, hrefs) => {
    const markup = renderToStaticMarkup(<PropertyHome locale={locale} />);
    for (const href of hrefs) expect(markup).toContain(`href="${href.replace(/\/$/, '')}"`);
  });

  it('keeps global destinations and capability-safe market entry points crawlable', async () => {
    const markup = renderToStaticMarkup(await Home());

    for (const href of ['/prices', '/rankings', '/news', '/guides']) {
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

  it.each(['en', 'ko', 'zh-CN'] as const)('renders existing published analysis with the matching language and dates for %s', locale => {
    const markup = renderToStaticMarkup(<PropertyHome locale={locale} />);
    const analysis = markup.slice(markup.indexOf('data-home-region="analysis"')).split('</section>')[0]!;
    expect(analysis.match(/<article/g)).toHaveLength(3);
    for (const slug of ['seoul-monthly-2026-09', 'singapore-monthly-2026-09', 'dubai-monthly-2026-09']) {
      const record = getPortfolioRecord(locale, slug)!;
      expect(record).toBeDefined();
      expect(analysis).toContain(record.canonicalHref.replace(/\/$/, ''));
      expect(analysis).toContain(`dateTime="${record.publishedAt}"`);
      expect(analysis).toContain(renderToStaticMarkup(<h3>{record.title}</h3>).slice(4, -5));
      expect(analysis).toContain(renderToStaticMarkup(<p>{record.deck}</p>));
    }
  });

  it('keeps the root canonical and indexable', () => {
    expect(metadata).toMatchObject({
      robots: { index: true, follow: true },
      alternates: { canonical: 'https://www.signedprice.com/' },
    });
  });
});
