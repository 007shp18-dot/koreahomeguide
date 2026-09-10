'use client';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { TOKYO_WARDS } from '../../lib/japan/query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GooglePlaceMap } from '../maps/google-place-map';
import type { TokyoAreaSummary } from '../../lib/japan/area-map-summary.server';
import type { TokyoMapFilters } from '../../lib/japan/map-summary.server';
import styles from './tokyo-explorer.module.css';
import wardLocations from '../../lib/japan/tokyo-ward-locations.json';

export function tokyoMapAreaHref(row: Pick<TokyoAreaSummary, 'city' | 'year' | 'quarter' | 'district'>, filters: TokyoMapFilters): string {
  const params = new URLSearchParams({ city: row.city, year: row.year, quarter: row.quarter });
  if (row.district || filters.q) params.set('q', row.district ?? filters.q);
  if (filters.type) params.set('type', filters.type);
  if (filters.minArea !== null) params.set('minArea', String(filters.minArea));
  if (filters.maxArea !== null) params.set('maxArea', String(filters.maxArea));
  return `/jp/tokyo/explore/?${params}`;
}

const AREA_PAGE_SIZE = 12;

/** Ward reference coordinates come from the published MLIT boundaries, not browser geocoding. */
export function tokyoAreaPoint(row: TokyoAreaSummary, index: number, selected: boolean) {
  const location = row.district === null ? wardLocations.wards[row.city as keyof typeof wardLocations.wards] : undefined;
  return {
    id: String(index), kind: 'area' as const, showFullLabel: true,
    ...(location ?? { address: `${row.district ? `${row.district}, ` : ''}${row.municipality}, Tokyo, Japan` }),
    label: row.district ?? row.municipality.replace(' Ward', ''),
    title: `${row.district ?? row.municipality}: median ¥${row.median.toLocaleString('en')}, ${row.count} transactions · ${row.year} Q${row.quarter}. Approximate area only.`,
    count: row.count, selected,
  };
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
  const pageSize = level === 'wards' ? 23 : AREA_PAGE_SIZE;
  const activePage = Math.min(page, Math.max(0, Math.ceil(areas.length / pageSize) - 1));
  const visible = useMemo(() => areas.slice(activePage * pageSize, (activePage + 1) * pageSize), [areas, activePage, pageSize]);
  const selectedArea = rows.find(row => row.city === city && (level === 'wards' ? row.district === null : row.district === filters.q));
  const points = useMemo(() => visible.map((row, index) => tokyoAreaPoint(row, index, level === 'wards' ? row.city === city : row.district === filters.q)), [visible, city, level, filters.q]);
  const select = useCallback((id: string) => {
    const row = visible[Number(id)]; if (!row) return;
    startTransition(() => router.push(tokyoMapAreaHref(row, filters), { scroll: false }));
  }, [visible, router, filters]);
  return <section className={styles.areaMap} aria-label="Tokyo area price map" data-tokyo-google-map="true" aria-busy={pending}>
    <h2>Explore Tokyo by area</h2>
    <p>Choose an area to see its recorded prices. Markers show approximate areas, not individual buildings.</p>
    <nav aria-label="Map detail"><button type="button" aria-pressed={level === 'wards'} onClick={() => { setLevel('wards'); setPage(0); }}>Wards</button><button type="button" aria-pressed={level === 'neighbourhoods'} onClick={() => { setLevel('neighbourhoods'); setPage(0); }}>Neighbourhoods</button></nav>
    <GooglePlaceMap market="tokyo" browserKey={browserKey} points={points} onSelectPoint={select} showAddressSearch={false} clusterLocations={false} />
    {selectedArea ? <div className={styles.selectedArea} aria-label="Selected area price summary">
      <div><h3>{selectedArea.district ?? selectedArea.municipality.replace(' Ward', '')}</h3><p>{selectedArea.year} Q{selectedArea.quarter} · {selectedArea.count.toLocaleString('en')} transactions</p></div>
      <div><span>Median recorded price</span><strong>¥{selectedArea.median.toLocaleString('en')}</strong></div>
    </div> : null}
    {pending ? <p role="status">Loading area transactions…</p> : null}
    {!areas.length ? <p>{unavailable ? 'Area summaries are temporarily unavailable. Transaction results remain available.' : 'No published area summaries match these filters.'}</p> : <details><summary>Choose an area from the list</summary><div className={styles.mapAreaList}>{visible.map((row, index) => <button type="button" key={`${row.city}:${row.district}`} onClick={() => select(String(index))}>{row.district ?? row.municipality} · {row.count} transactions · {row.year} Q{row.quarter}</button>)}</div></details>}
    {level === 'wards' ? <details><summary>All Tokyo wards</summary><div className={styles.mapAreaList}>{TOKYO_WARDS.map(([code, name]) => {
      const summary = rows.find(row => row.city === code && row.district === null);
      return <Link key={code} data-ward={code} aria-current={code === city ? 'location' : undefined} prefetch={false} scroll={false}
        href={tokyoMapAreaHref(summary ?? { city: code, year, quarter, district: null }, filters)}>{name}</Link>;
    })}</div></details> : null}
    {areas.length > pageSize ? <nav aria-label="Map area pages"><button type="button" disabled={activePage === 0} onClick={() => setPage(activePage - 1)}>Previous</button><span>{activePage + 1} / {Math.ceil(areas.length / pageSize)}</span><button type="button" disabled={(activePage + 1) * pageSize >= areas.length} onClick={() => setPage(activePage + 1)}>Next</button></nav> : null}
    <details className={styles.mapMethod}><summary>Map coverage and source</summary><p>{year} Q{quarter} · Your filters apply. Other wards use their latest available quarter when this period is missing. Prices cover different property types unless filtered; area medians are not like-for-like home valuations.</p><p><a href={wardLocations.source.url} target="_blank" rel="noreferrer">Ward reference points: MLIT 2020</a> · Derived by SignedPrice. Neighbourhood locations are resolved only when opened.</p></details>
  </section>;
}
