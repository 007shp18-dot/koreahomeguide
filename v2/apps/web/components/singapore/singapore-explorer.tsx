'use client';

import Link from 'next/link';
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { SingaporeExploreModel } from '../../lib/singapore/route-types';
import type { HdbExploreModel } from '../../lib/singapore/hdb-route-model.server';
import { GooglePlaceMap } from '../maps/google-place-map';
import { buildSingaporeMapCoverage } from '../../lib/singapore/map-coverage';
import { HdbMarketPanel } from './hdb-market-panel';
import { MarketExploreShell, MarketLayerControl } from '../market-ui/market-shell';
import { SingaporeEvidence, SingaporePage, singaporeStyles as styles } from './singapore-shell';
import searchStyles from '../price-market-search.module.css';

const PAGE_SIZE = 24;

type SingaporeExplorerState = Readonly<{
  query: string;
  selectedSegment: 'CCR' | 'RCR' | 'OCR' | null;
  district: string;
  sort: string;
  page: number;
  selectedProjectId: string | null;
}>;

export function buildSingaporeExploreHref(state: SingaporeExplorerState): string {
  const params = new URLSearchParams();
  const query = state.query.trim();
  if (query !== '') params.set('q', query);
  if (state.selectedSegment !== null) params.set('region', state.selectedSegment.toLocaleLowerCase('en'));
  if (state.district !== 'all') params.set('district', state.district);
  if (state.sort !== 'transactions') params.set('sort', state.sort);
  if (state.page > 1) params.set('page', String(state.page));
  if (state.selectedProjectId !== null) params.set('project', state.selectedProjectId);
  const queryString = params.toString();
  return `/sg/singapore/explore/${queryString === '' ? '' : `?${queryString}`}`;
}

export function formatSingaporeMapPrice(label: string | null, fallback: string): string {
  if (label === null) return fallback;
  const numeric = label.replace(/^SGD\s*/u, '').replaceAll(',', '').trim();
  if (!/^\d+(?:\.\d+)?$/u.test(numeric)) return fallback;
  const value = Number(numeric);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  if (value >= 1_000_000) return `S$${(value / 1_000_000).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}M`;
  return `S$${Math.round(value / 1_000)}K`;
}

export function SingaporeExplorer({
  model,
  hdbModel = { status: 'unavailable' },
  googleMapsBrowserKey = null,
  initialQuery = '',
  initialSegment = null,
  initialDistrict = 'all',
  initialSort = 'transactions',
  initialPage = 1,
  initialProjectId = null,
}: Readonly<{
  model: SingaporeExploreModel;
  hdbModel?: HdbExploreModel;
  googleMapsBrowserKey?: string | null;
  initialQuery?: string;
  initialSegment?: 'CCR' | 'RCR' | 'OCR' | null;
  initialDistrict?: string;
  initialSort?: 'transactions' | 'name';
  initialPage?: number;
  initialProjectId?: string | null;
}>) {
  const [selectedSegment, setSelectedSegment] = useState<'CCR' | 'RCR' | 'OCR' | null>(initialSegment);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId);
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);
  const [district, setDistrict] = useState(initialDistrict);
  const [page, setPage] = useState(initialPage);
  const [sort, setSort] = useState<string>(initialSort);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const segments = model.status === 'ready' ? model.segments : [];
  const selected = segments.find((segment) => segment.code === selectedSegment);
  const allProjects = useMemo(() => model.status === 'ready' ? model.segments.flatMap((segment) => (segment.projects ?? []).map((project) => ({ ...project, segment: segment.code }))) : [], [model]);
  const searchIndex = useMemo(() => allProjects.map((project) => ({
    project, term: `${project.name} ${project.street} ${project.district} district ${Number(project.district)} ${project.segment}`.toLocaleLowerCase('en'),
  })), [allProjects]);
  const orderedProjects = useMemo(() => searchIndex.filter(({ project }) =>
    (selectedSegment === null || project.segment === selectedSegment)
    && (district === 'all' || project.district === district))
    .sort(({project: a}, {project: b}) => sort === 'name' ? a.name.localeCompare(b.name) : b.n - a.n || a.name.localeCompare(b.name)),
  [searchIndex, district, selectedSegment, sort]);
  const projects = useMemo(() => {
    const term = deferredQuery.trim().toLocaleLowerCase('en');
    return orderedProjects.filter((item) => item.term.includes(term)).map(({ project }) => project);
  }, [orderedProjects, deferredQuery]);
  const pageCount = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
  const activePage = Math.min(Math.max(1, page), pageCount);
  const visible = useMemo(() => projects.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE), [activePage, projects]);
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const districtCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of allProjects.filter((candidate) => selectedSegment === null || candidate.segment === selectedSegment)) {
      counts.set(project.district, (counts.get(project.district) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [allProjects, selectedSegment]);
  const hasFilters = query.trim() !== '' || selectedSegment !== null || district !== 'all' || sort !== 'transactions';

  useEffect(() => {
    const href = buildSingaporeExploreHref({
      query,
      selectedSegment,
      district,
      sort,
      page: activePage,
      selectedProjectId: selectedProject?.id ?? null,
    });
    if (`${window.location.pathname}${window.location.search}` !== href) window.history.replaceState(null, '', href);
  }, [activePage, district, query, selectedProject, selectedSegment, sort]);
  const selectSegment = useCallback((segment: 'CCR' | 'RCR' | 'OCR' | null) => {
    setSelectedSegment(segment); setSelectedProjectId(null); setDistrict('all'); setPage(1);
  }, []);
  const onMapSelect = useCallback((id: string) => {
    if (id.startsWith('project-')) setSelectedProjectId(id.slice(8));
    if (id.startsWith('district-')) { setDistrict(id.slice(9)); setPage(1); setSelectedProjectId(null); }
  }, []);
  const mapCoverage = useMemo(() => buildSingaporeMapCoverage(projects, allProjects, selectedProjectId), [projects, allProjects, selectedProjectId]);
  const mapPoints = useMemo(() => {
    const byId = new Map(projects.map(project => [`project-${project.id}`, project]));
    return mapCoverage.points.map(point => {
      const project = byId.get(point.id);
      return project === undefined ? point : { ...point,
        label: formatSingaporeMapPrice(project.medianPriceLabel, project.name) };
    });
  }, [mapCoverage.points, projects]);
  const layers = <>
    <MarketLayerControl label="Singapore market layers" items={[
      { id: 'ura', label: 'URA private sales', href: '#ura-private', current: true },
      { id: 'resale', label: 'HDB resale', href: '#hdb-resale' },
      { id: 'rent', label: 'HDB rent', href: '#hdb-rent' },
    ]} />
    <div className={`${searchStyles.search} ${styles.exploreFilters}`}>
      <form role="search" onSubmit={(event) => { event.preventDefault(); setPage(1); }}>
        <label className={searchStyles.query}>Search Singapore projects<input name="q" type="search" value={query} placeholder="Project, street or district number" onChange={(event) => { setQuery(event.currentTarget.value); setPage(1); setSelectedProjectId(null); }} /></label>
        <label>District<select value={district} onChange={(event) => { setDistrict(event.currentTarget.value); setPage(1); setSelectedProjectId(null); }}><option value="all">All districts</option>{districtCounts.map(([value, count]) => <option key={value} value={value}>District {value} · {count.toLocaleString('en')} projects</option>)}</select></label>
        <label>Sort<select value={sort} onChange={(event) => { setSort(event.currentTarget.value); setPage(1); }}><option value="transactions">Most transactions</option><option value="name">Project name</option></select></label>
        {hasFilters ? <button type="button" className={styles.clearFilters} onClick={() => { setQuery(''); setSelectedSegment(null); setDistrict('all'); setSort('transactions'); setPage(1); setSelectedProjectId(null); }}>Clear filters</button> : null}
      </form>
    </div>
  </>;
  if (model.status === 'unavailable') return <SingaporePage currentHref="/sg/singapore/explore/" unframed><h1>Explore</h1><p>{model.message}</p><HdbMarketPanel model={hdbModel} /></SingaporePage>;
  return <SingaporePage currentHref="/sg/singapore/explore/" unframed>
    <div data-singapore-explore-workspace="true" data-singapore-evidence="ready" data-navigation-state={pendingHref === null ? 'idle' : 'pending'}>
      <MarketExploreShell eyebrow="Singapore" title="Explore" period={<>{model.periodLabel}</>} layers={layers}
        discovery={<section className={styles.segmentPanel} id="ura-private" aria-labelledby="segment-heading">
          <h2 id="segment-heading">Private residential projects</h2>
          <p className={styles.marketScopeLine}>URA private sales · New sale, Subsale and Resale<br />{model.transactionLabel}</p>
          <div className={styles.segmentTabs} role="tablist" aria-label="Singapore market regions">
            <button type="button" role="tab" aria-selected={selectedSegment === null} onClick={() => selectSegment(null)}><strong>All</strong><span>{allProjects.length.toLocaleString('en')}</span></button>
            {segments.map((segment) => <button key={segment.code} type="button" role="tab" aria-selected={selectedSegment === segment.code} onClick={() => selectSegment(segment.code)}><strong>{segment.code}</strong><span>{segment.projectCount.toLocaleString('en')}</span></button>)}
          </div>
          {selected ? <div className={styles.segmentList}><article className={styles.segmentRow}><h3>{selected.code}</h3><div><strong>{selected.medianPriceLabel ?? 'Not published'}</strong><span>{selected.n} transactions · {selected.projectCount} projects</span></div>{selected.state === 'published' ? <Link href={selected.href} aria-busy={pendingHref === selected.href} data-navigation-state={pendingHref === selected.href ? 'pending' : 'idle'} onClick={() => setPendingHref(selected.href)}>Open {selected.code} evidence</Link> : <span data-evidence-link="unavailable">At least 5 transactions are required</span>}</article></div> : null}
          <div className={styles.projectList} aria-live="polite" aria-busy={query !== deferredQuery}>
            <header><span>{projects.length.toLocaleString('en')} matching projects</span><small>{projects.length === 0 ? 'No matches' : `${(activePage - 1) * PAGE_SIZE + 1}–${Math.min(activePage * PAGE_SIZE, projects.length)} shown`}</small></header>
            {projects.length === 0 ? <p>No projects match these filters. Try a different name or district.</p> : null}
            {visible.map((project) => <div key={project.id} data-selected={selectedProjectId === project.id}>
              <button type="button" aria-pressed={selectedProjectId === project.id} onClick={() => setSelectedProjectId((current) => current === project.id ? null : project.id)}><span><strong>{project.name}</strong><small>{project.street} · District {project.district}</small></span><span><strong>{project.medianPriceLabel ?? 'Not published'}</strong><small>{project.n.toLocaleString('en')} {project.n === 1 ? 'sale' : 'sales'}</small></span></button>
              {project.state === 'published' ? <Link href={project.href} aria-label={`Open ${project.name} evidence`} aria-busy={pendingHref === project.href} onClick={() => setPendingHref(project.href)}>Details</Link> : <span className={styles.evidenceUnavailableLink} data-evidence-link="unavailable" title="At least 5 transactions are required">Below 5 sales</span>}
            </div>)}
          </div>
          <nav className={styles.projectPagination} aria-label="Project result pages"><button type="button" disabled={activePage === 1} onClick={() => { setPage(activePage - 1); setSelectedProjectId(null); }}>Previous</button><span>Page {activePage} of {pageCount}</span><button type="button" disabled={activePage >= pageCount} onClick={() => { setPage(activePage + 1); setSelectedProjectId(null); }}>Next</button></nav>
        </section>}
        spatial={<section className={styles.exploreMap} aria-labelledby="singapore-map-heading">
          <header className={styles.mapHeading}><div><h2 id="singapore-map-heading">Project locations</h2>
            <p>{mapCoverage.total.toLocaleString('en')} matching projects across all result pages · {mapCoverage.located.toLocaleString('en')} with source coordinates · {mapCoverage.areaOnly.toLocaleString('en')} area-only · {mapCoverage.unplaced.toLocaleString('en')} without a map reference.</p>
            <p>Location clusters expand as you zoom. Dashed groups use a reference from known projects in the same postal district, not the locations of the missing projects.</p>
          </div></header>
          <GooglePlaceMap browserKey={googleMapsBrowserKey} points={mapPoints} onSelectPoint={onMapSelect} showAddressSearch={false} />
          {mapCoverage.unplacedGroups.length > 0 ? <div className={styles.mapUnplaced}>
            <p>These district totals remain in the results; no reliable map reference is available yet.</p>
            {mapCoverage.unplacedGroups.map(group => <button type="button" key={group.district} onClick={() => onMapSelect(`district-${group.district}`)}>District {group.district} · {group.count.toLocaleString('en')} projects</button>)}
          </div> : null}
          {selectedProject ? <aside className={styles.mapSelection}><button type="button" aria-label="Close project preview" onClick={() => setSelectedProjectId(null)}>Close</button><h3>{selectedProject.name}</h3><p>{selectedProject.street} · District {selectedProject.district} · {selectedProject.segment}</p><strong>{selectedProject.medianPriceLabel ?? 'Not published'}</strong><span>{selectedProject.medianPsfLabel ?? `${selectedProject.n} reported sales`}</span>{selectedProject.state === 'published' ? <Link href={selectedProject.href}>Open project evidence</Link> : null}</aside> : null}
        </section>}
      />
    </div>
    <HdbMarketPanel model={hdbModel} /><SingaporeEvidence model={model.evidence} compact />
  </SingaporePage>;
}
