import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BUYING_GUIDE_DATA } from '../content/en/buying-guide-data';
import { BUYING_GUIDES } from '../content/en/buying-guides';
import { BuyingGuide, buyingGuideBsd, buyingGuideCosts } from '../components/newsroom/buying-guide';
import { GlobalProductHub } from '../components/global-product-hub';

describe('budget buying guides', () => {
  it('keeps every example tied to a qualifying price and area cohort', () => {
    for (const guide of BUYING_GUIDE_DATA) for (const band of guide.bands) {
      expect(band.examples).toHaveLength(3);
      for (const sample of band.examples) {
        expect(sample.records).toHaveLength(sample.n);
        expect(sample.n).toBeGreaterThanOrEqual(3);
        expect(sample.n / sample.total).toBeGreaterThanOrEqual(.5);
        for (const record of sample.records) {
          expect(record.price).toBeGreaterThanOrEqual(band.cap * .8);
          expect(record.price).toBeLessThanOrEqual(band.cap);
          expect(record.area).toBeGreaterThanOrEqual(sample.band);
          expect(record.area).toBeLessThan(sample.band + 20);
        }
      }
    }
  });
  it('uses progressive BSD and distinct buyer-profile assumptions', () => {
    expect([1000000, 1500000, 2000000].map(buyingGuideBsd)).toEqual([24600, 44600, 69600]);
    const subtotal = (profile: number) => buyingGuideCosts('SGD', 1500000, profile).reduce((sum, [, value]) => sum + value, 0);
    expect([0, 1, 2].map(subtotal)).toEqual([2444600, 1619600, 1544600]);
    expect(buyingGuideCosts('AED', 1000000, 0)).toEqual([['Property price', 1000000], ['Buyer registration share (2%)', 20000], ['Service partner fee before VAT', 4000]]);
    expect(buyingGuideCosts('KRW', 1000000000, 0)[1]?.[1]).toBe(30000000);
  });
  it('renders evidence, accessible controls and limits for all cities', () => {
    for (const guide of BUYING_GUIDE_DATA) {
      const html = renderToStaticMarkup(<BuyingGuide guide={guide} />);
      expect(html).toContain('Purchase-price ceiling');
      expect(html).toContain('View transaction evidence');
      expect(html).toContain('Subtotal of displayed items');
      expect(html).toContain('not current listings');
      expect(html).not.toMatch(/NaN|undefined/);
      expect(BUYING_GUIDES.find(record => record.slug === guide.slug)?.canonicalHref).toBe(`/guides/${guide.slug}/`);
    }
  });
  it('includes the Dubai portfolio guide in the existing Dubai filter', () => {
    const html = renderToStaticMarkup(<GlobalProductHub kind="guides" guideMarket="dubai" />);
    expect(html).toContain('dubai-ready-apartment-buying-budget-guide');
    expect(html).not.toContain('seoul-apartment-buying-budget-guide');
  });
});
