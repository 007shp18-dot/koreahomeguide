'use client';
import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { DUBAI_AREAS, DUBAI_SOURCES, filterDubaiAreas } from '../../lib/dubai/research';
import { GooglePlaceMap } from '../maps/google-place-map';
import { MarketExploreShell } from '../market-ui/market-shell';
import styles from './dubai-research.module.css';

export function DubaiExplorer({ browserKey, initialQuery = '', initialArea = '' }: Readonly<{ browserKey: string | null; initialQuery?: string; initialArea?: string }>) {
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState(initialArea);
  const areas = useMemo(() => filterDubaiAreas(query), [query]);
  const area = areas.find(({id}) => id === selected);
  const select = useCallback((id: string) => { setSelected(id); const url = new URL(window.location.href); url.searchParams.set('area', id); window.history.replaceState(null, '', url); }, []);
  const points = useMemo(() => areas.map((item) => ({ id: item.id, title: item.name, label: item.name, address: `${item.name}, Dubai, United Arab Emirates`, selected: selected === item.id })), [areas, selected]);
  return <MarketExploreShell eyebrow="Dubai" title="Explore" period="Area research" layers={<div className={styles.toolbar}><label>Find an area<input type="search" value={query} placeholder="Area name" onChange={(event) => { const value = event.currentTarget.value; setQuery(value); setSelected(''); const url = new URL(window.location.href); if (value.trim()) url.searchParams.set('q', value); else url.searchParams.delete('q'); url.searchParams.delete('area'); window.history.replaceState(null, '', url); }} /></label><nav className={styles.actions} aria-label="Dubai research"><Link href="/ae/dubai/">Market overview</Link><Link href="/ae/dubai/guide/">Buying research guide</Link><Link href="/news/?market=dubai">News</Link></nav></div>} discovery={<div className={styles.directory}><h2>Area guide</h2><p>{areas.length} of {DUBAI_AREAS.length} curated areas · Not a property inventory</p><ul>{areas.map((item) => <li key={item.id}><button type="button" onClick={() => select(item.id)} aria-pressed={selected === item.id}><strong>{item.name}</strong><span>{item.kind}</span></button></li>)}</ul>{areas.length === 0 ? <p>No area matches. Try Downtown, Marina, Business Bay or Palm.</p> : null}{area ? <article className={styles.areaDetail} aria-live="polite"><h3>{area.name}</h3><p>{area.description}</p><p>{area.question}</p><a href={area.source} target="_blank" rel="noreferrer">Official neighbourhood guide</a><p><a href={DUBAI_SOURCES.projects} target="_blank" rel="noreferrer">Check a project with DLD</a></p></article> : <p>Select an area to see its location and research questions.</p>}</div>} spatial={<div className={styles.map}><GooglePlaceMap key="dubai" market="dubai" browserKey={browserKey} points={points} onSelectPoint={select} showAddressSearch={false} /><p>Markers locate neighbourhoods, not individual buildings or available listings. Area transaction counts and prices are not published here.</p></div>} />;
}
