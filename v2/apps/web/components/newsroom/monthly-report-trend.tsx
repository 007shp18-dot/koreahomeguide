'use client';
import { useChartWidth } from '../market-ui/use-chart-width';
import { reports, chineseCityLabels, chineseSeriesLabels, cityLabels, monthLabels, seriesLabels } from './monthly-report-data';
import styles from './newsroom.module.css';

export function MonthlyReportTrend({ slug, locale = 'en' }: Readonly<{ slug: string; locale?: 'en' | 'ko' | 'zh-CN' }>) {
  const ko = locale === 'ko';
  const zh = locale === 'zh-CN';
  const { ref, width } = useChartWidth();
  const report = reports.find((item) => item.slug === slug);
  if (!report) return null;
  const months = report.months.map(month => ko ? monthLabels[month]! : zh ? monthLabels[month]!.replace('월', '月') : month);
  const seriesLabel = (label: string) => ko ? seriesLabels[label]! : zh ? chineseSeriesLabels[label]! : label;
  const maximum = Math.ceil(Math.max(...report.series.flatMap((series) => [...series.values])) / 200) * 200;
  const x = (index: number) => 52 + index * (width - 76) / 5;
  const y = (value: number) => 184 - value / maximum * 144;
  const summary = report.series.map((series) => `${seriesLabel(series.label)}: ${series.values.map((value, index) => `${months[index]} ${value.toLocaleString('en-US')}`).join(', ')}.`).join(' ');
  return <figure className={styles.monthlyTrend}>
    <figcaption>{ko ? '최근 6개월 거래 추이' : zh ? '近六个月成交趋势' : 'Six-month transaction trend'}</figcaption>
    <div ref={ref}><svg viewBox={`0 0 ${width} 225`} role="img" aria-labelledby={`${slug}-trend-title ${slug}-trend-desc`}>
      <title id={`${slug}-trend-title`}>{ko ? `${cityLabels[report.city]}: 최근 6개월 거래 추이` : zh ? `${chineseCityLabels[report.city]}：近六个月成交趋势` : `${report.label}: six-month transaction trend`}</title>
      <desc id={`${slug}-trend-desc`}>{summary} {ko ? '자료 범위와 신고의 한계는 본문에 설명합니다.' : zh ? '数据范围与申报局限见正文。' : 'Scope and reporting limitations appear in the article.'}</desc>
      {[0, maximum / 2, maximum].map((value) => <g key={value}>
        <line x1="52" x2={width - 24} y1={y(value)} y2={y(value)} className={styles.monthlyGrid} />
        <text x="44" y={y(value) + 4} textAnchor="end">{value.toLocaleString('en-US')}</text>
      </g>)}
      {months.filter((_, index) => width >= 430 || index % 2 === 0 || index === months.length - 1).map((month) => <text key={month} x={x(months.indexOf(month))} y="211" textAnchor="middle">{month}</text>)}
      {report.series.map((series, seriesIndex) => <g key={series.label} className={seriesIndex === 0 ? styles.monthlyPrimary : styles.monthlySecondary}>
        <polyline fill="none" strokeWidth="2.5" strokeDasharray={seriesIndex ? '6 4' : undefined} points={series.values.map((value, index) => `${x(index)},${y(value)}`).join(' ')} />
        {series.values.map((value, index) => <circle key={index} cx={x(index)} cy={y(value)} r="3.5" />)}
      </g>)}
    </svg></div>
    <div className={styles.monthlyLegend}>{report.series.map((series, index) => <span key={series.label}><i className={index === 0 ? styles.monthlyPrimaryKey : styles.monthlySecondaryKey} />{seriesLabel(series.label)}</span>)}</div>
  </figure>;
}
