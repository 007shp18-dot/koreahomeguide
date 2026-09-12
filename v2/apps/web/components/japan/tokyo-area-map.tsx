'use client';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { TOKYO_WARDS } from '../../lib/japan/query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GooglePlaceMap } from '../maps/google-place-map';
import type { TokyoAreaSummary } from '../../lib/japan/area-map-summary.server';
import type { TokyoMapFilters } from '../../lib/japan/map-summary.server';
import styles from './tokyo-explorer.module.css';
import { tokyoText, tokyoHref, type TokyoLocale } from './tokyo-copy';
import wardLocations from '../../lib/japan/tokyo-ward-locations.json';

export function tokyoMapAreaHref(row: Pick<TokyoAreaSummary, 'city' | 'year' | 'quarter' | 'district'>, filters: TokyoMapFilters, locale: TokyoLocale = 'en'): string {
  const params = new URLSearchParams({ city: row.city, year: row.year, quarter: row.quarter });
  if (row.district) params.set('neighbourhood', row.district);
  params.set('type', filters.type);
  if (filters.minArea !== null) params.set('minArea', String(filters.minArea));
  if (filters.maxArea !== null) params.set('maxArea', String(filters.maxArea));
  return tokyoHref(locale, `/jp/tokyo/explore/?${params}`);
}

export function filterTokyoAreas<T extends { district: string | null; municipality: string }>(rows: readonly T[], query: string): T[] {
  const search = query.trim().toLocaleLowerCase('en');
  return rows.filter(row => `${row.district ?? ''} ${row.municipality}`.toLocaleLowerCase('en').includes(search));
}

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

export function TokyoAreaMap({ rows, city, year, quarter, browserKey, filters, unavailable = false, locale = 'en', view = 'combined' }: { view?: 'combined' | 'directory' | 'map'; locale?: TokyoLocale;
  rows: readonly TokyoAreaSummary[]; city: string; year: string; quarter: string; browserKey: string | null;
  filters: TokyoMapFilters; unavailable?: boolean;
}) {
  const t = (text: string) => tokyoText(locale, text);
  const router = useRouter();
  const [search, setSearch] = useState({ city, value: '' });
  const [wardSearch, setWardSearch] = useState('');
  const neighbourhoodSearch = search.city === city ? search.value : '';
  const [pending, startTransition] = useTransition();
  const wardName = TOKYO_WARDS.find(([code]) => code === city)?.[1] ? t(TOKYO_WARDS.find(([code]) => code === city)![1]) : t('Ward');
  const wards = useMemo(() => rows.filter(row => row.district === null), [rows]);
  const neighbourhoods = useMemo(() => rows.filter(row => row.city === city && row.district !== null)
    .sort((a, b) => (a.district ?? '').localeCompare(b.district ?? '', 'en')), [rows, city]);
  const visible = filterTokyoAreas(neighbourhoods, neighbourhoodSearch);
  const visibleWards = TOKYO_WARDS.filter(([, name]) => `${name} ${t(name)}`.toLowerCase().includes(wardSearch.trim().toLowerCase()));
  const selectedArea = rows.find(row => row.city === city && row.district === (filters.neighbourhood || filters.q || null));
  const points = useMemo(() => wards.map((row, index) => tokyoAreaPoint(row, index, row.city === city)), [wards, city]);
  const selectWard = useCallback((id: string) => {
    const row = wards[Number(id)]; if (!row) return;
    startTransition(() => router.push(tokyoMapAreaHref(row, filters, locale), { scroll: false }));
  }, [wards, router, filters, locale]);
  return <section className={styles.areaMap} aria-label={view === 'directory' ? 'Tokyo area prices' : 'Tokyo area price map'} data-tokyo-google-map={view !== 'directory' ? 'true' : undefined} aria-busy={pending}>
    {view !== 'directory' && <h2>{t('Explore Tokyo by area')}</h2>}
    {view === 'combined' && <p>{t('Ward → neighbourhood → recorded home prices')}</p>}
    {view !== 'map' && <details className={styles.wardDirectory}><summary><span>{wardName}</span><span>{t('Change ward · 23 wards')}</span></summary>
      <label className={styles.areaSearch}>{t('Find a ward')}<input type="search" value={wardSearch} onChange={event => setWardSearch(event.target.value)} placeholder="Shibuya, Minato…" /></label>
      <nav className={styles.mapAreaList} aria-label="Choose a Tokyo ward">{visibleWards.map(([code, name]) => {
        const summary = wards.find(row => row.city === code);
        return <Link key={code} data-ward={code} aria-current={code === city ? 'location' : undefined} prefetch={false} scroll={false}
          href={tokyoMapAreaHref(summary ?? { city: code, year, quarter, district: null }, filters, locale)}>{t(name)}<span>{summary ? `${summary.year} Q${summary.quarter}` : t('View coverage')}</span></Link>;
      })}</nav>
      {!visibleWards.length && <p>{t('No wards match this search.')}</p>}
    </details>}
    {view !== 'directory' && <div className={styles.mapViewport}>
      <GooglePlaceMap market="tokyo" browserKey={browserKey} points={points} onSelectPoint={selectWard} showAddressSearch={false} clusterLocations={false} />
    </div>}
    {view !== 'directory' && selectedArea ? <div className={styles.selectedArea} aria-label="Selected area price summary">
      <div><h3>{selectedArea.district ?? wardName}</h3><p>{selectedArea.year} Q{selectedArea.quarter} · {selectedArea.count.toLocaleString('en')} {t('transactions')}</p></div>
      <div><span>{t('Median recorded price')}</span><strong>¥{selectedArea.median.toLocaleString('en')}</strong></div>
    </div> : null}
    {pending ? <p role="status">{t('Loading area transactions…')}</p> : null}
    {view !== 'map' && <section className={styles.neighbourhoods} aria-label={`Neighbourhoods in ${wardName}`}>
      <div className={styles.neighbourhoodHeading}><h3>{locale === 'en' ? `Neighbourhoods in ${wardName}` : locale === 'ko' ? `${wardName} 동네` : `${wardName}街区`}</h3><span>{neighbourhoods.length} {locale === 'en' ? 'available' : locale === 'ko' ? '개 동네' : '个街区'}</span></div>
      <p className={styles.neighbourhoodHelp}>{t('Choose an area to see its recorded home prices.')}</p>
      {!neighbourhoods.length ? <p>{unavailable ? t('Neighbourhood summaries are temporarily unavailable. You can still search the transaction records.') : t('No neighbourhoods match this period and property filters. Try another quarter or a wider area range.')}</p> : <>
        <label className={styles.areaSearch}>{t('Find a neighbourhood')}<input type="search" value={neighbourhoodSearch} onChange={event => setSearch({ city, value: event.target.value })} placeholder={t('Find a neighbourhood')} /></label>
        <div className={styles.neighbourhoodColumns} aria-hidden="true"><span>{t('Neighbourhood · transactions')}</span><span>{t('Median price')}</span></div>
        <nav className={styles.neighbourhoodList} aria-label="Choose a Tokyo neighbourhood">
          {visible.map(row => <Link key={`${row.city}:${row.district}`} data-neighbourhood={row.district}
            href={`${tokyoMapAreaHref(row, filters, locale)}#tokyo-transactions`} prefetch={false}
            aria-current={row.district === (filters.neighbourhood || filters.q) ? 'location' : undefined}>
            <span><strong>{row.district}</strong><small>{row.count.toLocaleString('en')} {t('transactions')} · {row.year} Q{row.quarter}</small></span><span className={styles.neighbourhoodPrice}>¥{row.median.toLocaleString('en')} <span aria-hidden="true">↗</span></span>
          </Link>)}
        </nav>
        {(filters.neighbourhood || filters.q) ? <Link className={styles.clearSearch} href={tokyoMapAreaHref({ city, year, quarter, district: null }, filters, locale)} prefetch={false} scroll={false}>{locale === 'en' ? `All ${wardName} transactions` : locale === 'ko' ? `${wardName} 전체 거래` : `${wardName}全部成交`}</Link> : null}
        {!visible.length && <p role="status">{locale === 'ko' ? `“${neighbourhoodSearch}” 검색 결과가 없습니다.` : locale === 'zh-CN' ? `没有匹配“${neighbourhoodSearch}”的街区。` : `No neighbourhoods match “${neighbourhoodSearch}”.`}</p>}
      </>}
    </section>}
    {view !== 'directory' && <details className={styles.mapMethod}><summary>{t('Map coverage and source')}</summary><p>{year} Q{quarter} · {t('Property type and area filters apply. Other wards use their latest available quarter when this period is missing. Neighbourhoods show the selected ward and quarter. Area medians are not like-for-like home valuations.')}</p><p><a href={wardLocations.source.url} target="_blank" rel="noreferrer">{t('Ward reference points: MLIT 2020')}</a> · {t('Derived by SignedPrice. Neighbourhoods are selected from published transaction records, without inferred building locations.')}</p></details>}
  </section>;
}
