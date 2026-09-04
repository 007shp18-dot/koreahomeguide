import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import InsightsPage from '../app/(en)/insights/page';
import InsightsArticlePage from '../app/(en)/insights/[slug]/page';
import { STARTER_EDITORIAL_ARTICLES } from '../lib/insights/editorial-content';

afterEach(() => vi.unstubAllEnvs());

describe('public Journal routes', () => {
  it('uses the approved public editorial frame without review or legacy navigation', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const markup = renderToStaticMarkup(await InsightsPage());

    expect(markup).toContain('data-public-editorial-frame="content"');
    expect(markup).toContain('aria-label="Primary navigation"');
    expect(markup).not.toContain('site-header__market-tier');
    expect(markup).not.toContain('Design review');
    expect(markup).not.toContain('/design-review/');
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
});
