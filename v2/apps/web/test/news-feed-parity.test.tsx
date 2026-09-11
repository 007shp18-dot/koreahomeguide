import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NewsFeedIndex } from '../components/newsroom/news-feed-index';
import { marketDestination } from '../lib/navigation/site-navigation';
import { pricePlotScale } from '../lib/research/price-plot';

describe('localized research navigation', () => {
  it('preserves investment discovery when switching cities, but not in News', () => {
    for (const locale of ['en', 'ko', 'zh-CN'] as const) {
      const prefix = locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn';
      expect(marketDestination('jp-tokyo', `${prefix}/news/?market=seoul&topic=investment`, locale)).toBe(`${prefix}/news/?market=tokyo&topic=investment`);
      expect(marketDestination('ae-dubai', `${prefix}/news/?type=news&topic=investment`, locale)).toBe(`${prefix}/news/?type=news&market=dubai`);
    }
  });
  it('uses the same news layout and city order in every language', () => {
    for (const locale of ['en', 'ko', 'zh-CN'] as const) {
      const prefix = locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn';
      const html = renderToStaticMarkup(<NewsFeedIndex articles={[]} market="tokyo" locale={locale} headlines={<p>Stored headlines</p>} />);
      expect(html).toContain('data-newsroom-layout="news"');
      expect(html).toContain(`lang="${locale}"`);
      expect(html).toContain('Stored headlines');
      const destinations = [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
      expect(destinations).toEqual(['', '&amp;market=seoul', '&amp;market=singapore', '&amp;market=dubai', '&amp;market=tokyo'].map(query => `${prefix}/news?type=news${query}`));
    }
  });
});

describe('readable transaction price domain', () => {
  it('pads clustered prices and keeps all real observations inside the chart', () => {
    const values = [490_000_000, 530_000_000, 865_000_000];
    const scale = pricePlotScale(values);
    expect(scale.min).toBeGreaterThan(0);
    expect(scale.min).toBeLessThan(Math.min(...values));
    expect(scale.max).toBeGreaterThan(Math.max(...values));
    for (const value of values) expect(scale.position(value)).toBeGreaterThan(0);
    for (const value of values) expect(scale.position(value)).toBeLessThan(1);
  });
  it.each([{values: []}, {values: [0]}, {values: [5, 5]}, {values: [NaN, Infinity, -1]}])('keeps an empty or constant cohort finite: %j', ({ values }) => {
    const scale = pricePlotScale(values);
    expect(scale.max).toBeGreaterThan(scale.min);
    expect(scale.ticks.every(Number.isFinite)).toBe(true);
    expect(scale.ticks.length).toBeLessThan(10);
  });
});
