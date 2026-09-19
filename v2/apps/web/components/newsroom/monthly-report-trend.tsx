'use client';
import { reports } from './monthly-report-data';
import { MarketPulse } from '../visual/market-pulse';

/** Same published report series; reuse the complete accessible chart on the article. */
export function MonthlyReportTrend({ slug, locale = 'en' }: Readonly<{ slug: string; locale?: 'en' | 'ko' | 'zh-CN' }>) {
  const report = reports.find(item => item.slug === slug);
  return report ? <MarketPulse city={report.city} locale={locale} /> : null;
}
