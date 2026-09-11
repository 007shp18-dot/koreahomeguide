import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PricesPage } from '../components/prices-page';
import { languageDestinations } from '../lib/navigation/site-navigation';
import { pricesCopy } from '../lib/locale/prices-copy';

describe('Explore directory language parity', () => {
  it('keeps the same directory sections and all four city links in each language', async () => {
    const sections: number[] = [];
    for (const locale of ['en', 'ko', 'zh-CN'] as const) {
      const html = renderToStaticMarkup(await PricesPage({ locale, searchParams: Promise.resolve({}) }));
      const prefix = locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : '';
      for (const route of ['/kr/seoul/explore/', '/sg/singapore/explore/', '/ae/dubai/explore/', '/jp/tokyo/explore/']) expect(html).toContain(`href="${prefix}${route.replace(/\/$/, '')}"`);
      expect(html).toContain(pricesCopy(locale).tips[0]![0]);
      sections.push((html.match(/<section/g) ?? []).length);
      if (locale !== 'en') expect(html).not.toContain('What to check beside the price');
    }
    expect(new Set(sections).size).toBe(1);
  });
  it('preserves search and market when switching the directory language', () => {
    expect(languageDestinations('/ko/prices/', '?market=tokyo&q=Shibuya')).toEqual({ en: '/prices/?market=tokyo&q=Shibuya', ko: '/ko/prices/?market=tokyo&q=Shibuya', 'zh-CN': '/zh-cn/prices/?market=tokyo&q=Shibuya' });
  });
});
