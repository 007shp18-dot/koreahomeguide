'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import type { SingaporeExploreModel } from '../../lib/singapore/route-types';
import type { HdbExploreModel } from '../../lib/singapore/hdb-route-model.server';
import { GooglePlaceMap, type GoogleMarketMapPoint } from '../maps/google-place-map';
import { HdbMarketPanel } from './hdb-market-panel';
import { MarketExploreShell, MarketLayerControl } from '../market-ui/market-shell';
import { SingaporeEvidence, SingaporePage, SingaporeScope, singaporeStyles as styles } from './singapore-shell';
import searchStyles from '../price-market-search.module.css';

const segmentCenters = {
  CCR: { latitude: 1.2897, longitude: 103.8501 },
  RCR: { latitude: 1.3270, longitude: 103.8460 },
  OCR: { latitude: 1.3691, longitude: 103.8061 },
} as const;
const PAGE_SIZE = 24;

export function SingaporeExplorer({ model, hdbModel = { status: 'unavailable' }, googleMapsBrowserKey = null, initialQuery = '' }: Readonly<{
  model: SingaporeExploreModel;
  hdbModel?: HdbExploreModel;
  googleMapsBrowserKey?: string | null;
  initialQuery?: string;
}>) {
  const [selectedSegment, setSelectedSegment] = useState<'CCR' | 'RCR' | 'OCR' | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [district, setDistrict] = useState('all');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('transactions');
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const segments = model.status === 'ready' ? model.segments : [];
  const selected = segments.find((segment) => segment.code === selectedSegment);
  const allProjects = useMemo(() => model.status === 'ready' ? model.segments.flatMap((segment) => (segment.projects ?? []).map((project) => ({ ...project, segment: segment.code }))) : [], [model]);
  const projects = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('en');
    return allProjects.filter((project) => (selectedSegment === null || project.segment === selectedSegment)
      && (district === 'all' || project.district === district)
      && `${project.name} ${project.street} ${project.district} district ${Number(project.district)} ${project.segment}`.toLocaleLowerCase('en').includes(term))
      .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : b.n - a.n || a.name.localeCompare(b.name));
  }, [allProjects, district, query, selectedSegment, sort]);
  const visible = projects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const selectSegment = useCallback((segment: 'CCR' | 'RCR' | 'OCR' | null) => {
    setSelectedSegment(segment); setSelectedProjectId(null); setDistrict('all'); setPage(1);
  }, []);
  const onMapSelect = useCallback((id: string) => {
    if (id.startsWith('segment-')) {
      const value = id.slice(8);
      if (value === 'CCR' || value === 'RCR' || value === 'OCR') selectSegment(value);
    } else if (id.startsWith('project-')) setSelectedProjectId(id.slice(8));
  }, [selectSegment]);
  const mapPoints = useMemo<readonly GoogleMarketMapPoint[]>(() => {
    if (selectedSegment === null && selectedProjectId === null && query.trim() === '' && district === 'all') return (model.status === 'ready' ? model.segments : []).map((segment) => ({
      id: `segment-${segment.code}`, title: `${segment.code} regional summary`, label: `${segment.code} · ${segment.medianPriceLabel ?? 'Not published'}`, ...segmentCenters[segment.code],
    }));
    return projects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((project) => ({
      id: `project-${project.id}`, title: `${project.name} · ${project.street}`, label: project.medianPriceLabel ?? `${project.n} sales`,
      address: `${project.name}, ${project.street}, Singapore`, selected: selectedProjectId === project.id,
    }));
  }, [district, model, page, projects, query, selectedProjectId, selectedSegment]);
  const layers = <>
    <MarketLayerControl label="Singapore market layers" items={[
      { id: 'ura', label: 'URA private sales', href: '#ura-private', current: true },
      { id: 'resale', label: 'HDB resale', href: '#hdb-resale' },
      { id: 'rent', label: 'HDB rent', href: '#hdb-rent' },
    ]} />
    <div className={searchStyles.search}>
      <form role="search" onSubmit={(event) => { event.preventDefault(); setPage(1); }}>
        <label className={searchStyles.query}>Search Singapore projects<input name="q" type="search" value={query} placeholder="Project, street or district number" onChange={(event) => { setQuery(event.currentTarget.value); setPage(1); setSelectedProjectId(null); }} /></label>
        <label>District<select value={district} onChange={(event) => { setDistrict(event.currentTarget.value); setPage(1); setSelectedProjectId(null); }}><option value="all">All districts</option>{[...new Set(allProjects.filter((project) => selectedSegment === null || project.segment === selectedSegment).map((project) => project.district))].sort().map((value) => <option key={value} value={value}>District {value}</option>)}</select></label>
        <label>Sort<select value={sort} onChange={(event) => { setSort(event.currentTarget.value); setPage(1); }}><option value="transactions">Most transactions</option><option value="name">Project name</option></select></label>
        <button type="submit">Search</button>
      </form>
    </div>
  </>;
  if (model.status === 'unavailable') return <SingaporePage currentHref="/sg/singapore/explore/" unframed><h1>Explore</h1><p>{model.message}</p><HdbMarketPanel model={hdbModel} /></SingaporePage>;
  return <SingaporePage currentHref="/sg/singapore/explore/" unframed>
    <div data-singapore-explore-workspace="true" data-singapore-evidence="ready" data-navigation-state={pendingHref === null ? 'idle' : 'pending'}>
      <MarketExploreShell eyebrow="Singapore" title="Explore" period={<>{model.transactionLabel}<br />{model.periodLabel}</>} layers={layers}
        discovery={<section className={styles.segmentPanel} id="ura-private" aria-labelledby="segment-heading">
          <h2 id="segment-heading">Private residential projects</h2><SingaporeScope />
          <div className={styles.segmentTabs} role="tablist" aria-label="Singapore market regions">
            <button type="button" role="tab" aria-selected={selectedSegment === null} onClick={() => selectSegment(null)}><strong>All regions</strong></button>
            {segments.map((segment) => <button key={segment.code} type="button" role="tab" aria-selected={selectedSegment === segment.code} onClick={() => selectSegment(segment.code)}><strong>{segment.code}</strong><span>{segment.medianPriceLabel ?? 'Not published'}</span></button>)}
          </div>
          {selected ? <div className={styles.segmentList}><article className={styles.segmentRow}><h3>{selected.code}</h3><div><strong>{selected.medianPriceLabel ?? 'Not published'}</strong><span>{selected.n} transactions · {selected.projectCount} projects</span></div>{selected.state === 'published' ? <Link href={selected.href}>Open {selected.code} evidence</Link> : <span data-evidence-link="unavailable">At least 5 transactions are required</span>}</article></div> : null}
          <div className={styles.projectList} aria-live="polite">
            <header><span>{projects.length.toLocaleString('en')} matching projects</span><small>{projects.length === 0 ? 'No matches' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, projects.length)} shown`}</small></header>
            {projects.length === 0 ? <p>No projects match these filters. Try a different name or district.</p> : null}
            {visible.map((project) => <div key={project.id} data-selected={selectedProjectId === project.id}>
              <button type="button" aria-pressed={selectedProjectId === project.id} onClick={() => setSelectedProjectId(project.id)}><span><strong>{project.name}</strong><small>{project.street} · District {project.district}</small></span><span><strong>{project.medianPriceLabel ?? 'Not published'}</strong><small>{project.n} sales</small></span></button>
              {project.state === 'published' ? <Link href={project.href} aria-label={`Open ${project.name} evidence`} aria-busy={pendingHref === project.href} onClick={() => setPendingHref(project.href)}>Details</Link> : <span className={styles.evidenceUnavailableLink} data-evidence-link="unavailable" title="At least 5 transactions are required">Below 5 sales</span>}
            </div>)}
          </div>
          <nav className={searchStyles.search} aria-label="Project result pages"><button type="button" disabled={page === 1} onClick={() => { setPage(page - 1); setSelectedProjectId(null); }}>Previous</button>{' '}<span>Page {page} of {Math.max(1, Math.ceil(projects.length / PAGE_SIZE))}</span>{' '}<button type="button" disabled={page * PAGE_SIZE >= projects.length} onClick={() => { setPage(page + 1); setSelectedProjectId(null); }}>Next</button></nav>
        </section>}
        spatial={<section className={styles.exploreMap} aria-labelledby="singapore-map-heading"><h2 id="singapore-map-heading">{selected || selectedProjectId || query || district !== 'all' ? 'Projects on this results page' : 'Singapore regions'}</h2><GooglePlaceMap browserKey={googleMapsBrowserKey} points={mapPoints} onSelectPoint={onMapSelect} showAddressSearch={false} />{selectedProject ? <aside className={styles.mapSelection}><h3>{selectedProject.name}</h3><p>{selectedProject.street}</p><strong>{selectedProject.medianPriceLabel ?? 'Not published'}</strong>{selectedProject.state === 'published' ? <Link href={selectedProject.href}>Open project evidence</Link> : null}</aside> : null}</section>}
      />
    </div>
    <HdbMarketPanel model={hdbModel} /><SingaporeEvidence model={model.evidence} compact />
  </SingaporePage>;
}
