'use client';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { GooglePlaceMap } from '../maps/google-place-map';
import type { TokyoAreaSummary } from '../../lib/japan/area-map-summary.server';
import styles from './tokyo-explorer.module.css';

export function TokyoAreaMap({ rows, city, year, quarter, browserKey }: { rows: readonly TokyoAreaSummary[]; city: string; year: string; quarter: string; browserKey: string | null }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [level, setLevel] = useState<'wards' | 'neighbourhoods'>('wards');
  const [page, setPage] = useState(0);
  const [pending, startTransition] = useTransition();
  const areas = useMemo(() => rows.filter(row => level === 'wards' ? row.district === null : row.city === city && row.district !== null), [rows, level, city]);
  const visible = useMemo(() => areas.slice(page * 24, (page + 1) * 24), [areas, page]);
  const points = useMemo(() => visible.map((row, index) => ({
    id: String(index), kind: 'area' as const, showFullLabel: true,
    address: `${row.district ? `${row.district}, ` : ''}${row.municipality}, Tokyo, Japan`,
    label: `${row.district ?? row.municipality.replace(" Ward", "")} · ¥${(row.median / 1e6).toFixed(1)}M · ${row.count} · ${row.year}Q${row.quarter}`,
    title: `${row.district ?? row.municipality}: median ¥${row.median.toLocaleString('en')}, ${row.count} transactions · ${row.year} Q${row.quarter}. Approximate area only.`,
    count: row.count, selected: level === 'wards' && row.city === city,
  })), [visible, city, level]);
  const select = useCallback((id: string) => {
    const row = visible[Number(id)]; if (!row) return;
    const params = new URLSearchParams({ city: row.city, year: row.year, quarter: row.quarter });
    if (row.district) params.set('q', row.district);
    startTransition(() => router.push(`/jp/tokyo/explore/?${params}`, { scroll: false }));
  }, [visible, router]);
  if (!expanded) return <div className={styles.areaMap}><button type="button" onClick={() => setExpanded(true)}>Open ward and neighbourhood price map</button></div>;
  return <section className={styles.areaMap} aria-label="Tokyo area price map" aria-busy={pending}>
    <h2>Area prices</h2>
    <p>{year} Q{quarter} · All property types · Median price and transaction count. Other wards use their latest available quarter if this period is missing; select a ward to see its period. Markers represent areas, never individual buildings.</p>
    <nav aria-label="Map detail"><button type="button" aria-pressed={level === 'wards'} onClick={() => { setLevel('wards'); setPage(0); }}>Wards</button><button type="button" aria-pressed={level === 'neighbourhoods'} onClick={() => { setLevel('neighbourhoods'); setPage(0); }}>Selected ward neighbourhoods</button></nav>
    <GooglePlaceMap market="tokyo" browserKey={browserKey} points={points} onSelectPoint={select} showAddressSearch={false} clusterLocations={false} />
    {pending ? <p role="status">Loading area transactions…</p> : null}
    {!areas.length ? <p>Area summaries are not available for this period.</p> : <details><summary>Choose an area from the list</summary><div className={styles.mapAreaList}>{visible.map((row, index) => <button type="button" key={`${row.city}:${row.district}`} onClick={() => select(String(index))}>{row.district ?? row.municipality} · {row.count} transactions · {row.year} Q{row.quarter}</button>)}</div></details>}
    {areas.length > 24 ? <nav aria-label="Map area pages"><button type="button" disabled={page === 0} onClick={() => setPage(value => value - 1)}>Previous</button><span>{page + 1} / {Math.ceil(areas.length / 24)}</span><button type="button" disabled={(page + 1) * 24 >= areas.length} onClick={() => setPage(value => value + 1)}>Next</button></nav> : null}
  </section>;
}
