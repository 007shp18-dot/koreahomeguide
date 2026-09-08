import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import ChineseHome, { metadata as homeMetadata } from '../app/(zh-cn)/zh-cn/kr/seoul/page';
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
    expect(home).toContain('你的预算可以在哪里买到房子？');
    expect(home).toContain('最新洞察');
    expect(home).toContain('href="/zh-cn/news');
    expect(news).toContain('首尔与新加坡的政策更新、市场简报和数据故事。');
    expect(news).toContain('data-public-editorial-frame="content"');
  });

  it('opens the home analysis destination without policy updates or guides', async () => {
    const markup = renderToStaticMarkup(await ChineseNews({ searchParams: Promise.resolve({type: 'analysis'}) }));
    expect(markup).toContain('data story');
    expect(markup).toContain('market brief');
    expect(markup).not.toContain('policy update');
    expect(markup).not.toContain('href="/zh-cn/guides/');
  });

  it('uses reciprocal English and zh-Hans canonicals on indexable content', () => {
    expect(homeMetadata).toMatchObject({
      robots: { index: true, follow: true },
      alternates: {
        canonical: 'https://www.signedprice.com/zh-cn/kr/seoul/',
        languages: {
          en: 'https://www.signedprice.com/',
          'zh-Hans': 'https://www.signedprice.com/zh-cn/kr/seoul/',
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

  it('indexes only the localized editorial surfaces and bridges tools to live English products', () => {
    const urls = sitemap().map(({ url }) => url);
    expect(urls).toContain('https://www.signedprice.com/zh-cn/kr/seoul/');
    expect(urls).toContain('https://www.signedprice.com/zh-cn/news/');
    expect(urls).toContain('https://www.signedprice.com/zh-cn/guides/');
    expect(urls).not.toContain('https://www.signedprice.com/zh-cn/kr/seoul/check/');
    expect(urls).not.toContain('https://www.signedprice.com/zh-cn/kr/seoul/explore/');

    for (const [file, destination] of [
      ['../app/(zh-cn)/zh-cn/kr/seoul/check/page.tsx', '/kr/seoul/check/'],
      ['../app/(zh-cn)/zh-cn/kr/seoul/explore/page.tsx', '/kr/seoul/explore/'],
    ] as const) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8');
      expect(source).toContain(`redirect('${destination}')`);
    }
  });
});
