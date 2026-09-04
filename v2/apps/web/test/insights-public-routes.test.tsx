import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import InsightsPage, { revalidate as insightsRevalidate } from '../app/(en)/insights/page';
import InsightsArticlePage from '../app/(en)/insights/[slug]/page';
import { InsightsArticle } from '../components/insights/insights-article';
import { STARTER_EDITORIAL_ARTICLES } from '../lib/insights/editorial-content';

const insightsCss = readFileSync(
  new URL('../components/insights/insights.module.css', import.meta.url),
  'utf8',
);

afterEach(() => vi.unstubAllEnvs());

describe('public Journal routes', () => {
  it('keeps the lead summary in the dedicated desktop column', () => {
    expect(insightsCss).toContain('.leadCard > :not(.cardIndex, p)');
    expect(insightsCss).not.toContain('.leadCard > :not(.cardIndex) {');
  });

  it('uses the approved public editorial frame without review or legacy navigation', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const markup = renderToStaticMarkup(await InsightsPage());

    expect(markup).toContain('data-public-editorial-frame="content"');
    expect(markup).toContain('aria-label="Primary navigation"');
    expect(markup).not.toContain('site-header__market-tier');
    expect(markup).not.toContain('Design review');
    expect(markup).not.toContain('/design-review/');
    expect(insightsRevalidate).toBe(900);
  });

  it('keeps the canonical article, reading measure, and empty ad boundary', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const article = STARTER_EDITORIAL_ARTICLES[0]!;
    const markup = renderToStaticMarkup(await InsightsArticlePage({
      params: Promise.resolve({ slug: article.slug }),
    }));

    expect(markup).toContain(article.title);
    expect(markup).toContain('data-public-editorial-frame="content"');
    expect(markup).toContain('data-article-reading-width="720"');
    expect(markup).toContain('data-article-paragraph="1"');
    expect(markup).toContain('data-ad-slot="article-1"');
    expect(markup.indexOf('data-ad-slot="article-1"'))
      .toBeGreaterThan(markup.indexOf('data-article-paragraph="1"'));
  });

  it('hands each report to the relevant live market product', () => {
    const seoul = STARTER_EDITORIAL_ARTICLES.find(({ marketKey }) => marketKey === 'seoul')!;
    const singapore = STARTER_EDITORIAL_ARTICLES.find(({ marketKey }) => marketKey === 'singapore')!;
    const dubai = { ...seoul, marketKey: 'dubai' as const, slug: 'dubai-boundary' };

    const seoulMarkup = renderToStaticMarkup(<InsightsArticle article={seoul} />);
    const singaporeMarkup = renderToStaticMarkup(<InsightsArticle article={singapore} />);
    const dubaiMarkup = renderToStaticMarkup(<InsightsArticle article={dubai} />);

    expect(seoulMarkup).toContain('href="/kr/seoul/explore"');
    expect(seoulMarkup).toContain('href="/kr/seoul/check"');
    expect(singaporeMarkup).toContain('href="/sg/singapore/explore"');
    expect(singaporeMarkup).toContain('href="/sg/singapore/check"');
    expect(dubaiMarkup).toContain('href="/ae/dubai"');
    expect(dubaiMarkup).toContain('href="/compare?market=dubai"');
    expect(dubaiMarkup).not.toContain('/ae/dubai/check');
  });
});
