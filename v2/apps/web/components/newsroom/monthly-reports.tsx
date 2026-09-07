import Link from 'next/link';
import styles from './newsroom.module.css';

const reports = [
  { city: 'seoul', label: 'Seoul', slug: 'seoul-monthly-2026-09', period: 'July vs June 2026', months: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], series: [{ label: 'Brokered apartment sales', values: [5626, 5301, 8339, 8293, 5096, 5321] }] },
  { city: 'singapore', label: 'Singapore', slug: 'singapore-monthly-2026-09', period: 'July vs June 2026', months: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], series: [{ label: 'Selected condominium resales', values: [594, 605, 665, 627, 639, 630] }] },
  { city: 'dubai', label: 'Dubai', slug: 'dubai-monthly-2026-09', period: 'August vs July 2026', months: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], series: [{ label: 'Off-plan apartment entries', values: [8100, 8708, 6302, 8655, 8629, 7142] }, { label: 'Ready apartment entries', values: [2043, 1877, 1531, 1980, 2417, 2079] }] },
] as const;

const cityLabels = { seoul: '서울', singapore: '싱가포르', dubai: '두바이' } as const;
const monthLabels: Readonly<Record<string, string>> = { Feb: '2월', Mar: '3월', Apr: '4월', May: '5월', Jun: '6월', Jul: '7월', Aug: '8월' };
const seriesLabels: Readonly<Record<string, string>> = { 'Brokered apartment sales': '아파트 중개 매매', 'Selected condominium resales': '선정 콘도 재판매', 'Off-plan apartment entries': '미준공(Off-Plan) 아파트 기록', 'Ready apartment entries': '준공(Ready) 아파트 기록' };

export function isMonthlyReport(slug: string): boolean {
  return reports.some((report) => report.slug === slug);
}

export function monthlyReportHref(city: string, locale: 'en' | 'ko' = 'en'): string {
  return `${locale === 'ko' ? '/ko' : ''}/news/${(reports.find((report) => report.city === city) ?? reports[0]).slug}/`;
}

export function MonthlyReportNavigation({ slug, locale = 'en' }: Readonly<{ slug: string; locale?: 'en' | 'ko' }>) {
  const ko = locale === 'ko';
  const current = reports.find((report) => report.slug === slug);
  if (!current) return null;
  return <div className={styles.monthlyNavigation}>
    <nav className={styles.typeTabs} aria-label={ko ? '월간 보고서 도시' : 'Monthly report cities'}>
      {reports.map((report) => <Link key={report.city} href={monthlyReportHref(report.city, locale)} aria-current={report.slug === slug ? 'page' : undefined}>{ko ? cityLabels[report.city] : report.label}</Link>)}
    </nav>
    <p>{ko ? '월간 보고서 · 2026년 9월' : 'Monthly report · September 2026'} <span>{ko ? current.city === 'dubai' ? '2026년 7월 대비 8월' : '2026년 6월 대비 7월' : current.period}</span></p>
  </div>;
}

export function MonthlyReportTrend({ slug, locale = 'en' }: Readonly<{ slug: string; locale?: 'en' | 'ko' }>) {
  const ko = locale === 'ko';
  const report = reports.find((item) => item.slug === slug);
  if (!report) return null;
  const months = report.months.map(month => ko ? monthLabels[month]! : month);
  const seriesLabel = (label: string) => ko ? seriesLabels[label]! : label;
  const maximum = Math.ceil(Math.max(...report.series.flatMap((series) => [...series.values])) / 200) * 200;
  const x = (index: number) => 66 + index * 116;
  const y = (value: number) => 184 - value / maximum * 144;
  const summary = report.series.map((series) => `${seriesLabel(series.label)}: ${series.values.map((value, index) => `${months[index]} ${value.toLocaleString('en-US')}`).join(', ')}.`).join(' ');
  return <figure className={styles.monthlyTrend}>
    <figcaption>{ko ? '최근 6개월 거래 추이' : 'Six-month transaction trend'}</figcaption>
    <svg viewBox="0 0 720 225" role="img" aria-labelledby={`${slug}-trend-title ${slug}-trend-desc`}>
      <title id={`${slug}-trend-title`}>{ko ? `${cityLabels[report.city]}: 최근 6개월 거래 추이` : `${report.label}: six-month transaction trend`}</title>
      <desc id={`${slug}-trend-desc`}>{summary} {ko ? '자료 범위와 신고의 한계는 본문에 설명합니다.' : 'Scope and reporting limitations appear in the article.'}</desc>
      {[0, maximum / 2, maximum].map((value) => <g key={value}>
        <line x1="66" x2="646" y1={y(value)} y2={y(value)} className={styles.monthlyGrid} />
        <text x="55" y={y(value) + 4} textAnchor="end">{value.toLocaleString('en-US')}</text>
      </g>)}
      {months.map((month, index) => <text key={month} x={x(index)} y="211" textAnchor="middle">{month}</text>)}
      {report.series.map((series, seriesIndex) => <g key={series.label} className={seriesIndex === 0 ? styles.monthlyPrimary : styles.monthlySecondary}>
        <polyline fill="none" strokeWidth="2.5" strokeDasharray={seriesIndex ? '6 4' : undefined} points={series.values.map((value, index) => `${x(index)},${y(value)}`).join(' ')} />
        {series.values.map((value, index) => <circle key={index} cx={x(index)} cy={y(value)} r="3.5" />)}
      </g>)}
    </svg>
    <div className={styles.monthlyLegend}>{report.series.map((series, index) => <span key={series.label}><i className={index === 0 ? styles.monthlyPrimaryKey : styles.monthlySecondaryKey} />{seriesLabel(series.label)}</span>)}</div>
  </figure>;
}
