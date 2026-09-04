import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import sitemap from '../app/sitemap';
import { PublicEditorialJsonLd } from '../components/public-json-ld';
import { EDITORIAL_PORTFOLIO } from '../content/portfolio-manifest';
import { editorialLanguageAlternates } from '../lib/public-metadata';
import { signedPricePublicRouteRegistry } from '../lib/seo/public-route-registry.server';

describe('Newsroom and Guide SEO release contract', () => {
  it('publishes every reviewed portfolio canonical and no legacy editorial route', () => {
    const urls = sitemap().map(({ url }) => url);
    for (const record of EDITORIAL_PORTFOLIO) {
      expect(urls).toContain(`https://www.signedprice.com${record.canonicalHref}`);
    }
    expect(urls.filter((url) => EDITORIAL_PORTFOLIO.some(({ canonicalHref }) => url.endsWith(canonicalHref))))
      .toHaveLength(29);
    expect(urls.some((url) => /\/insights\/|\/kr\/seoul\/guide\//u.test(url))).toBe(false);
  });

  it('creates reciprocal hreflang only for independently reviewed translation groups', () => {
    for (const record of EDITORIAL_PORTFOLIO) {
      const alternates = editorialLanguageAlternates(record, EDITORIAL_PORTFOLIO);
      if (record.translationGroupId === null) {
        expect(alternates).toBeUndefined();
        continue;
      }
      const group = EDITORIAL_PORTFOLIO.filter(({ translationGroupId }) => translationGroupId === record.translationGroupId);
      if (group.length === 1) expect(alternates).toBeUndefined();
      else {
        expect(alternates?.en).toBe(group.find(({ locale }) => locale === 'en')?.canonicalHref);
        expect(alternates?.['zh-Hans']).toBe(group.find(({ locale }) => locale === 'zh-CN')?.canonicalHref);
      }
    }
  });

  it('matches visible review dates and sources in Article JSON-LD', () => {
    const article = EDITORIAL_PORTFOLIO.find(({ type }) => type === 'data-story')!;
    const html = renderToStaticMarkup(<PublicEditorialJsonLd article={article} />);
    const payload = JSON.parse(html.match(/<script[^>]*>(.*)<\/script>/u)?.[1] ?? '{}');
    expect(payload).toMatchObject({
      '@type': 'Article', headline: article.title, datePublished: article.publishedAt,
      dateModified: article.updatedAt, mainEntityOfPage: `https://www.signedprice.com${article.canonicalHref}`,
      reviewedBy: { name: article.reviewedBy }, citation: article.sources.map(({ href }) => href),
    });
  });

  it('keeps redirected legacy Guide routes out of the public sitemap registry', () => {
    expect(signedPricePublicRouteRegistry.listSitemapPaths({ newsReady: true }))
      .not.toContain('/kr/seoul/guide/');
  });
});
