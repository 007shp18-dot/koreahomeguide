'use client';
import { useState } from 'react';
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
    {!!trends.length && <div className={styles.trends}>{trends.map(trend => {
      const max = Math.max(...trend.points.map(p => p.value), 1);
      const positions = trend.points.map((point, i) => ({ ...point, x: 35 + i / (trend.points.length - 1) * 490, y: 165 - point.value / max * 120 }));
      return <figure className={styles.chart} key={trend.label.en}>
        <h3>{trend.label[lang]}</h3><p className={styles.seriesUnit}>{unit(trend.unit)} · {trend.points[0]!.period}–{trend.points.at(-1)!.period}</p>
        <svg className={styles.trend} viewBox="0 0 560 210" role="img" aria-label={`${trend.label[lang]} · ${lang === 'ko' ? '정확한 수치는 아래 표에 표시됩니다.' : 'Exact values appear in the table below.'}`}>
          <line x1="35" y1="165" x2="525" y2="165" className={styles.axis}/>
          <text x="12" y="169">0</text>
          <polyline points={positions.map(p => `${p.x},${p.y}`).join(' ')} className={styles.trendLine}/>
          {positions.map(p => <g key={p.period}><circle cx={p.x} cy={p.y} r="4"/><text x={p.x} y={p.y-13} textAnchor="middle">{number(p.value)}</text><text x={p.x} y="192" textAnchor="middle">{p.period}</text></g>)}
        </svg>
        <table className={styles.seriesTable}><thead><tr><th scope="col">{lang === 'ko' ? '연도' : 'Year'}</th><th scope="col">{unit(trend.unit)}</th></tr></thead><tbody>{trend.points.map(p => <tr key={p.period}><th scope="row">{p.period}</th><td>{number(p.value)}</td></tr>)}</tbody></table>
        <figcaption>{trend.basis[lang]}</figcaption>
      </figure>;
    })}</div>}
    {!!facts.length && <section className={styles.facts} aria-label={lang === 'ko' ? '단지 핵심 수치' : 'Property facts'}>{facts.map(m => <article key={`${m.label.en}:${m.unit}`}><p>{m.label[lang]}</p><strong>{number(m.value)} <span>{unit(m.unit)}</span></strong><p className={styles.basis}>{m.basis[lang]}</p></article>)}</section>}
  </div>;
}
