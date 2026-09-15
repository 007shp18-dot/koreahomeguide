import type { ContentLocale } from '../lib/content/content-types';

// Edition date describes editorial selection, not the transaction period.
export const BUDGET_GUIDE_EDITION = '2026-09';
export const BUDGET_GUIDE_SERIES = [
  { city: 'seoul', slug: 'seoul-apartment-buying-budget-guide', budgets: { en: 'KRW 600M · 1B · 1.5B', ko: '6억 · 10억 · 15억 원', 'zh-CN': '6亿 · 10亿 · 15亿韩元' }, period: { en: 'May–Jul 2026 sales', ko: '2026년 5–7월 거래', 'zh-CN': '2026年5–7月成交' } },
  { city: 'singapore', slug: 'singapore-condo-buying-budget-guide', budgets: { en: 'S$1M · 1.5M · 2M', ko: 'S$100만 · 150만 · 200만', 'zh-CN': '100万 · 150万 · 200万新元' }, period: { en: 'May–Jul 2026 resales', ko: '2026년 5–7월 재판매', 'zh-CN': '2026年5–7月转售' } },
  { city: 'dubai', slug: 'dubai-ready-apartment-buying-budget-guide', budgets: { en: 'AED 750K · 1M · 1.5M', ko: 'AED 75만 · 100만 · 150만', 'zh-CN': '75万 · 100万 · 150万迪拉姆' }, period: { en: 'Jun–Aug 2026 ready sales', ko: '2026년 6–8월 준공 주택 거래', 'zh-CN': '2026年6–8月现房成交' } },
  { city: 'tokyo', slug: 'tokyo-apartment-buying-budget-guide', budgets: { en: 'JPY 30M · 50M · 100M', ko: '3천만 · 5천만 · 1억 엔', 'zh-CN': '3,000万 · 5,000万 · 1亿日元' }, period: { en: '2026 Q1 · Chiyoda examples', ko: '2026년 1분기 · 지요다 사례', 'zh-CN': '2026年第1季度 · 千代田案例' } },
] as const;

export function budgetGuidePeriod(slug: string, locale: ContentLocale): string | undefined {
  if (slug.endsWith('-same-budget-property-comparison')) {
    const city = slug.split('-')[0];
    if (city === 'tokyo') return ({en:'2026 Q1 · Tokyo ward groups',ko:'2026년 1분기 · 도쿄 구별 거래','zh-CN':'2026年第1季度 · 东京各区成交'})[locale];
    return BUDGET_GUIDE_SERIES.find(guide => guide.city === city)?.period[locale];
  }
  return BUDGET_GUIDE_SERIES.find(guide => guide.slug === slug)?.period[locale];
}
