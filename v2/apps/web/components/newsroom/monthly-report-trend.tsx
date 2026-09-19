'use client';
import { ChartInsight, chartCopy } from '../market-ui/chart-insight';
import { useChartWidth } from '../market-ui/use-chart-width';
import { reports, chineseCityLabels, chineseSeriesLabels, cityLabels, monthLabels, seriesLabels } from './monthly-report-data';
import styles from './newsroom.module.css';
import chartStyles from './monthly-report-trend.module.css';

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
  const number = (value: number) => value.toLocaleString(locale);
  const period = `2026 · ${months[0]}–${months.at(-1)}`;
  const summary = report.series.map((series) => `${seriesLabel(series.label)}: ${series.values.map((value, index) => `${months[index]} ${value.toLocaleString('en-US')}`).join(', ')}.`).join(' ');
  return <figure className={styles.monthlyTrend}>
    <figcaption>{chartCopy(locale, 'Did reported transactions rise or fall?', '신고 거래는 늘었을까요, 줄었을까요?', '申报成交量是上升还是下降？')}</figcaption>
    <p>{period} · {chartCopy(locale, 'Historical selected cohorts · transaction counts, not a price index.', '과거 선정 거래군 · 가격지수가 아닌 거래 건수입니다.', '历史选定成交组 · 成交笔数，并非价格指数。')}</p>
    {report.series.map(series => <div key={series.label}><p><strong>{seriesLabel(series.label)}</strong></p><ChartInsight locale={locale} latest={series.values.at(-1)} previous={series.values.at(-2)} latestLabel={`${months.at(-1)} 2026`} previousLabel={`${months.at(-2)} 2026`} format={number} /></div>)}
    <div ref={ref}><svg viewBox={`0 0 ${width} 225`} role="img" aria-labelledby={`${slug}-trend-title ${slug}-trend-desc`}>
      <title id={`${slug}-trend-title`}>{ko ? `${cityLabels[report.city]}: 과거 6개월 거래 추이 · ${period}` : zh ? `${chineseCityLabels[report.city]}：近六个月成交趋势 · ${period} · 历史报告` : `${report.label}: historical six-month transaction trend · ${period}`}</title>
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
    <details className={chartStyles.figures}><summary>{chartCopy(locale, 'Compare monthly figures', '월별 수치 비교', '比较每月数值')}</summary><table><caption>{period} · {chartCopy(locale, 'Reported transactions', '신고 거래 건수', '申报成交笔数')}</caption><thead><tr><th scope="col">{chartCopy(locale, 'Month', '월', '月份')}</th>{report.series.map(series => <th scope="col" key={series.label}>{seriesLabel(series.label)}</th>)}</tr></thead><tbody>{months.map((month, i) => <tr key={month}><th scope="row">{month}</th>{report.series.map(series => <td key={series.label}>{number(series.values[i]!)}</td>)}</tr>)}</tbody></table></details>
  </figure>;
}
