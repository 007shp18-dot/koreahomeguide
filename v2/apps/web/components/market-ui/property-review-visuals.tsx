'use client';
import { useState } from 'react';
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
        <h3>{group[0]!.unit === 'm' ? lang === 'ko' ? '주변 접근 거리 비교' : 'Nearby access at a glance' : group[0]!.unit === 'min' ? lang === 'ko' ? '시간 비교' : 'Timing comparison' : lang === 'ko' ? '단지의 세대 구성' : 'Homes within the development'}</h3>
        <div className={styles.bars}>{group.map(m => <div className={styles.barRow} key={m.label.en}>
          <span>{m.label[lang]}</span><strong>{number(m.value)} {unit(m.unit)}</strong>
          <div className={styles.track} aria-hidden="true"><div style={{ width: `${m.value / max * 100}%` }} /></div>
        </div>)}</div><figcaption>{group[0]!.basis[lang]}</figcaption>
      </figure>;
    })}
    {!!trends.length && <div className={styles.trends}>{trends.map(trend => <ReviewTrend key={trend.label.en} trend={trend} lang={lang} />)}</div>}
    {!!facts.length && <section className={styles.facts} aria-label={lang === 'ko' ? '단지 핵심 수치' : 'Property facts'}>{facts.map(m => <article key={`${m.label.en}:${m.unit}`}><p>{m.label[lang]}</p><strong>{number(m.value)} <span>{unit(m.unit)}</span></strong><p className={styles.basis}>{m.basis[lang]}</p></article>)}</section>}
  </div>;
}

function ReviewTrend({ trend, lang }: { trend: ReviewVisualSeries; lang: 'ko' | 'en' }) {
  const { ref, width } = useChartWidth();
  const maximum = Math.max(...trend.points.map(point => point.value), 1);
  const number = (value: number) => value.toLocaleString(lang, { maximumFractionDigits: 2 });
  const unit = lang === 'ko' && trend.unit === 'transactions' ? '건' : trend.unit;
  const positions = trend.points.map((point, index) => ({ ...point,
    x: 48 + index / (trend.points.length - 1) * (width - 78), y: 162 - point.value / maximum * 118,
  }));
  return <figure className={styles.chart}>
    <h3>{trend.label[lang]}</h3><p className={styles.seriesUnit}>{unit} · {trend.points[0]!.period}–{trend.points.at(-1)!.period}</p>
    <div ref={ref}>
      <svg className={styles.trend} viewBox={`0 0 ${width} 206`} role="img" aria-label={`${trend.label[lang]} · ${lang === 'ko' ? '정확한 수치는 아래 표에 표시됩니다.' : 'Exact values appear in the table below.'}`}>
        {[0, .5, 1].map(fraction => <line key={fraction} x1="48" y1={162 - fraction * 118} x2={width - 30} y2={162 - fraction * 118} className={styles.axis} />)}
        <text x="24" y="166" textAnchor="end">0</text>
        <polyline points={positions.map(point => `${point.x},${point.y}`).join(' ')} className={styles.trendLine} />
        {positions.map((point, index) => <g key={point.period}>
          <circle cx={point.x} cy={point.y} r="3"><title>{`${point.period}: ${number(point.value)} ${unit}`}</title></circle>
          {(index === 0 || index === positions.length - 1) && <>
            <text x={point.x} y={point.y - 14} textAnchor={index === 0 ? 'start' : 'end'}>{number(point.value)}</text>
            <text x={point.x} y="192" textAnchor={index === 0 ? 'start' : 'end'}>{point.period}</text>
          </>}
        </g>)}
      </svg>
    </div>
    <table className={styles.seriesTable}><thead><tr><th scope="col">{lang === 'ko' ? '연도' : 'Year'}</th><th scope="col">{unit}</th></tr></thead><tbody>{trend.points.map(point => <tr key={point.period}><th scope="row">{point.period}</th><td>{number(point.value)}</td></tr>)}</tbody></table>
    <figcaption>{trend.basis[lang]}</figcaption>
  </figure>;
}
