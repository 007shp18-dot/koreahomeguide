import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('server-only', () => ({}));
import { createBuyingJourney } from '../lib/home/buying-journey-model.server';
import { budgetBandIndex, buyingMoney } from '../lib/home/buying-journey';
import { BUYING_GUIDE_DATA } from '../content/en/buying-guide-data';
import { getPortfolioRecord } from '../content/portfolio-manifest';
import { PropertyHome } from '../components/design-review/editorial-growth-home';

describe('four-city buying journey', () => {
  it('keeps the initial home neutral with four equal city choices and crawlable guide links', () => {
    const html = renderToStaticMarkup(<PropertyHome locale="en" />);
    expect(html.match(/data-city-destination=/g)).toHaveLength(4);
    expect(html).not.toContain('data-buying-results=');
    for (const model of createBuyingJourney('en')) expect(html).toContain(model.guideHref.replace(/\/$/, ''));
  });
  it.each(['en', 'ko', 'zh-CN'] as const)('uses published locale routes and isolates market currencies for %s', locale => {
    const models = createBuyingJourney(locale);
    expect(models.map(model => model.city)).toEqual(['seoul', 'singapore', 'dubai', 'tokyo']);
    expect(models.map(model => model.currency)).toEqual(['KRW', 'SGD', 'AED', 'JPY']);
    for (const model of models) {
      expect(getPortfolioRecord(model.guideLocale, model.slug)?.canonicalHref).toBe(model.guideHref);
      expect(model.exploreHref).toMatch(new RegExp(`^${locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn'}/`));
      expect(model.bands).toHaveLength(3);
      expect(model.bands.every(band => band.examples.length > 0)).toBe(true);
    }
  });
  it('projects observed prices, areas and counts from reviewed guides, without shipping raw records', () => {
    const models = createBuyingJourney('en');
    for (const guide of BUYING_GUIDE_DATA) {
      const model = models.find(model => model.slug === guide.slug)!;
      model.bands.forEach((band, i) => {
        expect(band.cap).toBe(guide.bands[i]!.cap);
        expect(band.examples).toHaveLength(3);
        band.examples.forEach((example, j) => {
          const original = guide.bands[i]!.examples[j]!;
          expect(example.price).toEqual(original.price);
          expect(example.area).toEqual(original.area);
          expect(example.count).toBe(original.n);
          expect(example).not.toHaveProperty('records');
        });
      });
    }
  });
  it('retains fractional reported prices instead of rounding them to whole currency', () => {
    expect(buyingMoney(816962.35, 'AED', 'en')).toBe('AED 816,962.35');
    expect(buyingMoney(1000000, 'AED', 'en')).toBe('AED 1,000,000');
  });
  it('localizes Chinese property descriptions while retaining source names', () => {
    const descriptions = createBuyingJourney('zh-CN').flatMap(model => model.bands.flatMap(band => band.examples.map(example => example.detail)));
    expect(descriptions.join(' ')).not.toMatch(/Built |yrs lease|B\/R|Studio|Free Hold/);
  });
  it('shows five distinct Tokyo wards per cap with repeated transactions and pinned evidence', () => {
    const tokyo = createBuyingJourney('en')[3]!;
    for (const band of tokyo.bands) {
      expect(band.examples).toHaveLength(5);
      expect(new Set(band.examples.map(e=>e.name)).size).toBe(5);
      for (const e of band.examples) {
        expect(e.count).toBeGreaterThanOrEqual(5);
        expect(e.price[0]).toBeGreaterThanOrEqual(band.cap*.8);
        expect(e.price[1]).toBeLessThanOrEqual(band.cap);
        expect(e.evidenceHref).toContain('release=jp-area-');
        expect(e.evidenceHref).toContain('year=2026&quarter=1');
      }
    }
    expect(tokyo.guideHref).toContain('tokyo-apartment-buying-budget-guide');
  });
  it('accepts only supported budgets and safely defaults on malformed or cross-currency values', () => {
    const bands = [{ cap: 750000 }, { cap: 1000000 }, { cap: 1500000 }];
    expect(budgetBandIndex(bands, '750000')).toBe(0);
    expect(budgetBandIndex(bands, '1500000')).toBe(2);
    for (const value of [undefined, null, '', 'Infinity', 'NaN', '-1', '50000000', '750000x']) expect(budgetBandIndex(bands, value)).toBe(1);
  });
});
