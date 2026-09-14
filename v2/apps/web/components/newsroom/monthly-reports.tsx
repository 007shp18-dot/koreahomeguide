import Link from 'next/link';
import styles from './newsroom.module.css';
import { reports, cityLabels, chineseCityLabels } from './monthly-report-data';
export { MonthlyReportTrend } from './monthly-report-trend';

export function isMonthlyReport(slug: string): boolean {
  return reports.some((report) => report.slug === slug);
}

export function monthlyReportHref(city: string, locale: 'en' | 'ko' | 'zh-CN' = 'en'): string {
  return `${locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : ''}/news/${(reports.find((report) => report.city === city) ?? reports[0]).slug}/`;
}

export function MonthlyReportNavigation({ slug, locale = 'en' }: Readonly<{ slug: string; locale?: 'en' | 'ko' | 'zh-CN' }>) {
  const ko = locale === 'ko';
  const zh = locale === 'zh-CN';
  const current = reports.find((report) => report.slug === slug);
  if (!current) return null;
  return <div className={styles.monthlyNavigation}>
    <nav className={styles.typeTabs} aria-label={ko ? '월간 보고서 도시' : zh ? '月报城市' : 'Monthly report cities'}>
      {reports.map((report) => <Link key={report.city} href={monthlyReportHref(report.city, locale)} aria-current={report.slug === slug ? 'page' : undefined}>{ko ? cityLabels[report.city] : zh ? chineseCityLabels[report.city] : report.label}</Link>)}
    </nav>
    <p>{ko ? '월간 보고서 · 2026년 9월' : zh ? '月报 · 2026年9月' : 'Monthly report · September 2026'} <span>{ko ? current.city === 'dubai' ? '2026년 7월 대비 8월' : '2026년 6월 대비 7월' : zh ? current.city === 'dubai' ? '2026年8月与7月比较' : '2026年7月与6月比较' : current.period}</span></p>
  </div>;
}
