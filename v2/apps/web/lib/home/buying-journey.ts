import type { SiteLocale } from '../navigation/site-navigation';
export type BuyingCity = 'seoul' | 'singapore' | 'dubai' | 'tokyo';
export type BuyingExample = Readonly<{
  evidenceHref?: string; name: string; region: string; detail: string; price: readonly number[];
  area: readonly number[]; count: number; latest: string;
}>;
export type BuyingCityModel = Readonly<{
  city: BuyingCity; market: string; name: string; currency: string; slug: string;
  scope: 'project' | 'neighbourhood'; period: string; guideHref: string; guideLocale: SiteLocale;
  exploreHref: string; checkHref: string; costsHref: string;
  bands: readonly Readonly<{ cap: number; examples: readonly BuyingExample[] }>[];
}>;

/** Unknown budgets never silently select an unrelated market's cap. */
export function budgetBandIndex(bands: readonly { cap: number }[], value?: string | number | null): number {
  const amount = value === null || value === undefined || value === '' ? NaN : Number(value);
  const match = Number.isFinite(amount) ? bands.findIndex(band => band.cap === amount) : -1;
  return match >= 0 ? match : Math.min(1, Math.max(0, bands.length - 1));
}

export function buyingGuideHref(model: BuyingCityModel, cap: number, section: 'examples' | 'costs' = 'examples'): string {
  // EN/KO project guides are interactive. Static translations and Tokyo present
  // the complete comparison together, so link to their actual content section.
  const interactive = model.scope === 'project' && model.guideLocale !== 'zh-CN';
  return interactive ? `${model.guideHref}?budget=${cap}#buying-${section}`
    : `${model.guideHref}#section-${section === 'examples' ? 2 : model.city === 'tokyo' ? 4 : 3}`;
}

export function buyingMoney(value: number, currency: string, locale: SiteLocale): string {
  if (locale === 'ko' && currency === 'KRW') {
    return value >= 100000000 && value % 100000000 === 0 ? `${value / 100000000}억 원` : `${(value / 10000).toLocaleString('ko-KR')}만 원`;
  }
  return `${currency === 'SGD' ? 'S$' : `${currency} `}${value.toLocaleString(locale === 'ko' ? 'ko-KR' : locale === 'zh-CN' ? 'zh-CN' : 'en-US', { maximumFractionDigits: 2 })}`;
}
