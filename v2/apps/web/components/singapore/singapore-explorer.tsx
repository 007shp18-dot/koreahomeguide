'use client';
import { requestSingaporeExplore } from '../../lib/singapore/explore-request';
import { RegionContextPhoto } from './region-context-photo';
import { sgText } from '../../lib/locale/singapore-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';

import { retainPassportContext } from '../../lib/passport/journey';

import { singaporeProjectSearchTerm } from '../../lib/singapore/project-display-name';

import { PassportLink as Link } from '../passport/passport-journey';
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { SingaporeExploreModel } from '../../lib/singapore/route-types';
import { unpackSingaporeExploreModel, type PackedSingaporeExploreModel } from '../../lib/singapore/explore-transport';
import { SingaporeProjectDirectory } from './singapore-project-directory';
import type { HdbExploreModel } from '../../lib/singapore/hdb-route-model.server';
import { GooglePlaceMap, type GoogleMarketMapPoint } from '../maps/google-place-map';
import { buildSingaporeAreaMapCoverage, buildSingaporeMapCoverage } from '../../lib/singapore/map-coverage';
import { HdbMarketPanel } from './hdb-market-panel';
import { MarketExploreShell, MarketLayerControl } from '../market-ui/market-shell';
import { SingaporeEvidence, SingaporePage, singaporeStyles as styles } from './singapore-shell';
import searchStyles from '../price-market-search.module.css';

import { selectedResultPage } from '../../lib/navigation/selected-result-page';

const PAGE_SIZE = 24;
const REGION_NAMES = {
  CCR: { en: 'Core Central Region', ko: '핵심 중심 권역' },
  RCR: { en: 'Rest of Central Region', ko: '그 외 중심 권역' },
  OCR: { en: 'Outside Central Region', ko: '외곽 권역' },
} as const;

type SingaporeExplorerState = Readonly<{
  query: string;
  selectedSegment: 'CCR' | 'RCR' | 'OCR' | null;
  district: string;
  sort: string;
  page: number;
  selectedProjectId: string | null;
}>;

export function parseSingaporeExploreSearchParams(params: URLSearchParams): SingaporeExplorerState {
  const region = params.get('region')?.toLocaleUpperCase('en') ?? '';
  const district = params.get('district') ?? '';
  const requestedPage = Number(params.get('page') ?? '1');
  const projectId = params.get('project');
  return Object.freeze({
    query: params.get('q') ?? '',
    selectedSegment: region === 'CCR' || region === 'RCR' || region === 'OCR' ? region : null,
    district: /^(?:0[1-9]|1\d|2[0-8])$/.test(district) ? district : 'all',
    sort: params.get('sort') === 'name' ? 'name' : 'transactions',
    page: Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    selectedProjectId: projectId !== null && /^[a-z0-9:_-]{1,128}$/i.test(projectId) ? projectId : null,
  });
}

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

export function SingaporeExplorer({ locale = 'en',
  model: incomingModel,
  hdbModel = { status: 'unavailable' },
  googleMapsBrowserKey = null,
  initialQuery = '',
  initialSegment = null,
  initialDistrict = 'all',
  initialSort = 'transactions',
  initialPage = 1,
  initialProjectId = null,
  restoreStateFromUrl = false,
  progressive = false,
  regionPoints = [],
  districtSummary = [],
}: Readonly<{ locale?: MarketLocale;
  model: SingaporeExploreModel | PackedSingaporeExploreModel;
  hdbModel?: HdbExploreModel;
  googleMapsBrowserKey?: string | null;
  initialQuery?: string;
  initialSegment?: 'CCR' | 'RCR' | 'OCR' | null;
  initialDistrict?: string;
  initialSort?: 'transactions' | 'name';
  initialPage?: number;
  initialProjectId?: string | null;
  restoreStateFromUrl?: boolean;
  progressive?: boolean;
  regionPoints?: readonly GoogleMarketMapPoint[];
  districtSummary?: readonly { region: string; district: string; count: number }[];
}>) {
  const overview = useMemo(() => unpackSingaporeExploreModel(incomingModel), [incomingModel]);
  const [results, setResults] = useState<Readonly<Record<string, { model: SingaporeExploreModel | null; error: boolean }>>>({});
  const [retry, setRetry] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState<'CCR' | 'RCR' | 'OCR' | null>(initialSegment);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId);
  const [lookupProjectId, setLookupProjectId] = useState<string | null>(initialProjectId);
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);
  const [showAreaReferences, setShowAreaReferences] = useState(false);
  const [district, setDistrict] = useState(initialDistrict);
  const [page, setPage] = useState(initialPage);
  const [sort, setSort] = useState<string>(initialSort);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [urlStateReady, setUrlStateReady] = useState(!restoreStateFromUrl);
  const needsProjects = progressive && urlStateReady && (selectedSegment !== null || deferredQuery.trim() !== '' || district !== 'all' || lookupProjectId !== null);
  // A loaded region contains all its districts: refine it locally instead of
  // clearing the map and starting another server request on every click/key.
  const requestQuery = selectedSegment === null ? deferredQuery : '';
  const requestDistrict = selectedSegment === null ? district : 'all';
  const requestProject = selectedSegment === null && !requestQuery.trim() && requestDistrict === 'all' ? lookupProjectId : null;
  const requestKey = JSON.stringify([selectedSegment, requestQuery, requestDistrict, requestProject, retry]);
  const currentResult = needsProjects ? results[requestKey] ?? null : null;
  const loadedModel = currentResult?.model ?? null;
  const model = loadedModel ?? overview;
  const loadingProjects = needsProjects && currentResult === null;
  const loadError = currentResult?.error ?? false;
  useEffect(() => {
    if (!needsProjects || currentResult !== null) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams();
      if (selectedSegment) params.set('region', selectedSegment);
      if (requestQuery.trim()) params.set('q', requestQuery.trim().slice(0, 100));
      if (requestDistrict !== 'all') params.set('district', requestDistrict);
      if (requestProject) params.set('project', requestProject);
      try {
        const payload = await requestSingaporeExplore(`/api/singapore/explore/?${params}`, controller.signal);
        const next = unpackSingaporeExploreModel(payload as PackedSingaporeExploreModel);
        if (!controller.signal.aborted) setResults(previous => ({ ...Object.fromEntries(Object.entries(previous).slice(-11)), [requestKey]: { model: next, error: false } }));
      } catch { if (!controller.signal.aborted) setResults(previous => ({ ...previous, [requestKey]: { model: null, error: true } })); }
    }, requestQuery.trim() ? 200 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [needsProjects, requestKey, selectedSegment, requestQuery, requestDistrict, requestProject, currentResult]);
  const segments = model.status === 'ready' ? model.segments : [];
  const regionNavigation = overview.status === 'ready' ? overview.segments : segments;
  const selected = segments.find((segment) => segment.code === selectedSegment);
  const allProjects = useMemo(() => model.status === 'ready' ? model.segments.flatMap((segment) => (segment.projects ?? []).map((project) => ({ ...project, segment: segment.code }))) : [], [model]);
  const searchIndex = useMemo(() => allProjects.map((project) => ({
    project, term: singaporeProjectSearchTerm(`${project.name} ${project.street} ${project.district} district ${Number(project.district)} ${project.segment}`),
  })), [allProjects]);
  const orderedProjects = useMemo(() => searchIndex.filter(({ project }) =>
    (selectedSegment === null || project.segment === selectedSegment)
    && (district === 'all' || project.district === district))
    .sort(({project: a}, {project: b}) => sort === 'name' ? a.name.localeCompare(b.name) : b.n - a.n || a.name.localeCompare(b.name)),
  [searchIndex, district, selectedSegment, sort]);
  const projects = useMemo(() => {
    const term = singaporeProjectSearchTerm(deferredQuery.trim());
    return orderedProjects.filter((item) => item.term.includes(term)).map(({ project }) => project);
  }, [orderedProjects, deferredQuery]);
  const pageCount = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
  const activePage = selectedResultPage(projects.map(project => project.id), selectedProjectId, page, PAGE_SIZE);
  const visible = useMemo(() => projects.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE), [activePage, projects]);
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const districtCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (progressive) {
      for (const item of districtSummary) if (selectedSegment === null || item.region === selectedSegment) counts.set(item.district, (counts.get(item.district) ?? 0) + item.count);
      return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
    }
    for (const project of allProjects.filter((candidate) => selectedSegment === null || candidate.segment === selectedSegment)) {
      counts.set(project.district, (counts.get(project.district) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [allProjects, selectedSegment, progressive, districtSummary]);
  const hasFilters = query.trim() !== '' || selectedSegment !== null || district !== 'all' || sort !== 'transactions' || lookupProjectId !== null;

  useEffect(() => {
    if (!restoreStateFromUrl) return;
    const restored = parseSingaporeExploreSearchParams(new URLSearchParams(window.location.search));
    const frame = window.requestAnimationFrame(() => {
      setQuery(restored.query);
      setSelectedSegment(restored.selectedSegment);
      setDistrict(restored.district);
      setSort(restored.sort);
      setPage(restored.page);
      setSelectedProjectId(restored.selectedProjectId);
      setLookupProjectId(restored.selectedProjectId);
      setUrlStateReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [restoreStateFromUrl]);

  useEffect(() => {
    if (!urlStateReady || (progressive && (loadingProjects || (loadedModel === null && (selectedSegment !== null || query.trim() !== '' || district !== 'all' || lookupProjectId !== null))))) return;
    const href = retainPassportContext(marketHref(locale, buildSingaporeExploreHref({
      query,
      selectedSegment,
      district,
      sort,
      page: activePage,
      selectedProjectId: selectedProjectId,
    })), window.location.href);
    if (`${window.location.pathname}${window.location.search}` !== href) window.history.replaceState(null, '', href);
  }, [activePage, district, query, selectedProjectId, selectedSegment, sort, urlStateReady, locale, progressive, loadingProjects, loadedModel, lookupProjectId]);
  const selectSegment = useCallback((segment: 'CCR' | 'RCR' | 'OCR' | null) => {
    setSelectedSegment(segment); setLookupProjectId(null); setSelectedProjectId(null); setDistrict('all'); setPage(1);
  }, []);
  const onMapSelect = useCallback((id: string) => {
    if (id.startsWith('region-')) { selectSegment(id.slice(7) as 'CCR' | 'RCR' | 'OCR'); return; }
    if (id.startsWith('project-')) setSelectedProjectId(id.slice(8));
    if (id.startsWith('district-')) { setDistrict(id.slice(9)); setPage(1); setSelectedProjectId(null); }
  }, [selectSegment]);
  const mapLevel = district !== 'all' || deferredQuery.trim() !== '' || selectedProjectId !== null
    ? 'projects'
    : selectedSegment === null ? 'regions' : 'districts';
  const projectMapCoverage = useMemo(() => mapLevel === 'projects'
    ? buildSingaporeMapCoverage(visible, allProjects, selectedProjectId)
    : buildSingaporeMapCoverage([], [], null), [visible, allProjects, selectedProjectId, mapLevel]);
  const areaMapCoverage = useMemo(() => mapLevel === 'projects'
    ? buildSingaporeAreaMapCoverage([], [], 'district')
    : mapLevel === 'regions'
    ? buildSingaporeAreaMapCoverage(projects, allProjects, 'region')
    : buildSingaporeAreaMapCoverage(projects, allProjects, 'district'), [allProjects, mapLevel, projects]);
  const activeMapPoints = progressive && (mapLevel === 'regions' || loadingProjects) ? regionPoints : mapLevel === 'projects' ? projectMapCoverage.points : areaMapCoverage.points;
  const mapPoints = useMemo(() => {
    const byId = new Map(projects.map(project => [`project-${project.id}`, project]));
    return activeMapPoints.filter(point => mapLevel !== 'projects' || showAreaReferences || point.kind !== 'area' || point.selected === true).map(point => {
      const project = byId.get(point.id);
      return project === undefined ? { ...point, title: sgText(locale, point.title), label: sgText(locale, point.label) } : { ...point,
        label: project.name };
    });
  }, [activeMapPoints, projects, mapLevel, showAreaReferences, locale]);
  const layers = <>
    <MarketLayerControl locale={locale} label={sgText(locale, "Singapore market layers")} items={[
      { id: 'ura', label: 'URA private sales', href: '#ura-private', current: true },
      { id: 'resale', label: 'HDB resale', href: '#hdb-resale' },
      { id: 'rent', label: 'HDB rent', href: '#hdb-rent' },
    ]} />
    <div className={`${searchStyles.search} ${styles.exploreFilters}`}>
      <form role="search" onSubmit={(event) => { event.preventDefault(); setPage(1); }}>
        <label className={searchStyles.query}>{sgText(locale, "Search Singapore projects")}<input name="q" type="search" value={query} placeholder={sgText(locale, "Project, street or district number")} onChange={(event) => { setQuery(event.currentTarget.value); setLookupProjectId(null); setPage(1); setSelectedProjectId(null); }} /></label>
        <label>{sgText(locale, "District")}<select value={district} onChange={(event) => { setDistrict(event.currentTarget.value); setLookupProjectId(null); setPage(1); setSelectedProjectId(null); }}><option value="all">{sgText(locale, "All districts")}</option>{districtCounts.map(([value, count]) => <option key={value} value={value}>{sgText(locale, "District ")}{sgText(locale, value)}{sgText(locale, " · ")}{sgText(locale, count.toLocaleString('en'))}{sgText(locale, " projects")}</option>)}</select></label>
        <label>{sgText(locale, "Sort")}<select value={sort} onChange={(event) => { setSort(event.currentTarget.value); setPage(1); }}><option value="transactions">{sgText(locale, "Most transactions")}</option><option value="name">{sgText(locale, "Project name")}</option></select></label>
        {hasFilters ? <button type="button" className={styles.clearFilters} onClick={() => { setQuery(''); setLookupProjectId(null); setSelectedSegment(null); setDistrict('all'); setSort('transactions'); setPage(1); setSelectedProjectId(null); }}>{sgText(locale, "Clear filters")}</button> : null}
      </form>
    </div>
  </>;
  if (model.status === 'unavailable') return <SingaporePage locale={locale} currentHref={marketHref(locale, "/sg/singapore/explore/")} unframed><div className={styles.exploreSupportingContent}><h1>{sgText(locale, "Explore")}</h1><p>{sgText(locale, model.message)}</p><HdbMarketPanel locale={locale} model={hdbModel} /></div></SingaporePage>;
  return <SingaporePage locale={locale} currentHref={marketHref(locale, "/sg/singapore/explore/")} unframed>
    <div data-singapore-explore-workspace="true" data-singapore-evidence="ready" data-navigation-state={pendingHref === null ? 'idle' : 'pending'}>
      <MarketExploreShell locale={locale} eyebrow={sgText(locale, "Singapore")} title={sgText(locale, "Explore")} period={<>{sgText(locale, model.periodLabel)}</>} layers={layers}
        discovery={<section className={styles.segmentPanel} id="ura-private" aria-labelledby="segment-heading">
          <h2 id="segment-heading">{sgText(locale, "Private residential projects")}</h2>
          <p className={styles.marketScopeLine}>{sgText(locale, "URA private sales · New sale, Subsale and Resale")}<br />{sgText(locale, model.transactionLabel)}</p>
          <div className={styles.segmentTabs} role="tablist" aria-label={sgText(locale, "Singapore market regions")}>
            <button type="button" role="tab" aria-selected={selectedSegment === null} onClick={() => selectSegment(null)}><strong>{sgText(locale, "All")}</strong><small>{locale === 'ko' ? '싱가포르 전체' : 'Singapore'}</small><span>{sgText(locale, regionNavigation.reduce((sum, segment) => sum + segment.projectCount, 0).toLocaleString('en'))}</span></button>
            {regionNavigation.map((segment) => <button key={segment.code} type="button" role="tab" aria-selected={selectedSegment === segment.code} onClick={() => selectSegment(segment.code)}><strong>{sgText(locale, segment.code)}</strong><small>{REGION_NAMES[segment.code][locale]}</small><span>{sgText(locale, segment.projectCount.toLocaleString('en'))}</span></button>)}
          </div>
          {selectedSegment !== null ? <nav className={styles.districtChoices} aria-label={locale === 'ko' ? '선택 권역의 우편구역' : 'Districts in selected region'}>
            <button type="button" aria-pressed={district === 'all'} onClick={() => { setDistrict('all'); setPage(1); setSelectedProjectId(null); }}>{locale === 'ko' ? '전체 단지' : 'All projects'}</button>
            {districtCounts.map(([value, count]) => <button key={value} type="button" aria-pressed={district === value} onClick={() => { setDistrict(value); setPage(1); setSelectedProjectId(null); }}><span>{locale === 'ko' ? '우편구역 ' : 'District '}{value}</span><small>{count.toLocaleString('en')}</small></button>)}
          </nav> : null}
          {selected ? <div className={styles.segmentList}><article className={styles.segmentRow}><RegionContextPhoto region={selected.code} locale={locale} /><h3>{sgText(locale, selected.code)}</h3><div><strong>{sgText(locale, selected.medianPriceLabel ?? 'Not published')}</strong><span>{sgText(locale, selected.n.toLocaleString('en'))}{sgText(locale, " transactions · ")}{sgText(locale, selected.projectCount.toLocaleString('en'))}{sgText(locale, " projects")}</span></div>{selected.state === 'published' ? <Link href={marketHref(locale, selected.href)} aria-busy={pendingHref === selected.href} data-navigation-state={pendingHref === selected.href ? 'pending' : 'idle'} onClick={() => setPendingHref(selected.href)}>{sgText(locale, "Open ")}{sgText(locale, selected.code)}{sgText(locale, " evidence")}</Link> : <span data-evidence-link="unavailable">{sgText(locale, "At least 5 transactions are required")}</span>}</article></div> : null}
          <div className={styles.projectList} aria-live="polite" aria-busy={loadingProjects || query !== deferredQuery}>
            {!loadingProjects && !loadError && (!progressive || loadedModel !== null) ? (<header><span>{sgText(locale, projects.length.toLocaleString('en'))}{sgText(locale, " matching projects")}</span><small>{sgText(locale, projects.length === 0 ? 'No matches' : `${(activePage - 1) * PAGE_SIZE + 1}–${Math.min(activePage * PAGE_SIZE, projects.length)} shown`)}</small></header>) : null}
            {loadingProjects ? <p role="status">{locale === 'ko' ? '선택한 지역을 불러오는 중…' : 'Loading selected area…'}</p> : loadError ? <p role="alert">{locale === 'ko' ? '불러오지 못했습니다.' : 'Could not load projects.'} <button type="button" onClick={() => setRetry(value => value + 1)}>{locale === 'ko' ? '다시 시도' : 'Retry'}</button></p> : progressive && loadedModel === null ? <section className={styles.exploreStart} aria-label={locale === 'ko' ? '탐색 시작' : 'Start exploring'}>
              <span className={styles.exploreStartKicker}>{locale === 'ko' ? '단지 찾기' : 'Find your neighbourhood'}</span>
              <h3>{locale === 'ko' ? '어느 지역을 살펴볼까요?' : 'Where would you like to look?'}</h3>
              <p>{locale === 'ko' ? '위 권역이나 지도에서 시작하세요. 단지 이름으로 바로 검색할 수도 있어요.' : 'Start with a region above or on the map. Already have a project in mind? Search by name.'}</p>
              <ol className={styles.exploreSteps}><li>{locale === 'ko' ? '권역' : 'Region'}</li><li>{locale === 'ko' ? '우편구역' : 'District'}</li><li>{locale === 'ko' ? '단지·실거래' : 'Projects & sales'}</li></ol>
            </section> : projects.length === 0 ? <p>{sgText(locale, "No projects match these filters. Try a different name or district.")}</p> : null}
            {(!loadingProjects && !loadError ? visible : []).map((project) => <div key={project.id} data-selected={selectedProjectId === project.id}>
              <button type="button" aria-pressed={selectedProjectId === project.id} onClick={() => setSelectedProjectId((current) => current === project.id ? null : project.id)}><span><strong title={project.name}>{project.name}</strong><small title={sgText(locale, `${project.street} · District ${project.district}`)}>{project.street}{sgText(locale, " · District ")}{sgText(locale, project.district)}</small></span><span><strong>{sgText(locale, project.medianPriceLabel ?? 'Not published')}</strong><small>{sgText(locale, project.n.toLocaleString('en'))}{sgText(locale, " ")}{sgText(locale, project.n === 1 ? 'sale' : 'sales')}</small></span></button>
              {project.state === 'published' ? <Link prefetch={false} href={marketHref(locale, project.href)} aria-label={sgText(locale, `Open ${project.name} evidence`)} aria-busy={pendingHref === project.href} onClick={() => setPendingHref(project.href)}>{sgText(locale, "Details")}</Link> : <span className={styles.evidenceUnavailableLink} data-evidence-link="unavailable" title={sgText(locale, "At least 5 transactions are required")}>{sgText(locale, "Below 5 sales")}</span>}
            </div>)}
          </div>
          {!loadingProjects && !loadError && projects.length > 0 && <nav className={styles.projectPagination} aria-label={sgText(locale, "Project result pages")}><button type="button" disabled={activePage === 1} onClick={() => { setPage(activePage - 1); setSelectedProjectId(null); }}>{sgText(locale, "Previous")}</button><span>{sgText(locale, "Page ")}{sgText(locale, activePage)}{sgText(locale, " of ")}{sgText(locale, pageCount)}</span><button type="button" disabled={activePage >= pageCount} onClick={() => { setPage(activePage + 1); setSelectedProjectId(null); }}>{sgText(locale, "Next")}</button></nav>}
        </section>}
        spatial={<section className={styles.exploreMap} aria-labelledby="singapore-map-heading" data-singapore-map-level={mapLevel}>
          <header className={styles.mapHeading}>
            <h2 id="singapore-map-heading">{sgText(locale, mapLevel === 'regions' ? 'Market regions' : mapLevel === 'districts' ? 'Postal districts' : 'Project locations')}</h2>
            <p>{mapLevel === 'projects'
              ? locale === 'ko' ? '마커를 선택하세요. 지역 묶음은 대략적인 위치입니다.' : 'Select a marker; district groups are approximate.'
              : mapLevel === 'regions'
                ? locale === 'ko' ? '권역을 선택해 우편구역을 살펴보세요.' : 'Choose a region to see its districts.'
                : locale === 'ko' ? '우편구역을 선택해 단지 위치를 살펴보세요.' : 'Choose a district to see project locations.'}</p>
          </header>
          <details className={`${styles.evidenceDisclosure} ${styles.mapCoverage}`}>
            <summary>{locale === 'ko' ? '지도 범위' : 'Map coverage'}</summary>
            <div className={styles.disclosureBody}>
              {mapLevel === 'projects' ? <>
                <p>{sgText(locale, projectMapCoverage.total.toLocaleString('en'))}{sgText(locale, " projects on this page · ")}{sgText(locale, projectMapCoverage.located.toLocaleString('en'))}{sgText(locale, " with source coordinates · ")}{sgText(locale, projectMapCoverage.areaOnly.toLocaleString('en'))}{sgText(locale, " area-only · ")}{sgText(locale, projectMapCoverage.unplaced.toLocaleString('en'))}{sgText(locale, " without a map reference.")}</p>
                <p>{sgText(locale, "Markers use source coordinates. Select a project for its transactions. Projects without exact coordinates stay in the list; area references show their approximate district.")}</p>
                <label className={styles.mapCoverageToggle}><input type="checkbox" checked={showAreaReferences} onChange={event => setShowAreaReferences(event.currentTarget.checked)} /> <span>{sgText(locale, " Show approximate district groups")}</span></label>
              </> : <p>{sgText(locale, areaMapCoverage.total.toLocaleString('en'))}{sgText(locale, " matching projects across all result pages · choose a ")}{sgText(locale, mapLevel === 'regions' ? 'market region' : 'postal district')}{sgText(locale, " to open its full project map.")}</p>}
              {mapLevel === 'projects' && projectMapCoverage.unplacedGroups.length > 0 ? <div className={styles.mapUnplaced}>
                <p>{sgText(locale, "These district totals remain in the results; no reliable map reference is available yet.")}</p>
                {projectMapCoverage.unplacedGroups.map(group => <button type="button" key={group.district} onClick={() => onMapSelect(`district-${group.district}`)}>{sgText(locale, "District ")}{sgText(locale, group.district)}{sgText(locale, " · ")}{sgText(locale, group.count.toLocaleString('en'))}{sgText(locale, " projects")}</button>)}
              </div> : null}
              {mapLevel !== 'projects' && areaMapCoverage.unplacedGroups.length > 0 ? <div className={styles.mapUnplaced}>
                <p>{sgText(locale, areaMapCoverage.unplaced.toLocaleString('en'))}{sgText(locale, " projects remain selectable while their area reference is unavailable.")}</p>
                {areaMapCoverage.unplacedGroups.map(group => <button type="button" key={group.id} onClick={() => onMapSelect(group.id)}>{sgText(locale, group.label)}{sgText(locale, " · ")}{sgText(locale, group.count.toLocaleString('en'))}{sgText(locale, " projects")}</button>)}
              </div> : null}
            </div>
          </details>
          <GooglePlaceMap locale={locale} browserKey={googleMapsBrowserKey} points={mapPoints} onSelectPoint={onMapSelect} showAddressSearch={false} clusterLocations={true} />
          {selectedProject ? <aside className={styles.mapSelection}><button type="button" aria-label={sgText(locale, "Close project preview")} onClick={() => setSelectedProjectId(null)}>{sgText(locale, "Close")}</button><h3>{selectedProject.name}</h3><p>{selectedProject.street}{sgText(locale, " · District ")}{sgText(locale, selectedProject.district)}{sgText(locale, " · ")}{sgText(locale, selectedProject.segment)}</p>{!selectedProject.location ? <p>{sgText(locale, projectMapCoverage.points.some(point => point.kind === 'area' && point.selected) ? 'Approximate district location' : 'Project location unavailable')}</p> : null}<strong>{sgText(locale, selectedProject.medianPriceLabel ?? 'Not published')}</strong><span>{sgText(locale, selectedProject.medianPsfLabel ?? `${selectedProject.n} reported sales`)}</span>{selectedProject.state === 'published' ? <Link href={marketHref(locale, selectedProject.href)}>{sgText(locale, "Open project evidence")}</Link> : null}</aside> : null}
        </section>}
      />
    </div>
    <div className={styles.exploreSupportingContent}>
    {progressive ? <details className={styles.regionDirectory}>
      <summary>{locale === 'ko' ? '권역별 가격·단지 살펴보기' : 'Regional prices & project directories'}</summary>
      <nav aria-label={locale === 'ko' ? '권역별 전체 단지' : 'All projects by region'}>{regionNavigation.map(segment => <Link key={segment.code} prefetch={false} href={marketHref(locale, segment.href)}><strong>{segment.code}</strong><span>{REGION_NAMES[segment.code][locale]}</span><small>{segment.projectCount.toLocaleString('en')} {locale === 'ko' ? '단지' : 'projects'} <span aria-hidden="true">↗</span></small></Link>)}</nav>
    </details> : <SingaporeProjectDirectory segments={segments} locale={locale} />}
    <p><Link href={marketHref(locale, "/guides/singapore-condo-buying-budget-guide/")}>{sgText(locale, "Condo buying guide: budgets, costs and ownership checks")}</Link></p>
    <HdbMarketPanel locale={locale} model={hdbModel} /><SingaporeEvidence locale={locale} model={model.evidence} compact />
    </div>
  </SingaporePage>;
}
