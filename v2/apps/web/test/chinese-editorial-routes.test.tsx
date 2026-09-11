import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import ChineseHome, { metadata as homeMetadata } from '../app/(zh-cn)/zh-cn/page';
import ChineseNews, { metadata as newsMetadata } from '../app/(zh-cn)/zh-cn/news/page';
import sitemap from '../app/sitemap';

afterEach(() => vi.unstubAllEnvs());

describe('Simplified Chinese editorial release', () => {
  it('publishes a localized home and Journal without leaking review routes', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const home = renderToStaticMarkup(await ChineseHome());
    const news = renderToStaticMarkup(await ChineseNews());

    for (const markup of [home, news]) {
      expect(markup).toContain('lang="zh-CN"');
      expect(markup).not.toContain('Design review');
      expect(markup).not.toContain('/design-review/');
    }
    expect(home).toContain('四座城市，');
    expect(home).toContain('不同的生活。');
    expect(home.match(/data-primary-action="explore"/g)).toHaveLength(4);
    expect(home).toContain('href="/zh-cn/news');
    expect(news).toContain('了解四座城市的房地产市场、投资决策与社区生活。');
    expect(news).toContain('data-public-editorial-frame="content"');
  });

  it('opens the legacy analysis destination in the shared Insights layout', async () => {
    const markup = renderToStaticMarkup(await ChineseNews({ searchParams: Promise.resolve({type: 'analysis'}) }));
    expect(markup).toContain('data-newsroom-layout="insights"');
    expect(markup).toContain('aria-label="洞察城市"');
    expect(markup).toContain('/zh-cn/news?topic=investment');
    expect(markup).not.toContain('data-newsroom-layout="news"');
  });

  it('uses reciprocal English and zh-Hans canonicals on indexable content', () => {
    expect(homeMetadata).toMatchObject({
      robots: { index: true, follow: true },
      alternates: {
        canonical: 'https://www.signedprice.com/zh-cn/',
        languages: {
          en: 'https://www.signedprice.com/',
          'zh-Hans': 'https://www.signedprice.com/zh-cn/',
          'x-default': 'https://www.signedprice.com/',
        },
      },
    });
    expect(newsMetadata).toMatchObject({
      alternates: {
        canonical: 'https://www.signedprice.com/zh-cn/news/',
        languages: {
          en: 'https://www.signedprice.com/news/',
          'zh-Hans': 'https://www.signedprice.com/zh-cn/news/',
        },
      },
      openGraph: { locale: 'zh_CN' },
    });
  });

  it('keeps editorial surfaces indexed and renders Chinese Seoul products without redirecting', () => {
    const urls = sitemap().map(({ url }) => url);
    expect(urls).toContain('https://www.signedprice.com/zh-cn/');
    expect(urls).toContain('https://www.signedprice.com/zh-cn/news/');
    expect(urls).toContain('https://www.signedprice.com/zh-cn/guides/');

    for (const file of [
      '../app/(zh-cn)/zh-cn/kr/seoul/check/page.tsx',
      '../app/(zh-cn)/zh-cn/kr/seoul/explore/page.tsx',
    ] as const) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8');
      expect(source).not.toContain('redirect(');
      expect(source).toContain("'zh-CN'");
    }
  });
});
