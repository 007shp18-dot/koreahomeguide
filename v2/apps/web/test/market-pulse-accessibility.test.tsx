import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarketPulse } from '../components/visual/market-pulse';

// Empty SVG titles and missing descriptions must fail independently of visual styling.
const cases = [
  { city: 'seoul', names: ['Seoul', '서울', '首尔'], first: '5,626', last: '5,321' },
  { city: 'singapore', names: ['Singapore', '싱가포르', '新加坡'], first: '594', last: '630' },
  { city: 'dubai', names: ['Dubai', '두바이', '迪拜'], first: '8,100', last: '7,142' },
] as const;

for (const [index, locale] of (['en', 'ko', 'zh-CN'] as const).entries()) {
  describe(`market chart accessibility in ${locale}`, () => {
    it.each(cases)('names and describes the $city graph with its actual historical values', ({ city, names, first, last }) => {
      const html = renderToStaticMarkup(<MarketPulse locale={locale} city={city} />);
      const svg = html.match(/<svg\b[^>]*role="img"[\s\S]*?<\/svg>/)?.[0] ?? '';
      const title = svg.match(/<title id="([^"]+)">([^<]+)<\/title>/);
      const description = svg.match(/<desc id="([^"]+)">([^<]+)<\/desc>/);
      expect(title, 'The graph needs a non-empty accessible title').not.toBeNull();
      expect(title?.[2]).toContain(names[index]);
      expect(title?.[2]).toContain('2026');
      expect(svg).toContain(`aria-labelledby="${title?.[1]}"`);
      expect(description, 'The graph needs a linked textual description').not.toBeNull();
      expect(svg).toContain(`aria-describedby="${description?.[1]}"`);
      expect(description?.[2]).toContain(first);
      expect(description?.[2]).toContain(last);
      if (city === 'dubai') {
        expect(description?.[2]).toContain('2,043');
        expect(description?.[2]).toContain('2,079');
      }
      expect(description?.[2]).toContain(locale === 'en' ? 'not a price index' : locale === 'ko' ? '가격지수가 아닙니다' : '并非价格指数');
      expect(html).toContain('<table>');
      const prefix = locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn';
      expect(html).toContain(`href="${prefix}/news/${city}-monthly-2026-09"`);
    });
  });
}
