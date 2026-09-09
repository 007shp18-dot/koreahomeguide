'use client';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { TOKYO_WARDS } from '../../lib/japan/query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GooglePlaceMap } from '../maps/google-place-map';
import type { TokyoAreaSummary } from '../../lib/japan/area-map-summary.server';
import type { TokyoMapFilters } from '../../lib/japan/map-summary.server';
import styles from './tokyo-explorer.module.css';

export function tokyoMapAreaHref(row: Pick<TokyoAreaSummary, 'city' | 'year' | 'quarter' | 'district'>, filters: TokyoMapFilters): string {
  const params = new URLSearchParams({ city: row.city, year: row.year, quarter: row.quarter });
  if (row.district || filters.q) params.set('q', row.district ?? filters.q);
  if (filters.type) params.set('type', filters.type);
  if (filters.minArea !== null) params.set('minArea', String(filters.minArea));
  if (filters.maxArea !== null) params.set('maxArea', String(filters.maxArea));
  return `/jp/tokyo/explore/?${params}`;
}

export function TokyoAreaMap({ rows, city, year, quarter, browserKey, filters, unavailable = false }: {
  rows: readonly TokyoAreaSummary[]; city: string; year: string; quarter: string; browserKey: string | null;
  filters: TokyoMapFilters; unavailable?: boolean;
}) {
  const router = useRouter();
  const [level, setLevel] = useState<'wards' | 'neighbourhoods'>('wards');
  const [page, setPage] = useState(0);
  const [pending, startTransition] = useTransition();
  const areas = useMemo(() => rows.filter(row => level === 'wards' ? row.district === null : row.city === city && row.district !== null), [rows, level, city]);
  const activePage = Math.min(page, Math.max(0, Math.ceil(areas.length / 24) - 1));
  const visible = useMemo(() => areas.slice(activePage * 24, (activePage + 1) * 24), [areas, activePage]);
  const points = useMemo(() => visible.map((row, index) => ({
    id: String(index), kind: 'area' as const, showFullLabel: true,
    address: `${row.district ? `${row.district}, ` : ''}${row.municipality}, Tokyo, Japan`,
    label: `${row.district ?? row.municipality.replace(" Ward", "")} · ¥${(row.median / 1e6).toFixed(1)}M · ${row.count} · ${row.year}Q${row.quarter}`,
    title: `${row.district ?? row.municipality}: median ¥${row.median.toLocaleString('en')}, ${row.count} transactions · ${row.year} Q${row.quarter}. Approximate area only.`,
    count: row.count, selected: level === 'wards' && row.city === city,
  })), [visible, city, level]);
  const select = useCallback((id: string) => {
    const row = visible[Number(id)]; if (!row) return;
    startTransition(() => router.push(tokyoMapAreaHref(row, filters), { scroll: false }));
  }, [visible, router, filters]);
  return <section className={styles.areaMap} aria-label="Tokyo area price map" data-tokyo-google-map="true" aria-busy={pending}>
    <h2>Tokyo price map</h2>
    <p>{year} Q{quarter} · Your filters apply · Median price and transaction count. Other wards use their latest available quarter if this period is missing; select a ward to see its period. Markers represent areas, never individual buildings.</p>
    <nav aria-label="Map detail"><button type="button" aria-pressed={level === 'wards'} onClick={() => { setLevel('wards'); setPage(0); }}>Wards</button><button type="button" aria-pressed={level === 'neighbourhoods'} onClick={() => { setLevel('neighbourhoods'); setPage(0); }}>Selected ward neighbourhoods</button></nav>
    <GooglePlaceMap market="tokyo" browserKey={browserKey} points={points} onSelectPoint={select} showAddressSearch={false} clusterLocations={false} />
    {pending ? <p role="status">Loading area transactions…</p> : null}
    {!areas.length ? <p>{unavailable ? 'Area summaries are temporarily unavailable. Transaction results remain available.' : 'No published area summaries match these filters.'}</p> : <details><summary>Choose an area from the list</summary><div className={styles.mapAreaList}>{visible.map((row, index) => <button type="button" key={`${row.city}:${row.district}`} onClick={() => select(String(index))}>{row.district ?? row.municipality} · {row.count} transactions · {row.year} Q{row.quarter}</button>)}</div></details>}
    {level === 'wards' ? <details><summary>All Tokyo wards</summary><div className={styles.mapAreaList}>{TOKYO_WARDS.map(([code, name]) => {
      const summary = rows.find(row => row.city === code && row.district === null);
      return <Link key={code} data-ward={code} aria-current={code === city ? 'location' : undefined} prefetch={false} scroll={false}
        href={tokyoMapAreaHref(summary ?? { city: code, year, quarter, district: null }, filters)}>{name}</Link>;
    })}</div></details> : null}
    {areas.length > 24 ? <nav aria-label="Map area pages"><button type="button" disabled={activePage === 0} onClick={() => setPage(activePage - 1)}>Previous</button><span>{activePage + 1} / {Math.ceil(areas.length / 24)}</span><button type="button" disabled={(activePage + 1) * 24 >= areas.length} onClick={() => setPage(activePage + 1)}>Next</button></nav> : null}
  </section>;
}
