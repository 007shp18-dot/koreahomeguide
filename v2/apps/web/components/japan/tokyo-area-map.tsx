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
  if (row.district) params.set('q', row.district);
  params.set('type', filters.type);
  if (filters.minArea !== null) params.set('minArea', String(filters.minArea));
  if (filters.maxArea !== null) params.set('maxArea', String(filters.maxArea));
  return `/jp/tokyo/explore/?${params}`;
}

const AREA_PAGE_SIZE = 6;

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
  const [paging, setPaging] = useState({ scope: `${city}:${year}:${quarter}`, page: 0 });
  const pagingScope = `${city}:${year}:${quarter}`;
  const page = paging.scope === pagingScope ? paging.page : 0;
  const setPage = (next: number) => setPaging({ scope: pagingScope, page: next });
  const [pending, startTransition] = useTransition();
  const wardName = TOKYO_WARDS.find(([code]) => code === city)?.[1] ?? 'this ward';
  const wards = useMemo(() => rows.filter(row => row.district === null), [rows]);
  const neighbourhoods = useMemo(() => rows.filter(row => row.city === city && row.district !== null)
    .sort((a, b) => (a.district ?? '').localeCompare(b.district ?? '', 'en')), [rows, city]);
  const activePage = Math.min(page, Math.max(0, Math.ceil(neighbourhoods.length / AREA_PAGE_SIZE) - 1));
  const visible = neighbourhoods.slice(activePage * AREA_PAGE_SIZE, (activePage + 1) * AREA_PAGE_SIZE);
  const selectedArea = rows.find(row => row.city === city && row.district === (filters.q || null));
  const points = useMemo(() => wards.map((row, index) => tokyoAreaPoint(row, index, row.city === city)), [wards, city]);
  const selectWard = useCallback((id: string) => {
    const row = wards[Number(id)]; if (!row) return;
    setPaging({ scope: `${row.city}:${row.year}:${row.quarter}`, page: 0 });
    startTransition(() => router.push(tokyoMapAreaHref(row, filters), { scroll: false }));
  }, [wards, router, filters]);
  return <section className={styles.areaMap} aria-label="Tokyo area price map" data-tokyo-google-map="true" aria-busy={pending}>
    <h2>Explore Tokyo by area</h2>
    <p>Choose a ward on the map, then a neighbourhood below. Markers show ward areas.</p>
    <div className={styles.mapViewport}>
      <GooglePlaceMap market="tokyo" browserKey={browserKey} points={points} onSelectPoint={selectWard} showAddressSearch={false} clusterLocations={false} />
    </div>
    {selectedArea ? <div className={styles.selectedArea} aria-label="Selected area price summary">
      <div><h3>{selectedArea.district ?? wardName}</h3><p>{selectedArea.year} Q{selectedArea.quarter} · {selectedArea.count.toLocaleString('en')} transactions</p></div>
      <div><span>Median recorded price</span><strong>¥{selectedArea.median.toLocaleString('en')}</strong></div>
    </div> : null}
    {pending ? <p role="status">Loading area transactions…</p> : null}
    <section className={styles.neighbourhoods} aria-label={`Neighbourhoods in ${wardName}`}>
      <div className={styles.neighbourhoodHeading}><h3>Neighbourhoods in {wardName}</h3><span>{neighbourhoods.length} available</span></div>
      <p className={styles.neighbourhoodHelp}>Select a neighbourhood to show its transactions. Property type and area filters apply.</p>
      {!neighbourhoods.length ? <p>{unavailable ? 'Neighbourhood summaries are temporarily unavailable. You can still search the transaction records.' : 'No neighbourhoods match this period and property filters. Try another quarter or a wider area range.'}</p> : <>
        <nav className={styles.neighbourhoodList} aria-label="Choose a Tokyo neighbourhood">
          {visible.map(row => <Link key={`${row.city}:${row.district}`} data-neighbourhood={row.district}
            href={`${tokyoMapAreaHref(row, filters)}#tokyo-transactions`} prefetch={false}
            aria-current={row.district === filters.q ? 'location' : undefined}>
            <strong>{row.district}</strong><span>{row.count.toLocaleString('en')} transactions · {row.year} Q{row.quarter}</span>
          </Link>)}
        </nav>
        {filters.q ? <Link className={styles.clearSearch} href={tokyoMapAreaHref({ city, year, quarter, district: null }, filters)} prefetch={false} scroll={false}>All {wardName} transactions</Link> : null}
        {neighbourhoods.length > AREA_PAGE_SIZE ? <nav className={styles.areaPagination} aria-label="Neighbourhood pages"><button type="button" disabled={activePage === 0} onClick={() => setPage(activePage - 1)}>Previous</button><span>{activePage + 1} / {Math.ceil(neighbourhoods.length / AREA_PAGE_SIZE)}</span><button type="button" disabled={(activePage + 1) * AREA_PAGE_SIZE >= neighbourhoods.length} onClick={() => setPage(activePage + 1)}>Next</button></nav> : null}
      </>}
    </section>
    <details className={styles.wardDirectory}><summary>All Tokyo wards</summary><div className={styles.mapAreaList}>{TOKYO_WARDS.map(([code, name]) => {
      const summary = wards.find(row => row.city === code);
      return <Link key={code} data-ward={code} aria-current={code === city ? 'location' : undefined} prefetch={false} scroll={false}
        onClick={() => setPage(0)}
        href={tokyoMapAreaHref(summary ?? { city: code, year, quarter, district: null }, filters)}>{name}</Link>;
    })}</div></details>
    <details className={styles.mapMethod}><summary>Map coverage and source</summary><p>{year} Q{quarter} · Property type and area filters apply. Other wards use their latest available quarter when this period is missing. Neighbourhoods show the selected ward and quarter. Area medians are not like-for-like home valuations.</p><p><a href={wardLocations.source.url} target="_blank" rel="noreferrer">Ward reference points: MLIT 2020</a> · Derived by SignedPrice. Neighbourhoods are selected from published transaction records, without inferred building locations.</p></details>
  </section>;
}
