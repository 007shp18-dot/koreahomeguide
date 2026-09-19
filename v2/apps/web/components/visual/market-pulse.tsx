'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import type { SiteLocale } from '../../lib/navigation/site-navigation';
import { reports, cityLabels, chineseCityLabels, seriesLabels, chineseSeriesLabels, monthLabels } from '../newsroom/monthly-report-data';
import { useChartWidth } from '../market-ui/use-chart-width';
import styles from './visual-panels.module.css';

type ReportCity = typeof reports[number]['city'];
const TEXT = {
  en: { title: 'A clearer view of the market', trend: 'Six-month transaction trend', lead: 'Follow recorded activity, then read the story behind it.', latest: 'Latest month', change: 'From previous month', history: 'Six-month total', count: 'records', scope: 'Selected report series · transaction counts, not a price index', publication: 'September 2026 report', read: 'Read the source report', table: 'View the exact chart values', month: 'Month', year: '2026', selected: 'Selected month' },
  ko: { title: '숫자로 보는 시장의 흐름', trend: '최근 6개월 거래 추이', lead: '실제 거래가 어떻게 움직였는지, 그래프와 분석을 함께 살펴보세요.', latest: '최근 집계 월', change: '직전 월 대비', history: '6개월 합계', count: '건', scope: '보고서의 선정 거래군 · 거래 건수이며 가격지수가 아닙니다', publication: '2026년 9월 발행 보고서', read: '근거 보고서 읽기', table: '그래프의 원래 수치 보기', month: '월', year: '2026년', selected: '선택한 월' },
  'zh-CN': { title: '从数据看市场走势', trend: '近六个月成交趋势', lead: '查看真实成交的变化，继续阅读数字背后的分析。', latest: '最新统计月', change: '较前月', history: '六个月合计', count: '笔', scope: '报告中的选定成交组 · 成交笔数，并非价格指数', publication: '2026年9月发布的报告', read: '阅读来源报告', table: '查看图表原始数值', month: '月份', year: '2026年', selected: '所选月份' },
} as const;

/** All values come from the already-published monthly report, never a generated trend. */
export function MarketPulse({ locale, city }: { locale: SiteLocale; city?: ReportCity }) {
  const [selectedCity, setCity] = useState<ReportCity>(city ?? 'seoul');
  const [active, setActive] = useState<number | null>(null);
  const report = reports.find(item => item.city === (city ?? selectedCity)) ?? reports[0];
  const { ref, width } = useChartWidth();
  const uid = useId().replace(/:/g, '');
  const copy = TEXT[locale];
  const prefix = locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn';
  const cityName = (id: ReportCity) => locale === 'ko' ? cityLabels[id] : locale === 'zh-CN' ? chineseCityLabels[id] : reports.find(item => item.city === id)!.label;
  const label = (value: string) => locale === 'ko' ? seriesLabels[value] : locale === 'zh-CN' ? chineseSeriesLabels[value] : value;
  const month = (value: string) => locale === 'en' ? value : locale === 'ko' ? monthLabels[value] : monthLabels[value]?.replace('월', '月');
  const number = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
  const primary = report.series[0];
  const last = primary.values[5], previous = primary.values[4];
  const change = ((last - previous) / previous) * 100;
  const max = Math.ceil(Math.max(...report.series.flatMap(series => [...series.values])) / 4 / 100) * 400;
  const left = 48, right = width - 18, top = 26, bottom = 222;
  const x = (index: number) => left + index * (right - left) / 5;
  const y = (value: number) => bottom - value / max * (bottom - top);
  const period = `${copy.year} · ${month(report.months[0])}–${month(report.months[5])}`;
  // A title must be one string; multiple JSX children produce an empty SSR title.
  const chartTitle = `${cityName(report.city)} · ${copy.trend} · ${period}`;
  const chartDescription = `${copy.scope}. ${report.series.map(series => `${label(series.label)}: ${report.months.map((value, i) => `${month(value)} ${number(series.values[i]!)}`).join('; ')}`).join('. ')}. ${copy.table}.`;
  return <section className={styles.pulse} data-market-pulse={report.city} aria-labelledby={`${uid}-heading`}>
    <header className={styles.heading}>
      <div><p className={styles.eyebrow}>MARKET PULSE</p><h2 id={`${uid}-heading`}>{city ? `${cityName(city)} · ${copy.title}` : copy.title}</h2><p>{copy.lead}</p></div>
      {!city && <div className={styles.tabs} role="group" aria-label={locale === 'ko' ? '시장 선택' : locale === 'zh-CN' ? '选择市场' : 'Choose market'}>{reports.map(item => <button key={item.city} type="button" aria-pressed={selectedCity === item.city} onClick={() => { setCity(item.city); setActive(null); }}>{cityName(item.city)}</button>)}</div>}
    </header>
    <div className={styles.stats} aria-label={label(primary.label)}>
      <div><span>{copy.latest} · {month(report.months[5])}</span><strong>{number(last)}<small>{copy.count}</small></strong><p>{label(primary.label)}</p></div>
      <div><span>{copy.change}</span><strong>{change > 0 ? '+' : ''}{number(change)}<small>%</small></strong><p>{month(report.months[4])} → {month(report.months[5])}</p></div>
      <div><span>{copy.history}</span><strong>{number(primary.values.reduce((a, b) => a + b, 0))}<small>{copy.count}</small></strong><p>{period}</p></div>
    </div>
    <div className={styles.chartPanel}>
      <div className={styles.chartMain}>
        <div className={styles.chartTop}><h3>{cityName(report.city)} · {label(primary.label)}</h3><span>{period}</span></div>
        <div ref={ref} className={styles.chart}>
          <svg role="img" aria-labelledby={`${uid}-chart-title`} aria-describedby={`${uid}-chart-description`} viewBox={`0 0 ${width} 264`} width="100%" height="264">
            <title id={`${uid}-chart-title`}>{chartTitle}</title>
            <desc id={`${uid}-chart-description`}>{chartDescription}</desc>
            <defs><linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563d8" stopOpacity=".24"/><stop offset="100%" stopColor="#2563d8" stopOpacity=".015"/></linearGradient></defs>
            {[0, 1, 2, 3, 4].map(i => <g key={i}><line x1={left} x2={right} y1={y(max * i / 4)} y2={y(max * i / 4)} stroke="#e1e9f5"/><text x={left - 10} y={y(max * i / 4) + 4} textAnchor="end" fill="#637590" fontSize="12">{number(max * i / 4)}</text></g>)}
            <path d={`M ${left} ${bottom} ${primary.values.map((value, i) => `L ${x(i)} ${y(value)}`).join(' ')} L ${right} ${bottom} Z`} fill={`url(#${uid}-fill)`}/>
            {report.series.map((series, si) => <g key={series.label}><polyline points={series.values.map((value, i) => `${x(i)},${y(value)}`).join(' ')} fill="none" stroke={si === 0 ? '#2563d8' : '#667c9b'} strokeWidth="3" strokeDasharray={si === 0 ? undefined : '6 5'} strokeLinejoin="round"/>{series.values.map((value, i) => <circle key={i} cx={x(i)} cy={y(value)} r={active === i ? 5 : 3.5} fill={si === 0 ? '#2563d8' : '#667c9b'} stroke="white" strokeWidth="2"/>)}</g>)}
            {active !== null && <line x1={x(active)} x2={x(active)} y1={top} y2={bottom} stroke="#7b9cd8" strokeDasharray="3 3"/>}
            {report.months.map((value, i) => <text key={value} x={x(i)} y="251" textAnchor="middle" fill="#637590" fontSize="12">{month(value)}</text>)}
          </svg>
          <div className={styles.chartTargets} style={{ left: left - 22, right: width - right - 22 }} role="group" aria-label={copy.selected}>
            {report.months.map((value, i) => <button key={value} type="button" aria-pressed={active === i} aria-label={`${month(value)}: ${report.series.map(series => `${label(series.label)} ${number(series.values[i]!)}`).join(', ')}`} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)}><span>{month(value)}</span></button>)}
          </div>
        </div>
        <p className={styles.legend}>{report.series.map((series, i) => <span key={series.label}><i className={i ? styles.secondaryDot : styles.primaryDot}/>{label(series.label)}</span>)}</p>
      </div>
      <aside className={styles.chartAside} aria-live="polite" aria-atomic="true"><span>{copy.selected} · {month(report.months[active ?? 5]!)}</span><strong>{number(primary.values[active ?? 5]!)}<small>{copy.count}</small></strong><p>{copy.scope}</p><Link href={`${prefix}/news/${report.slug}/`}>{copy.read} <span aria-hidden="true">→</span></Link></aside>
    </div>
    <footer className={styles.chartFooter}><span>{copy.publication} · {period}</span><details><summary>{copy.table}</summary><div className={styles.tableWrap}><table><caption>{copy.scope}</caption><thead><tr><th scope="col">{copy.month}</th>{report.series.map(series => <th key={series.label} scope="col">{label(series.label)}</th>)}</tr></thead><tbody>{report.months.map((value, i) => <tr key={value}><th scope="row">{month(value)}</th>{report.series.map(series => <td key={series.label}>{number(series.values[i]!)}</td>)}</tr>)}</tbody></table></div></details></footer>
  </section>;
}
