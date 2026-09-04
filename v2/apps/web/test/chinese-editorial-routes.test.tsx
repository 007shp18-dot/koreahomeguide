import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import ChineseHome, { metadata as homeMetadata } from '../app/(zh-cn)/zh-cn/kr/seoul/page';
import ChineseInsights, { metadata as insightsMetadata } from '../app/(zh-cn)/zh-cn/kr/seoul/insights/page';
import sitemap from '../app/sitemap';

afterEach(() => vi.unstubAllEnvs());

describe('Simplified Chinese editorial release', () => {
  it('publishes a localized home and Journal without leaking review routes', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const home = renderToStaticMarkup(await ChineseHome());
    const insights = renderToStaticMarkup(await ChineseInsights());

    for (const markup of [home, insights]) {
      expect(markup).toContain('lang="zh-CN"');
      expect(markup).not.toContain('Design review');
      expect(markup).not.toContain('/design-review/');
    }
    expect(home).toContain('做决定之前，先看懂市场。');
    expect(home).toContain('在韩国租房前，先看真实成交依据');
    expect(home).toContain('href="/zh-cn/kr/seoul/insights"');
    expect(insights).toContain('面向跨境租客与买家的原创报道和实用指南。');
    expect(insights).toContain('data-public-editorial-shell="content"');
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
    expect(insightsMetadata).toMatchObject({
      alternates: {
        canonical: 'https://www.signedprice.com/zh-cn/kr/seoul/insights/',
        languages: {
          en: 'https://www.signedprice.com/insights/',
          'zh-Hans': 'https://www.signedprice.com/zh-cn/kr/seoul/insights/',
        },
      },
      openGraph: { locale: 'zh_CN' },
    });
  });

  it('indexes only the localized editorial surfaces and bridges tools to live English products', () => {
    const urls = sitemap().map(({ url }) => url);
    expect(urls).toContain('https://www.signedprice.com/zh-cn/kr/seoul/');
    expect(urls).toContain('https://www.signedprice.com/zh-cn/kr/seoul/insights/');
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
