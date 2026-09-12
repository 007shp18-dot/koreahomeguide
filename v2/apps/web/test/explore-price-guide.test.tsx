import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ExplorePriceGuide } from '../components/market-ui/explore-price-guide';

describe('Explore price meanings', () => {
  it.each(['en', 'ko', 'zh-CN'] as const)('separates sale totals, deposits and monthly rents in %s', locale => {
    const sale = renderToStaticMarkup(<ExplorePriceGuide locale={locale} market="seoul" />);
    const jeonse = renderToStaticMarkup(<ExplorePriceGuide locale={locale} market="seoul" transaction="jeonse" />);
    const monthly = renderToStaticMarkup(<ExplorePriceGuide locale={locale} market="seoul" transaction="monthly" />);
    expect(sale).toContain('data-transaction-kind="sale"');
    expect(jeonse).toContain('data-transaction-kind="jeonse"');
    expect(monthly).toContain('data-transaction-kind="monthly"');
    expect(new Set([sale, jeonse, monthly]).size).toBe(3);
    for (const html of [sale, jeonse, monthly]) expect(html).toContain('KRW');
  });

  it('makes Tokyo sales, neighbourhood medians and individual totals explicit', () => {
    const html = renderToStaticMarkup(<ExplorePriceGuide locale="ko" market="tokyo" />);
    for (const label of ['매매 실거래가', '동네별 중앙값', '개별 기록은 매매 총액', 'JPY']) expect(html).toContain(label);
  });

  it('keeps Singapore sales and Dubai annual rent context distinct', () => {
    expect(renderToStaticMarkup(<ExplorePriceGuide market="singapore" />)).toContain('URA private homes · Median sale price · SGD');
    expect(renderToStaticMarkup(<ExplorePriceGuide market="dubai" />)).toContain('Rent shown separately per year');
  });
});
