'use client';
import { useId, useState } from 'react';
import Link from 'next/link';
import type { SiteLocale } from '../../lib/navigation/site-navigation';
import { reports, cityLabels, chineseCityLabels, seriesLabels, chineseSeriesLabels, monthLabels } from '../newsroom/monthly-report-data';
import styles from '../design-review/editorial-growth-home.module.css';

/** Dated, published report data. Never imply this historical cohort is a live price index. */
export function HomeReportPulse({ locale }: { locale: SiteLocale }) {
  const [city, setCity] = useState<string>('seoul');
  const report = reports.find(value => value.city === city) ?? reports[0];
  const ko = locale === 'ko', zh = locale === 'zh-CN';
  const prefix = ko ? '/ko' : zh ? '/zh-cn' : '';
  const id = useId();
  const name = (value: typeof report.city) => ko ? cityLabels[value] : zh ? chineseCityLabels[value] : reports.find(r => r.city === value)!.label;
  const series = report.series[0];
  const label = ko ? seriesLabels[series.label] : zh ? chineseSeriesLabels[series.label] : series.label;
  const month = (value: string) => ko ? monthLabels[value] : zh ? monthLabels[value]?.replace('월', '月') : value;
  const period = `2026 · ${month(report.months[0])}–${month(report.months[5])}`;
  const max = Math.ceil(Math.max(...series.values) / 2000) * 2000;
  const n = (value: number) => new Intl.NumberFormat(locale).format(value);
  const title = `${name(report.city)} · ${label} · ${period}`;
  const points = series.values.map((value, index) => `${48 + index * 83},${190 - value / max * 160}`).join(' ');
  const scope = ko ? '보고서의 선정 거래군 · 거래 건수이며 가격지수가 아닙니다.' : zh ? '报告中的选定成交组 · 成交笔数，并非价格指数。' : 'Selected report cohort · transaction counts, not a price index.';
  return <section className={styles.pulse} aria-labelledby={`${id}-heading`}>
    <p className={styles.kicker}>{ko ? '발행 보고서의 거래 추이' : zh ? '已发布报告的成交趋势' : 'FROM THE PUBLISHED REPORT'}</p>
    <h2 id={`${id}-heading`}>{ko ? '거래의 흐름을 읽어보세요' : zh ? '读懂成交变化' : 'Read the movement.'}</h2>
    <div className={styles.pulseTabs} role="group" aria-label={ko ? '시장 선택' : zh ? '选择市场' : 'Choose market'}>{reports.map(r => <button key={r.city} aria-pressed={r.city === city} onClick={() => setCity(r.city)}>{name(r.city)}</button>)}</div>
    <p className={styles.pulsePeriod}>{label} <strong>{period}</strong></p>
    <svg className={styles.pulseChart} role="img" aria-labelledby={`${id}-title`} aria-describedby={`${id}-desc`} viewBox="0 0 500 226">
      <title id={`${id}-title`}>{title}</title>
      <desc id={`${id}-desc`}>{`${scope} ${report.months.map((m, i) => `${month(m)}: ${n(series.values[i]!)}`).join('; ')}`}</desc>
      {[0, .5, 1].map(f => <g key={f}><line x1="48" x2="480" y1={190 - f * 160} y2={190 - f * 160} stroke="#dce5f0"/><text x="39" y={194 - f * 160} textAnchor="end" fill="#52647d" fontSize="12">{n(max * f)}</text></g>)}
      <polygon points={`48,190 ${points} 463,190`} fill="#eaf2ff"/>
      <polyline points={points} fill="none" stroke="#2563d8" strokeWidth="3" strokeLinejoin="round"/>
      {series.values.map((value, index) => <g key={index}><circle cx={48 + index * 83} cy={190 - value / max * 160} r="4" fill="#2563d8"/><text x={48 + index * 83} y="216" textAnchor="middle" fill="#52647d" fontSize="12">{month(report.months[index]!)}</text></g>)}
    </svg>
    <p className={styles.scope}>{scope}</p>
    <div className={styles.pulseFooter}><Link href={`${prefix}/news/${report.slug}/`}>{ko ? '근거와 분석 읽기' : zh ? '阅读依据与分析' : 'Read the source analysis'} →</Link><details><summary>{ko ? '수치 보기' : zh ? '查看数值' : 'View values'}</summary><table><caption>{title}</caption><thead><tr><th>{ko ? '월' : zh ? '月份' : 'Month'}</th><th>{label}</th></tr></thead><tbody>{report.months.map((m, i) => <tr key={m}><th scope="row">{month(m)}</th><td>{n(series.values[i]!)}</td></tr>)}</tbody></table></details></div>
    <p className={styles.tokyoNote}>{ko ? '도쿄는 별도의 분기별 익명 거래 자료를 제공합니다.' : zh ? '东京提供独立的季度匿名成交资料。' : 'Tokyo provides a separate quarterly anonymous transaction dataset.'} <Link href={`${prefix}/jp/tokyo/explore/`}>{nameForTokyo(locale)} →</Link></p>
  </section>;
}
function nameForTokyo(locale: SiteLocale) { return locale === 'ko' ? '도쿄 탐색' : locale === 'zh-CN' ? '探索东京' : 'Explore Tokyo'; }
