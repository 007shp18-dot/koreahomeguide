import Link from 'next/link';
import styles from './newsroom.module.css';

const reports = [
  { city: 'seoul', label: 'Seoul', slug: 'seoul-monthly-2026-09', period: 'July vs June 2026', months: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], series: [{ label: 'Brokered apartment sales', values: [5626, 5301, 8339, 8293, 5096, 5321] }] },
  { city: 'singapore', label: 'Singapore', slug: 'singapore-monthly-2026-09', period: 'July vs June 2026', months: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], series: [{ label: 'Selected condominium resales', values: [594, 605, 665, 627, 639, 630] }] },
  { city: 'dubai', label: 'Dubai', slug: 'dubai-monthly-2026-09', period: 'August vs July 2026', months: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], series: [{ label: 'Off-plan apartment entries', values: [8100, 8708, 6302, 8655, 8629, 7142] }, { label: 'Ready apartment entries', values: [2043, 1877, 1531, 1980, 2417, 2079] }] },
] as const;

export function isMonthlyReport(slug: string): boolean {
  return reports.some((report) => report.slug === slug);
}

export function monthlyReportHref(city: string): string {
  return `/news/${(reports.find((report) => report.city === city) ?? reports[0]).slug}/`;
}

export function MonthlyReportNavigation({ slug }: Readonly<{ slug: string }>) {
  const current = reports.find((report) => report.slug === slug);
  if (!current) return null;
  return <div className={styles.monthlyNavigation}>
    <nav className={styles.typeTabs} aria-label="Monthly report cities">
      {reports.map((report) => <Link key={report.city} href={monthlyReportHref(report.city)} aria-current={report.slug === slug ? 'page' : undefined}>{report.label}</Link>)}
    </nav>
    <p>Monthly report · September 2026 <span>{current.period}</span></p>
  </div>;
}

export function MonthlyReportTrend({ slug }: Readonly<{ slug: string }>) {
  const report = reports.find((item) => item.slug === slug);
  if (!report) return null;
  const maximum = Math.ceil(Math.max(...report.series.flatMap((series) => [...series.values])) / 200) * 200;
  const x = (index: number) => 66 + index * 116;
  const y = (value: number) => 184 - value / maximum * 144;
  const summary = report.series.map((series) => `${series.label}: ${series.values.map((value, index) => `${report.months[index]} ${value.toLocaleString('en-US')}`).join(', ')}.`).join(' ');
  return <figure className={styles.monthlyTrend}>
    <figcaption>Six-month transaction trend</figcaption>
    <svg viewBox="0 0 720 225" role="img" aria-labelledby={`${slug}-trend-title ${slug}-trend-desc`}>
      <title id={`${slug}-trend-title`}>{report.label}: six-month transaction trend</title>
      <desc id={`${slug}-trend-desc`}>{summary} Scope and reporting limitations appear in the article.</desc>
      {[0, maximum / 2, maximum].map((value) => <g key={value}>
        <line x1="66" x2="646" y1={y(value)} y2={y(value)} className={styles.monthlyGrid} />
        <text x="55" y={y(value) + 4} textAnchor="end">{value.toLocaleString('en-US')}</text>
      </g>)}
      {report.months.map((month, index) => <text key={month} x={x(index)} y="211" textAnchor="middle">{month}</text>)}
      {report.series.map((series, seriesIndex) => <g key={series.label} className={seriesIndex === 0 ? styles.monthlyPrimary : styles.monthlySecondary}>
        <polyline fill="none" strokeWidth="2.5" strokeDasharray={seriesIndex ? '6 4' : undefined} points={series.values.map((value, index) => `${x(index)},${y(value)}`).join(' ')} />
        {series.values.map((value, index) => <circle key={index} cx={x(index)} cy={y(value)} r="3.5" />)}
      </g>)}
    </svg>
    <div className={styles.monthlyLegend}>{report.series.map((series, index) => <span key={series.label}><i className={index === 0 ? styles.monthlyPrimaryKey : styles.monthlySecondaryKey} />{series.label}</span>)}</div>
  </figure>;
}
