'use client';

import Link from 'next/link';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  buildDubaiExploreHref,
  DUBAI_EXPLORE_PAGE_SIZE,
  filterDubaiExploreResults,
} from '../../lib/dubai/explore-model';
import { DUBAI_AREAS, DUBAI_SOURCES, filterDubaiAreas } from '../../lib/dubai/research';
import type { DubaiExploreModel } from '../../lib/dubai/route-types';
import { GooglePlaceMap, type GoogleMarketMapPoint } from '../maps/google-place-map';
import { MarketExploreShell } from '../market-ui/market-shell';
import styles from './dubai-research.module.css';

const unavailableModel = Object.freeze({
  status: 'unavailable' as const,
  message: 'Verified Dubai area evidence unavailable' as const,
});
const integer = new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 });
const money = (value: number) => `AED\u00a0${integer.format(value)}`;
const moneyPerSqm = (value: number) => `${money(value)}/m²`;
const moneyPerYear = (value: number) => `${money(value)}/year`;

function compactMoney(value: number): string {
  if (value >= 1_000_000) return `AED ${(value / 1_000_000).toFixed(2).replace(/0+$/u, '').replace(/\.$/u, '')}M`;
  return `AED ${Math.round(value / 1_000)}K`;
}

function CuratedDubaiExplorer({
  browserKey,
  initialQuery,
  initialArea,
}: Readonly<{
  browserKey: string | null;
  initialQuery: string;
  initialArea: string;
}>) {
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState(initialArea);
  const areas = useMemo(() => filterDubaiAreas(query), [query]);
  const area = areas.find(({ id }) => id === selected);
  const select = useCallback((id: string) => {
    setSelected(id);
    const url = new URL(window.location.href);
    url.searchParams.set('area', id);
    window.history.replaceState(null, '', url);
  }, []);
  const points = useMemo(() => areas.map((item) => ({
    id: item.id,
    title: item.name,
    label: item.name,
    address: `${item.name}, Dubai, United Arab Emirates`,
    selected: selected === item.id,
  })), [areas, selected]);
  return <MarketExploreShell
    eyebrow="Dubai"
    title="Explore"
    period="Area research"
    layers={<div className={styles.toolbar}>
      <label>Find an area<input
        type="search"
        value={query}
        placeholder="Area name"
        onChange={(event) => {
          const value = event.currentTarget.value;
          setQuery(value);
          setSelected('');
          const url = new URL(window.location.href);
          if (value.trim()) url.searchParams.set('q', value);
          else url.searchParams.delete('q');
          url.searchParams.delete('area');
          window.history.replaceState(null, '', url);
        }}
      /></label>
      <nav className={styles.actions} aria-label="Dubai research">
        <Link href="/ae/dubai/">Market overview</Link>
        <Link href="/ae/dubai/guide/">Buying research guide</Link>
        <Link href="/news/?market=dubai">News</Link>
      </nav>
    </div>}
    discovery={<div className={styles.directory}>
      <h2>Area guide</h2>
      <p>{areas.length} of {DUBAI_AREAS.length} curated areas · Not a property inventory</p>
      <ul>{areas.map((item) => <li key={item.id}><button
        type="button"
        onClick={() => select(item.id)}
        aria-pressed={selected === item.id}
      ><strong>{item.name}</strong><span>{item.kind}</span></button></li>)}</ul>
      {areas.length === 0 ? <p>No area matches. Try Downtown, Marina, Business Bay or Palm.</p> : null}
      {area ? <article className={styles.areaDetail} aria-live="polite">
        <h3>{area.name}</h3><p>{area.description}</p><p>{area.question}</p>
        <a href={area.source} target="_blank" rel="noreferrer">Official neighbourhood guide</a>
        <p><a href={DUBAI_SOURCES.projects} target="_blank" rel="noreferrer">Check a project with DLD</a></p>
      </article> : <p>Select an area to see its location and research questions.</p>}
    </div>}
    spatial={<div className={styles.map}>
      <GooglePlaceMap
        key="dubai"
        market="dubai"
        browserKey={browserKey}
        points={points}
        onSelectPoint={select}
        showAddressSearch={false}
      />
      <p>Markers locate neighbourhoods, not individual buildings or available listings. Area transaction counts and prices are not published here.</p>
    </div>}
  />;
}

export function DubaiExplorer({
  browserKey,
  model = unavailableModel,
  initialQuery = '',
  initialArea = '',
  initialHousing = 'apartment',
  initialStage = 'ready',
  initialBudgetMaximumAed = null,
  initialYieldMinimumPct = null,
  initialPage = 1,
}: Readonly<{
  browserKey: string | null;
  model?: DubaiExploreModel;
  initialQuery?: string;
  initialArea?: string;
  initialHousing?: 'apartment' | 'villa';
  initialStage?: 'ready' | 'off-plan';
  initialBudgetMaximumAed?: number | null;
  initialYieldMinimumPct?: number | null;
  initialPage?: number;
}>) {
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);
  const [selectedArea, setSelectedArea] = useState(initialArea || null);
  const [housing, setHousing] = useState(initialHousing);
  const [stage, setStage] = useState(initialStage);
  const [budgetMaximumAed, setBudgetMaximumAed] = useState(initialBudgetMaximumAed);
  const [yieldMinimumPct, setYieldMinimumPct] = useState(initialYieldMinimumPct);
  const [page, setPage] = useState(initialPage);
  const results = useMemo(() => filterDubaiExploreResults(
    model.status === 'ready' ? model.areas : [], {
      query: deferredQuery,
      housing,
      stage,
      budgetMaximumAed,
      yieldMinimumPct,
    },
  ), [budgetMaximumAed, deferredQuery, housing, model, stage, yieldMinimumPct]);
  const pageCount = Math.max(1, Math.ceil(results.length / DUBAI_EXPLORE_PAGE_SIZE));
  const activePage = Math.min(Math.max(1, page), pageCount);
  const visible = useMemo(() => results.slice(
    (activePage - 1) * DUBAI_EXPLORE_PAGE_SIZE,
    activePage * DUBAI_EXPLORE_PAGE_SIZE,
  ), [activePage, results]);
  const selected = results.find(({ area }) => area.slug === selectedArea);
  const mapPoints = useMemo<readonly GoogleMarketMapPoint[]>(() => visible.map((result) => ({
    id: result.area.slug,
    title: `${result.area.name} · ${housing} · ${stage}`,
    label: compactMoney(result.sale.medianPriceAed),
    address: `${result.area.name}, Dubai, United Arab Emirates`,
    selected: result.area.slug === selectedArea,
  })), [housing, selectedArea, stage, visible]);

  useEffect(() => {
    if (model.status !== 'ready') return;
    const href = buildDubaiExploreHref({
      query,
      housing,
      stage,
      budgetMaximumAed,
      yieldMinimumPct,
      page: activePage,
      selectedArea,
    });
    if (`${window.location.pathname}${window.location.search}` !== href) {
      window.history.replaceState(null, '', href);
    }
  }, [activePage, budgetMaximumAed, housing, model.status, query, selectedArea, stage, yieldMinimumPct]);

  if (model.status === 'unavailable') return <CuratedDubaiExplorer
    browserKey={browserKey}
    initialQuery={initialQuery}
    initialArea={initialArea}
  />;

  const switchStage = (next: 'ready' | 'off-plan') => {
    setStage(next);
    if (next === 'off-plan') setYieldMinimumPct(null);
    setSelectedArea(null);
    setPage(1);
  };
  const clearFilters = () => {
    setQuery('');
    setHousing('apartment');
    setStage('ready');
    setBudgetMaximumAed(null);
    setYieldMinimumPct(null);
    setSelectedArea(null);
    setPage(1);
  };
  const hasFilters = query.trim() !== '' || housing !== 'apartment' || stage !== 'ready'
    || budgetMaximumAed !== null || yieldMinimumPct !== null;

  return <div data-dubai-evidence="ready" data-dubai-explore-workspace="true">
    <MarketExploreShell
      eyebrow="Dubai"
      title="Explore"
      period={`${model.context.comparisonPeriod.from}–${model.context.comparisonPeriod.to}`}
      layers={<div className={styles.evidenceToolbar}>
        <form role="search" onSubmit={(event) => event.preventDefault()}>
          <label className={styles.searchField}>Find an area<input
            name="q"
            type="search"
            value={query}
            placeholder="Area or known community name"
            onChange={(event) => {
              setQuery(event.currentTarget.value);
              setSelectedArea(null);
              setPage(1);
            }}
          /></label>
          <label>Home type<select value={housing} onChange={(event) => {
            setHousing(event.currentTarget.value as 'apartment' | 'villa');
            setSelectedArea(null);
            setPage(1);
          }}><option value="apartment">Apartment</option><option value="villa">Villa</option></select></label>
          <label>Maximum median price<select value={budgetMaximumAed ?? ''} onChange={(event) => {
            setBudgetMaximumAed(event.currentTarget.value === '' ? null : Number(event.currentTarget.value));
            setSelectedArea(null);
            setPage(1);
          }}><option value="">Any budget</option><option value="1000000">AED 1M</option><option value="1500000">AED 1.5M</option><option value="2500000">AED 2.5M</option><option value="5000000">AED 5M</option><option value="10000000">AED 10M</option></select></label>
          {stage === 'ready' ? <label>Minimum gross ratio<select value={yieldMinimumPct ?? ''} onChange={(event) => {
            setYieldMinimumPct(event.currentTarget.value === '' ? null : Number(event.currentTarget.value));
            setSelectedArea(null);
            setPage(1);
          }}><option value="">Any ratio</option><option value="5">5%+</option><option value="6">6%+</option><option value="7">7%+</option><option value="8">8%+</option></select></label> : null}
          {hasFilters ? <button type="button" className={styles.clearFilters} onClick={clearFilters}>Clear filters</button> : null}
        </form>
        <div className={styles.stageTabs} role="tablist" aria-label="Dubai sale stage">
          <button type="button" role="tab" aria-selected={stage === 'ready'} onClick={() => switchStage('ready')}>Ready</button>
          <button type="button" role="tab" aria-selected={stage === 'off-plan'} onClick={() => switchStage('off-plan')}>Off-Plan</button>
        </div>
        <nav className={styles.actions} aria-label="Dubai research">
          <Link href="/ae/dubai/">Market overview</Link>
          <Link href="/ae/dubai/guide/">Buying research guide</Link>
          <Link href="/news/?market=dubai">News</Link>
        </nav>
      </div>}
      discovery={<section className={styles.evidenceDirectory} aria-labelledby="dubai-area-results">
        <header className={styles.resultHeader}>
          <div><h2 id="dubai-area-results">Area prices</h2><p>{results.length.toLocaleString('en')} matching areas · {housing} · {stage}</p></div>
          <small>{results.length === 0 ? 'No matches' : `${(activePage - 1) * DUBAI_EXPLORE_PAGE_SIZE + 1}–${Math.min(activePage * DUBAI_EXPLORE_PAGE_SIZE, results.length)} shown`}</small>
        </header>
        <div className={styles.areaResults} aria-live="polite" aria-busy={query !== deferredQuery}>
          {visible.map(({ area, segment, sale }) => <article key={area.id} data-selected={area.slug === selectedArea}>
            <button type="button" aria-pressed={area.slug === selectedArea} onClick={() => setSelectedArea((current) => current === area.slug ? null : area.slug)}>
              <span><strong>{area.name}</strong><small>{housing === 'apartment' ? 'Apartment' : 'Villa'} · {stage === 'ready' ? 'Ready' : 'Off-Plan'}</small></span>
            </button>
            <dl className={styles.areaMetrics}>
              <div><dt>Median sale price</dt><dd>{money(sale.medianPriceAed)}</dd></div>
              <div><dt>Median AED/m²</dt><dd>{moneyPerSqm(sale.medianPricePerSqmAed)}</dd></div>
              <div><dt>Registered sales</dt><dd>{sale.n.toLocaleString('en')}</dd></div>
              <div><dt>Median annual rent</dt><dd>{moneyPerYear(segment.rent.medianAnnualRentAed)}</dd></div>
              <div><dt>Estimated gross rent-to-price ratio</dt><dd>{stage === 'ready' && segment.readyGrossYieldPct !== null ? `${segment.readyGrossYieldPct.toFixed(1)}%` : 'Not shown for Off-Plan'}</dd></div>
            </dl>
            {area.href === null
              ? <span className={styles.unavailableLink}>Area page unavailable for this release</span>
              : <Link href={area.href}>View area prices</Link>}
          </article>)}
          {results.length === 0 ? <p className={styles.emptyState}>No areas match these filters. Increase the budget or lower the ratio threshold.</p> : null}
        </div>
        <nav className={styles.pagination} aria-label="Dubai area result pages">
          <button type="button" disabled={activePage === 1} onClick={() => { setPage(activePage - 1); setSelectedArea(null); }}>Previous</button>
          <span>Page {activePage} of {pageCount}</span>
          <button type="button" disabled={activePage >= pageCount} onClick={() => { setPage(activePage + 1); setSelectedArea(null); }}>Next</button>
        </nav>
        <details className={styles.areaIndex}><summary>All published Dubai areas</summary><nav aria-label="All published Dubai areas">{model.areas.flatMap((area) => area.href === null ? [] : [<Link key={area.id} href={area.href}>{area.name}</Link>])}</nav></details>
      </section>}
      spatial={<section className={styles.evidenceMap} aria-labelledby="dubai-area-map">
        <header><div><h2 id="dubai-area-map">Area locations</h2><p>{visible.length.toLocaleString('en')} areas on this page · area summaries only</p></div></header>
        <GooglePlaceMap market="dubai" browserKey={browserKey} points={mapPoints} onSelectPoint={setSelectedArea} showAddressSearch={false} />
        {selected ? <aside className={styles.mapSelection}>
          <button type="button" onClick={() => setSelectedArea(null)} aria-label="Close area preview">Close</button>
          <h3>{selected.area.name}</h3>
          <p>{housing === 'apartment' ? 'Apartment' : 'Villa'} · {stage === 'ready' ? 'Ready' : 'Off-Plan'}</p>
          <strong>{money(selected.sale.medianPriceAed)}</strong>
          <span>{moneyPerSqm(selected.sale.medianPricePerSqmAed)} · {selected.sale.n.toLocaleString('en')} registered sales</span>
          {selected.area.href === null ? null : <Link href={selected.area.href}>View area prices</Link>}
        </aside> : null}
        <p className={styles.mapDisclosure}>Markers locate areas. They do not represent units or listings.</p>
      </section>}
    />
  </div>;
}
