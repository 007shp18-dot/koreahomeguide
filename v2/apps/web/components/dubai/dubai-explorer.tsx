'use client';
import { retainPassportContext } from '../../lib/passport/journey';

import { PassportLink as Link } from '../passport/passport-journey';
import { UiIcon } from '../ui-icon';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
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
import type { DubaiProjectEvidence } from '../../lib/dubai/project-evidence';
import { selectedResultPage } from '../../lib/navigation/selected-result-page';
import { marketText, marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import { DubaiExploreSelection } from './dubai-explore-selection';


const unavailableModel = Object.freeze({
  status: 'unavailable' as const,
  message: 'Verified Dubai area evidence unavailable' as const,
});
const integer = new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 });
const money = (value: number) => `AED\u00a0${integer.format(value)}`;
const moneyPerSqm = (value: number) => `${money(value)}/m²`;
const moneyPerYear = (value: number) => `${money(value)}/year`;

function CuratedDubaiExplorer({ locale = 'en',
  browserKey,
  initialQuery,
  initialArea,
}: Readonly<{
  browserKey: string | null;
  initialQuery: string;
  initialArea: string;
}> & { locale?: MarketLocale }) {
  const t = <T,>(value: T): T => marketText(locale, value);

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
  const points = useMemo<readonly GoogleMarketMapPoint[]>(() => areas.map((item) => ({
    id: item.id,
    title: item.name,
    label: item.name,
    kind: 'area',
    showFullLabel: true,
    address: `${item.name}, Dubai, United Arab Emirates`,
    selected: selected === item.id,
  })), [areas, selected]);
  return <div className={styles.explorer}><MarketExploreShell locale={locale}
    eyebrow={t("Dubai")}
    title={t("Explore")}
    period={t("Area research")}
    layers={<div className={styles.toolbar}>
      <label>{t("Find an area")}<input
        type="search"
        value={query}
        placeholder={t("Area name")}
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
      <nav className={styles.actions} aria-label={t("Dubai research")}>
        <Link href={marketHref(locale, "/ae/dubai/")}>{t("Market overview")}</Link>
        <Link href={marketHref(locale, "/ae/dubai/guide/")}>{t("Buying research guide")}</Link>
        <Link href={marketHref(locale, "/news/?type=news&market=dubai")}>{t("News")}</Link>
      </nav>
    </div>}
    discovery={<div className={styles.directory}>
      <h2>{t("Area guide")}</h2>
      <p>{t(areas.length)}{t(" of ")}{t(DUBAI_AREAS.length)}{t(" curated areas · Not a property inventory")}</p>
      <ul>{areas.map((item) => <li key={item.id}><button
        type="button"
        onClick={() => select(item.id)}
        aria-pressed={selected === item.id}
      ><strong>{t(item.name)}</strong><span>{t(item.kind)}</span></button></li>)}</ul>
      {areas.length === 0 ? <p>{t("No area matches. Try Downtown, Marina, Business Bay or Palm.")}</p> : null}
      {area ? <article className={styles.areaDetail} aria-live="polite">
        <h3>{t(area.name)}</h3><p>{t(area.description)}</p><p>{t(area.question)}</p>
        <a href={marketHref(locale, area.source)} target="_blank" rel="noreferrer">{t("Official neighbourhood guide")}</a>
        <p><a href={marketHref(locale, DUBAI_SOURCES.projects)} target="_blank" rel="noreferrer">{t("Check a project with DLD")}</a></p>
      </article> : <p>{t("Select an area to see its location and research questions.")}</p>}
    </div>}
    spatial={<div className={styles.map}>
      <GooglePlaceMap locale={locale}
        key="dubai"
        market="dubai"
        browserKey={browserKey}
        points={points}
        onSelectPoint={select}
        showAddressSearch={false}
      />
      <p>{t("Markers locate neighbourhoods, not individual buildings or available listings. Area transaction counts and prices are not published here.")}</p>
    </div>}
  /></div>;
}

export function DubaiExplorer({ locale = 'en',
  browserKey,
  model = unavailableModel,
  initialQuery = '',
  initialArea = '',
  initialHousing = 'apartment',
  initialStage = 'ready',
  initialBudgetMaximumAed = null,
  initialYieldMinimumPct = null,
  initialPage = 1,
  projects = [],
  initialProjectId = null,
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
  projects?: readonly DubaiProjectEvidence[];
  initialProjectId?: string | null;
}> & { locale?: MarketLocale }) {
  const t = <T,>(value: T): T => marketText(locale, value);

  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);
  const [selectedArea, setSelectedArea] = useState(initialArea || null);
  const [housing, setHousing] = useState(initialHousing);
  const [stage, setStage] = useState(initialStage);
  const [budgetMaximumAed, setBudgetMaximumAed] = useState(initialBudgetMaximumAed);
  const [yieldMinimumPct, setYieldMinimumPct] = useState(initialYieldMinimumPct);
  const [page, setPage] = useState(initialPage);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId);
  const selectionRef = useRef<HTMLElement>(null);
  const revealSelection = useRef(false);
  const selectArea = useCallback((slug: string | null) => {
    revealSelection.current = slug !== null;
    setSelectedArea(slug);
    setSelectedProjectId(null);
  }, []);
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
  const activePage = selectedResultPage(results.map(({ area }) => area.slug), selectedArea, page, DUBAI_EXPLORE_PAGE_SIZE);
  const visible = useMemo(() => results.slice(
    (activePage - 1) * DUBAI_EXPLORE_PAGE_SIZE,
    activePage * DUBAI_EXPLORE_PAGE_SIZE,
  ), [activePage, results]);
  const selected = results.find(({ area }) => area.slug === selectedArea);
  const projectResults = useMemo(() => projects.filter(project => project.housing === housing && project.stage === stage), [projects, housing, stage]);
  const selectedProject = projectResults.find(project => project.id === selectedProjectId && project.areaSlug === selected?.area.slug);
  const selectedAreaProjects = useMemo(() => projectResults.filter(project => project.areaSlug === selected?.area.slug), [projectResults, selected]);
  const mapPoints = useMemo<readonly GoogleMarketMapPoint[]>(() => visible.map((result) => ({
    id: result.area.slug,
    title: result.area.name,
    label: result.area.name,
    kind: 'area',
    showFullLabel: true,
    address: `${result.area.name}, Dubai, United Arab Emirates`,
    selected: result.area.slug === selectedArea,
  })), [selectedArea, visible]);

  useEffect(() => {
    if (!selected || !revealSelection.current) return;
    revealSelection.current = false;
    selectionRef.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }, [selected]);

  useEffect(() => {
    if (model.status !== 'ready') return;
    const href = retainPassportContext(marketHref(locale, buildDubaiExploreHref({
      query,
      housing,
      stage,
      budgetMaximumAed,
      yieldMinimumPct,
      page: activePage,
      selectedArea: selected?.area.slug ?? null,
      selectedProject: selectedProject?.id ?? null,
    })), window.location.href);
    if (`${window.location.pathname}${window.location.search}` !== href) {
      window.history.replaceState(null, '', href);
    }
  }, [locale, activePage, budgetMaximumAed, housing, model.status, query, selectedArea, selected, selectedProject, stage, yieldMinimumPct]);

  if (model.status === 'unavailable') return <CuratedDubaiExplorer locale={locale}
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

  return <div className={styles.explorer} data-dubai-evidence="ready" data-dubai-explore-workspace="true">
    <MarketExploreShell locale={locale}
      eyebrow={t("Dubai")}
      title={t("Explore")}
      period={t(`${model.context.comparisonPeriod.from}–${model.context.comparisonPeriod.to}`)}
      layers={<div className={styles.evidenceToolbar}>
        <form role="search" onSubmit={(event) => event.preventDefault()}>
          <label className={styles.searchField}>{t("Find an area")}<input
            name="q"
            type="search"
            value={query}
            placeholder={t("Area or known community name")}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
              setSelectedArea(null);
              setPage(1);
            }}
          /></label>
          <label>{t("Home type")}<select value={housing} onChange={(event) => {
            setHousing(event.currentTarget.value as 'apartment' | 'villa');
            setSelectedArea(null);
            setPage(1);
          }}><option value="apartment">{t("Apartment")}</option><option value="villa">{t("Villa")}</option></select></label>
          <label>{t("Maximum median price")}<select value={budgetMaximumAed ?? ''} onChange={(event) => {
            setBudgetMaximumAed(event.currentTarget.value === '' ? null : Number(event.currentTarget.value));
            setSelectedArea(null);
            setPage(1);
          }}><option value="">{t("Any budget")}</option>{budgetMaximumAed !== null && ![1000000,1500000,2500000,5000000,10000000].includes(budgetMaximumAed) ? <option value={budgetMaximumAed}>{money(budgetMaximumAed)}</option> : null}<option value="1000000">{t("AED 1M")}</option><option value="1500000">{t("AED 1.5M")}</option><option value="2500000">{t("AED 2.5M")}</option><option value="5000000">{t("AED 5M")}</option><option value="10000000">{t("AED 10M")}</option></select></label>
          {stage === 'ready' ? <label>{t("Minimum gross ratio")}<select value={yieldMinimumPct ?? ''} onChange={(event) => {
            setYieldMinimumPct(event.currentTarget.value === '' ? null : Number(event.currentTarget.value));
            setSelectedArea(null);
            setPage(1);
          }}><option value="">{t("Any ratio")}</option><option value="5">{t("5%+")}</option><option value="6">{t("6%+")}</option><option value="7">{t("7%+")}</option><option value="8">{t("8%+")}</option></select></label> : null}
          {hasFilters ? <button type="button" className={styles.clearFilters} onClick={clearFilters}>{t("Clear filters")}</button> : null}
        </form>
        <div className={styles.stageTabs} role="tablist" aria-label={t("Dubai sale stage")}>
          <button type="button" role="tab" aria-selected={stage === 'ready'} onClick={() => switchStage('ready')}>{t("Ready")}</button>
          <button type="button" role="tab" aria-selected={stage === 'off-plan'} onClick={() => switchStage('off-plan')}>{t("Off-Plan")}</button>
        </div>
        <nav className={styles.actions} aria-label={t("Dubai research")}>
          <Link href={marketHref(locale, "/ae/dubai/")}>{t("Market overview")}</Link>
          <Link href={marketHref(locale, "/ae/dubai/guide/")}>{t("Buying research guide")}</Link>
          <Link href={marketHref(locale, "/news/?type=news&market=dubai")}>{t("News")}</Link>
        </nav>
      </div>}
      discovery={<section className={styles.evidenceDirectory} aria-labelledby="dubai-area-results">
        {selected ? <DubaiExploreSelection locale={locale} selected={selected} stage={stage}
          period={`${model.context.comparisonPeriod.from}–${model.context.comparisonPeriod.to}`}
          asOfDate={model.context.asOfDate} projects={selectedAreaProjects} selectedProject={selectedProject}
          onSelectProject={setSelectedProjectId} onClose={() => selectArea(null)} panelRef={selectionRef}
          returnTo={buildDubaiExploreHref({ query, housing, stage, budgetMaximumAed, yieldMinimumPct,
            page: activePage, selectedArea: selected.area.slug, selectedProject: selectedProject?.id ?? null })}
        /> : <p className={styles.selectionPrompt}>{locale === 'ko'
          ? '지역을 선택하면 가격·임대료와 프로젝트별 거래 요약이 여기에 표시됩니다.'
          : 'Select an area to see prices, rent and project sales summaries here.'}</p>}
        <header className={styles.resultHeader}>
          <div><h2 id="dubai-area-results">{t("Area prices")}</h2><p>{t(results.length.toLocaleString('en'))}{t(" matching areas · ")}{t(housing)}{t(" · ")}{t(stage)}</p></div>
          <small>{t(results.length === 0 ? 'No matches' : `${(activePage - 1) * DUBAI_EXPLORE_PAGE_SIZE + 1}–${Math.min(activePage * DUBAI_EXPLORE_PAGE_SIZE, results.length)} shown`)}</small>
        </header>
        <div className={styles.areaResults} aria-live="polite" aria-busy={query !== deferredQuery}>
          {visible.map(({ area, segment, sale }) => <article key={area.id} data-selected={area.slug === selectedArea}>
            <button type="button" aria-pressed={area.slug === selectedArea} aria-controls="dubai-selected-area" onClick={() => selectArea(selectedArea === area.slug ? null : area.slug)}>
              <span><strong title={t(area.name)}>{t(area.name)}</strong><small>{t(housing === 'apartment' ? 'Apartment' : 'Villa')}{t(" · ")}{t(stage === 'ready' ? 'Ready' : 'Off-Plan')}</small></span>
            </button>
            <p className={styles.resultPrice}><strong>{t(money(sale.medianPriceAed))}</strong><span>{t(sale.n.toLocaleString('en'))} {locale === 'ko' ? '건 거래' : 'sales'} · {t(moneyPerSqm(sale.medianPricePerSqmAed))}</span></p>
            <details className={styles.resultEvidence} data-area-evidence="true">
              <summary>{locale === 'ko' ? '가격·임대료 자세히 보기' : 'Price and rent details'}</summary>
            <dl className={styles.areaMetrics}>
              <div><dt>{t("Median sale price")}</dt><dd>{t(money(sale.medianPriceAed))}</dd></div>
              <div><dt>{t("Median AED/m²")}</dt><dd>{t(moneyPerSqm(sale.medianPricePerSqmAed))}</dd></div>
              <div><dt>{t("Registered sales")}</dt><dd>{t(sale.n.toLocaleString('en'))}</dd></div>
              <div><dt>{t("Median annual rent")}</dt><dd>{t(moneyPerYear(segment.rent.medianAnnualRentAed))}</dd></div>
              <div><dt>{t("Estimated gross rent-to-price ratio")}</dt><dd>{t(stage === 'ready' && segment.readyGrossYieldPct !== null ? `${segment.readyGrossYieldPct.toFixed(1)}%` : stage === 'off-plan' ? 'Not shown for Off-Plan' : 'Not published')}</dd></div>
            </dl>
            </details>
            {area.href === null
              ? <span className={styles.unavailableLink}>{t("Area details unavailable")}</span>
              : <Link href={marketHref(locale, `${area.href}?housing=${segment.housing}&stage=${stage}`)}>{locale === 'ko' ? '지역 분석 전체 보기' : 'Full area analysis'}</Link>}
          </article>)}
          {results.length === 0 ? <p className={styles.emptyState}>{t("No areas match these filters. Increase the budget or lower the ratio threshold.")}</p> : null}
        </div>
        <nav className={styles.pagination} aria-label={t("Dubai area result pages")}>
          <button type="button" disabled={activePage === 1} onClick={() => { setPage(activePage - 1); setSelectedArea(null); }}>{t("Previous")}</button>
          <span>{t("Page ")}{t(activePage)}{t(" of ")}{t(pageCount)}</span>
          <button type="button" disabled={activePage >= pageCount} onClick={() => { setPage(activePage + 1); setSelectedArea(null); }}>{t("Next")}</button>
        </nav>
        <details className={styles.areaIndex}><summary>{t("All published Dubai areas")}</summary><nav aria-label={t("All published Dubai areas")}>{model.areas.flatMap((area) => area.href === null ? [] : [<Link key={area.id} href={marketHref(locale, area.href)}>{t(area.name)}</Link>])}</nav></details>
      </section>}
      spatial={<section className={styles.evidenceMap} aria-labelledby="dubai-area-map">
        <header><div><h2 id="dubai-area-map">{t("Area locations")}</h2><p>{t(visible.length.toLocaleString('en'))}{t(" areas on this page · area summaries only")}</p></div></header>
        <GooglePlaceMap locale={locale} market="dubai" browserKey={browserKey} points={mapPoints} onSelectPoint={selectArea} showAddressSearch={false} clusterLocations={false} />
        <p className={styles.mapDisclosure}>{t("Markers locate areas. They do not represent units or listings.")}</p>
      </section>}
    />
    <p className={styles.exploreSupport}><span>{locale === 'ko' ? '구매를 준비하고 있나요?' : 'Planning a purchase?'}</span><Link href={marketHref(locale, "/guides/dubai-ready-apartment-buying-budget-guide/")}>{locale === 'ko' ? '예산·구매 비용 가이드' : 'Read the budget & buying costs guide'}<UiIcon name="arrow-right" /></Link></p>
  </div>;
}
