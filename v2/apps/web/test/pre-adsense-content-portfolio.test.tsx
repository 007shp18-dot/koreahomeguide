import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import ChineseGuidesPage from '../app/(zh-cn)/zh-cn/guides/page';
import ChineseNewsPage from '../app/(zh-cn)/zh-cn/news/page';
import ChineseArticlePage, { generateMetadata as generateChineseArticleMetadata } from '../app/(zh-cn)/zh-cn/news/[slug]/page';
import { generateStaticParams as generateEnglishArticleParams } from '../app/(en)/news/[slug]/page';
import { generateStaticParams as generateEnglishGuideParams } from '../app/(en)/guides/[slug]/page';
import sitemap from '../app/sitemap';
import { EDITORIAL_PORTFOLIO, listPortfolioRecords } from '../content/portfolio-manifest';

const officialHosts = new Set([
  'www.law.go.kr', 'rt.molit.go.kr', 'www.molit.go.kr', 'land.seoul.go.kr',
  'www.fsc.go.kr', 'www.iras.gov.sg', 'www.hdb.gov.sg', 'www.ura.gov.sg',
]);

function sectionCount(body: string): number {
  return body.match(/^## /gmu)?.length ?? 0;
}

describe('pre-AdSense reviewed launch portfolio', () => {
  it('keeps the approved 29-record mix and public English parameters', () => {
    const english = listPortfolioRecords('en');
    expect(EDITORIAL_PORTFOLIO).toHaveLength(29);
    expect(english).toHaveLength(21);
    expect(generateEnglishArticleParams()).toEqual(english
      .filter(({ type }) => type === 'market-brief' || type === 'data-story')
      .map(({ slug }) => ({ slug })));
    expect(generateEnglishGuideParams()).toEqual(english
      .filter(({ type }) => type === 'guide')
      .map(({ slug }) => ({ slug })));

    for (const article of EDITORIAL_PORTFOLIO) {
      expect(sectionCount(article.bodyMarkdown)).toBeGreaterThanOrEqual(4);
      expect(article.sources.length).toBeGreaterThanOrEqual(1);
      for (const source of article.sources) {
        const url = new URL(source.href);
        expect(url.protocol).toBe('https:');
        expect(officialHosts.has(url.hostname)).toBe(true);
        expect(source.checkedAt).toBe('2026-09-04');
      }
    }
  });

  it('publishes eight independently reviewed Simplified Chinese records', () => {
    const chinese = listPortfolioRecords('zh-CN');
    expect(chinese).toHaveLength(8);
    expect(new Set(chinese.map(({ slug }) => slug)).size).toBe(8);
    expect(chinese.every(({ reviewedBy, reviewedAt }) => reviewedBy !== null && reviewedAt !== null)).toBe(true);
    expect(chinese.filter(({ type }) => type === 'policy-update')).toHaveLength(2);
    expect(chinese.filter(({ type }) => type === 'market-brief')).toHaveLength(1);
    expect(chinese.filter(({ type }) => type === 'data-story')).toHaveLength(2);
    expect(chinese.filter(({ type }) => type === 'guide')).toHaveLength(3);
  });

  it('renders crawlable Chinese News, Guides and a sourced detail', async () => {
    const news = renderToStaticMarkup(<ChineseNewsPage />);
    const guides = renderToStaticMarkup(<ChineseGuidesPage />);
    for (const article of listPortfolioRecords('zh-CN')) {
      expect(article.type === 'guide' ? guides : news).toContain(article.title);
    }

    const article = listPortfolioRecords('zh-CN').find(({ type }) => type === 'data-story')!;
    const params = Promise.resolve({ slug: article.slug });
    const detail = renderToStaticMarkup(await ChineseArticlePage({ params }));
    const metadata = await generateChineseArticleMetadata({ params });
    expect(detail).toContain('Sources');
    expect(detail).not.toContain(article.reviewedBy);
    expect(detail).toContain(article.relatedHref?.replace(/\/$/u, ''));
    expect(metadata.alternates?.canonical).toBe(`https://www.signedprice.com${article.canonicalHref}`);
  });

  it('publishes every reviewed canonical in the sitemap exactly once', () => {
    const urls = sitemap().map(({ url }) => url);
    for (const article of EDITORIAL_PORTFOLIO) {
      expect(urls.filter((url) => url === `https://www.signedprice.com${article.canonicalHref}`)).toHaveLength(1);
    }
  });
});
