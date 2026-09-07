import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { getPortfolioRecord } from '../content/portfolio-manifest';
import { EditorialMarkdown } from '../components/insights/editorial-markdown';

const number = (value: number) => Math.round(value).toLocaleString('en-US');

describe('foreign-reader worked examples', () => {
  it('renders Korean listing labels, questions and source links in the published English guide', () => {
    const article = getPortfolioRecord('en', 'rent-an-apartment-in-korea')!;
    const html = renderToStaticMarkup(<EditorialMarkdown source={article.bodyMarkdown} />);
    expect(html).toContain('<table>');
    for (const label of ['보증금', '월세', '관리비', '전용면적', '입주가능일']) expect(html).toContain(label);
    expect(html).toContain('정확한 주소와 동·호수를 알려주세요.');
    expect(html).toContain('href="/kr/seoul/check/"');
    expect(article.sources.some(source => source.id === 'ibs-housing-addresses')).toBe(true);
    expect(article.updatedAt).toBe('2026-09-07T05:57:26.000Z');
    // Later substantive edits may update review dates; preserve the original publication date.
    expect(getPortfolioRecord('en', 'wolse-vs-jeonse')!.publishedAt).toBe('2026-09-04T00:00:00.000Z');
  });

  it('reconciles both Singapore budget examples with marginal BSD and separately stated ABSD', () => {
    const article = getPortfolioRecord('en', 'singapore-condos-under-1-5-million-2026')!;
    const budgets = [1500000, 920000].map(price => {
      let remaining = price;
      let bsd = 0;
      for (const [width, rate] of [[180000, .01], [180000, .02], [640000, .03], [500000, .04]] as const) {
        const taxable = Math.min(remaining, width);
        bsd += taxable * rate;
        remaining -= taxable;
      }
      expect(remaining).toBe(0);
      return { price, bsd, absd: price * .6, total: price + bsd + price * .6 };
    });
    for (const [label, key] of [['Purchase price', 'price'], ['BSD', 'bsd'], ['ABSD at assumed 60%', 'absd'], ['Price plus duties', 'total']] as const) {
      expect(article.bodyMarkdown).toContain(`| ${label} | S$${number(budgets[0]![key])} | S$${number(budgets[1]![key])} |`);
    }
    expect(article.bodyMarkdown).toContain(`S$${number(1500000 - budgets[1]!.total)}`);
    expect(article.bodyMarkdown).toContain('with no remission');
    expect(article.bodyMarkdown).toContain('market value equals the agreed price');
    expect(article.sources.map(source => source.id)).toEqual(expect.arrayContaining(['iras-bsd', 'iras-absd', 'iras-fta-remission']));
  });

  it('checks Dubai payments by amortizing the balance and reconciles break-even rent with cash flow', () => {
    const article = getPortfolioRecord('en', 'dubai-rental-yield-after-costs')!;
    for (const annualRate of [.05, .07]) {
      const monthlyRate = annualRate / 12;
      const payment = 700000 * monthlyRate / (1 - Math.pow(1 + monthlyRate, -300));
      let balance = 700000;
      for (let month = 0; month < 300; month++) balance = balance * (1 + monthlyRate) - payment;
      expect(balance).toBeCloseTo(0, 4);
      const annualIncome = 70000 * 11 / 12 * .95 - 15000;
      const cash = annualIncome - 12 * payment;
      expect(article.bodyMarkdown).toContain(`| ${number(annualRate * 100)}% | AED ${number(payment)} | −AED ${number(-cash)} |`);
      const requiredRent = (12 * payment + 15000) / (11 / 12 * .95);
      expect(article.bodyMarkdown).toContain(`AED ${number(requiredRent)}`);
      expect(requiredRent * 11 / 12 * .95 - 15000 - 12 * payment).toBeCloseTo(0, 6);
    }
    expect(article.bodyMarkdown).toContain('Neither rate below is a lender quote');
    expect(article.publishedAt).toBe('2026-09-06T00:00:00.000Z');
  });
});
