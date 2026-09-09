import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import SingaporeOverviewAlias from '../app/(en)/sg/singapore/page';
import InsightsArticlePage from '../app/(en)/insights/[slug]/page';
import Home from '../app/(en)/page';
import { EditorialMarkdown } from '../components/insights/editorial-markdown';
import { InsightsIndex } from '../components/insights/insights-index';
import { listPublishedContentArticles } from '../lib/insights/content-article-store.server';
import { SINGAPORE_LENTOR_SPILLOVER } from '../content/en/singapore-lentor-spillover';
import { DUBAI_RENTAL_YIELD } from '../content/en/dubai-rental-yield';

afterEach(() => vi.unstubAllEnvs());

describe('three-city research journeys', () => {
  it('permanently redirects the Singapore city alias to its existing overview', () => {
    expect(() => SingaporeOverviewAlias()).toThrow('NEXT_REDIRECT');
    try { SingaporeOverviewAlias(); } catch (error) {
      expect((error as { digest: string }).digest).toContain('/sg/');
      expect((error as { digest: string }).digest).toContain('308');
    }
  });

  it('includes curated research once and keeps its News canonical destination', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const articles = await listPublishedContentArticles();
    expect(new Set(articles.map(a => a.slug)).size).toBe(articles.length);
    const dubai = articles.find(a => a.slug === DUBAI_RENTAL_YIELD.slug)!;
    expect(dubai).toMatchObject({ marketKey: 'dubai', canonicalHref: DUBAI_RENTAL_YIELD.canonicalHref });
    const markup = renderToStaticMarkup(<InsightsIndex articles={[dubai]} />);
    expect(markup).toContain('href="/news/dubai-rental-yield-after-costs"');
    await expect(InsightsArticlePage({ params: Promise.resolve({ slug: dubai.slug }) })).rejects.toMatchObject({
      digest: expect.stringContaining('/news/dubai-rental-yield-after-costs/'),
    });
  });

  it('routes homepage readers to the dedicated insights page without an embedded feed', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const markup = renderToStaticMarkup(await Home());
    const start = markup.indexOf('aria-label="Take a closer look"');
    expect(start).toBeGreaterThan(0);
    const section = markup.slice(start, markup.indexOf('</nav>', start));
    expect(section).toContain('href="/news"');
    expect(markup).not.toContain('data-home-region="analysis"');
  });

  it('marks internal tool links while leaving external and unrelated links untracked', () => {
    const markup = renderToStaticMarkup(<EditorialMarkdown source="[Explore](/ae/dubai/explore/) [Check](/sg/singapore/check/?price=100) [Source](https://example.com/check/) [Guide](/guides/)" />);
    expect(markup.match(/data-editorial-event=/g)).toHaveLength(2);
    expect(markup).toContain('data-editorial-event="article_to_explore"');
    expect(markup).toContain('data-editorial-event="article_to_check"');
    expect(markup).not.toContain('data-editorial-price');
  });

  it('renders reproducible Lentor counts and all nine Dubai yield scenarios as tables', () => {
    const lentor = renderToStaticMarkup(<EditorialMarkdown source={SINGAPORE_LENTOR_SPILLOVER.bodyMarkdown} />);
    expect(lentor).toContain('<table>');
    for (const value of ['13 / 17', '27 / 14', '996 / 1,060', '998 / 1,157']) expect(lentor).toContain(value);
    const dubai = DUBAI_RENTAL_YIELD.bodyMarkdown;
    for (const months of [0, 1, 2]) {
      const yields = [8000, 12000, 18000].map(charge =>
        ((70000 * (12 - months) / 12 * .95 - charge - 3000) / 1065000 * 100).toFixed(2) + '%');
      expect(dubai).toContain('| ' + months + ' | ' + yields.join(' | ') + ' |');
    }
    expect(DUBAI_RENTAL_YIELD.publishedAt).toBe('2026-09-06T00:00:00.000Z');
  });
});
