'use client';

import Link from 'next/link';
import { useState } from 'react';
import { TOKYO_WARDS } from '@/lib/japan/query';
import type { TokyoMapFilters, TokyoWardSummary } from '@/lib/japan/map-summary.server';
import geometry from '@/lib/japan/tokyo-ward-geometry.json';
import styles from './tokyo-ward-map.module.css';

export type TokyoWardMapProps = {
  city: string; year: string; quarter: string; filters: TokyoMapFilters;
  summaries: TokyoWardSummary[] | null;
};
const yen = new Intl.NumberFormat('en', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 });
export function TokyoWardMap({ city, year, quarter, filters, summaries }: TokyoWardMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const active = hovered ?? city;
  const name = (code: string) => TOKYO_WARDS.find(([id]) => id === code)?.[1] ?? code;
  const summary = (code: string) => summaries?.find(item => item.city === code);
  const status = (code: string) => {
    if (summaries === null) return 'Summary temporarily unavailable';
    const item = summary(code);
    return !item ? 'Not published for this quarter' : item.count === 0 ? 'No matching transactions' : `${item.count.toLocaleString('en')} transactions`;
  };
  const href = (code: string) => {
    const query = new URLSearchParams({ city: code, year, quarter });
    if (filters.q) query.set('q', filters.q);
    if (filters.type) query.set('type', filters.type);
    if (filters.minArea !== null) query.set('minArea', String(filters.minArea));
    if (filters.maxArea !== null) query.set('maxArea', String(filters.maxArea));
    return `/jp/tokyo/explore/?${query}`;
  };
  const maximum = Math.max(1, ...(summaries ?? []).map(item => item.count));
  const activeSummary = summary(active);
  return <div className={styles.panel} data-tokyo-ward-map="true">
    <div className={styles.heading}><h2>Tokyo by ward</h2><span>{year} Q{quarter}</span></div>
    <p className={styles.hint}>Choose a ward to explore its recorded prices.</p>
    <div className={styles.map} onMouseLeave={() => setHovered(null)}>
      <svg viewBox={geometry.viewBox} aria-label="Tokyo 23 wards. Select a region to view transactions.">
        <text x="590" y="35" className={styles.compass} aria-hidden="true">N ↑</text>
        <text x="470" y="540" className={styles.water} aria-hidden="true">Tokyo Bay</text>
        {geometry.wards.map(ward => {
          const item = summary(ward.city);
          const level = !item || !item.count ? 0 : Math.min(4, Math.ceil(item.count / maximum * 4));
          return <Link key={ward.city} href={href(ward.city)} prefetch={false} scroll={false}
            data-ward={ward.city} data-level={level} data-selected={ward.city === city}
            data-active={ward.city === active} aria-current={ward.city === city ? 'location' : undefined}
            aria-label={`${name(ward.city)}: ${status(ward.city)}`}
            onMouseEnter={() => setHovered(ward.city)} onFocus={() => setHovered(ward.city)} onBlur={() => setHovered(null)}>
            <title>{name(ward.city)} · {status(ward.city)}{item?.medianPrice ? ` · Median ${yen.format(item.medianPrice)}` : ''}</title>
            <path d={ward.path} fillRule="evenodd" />
            <text x={ward.labelX} y={ward.labelY} textAnchor="middle" dominantBaseline="middle" aria-hidden="true">{name(ward.city)}</text>
          </Link>;
        })}
      </svg>
    </div>
    <div className={styles.legend}><span>Fewer transactions</span><i /><i /><i /><i /><span>More</span></div>
    <div className={styles.summary} aria-live="polite" aria-atomic="true">
      <div><h3>{name(active)}</h3><p>{status(active)}</p></div>
      <div className={styles.metric}><span>Median transaction price</span><strong>{activeSummary?.medianPrice != null ? yen.format(activeSummary.medianPrice) : '—'}</strong></div>
    </div>
    <p className={styles.note}>Current published releases · Your filters apply. Shading shows transaction counts; pale wards have no matching records or no published data. Areas represent wards, not individual homes.</p>
    <p className={styles.credit}><a href={geometry.source.url} target="_blank" rel="noreferrer">Ward boundaries: MLIT 2020</a> · Simplified by SignedPrice.</p>
  </div>;
}
