import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import ChineseInsightsPage from '../app/(zh-cn)/zh-cn/kr/seoul/insights/page';
import ChineseArticlePage, {
  generateMetadata as generateChineseArticleMetadata,
} from '../app/(zh-cn)/zh-cn/kr/seoul/insights/[slug]/page';
import { generateStaticParams as generateEnglishArticleParams } from '../app/(en)/insights/[slug]/page';
import sitemap from '../app/sitemap';
import { GUIDES } from '../lib/guide/guide-content';
import { CHINESE_KOREA_ARTICLES } from '../lib/insights/chinese-korea-articles';
import { STARTER_EDITORIAL_ARTICLES } from '../lib/insights/editorial-content';

const officialHosts = new Set([
  'www.law.go.kr',
  'rt.molit.go.kr',
  'www.khug.or.kr',
  'global.seoul.go.kr',
  'english.seoul.go.kr',
  'www.easylaw.go.kr',
  'www.investkorea.org',
  'www.ura.gov.sg',
  'data.gov.sg',
]);

function sectionCount(body: string): number {
  return body.match(/^## /gmu)?.length ?? 0;
}

describe('pre-AdSense original content portfolio', () => {
  it('keeps the English portfolio inside the approved 30–40 original range', () => {
    const total = GUIDES.length + STARTER_EDITORIAL_ARTICLES.length;
    expect(total).toBe(34);
    expect(new Set(STARTER_EDITORIAL_ARTICLES.map(({ slug }) => slug)).size)
      .toBe(STARTER_EDITORIAL_ARTICLES.length);
    expect(generateEnglishArticleParams()).toEqual(
      STARTER_EDITORIAL_ARTICLES.map(({ slug }) => ({ slug })),
    );

    for (const article of STARTER_EDITORIAL_ARTICLES) {
      expect(sectionCount(article.bodyMarkdown)).toBeGreaterThanOrEqual(4);
      expect(article.bodyMarkdown.length).toBeGreaterThanOrEqual(1_200);
      expect(article.sources.length).toBeGreaterThanOrEqual(2);
      for (const source of article.sources) {
        const url = new URL(source.href);
        expect(url.protocol).toBe('https:');
        expect(officialHosts.has(url.hostname)).toBe(true);
        expect(source.checkedAt).toBe('2026-09-04');
      }
    }
  });

  it('publishes twelve independent Simplified Chinese originals', () => {
    expect(CHINESE_KOREA_ARTICLES).toHaveLength(12);
    expect(new Set(CHINESE_KOREA_ARTICLES.map(({ slug }) => slug)).size).toBe(12);
    expect(new Set(CHINESE_KOREA_ARTICLES.map(({ relatedEnglishSlug }) => relatedEnglishSlug)).size).toBe(12);
    for (const article of CHINESE_KOREA_ARTICLES) {
      expect(article.locale).toBe('zh-CN');
      expect(article.marketKey).toBe('seoul');
      expect(sectionCount(article.bodyMarkdown)).toBeGreaterThanOrEqual(4);
      expect(article.bodyMarkdown.length).toBeGreaterThanOrEqual(700);
      expect(article.bodyMarkdown).toMatch(/[（(][가-힣A-Za-z· ]+[）)]/u);
      expect(article.sources.length).toBeGreaterThanOrEqual(2);
      expect(STARTER_EDITORIAL_ARTICLES.some(({ slug }) => slug === article.relatedEnglishSlug)).toBe(true);
    }
  });

  it('renders crawlable Chinese index and detail pages with sources and product handoffs', async () => {
    const index = renderToStaticMarkup(await ChineseInsightsPage());
    for (const article of CHINESE_KOREA_ARTICLES) {
      expect(index).toContain(article.title);
      expect(index).toContain(`/zh-cn/kr/seoul/insights/${article.slug}`);
    }

    const article = CHINESE_KOREA_ARTICLES[0]!;
    const detail = renderToStaticMarkup(await ChineseArticlePage({
      params: Promise.resolve({ slug: article.slug }),
    }));
    const metadata = await generateChineseArticleMetadata({
      params: Promise.resolve({ slug: article.slug }),
    });
    expect(detail).toContain('资料来源与核对日期');
    expect(detail).toContain('查看首尔成交数据');
    expect(detail).toContain('查询价格');
    expect(detail).toContain(`/insights/${article.relatedEnglishSlug}`);
    expect(metadata.alternates?.canonical).toContain(`/zh-cn/kr/seoul/insights/${article.slug}/`);
    expect(metadata.alternates?.languages).toMatchObject({
      en: expect.stringContaining(`/insights/${article.relatedEnglishSlug}/`),
      'zh-Hans': expect.stringContaining(`/zh-cn/kr/seoul/insights/${article.slug}/`),
    });
  });

  it('publishes every English and Chinese original in the sitemap', () => {
    const urls = new Set(sitemap().map(({ url }) => url));
    for (const article of STARTER_EDITORIAL_ARTICLES) {
      expect(urls.has(`https://www.signedprice.com/insights/${article.slug}/`)).toBe(true);
    }
    for (const article of CHINESE_KOREA_ARTICLES) {
      expect(urls.has(`https://www.signedprice.com/zh-cn/kr/seoul/insights/${article.slug}/`)).toBe(true);
    }
  });
});
