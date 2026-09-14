import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import CommunityPage, { metadata as communityMetadata } from '../app/(en)/community/page';
import ChineseGuidePage, { generateMetadata, generateStaticParams } from '../app/(zh-cn)/zh-cn/guides/[slug]/page';
import sitemap from '../app/sitemap';
import robots from '../app/robots';
import { EDITORIAL_PORTFOLIO } from '../content/portfolio-manifest';
import { editorialLanguageAlternates, indexableMetadata } from '../lib/public-metadata';

const excluded = [
  '/community/',
  '/zh-cn/guides/wolse-vs-jeonse-zh/',
  '/zh-cn/guides/buy-property-in-korea-zh/',
  '/zh-cn/guides/rent-in-korea-zh/',
];

describe('content search exclusions', () => {
  it('keeps the community landing page readable and links followable', async () => {
    expect(communityMetadata.robots).toEqual({ index: false, follow: true });
    expect(communityMetadata.alternates?.canonical).toBe('https://www.signedprice.com/community/');
    expect(renderToStaticMarkup(await CommunityPage({searchParams:Promise.resolve({})}))).toContain('<main');
  });

  it.each(excluded.slice(1))('keeps %s readable with a self canonical and noindex', async (path) => {
    const slug = path.split('/').filter(Boolean).at(-1)!;
    const params = Promise.resolve({ slug });
    const metadata = await generateMetadata({ params });
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe(`https://www.signedprice.com${path}`);
    expect(generateStaticParams()).toContainEqual({ slug });
    const record = EDITORIAL_PORTFOLIO.find(({ canonicalHref }) => canonicalHref === path)!;
    expect(renderToStaticMarkup(await ChineseGuidePage({ params }))).toContain(record.title);
  });

  it('keeps other portfolio pages indexable without hreflang links to excluded content', () => {
    for (const article of EDITORIAL_PORTFOLIO) {
      const languages = editorialLanguageAlternates(article, EDITORIAL_PORTFOLIO);
      const metadata = indexableMetadata({
        path: article.canonicalHref as `/${string}`,
        title: article.title,
        description: article.deck,
        ...(languages === undefined ? {} : { languageAlternates: languages }),
      });
      expect(metadata.robots).toEqual({ index: !excluded.includes(article.canonicalHref), follow: true });
      for (const path of excluded) {
        expect(Object.values(metadata.alternates?.languages ?? {})).not.toContain(`https://www.signedprice.com${path}`);
      }
    }
  });

  it('omits excluded URLs from sitemap entries and language alternatives', () => {
    const entries = sitemap();
    const urls = entries.flatMap(entry => [entry.url, ...Object.values(entry.alternates?.languages ?? {})]);
    for (const path of excluded) expect(urls).not.toContain(`https://www.signedprice.com${path}`);
    expect(urls).toContain('https://www.signedprice.com/guides/wolse-vs-jeonse/');
    expect(urls).toContain('https://www.signedprice.com/zh-cn/guides/');
  });

  it('allows crawlers to revisit the excluded pages and read noindex', () => {
    expect(robots().rules).toEqual({ userAgent: '*', allow: '/', disallow: '/api/' });
  });
});
