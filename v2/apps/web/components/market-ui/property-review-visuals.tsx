'use client';
import { useState } from 'react';
import { ChartInsight, chartCopy } from './chart-insight';
import { consecutiveChartPeriods } from '../../lib/research/chart-insights';
import { useChartWidth } from './use-chart-width';
import type { MarketLocale } from '../../lib/locale/market-localization';
import type { ReviewVisualMetric, ReviewVisualSeries, ReviewPhoto } from '../../lib/research/property-review-locations';
import styles from './property-review-visuals.module.css';

export function PropertyReviewVisuals({ metrics = [], series = [], photo, locale }: { metrics?: ReviewVisualMetric[]; series?: ReviewVisualSeries[]; photo?: ReviewPhoto | null; locale: MarketLocale }) {
  const [failed, setFailed] = useState(false);
  const lang = locale === 'ko' ? 'ko' : 'en';
  const values = metrics.filter(m => Number.isFinite(m.value) && m.value >= 0);
  const trends = series.filter(s => s.points.length > 1 && new Set(s.points.map(p => p.period)).size === s.points.length && s.points.every(p => Number.isFinite(p.value) && p.value >= 0));
  const groups = new Map<string, ReviewVisualMetric[]>();
  for (const metric of values) {
    if (!['m', 'min', 'homes', 'units', 'households'].includes(metric.unit)) continue;
    const key = `${metric.unit}:${metric.basis.en}`;
    groups.set(key, [...(groups.get(key) ?? []), metric]);
  }
  const charts = [...groups.values()].filter(group => group.length > 1 && group.some(m => m.value > 0));
  const plotted = new Set(charts.flat());
  const facts = values.filter(m => !plotted.has(m));
  const number = (value: number) => new Intl.NumberFormat(lang === 'ko' ? 'ko-KR' : 'en-GB', { maximumFractionDigits: 2 }).format(value);
  const unit = (value: string) => lang !== 'ko' ? value : ({ transactions: '건', 'million visits': '백만 회', homes: '세대', units: '세대', households: '세대', buildings: '개 동', spaces: '대', min: '분', years: '년' } as Record<string, string>)[value] ?? value;
  if ((!photo || failed) && !values.length && !trends.length) return null;
  return <div className={styles.visuals}>
    {photo && !failed && <figure className={styles.photo}>
      {/* External, licensed originals are retained without changing the pictured property. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={photo.alt[lang]} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      <figcaption><span>{photo.kind === 'render' ? lang === 'ko' ? '예상 이미지' : 'Architectural rendering' : photo.alt[lang]}</span><span>{photo.credit} · {photo.licenseUrl && /^https:\/\/(creativecommons\.org|commons\.wikimedia\.org)\//.test(photo.licenseUrl) ? <a href={photo.licenseUrl} rel="license noopener" target="_blank">{photo.license}</a> : photo.license}</span></figcaption>
    </figure>}
    {charts.map((group, i) => {
      const max = Math.max(...group.map(m => m.value));
      return <figure className={styles.chart} key={i}>
        <h3>{group[0]!.unit === 'm' ? chartCopy(locale, 'Compare distances to nearby places', '주변 접근 거리 비교', '比较周边地点距离') : group[0]!.unit === 'min' ? chartCopy(locale, 'Compare reported travel times', '안내된 이동 시간 비교', '比较所示出行时间') : chartCopy(locale, 'Homes within the development', '단지의 세대 구성', '项目内住宅数量')}</h3>
        <div className={styles.bars}>{group.map(m => <div className={styles.barRow} key={m.label.en}>
          <span>{m.label[lang]}</span><strong>{number(m.value)} {unit(m.unit)}</strong>
          <div className={styles.track} aria-hidden="true"><div style={{ width: `${m.value / max * 100}%` }} /></div>
        </div>)}</div><figcaption>{group[0]!.basis[lang]}</figcaption>
      </figure>;
    })}
    {!!trends.length && <div className={styles.trends}>{trends.map(trend => <ReviewTrend key={trend.label.en} trend={trend} locale={locale} />)}</div>}
    {!!facts.length && <section className={styles.facts} aria-label={lang === 'ko' ? '단지 핵심 수치' : 'Property facts'}>{facts.map(m => <article key={`${m.label.en}:${m.unit}`}><p>{m.label[lang]}</p><strong>{number(m.value)} <span>{unit(m.unit)}</span></strong><p className={styles.basis}>{m.basis[lang]}</p></article>)}</section>}
  </div>;
}

function ReviewTrend({ trend, locale }: { trend: ReviewVisualSeries; locale: MarketLocale }) {
  const { ref, width } = useChartWidth();
  const lang = locale === 'ko' ? 'ko' : 'en';
  const maximum = Math.max(...trend.points.map(point => point.value), 1);
  const number = (value: number) => value.toLocaleString(locale, { maximumFractionDigits: 2 });
  const unit = trend.unit === 'transactions' ? chartCopy(locale, 'transactions', '건', '笔成交') : trend.unit === 'million visits' ? chartCopy(locale, 'million visits', '백만 회', '百万次访问') : trend.unit === 'S$ million' ? chartCopy(locale, 'SGD million', '백만 SGD', '百万新元') : trend.unit;
  const title = locale === 'zh-CN' ? ({ 'PLQ Mall annual visits': 'PLQ Mall 年度访问量', 'PLQ Mall annual tenant sales': 'PLQ Mall 年度租户销售额' }[trend.label.en] ?? trend.label.en) : trend.label[lang];
  const latest = trend.points.at(-1)!;
  const previous = trend.points.at(-2)!;
  const positions = trend.points.map((point, index) => ({ ...point,
    x: 48 + index / (trend.points.length - 1) * (width - 78), y: 162 - point.value / maximum * 118,
  }));
  return <figure className={styles.chart}>
    <h3>{title}</h3><p className={styles.seriesUnit}>{unit} · {trend.points[0]!.period}–{latest.period}</p>
    <ChartInsight locale={locale} latest={latest.value} previous={previous.value} latestLabel={latest.period} previousLabel={previous.period} format={number} comparisonAllowed={consecutiveChartPeriods(previous.period, latest.period)} />
    <div ref={ref}>
      <svg className={styles.trend} viewBox={`0 0 ${width} 206`} role="img" aria-label={`${title} · ${chartCopy(locale, 'Exact values appear in the table below.', '정확한 수치는 아래 표에 표시됩니다.', '具体数值见下表。')}`}>
        {[0, .5, 1].map(fraction => <g key={fraction}><line x1="48" y1={162 - fraction * 118} x2={width - 30} y2={162 - fraction * 118} className={styles.axis} /><text x="40" y={166 - fraction * 118} textAnchor="end">{number(maximum * fraction)}</text></g>)}
        {positions.slice(1).map((point, index) => consecutiveChartPeriods(positions[index]!.period, point.period) ? <line key={point.period} x1={positions[index]!.x} y1={positions[index]!.y} x2={point.x} y2={point.y} className={styles.trendLine} /> : null)}
        {positions.map((point, index) => <g key={point.period}>
          <circle cx={point.x} cy={point.y} r="3"><title>{`${point.period}: ${number(point.value)} ${unit}`}</title></circle>
          {(index === 0 || index === positions.length - 1) && <>
            <text x={point.x} y={point.y - 14} textAnchor={index === 0 ? 'start' : 'end'}>{number(point.value)}</text>
            <text x={point.x} y="192" textAnchor={index === 0 ? 'start' : 'end'}>{point.period}</text>
          </>}
        </g>)}
      </svg>
    </div>
    <details className={styles.figures}><summary>{chartCopy(locale, 'Compare exact figures', '정확한 수치 비교', '比较具体数值')}</summary><table className={styles.seriesTable}><thead><tr><th scope="col">{chartCopy(locale, 'Period', '기간', '期间')}</th><th scope="col">{unit}</th></tr></thead><tbody>{trend.points.map(point => <tr key={point.period}><th scope="row">{point.period}</th><td>{number(point.value)}</td></tr>)}</tbody></table></details>
    <figcaption>{locale === 'zh-CN' && trend.sourceId === 'plq-retail' ? trend.unit === 'million visits' ? '2022–2024 完整自然年度。数值来自 Lendlease Global Commercial REIT 于2025年11月5日发布的演示文稿第9页，保留原始一位小数精度。仅统计商场访问次数，并非独立访客、公寓居民或2026年数据。' : '2022–2024 完整自然年度。数值来自 Lendlease Global Commercial REIT 于2025年11月5日发布的演示文稿第9页，为保留一位小数的名义租户销售额。范围仅限 PLQ Mall，不代表公寓居民消费、全市零售额、住宅回报或2026年营业额。' : trend.basis[lang]}</figcaption>
  </figure>;
}
