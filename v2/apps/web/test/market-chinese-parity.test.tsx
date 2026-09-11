import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('server-only', () => ({}));
import { DubaiOverview } from '../components/dubai/dubai-overview';
import { SingaporeCheckWorkspace } from '../components/singapore/singapore-check-workspace';
import { marketHref, marketText } from '../lib/locale/market-localization';
import { sgText } from '../lib/locale/singapore-copy';
import type { SingaporeCheckRouteModel } from '../lib/singapore/check-route-model.server';

const empty = { available: false, months: [], segments: [], projects: [], districts: [], propertyTypes: [], floorRanges: [], saleTypes: [], towns: [], blocks: [], flatTypes: [], storeyRanges: [] } as const;
const model: SingaporeCheckRouteModel = {
  mode: 'single', catalogs: { 'ura-private-sale': { ...empty, available: true, months: ['2026-08'], projects: [{ id: 'p1', label: 'Project One' }] }, 'hdb-resale': empty, 'hdb-rent': empty },
  drafts: { a: { market: 'ura-private-sale' }, b: { market: 'hdb-rent' } }, result: { kind: 'empty' },
};

describe('Shared English-baseline Chinese market pages', () => {
  it('preserves native form fields while translating the Chinese calculator', () => {
    const english = renderToStaticMarkup(<SingaporeCheckWorkspace model={model} />);
    const chinese = renderToStaticMarkup(<SingaporeCheckWorkspace locale="zh-CN" model={model} />);
    const fields = (html: string) => [...html.matchAll(/name="([^"]+)"/g)].map(match => match[1]);
    expect(fields(chinese)).toEqual(fields(english));
    expect(chinese).toContain(sgText('zh-CN', 'Compare an asking price'));
    expect(chinese).not.toContain('>Compare an asking price<');
    expect(chinese).toContain('/zh-cn/sg/singapore/check');
  });
  it('retains the full overview and numerical facts in all three languages', () => {
    const rendered = (['en', 'ko', 'zh-CN'] as const).map(locale => renderToStaticMarkup(<DubaiOverview locale={locale} />));
    for (const html of rendered) {
      for (const number of ['761', '917', '252', '60,303', '+31%']) expect(html).toContain(number);
      expect(html).toContain('dubai-quarter-heading');
      expect(html).toContain('dubai-checks-heading');
    }
    expect(rendered[2]).not.toContain('Move from the city to the exact property');
    expect(rendered[1]).toContain('/ko/ae/dubai/explore');
    expect(rendered[2]).toContain('/zh-cn/ae/dubai/explore');
  });
  it('keeps filters and return context when linking within Chinese market pages', () => {
    const href = '/sg/singapore/check/?a-project=p1&a-amount=1200000&returnTo=%2Fsg%2Fsingapore%2Fexplore%2F';
    expect(marketHref('zh-CN', href)).toBe('/zh-cn' + href);
    expect(marketHref('zh-CN', '/zh-cn/ae/dubai/explore/')).toBe('/zh-cn/ae/dubai/explore/');
    expect(marketHref('zh-CN', 'https://www.ura.gov.sg/')).toBe('https://www.ura.gov.sg/');
    expect(marketText('zh-CN', 'Asking price')).not.toBe('Asking price');
    expect(sgText('zh-CN', '120 reported sales')).toBe('120 笔已申报交易');
  });
});
