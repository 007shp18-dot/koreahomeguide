import Link from 'next/link';
import { Suspense } from 'react';
import { UiIcon } from '../ui-icon';
import { SiteHeader } from '@/components/site-header';
import { homepageCopy } from '@/lib/site-copy';
import { parseJapanScope } from '@/lib/japan/source.server';
import { japanPageQuery, parseJapanFilters, TOKYO_WARDS } from '@/lib/japan/query';
import type { JapanPublished, JapanPublishedScope } from '@/lib/japan/repository.server';
import { readCachedJapanCoverage, readCachedJapanPublication } from '@/lib/japan/publication-cache.server';
import { SiteFooter } from '@/components/site-footer';
import { MarketExploreShell } from '../market-ui/market-shell';
import { TokyoPeriodFields } from './tokyo-period-fields';
import { TokyoMapPanel } from './tokyo-map-panel';
import styles from './tokyo-explorer.module.css';

type Params = Record<string, string | string[] | undefined>;
export default async function TokyoExplorer({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const query = japanPageQuery(params);
  let data: JapanPublished | null = null;
  let coverage: JapanPublishedScope[] | null = null;
  let error = '';
  let scope = { city: '13103', year: '2025', quarter: '4' };
  let filters = { q: '', type: '', minArea: null as number | null, maxArea: null as number | null, page: 1, release: null as string | null };
  const useLatestPeriod = !query.has('year') && !query.has('quarter') && !query.has('page') && !query.has('release');
  try { scope = parseJapanScope(query); filters = parseJapanFilters(query); }
  catch { error = 'Some filters are invalid. Choose a ward, year and quarter below.'; }
  if (!error) {
    try { coverage = await readCachedJapanCoverage(); }
    catch { /* Coverage is supplementary; a failed summary must not hide valid prices. */ }
    if (useLatestPeriod) {
      const latest = coverage?.find(item => !query.has('city') || item.city === scope.city);
      if (latest) scope = { city: latest.city, year: latest.year, quarter: latest.quarter };
    }
    try { data = await readCachedJapanPublication(scope, filters); }
    catch { error = 'Published records are temporarily unavailable. Please try again shortly.'; }
  }
  const pageLink = (page: number) => {
    const next = new URLSearchParams(query);
    for (const [key, value] of Object.entries(scope)) next.set(key, value);
    next.set('page', String(page));
    if (data) next.set('release', data.releaseId);
    return `/jp/tokyo/explore/?${next}`;
  };
  const yen = new Intl.NumberFormat('en', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 });
  const wardName = (city: string) => TOKYO_WARDS.find(([code]) => code === city)?.[1] ?? 'Ward';
  const scopeLink = ({ city, year, quarter }: JapanPublishedScope) => `/jp/tokyo/explore/?${new URLSearchParams({ city, year, quarter })}`;
  const availableInWard = coverage?.find(item => item.city === scope.city);
  const periodCoverage = coverage?.filter(item => item.year === scope.year && item.quarter === scope.quarter);
  const publishedWards = TOKYO_WARDS.flatMap(([city]) => {
    const available = periodCoverage?.find(item => item.city === city) ?? coverage?.find(item => item.city === city);
    return available ? [available] : [];
  });
  const years = Array.from({ length: new Date().getUTCFullYear() - 2023 }, (_, i) => String(2024 + i));
  const advancedFiltersActive = Boolean(error) || (!useLatestPeriod && (scope.year !== '2025' || scope.quarter !== '4'))
    || Boolean(filters.type) || filters.minArea !== null || filters.maxArea !== null;
  return <>
    <SiteHeader copy={{ ...homepageCopy.header, marketLabel: 'Tokyo', links: [{ label: 'Explore', href: '/jp/tokyo/explore/', isCurrent: true }] }} />
    <main className={styles.page}>
      <MarketExploreShell eyebrow="Tokyo" title="Explore" period={`${TOKYO_WARDS.find(([code]) => code === scope.city)?.[1] ?? 'Ward'} · ${scope.year} Q${scope.quarter} · JPY`}
        layers={<div>
          <p className={styles.intro}>Recorded prices by neighbourhood. Find the area, size and layout that fit.</p>
      <form key={JSON.stringify([scope, filters.q, filters.type, filters.minArea, filters.maxArea, useLatestPeriod])} className={styles.filters} action="/jp/tokyo/explore/" method="get" aria-label="Tokyo transaction filters">
        <div className={styles.primaryFilters}>
        <label className={styles.search}>Neighbourhood, layout or built year<input name="q" placeholder="Azabu, 2LDK, 2010…" defaultValue={filters.q} maxLength={100} /></label>
        <label>Ward<select name="city" defaultValue={scope.city}>{TOKYO_WARDS.map(([code, name]) => <option value={code} key={code}>{name}</option>)}</select></label>
        <button type="submit">Explore transactions</button>
        </div>
        <details className={styles.advancedFilters} aria-label="More filters" open={advancedFiltersActive}>
        <summary>More filters <span>Period, property type and area</span></summary>
        <fieldset className={styles.secondaryFilters} aria-label="Period, property type and area">
        <TokyoPeriodFields key={`${scope.city}:${scope.year}:${scope.quarter}:${useLatestPeriod}`} years={years} year={scope.year} quarter={scope.quarter} useLatest={useLatestPeriod} />
        <label className={styles.propertyType}>Property type<select name="type" defaultValue={filters.type}><option value="">All types</option><option>Pre-owned Condominiums, etc.</option><option>Residential Land(Land and Building)</option><option>Residential Land(Land Only)</option></select></label>
        <label>Min area (m²)<input name="minArea" type="number" min="1" max="100000" step="any" defaultValue={filters.minArea ?? ''} /></label>
        <label>Max area (m²)<input name="maxArea" type="number" min="1" max="100000" step="any" defaultValue={filters.maxArea ?? ''} /></label>
        </fieldset>
        </details>
      </form>
      {coverage !== null && <div className={styles.coverage}>
        <p className={styles.source}>{scope.year} Q{scope.quarter} · {periodCoverage?.length ?? 0} of 23 wards available</p>
        {publishedWards.length > 0 && <details>
          <summary>Browse published wards</summary>
          <nav className={styles.coverageLinks} aria-label="Published Tokyo wards">
            {publishedWards.map(item => <Link href={scopeLink(item)} key={item.city} prefetch={false}>
              <span>{wardName(item.city)}</span><span>{item.year} Q{item.quarter}</span>
            </Link>)}
          </nav>
        </details>}
      </div>}
        </div>}
        discovery={<>
      {error ? <div className={styles.empty} role="alert"><h2>Transactions are unavailable</h2><p>{error}</p></div> : data === null ? <div className={styles.empty}>
        <h2>Prices for this period are not available yet.</h2>
        <p>We have not published records for this ward and quarter. This does not mean that no homes traded.</p>
        {availableInWard && <Link className={styles.emptyLink} href={scopeLink(availableInWard)}>View {wardName(availableInWard.city)} · {availableInWard.year} Q{availableInWard.quarter} <UiIcon name="arrow-right" /></Link>}
        <Link className={styles.emptyLink} href="/news/city-stories/tokyo/">Find your Tokyo neighbourhood <UiIcon name="arrow-right" /></Link>
      </div> : <>
        <div className={styles.results}><h2>{data.filteredCount.toLocaleString('en')} recorded transactions</h2><p>{scope.year} Q{scope.quarter} · JPY · Price, high to low</p></div>
        <p className={styles.source}>{data.sourceCount.toLocaleString('en')} records in this ward and quarter · Source retrieved {new Date(data.retrievedAt).toLocaleDateString('en-GB', { timeZone: 'UTC' })}</p>
        <div className={styles.list}>
          {data.records.map(row => <article className={styles.row} key={row.recordReference}>
            <div className={styles.rowHeading}><h3>{row.district || row.municipality}</h3><strong className={styles.price}>{yen.format(row.price)}</strong></div>
            <div className={styles.details}><p>{row.areaLabel || 'Area not disclosed'}{row.areaLabel ? ' m²' : ''} · {row.floorPlan || 'Layout not disclosed'}</p><details className={styles.recordDetails}><summary>Property details</summary><p>{row.municipality} · {row.type}</p><p>Built {row.buildingYear || 'not disclosed'} · {row.structure || 'Structure not disclosed'}</p></details>
            </div>
          </article>)}
        </div>
        {!data.records.length && <p>No published records match these filters. Try a wider area range or another neighbourhood.</p>}
        <nav className={styles.pagination} aria-label="Transaction pages">
          {filters.page > 1 && <Link href={pageLink(filters.page - 1)}><UiIcon name="arrow-left" /> Previous</Link>}
          <span>Page {filters.page} of {Math.max(1, Math.ceil(data.filteredCount / 20))}</span>
          {filters.page * 20 < data.filteredCount && <Link href={pageLink(filters.page + 1)}>Next <UiIcon name="arrow-right" /></Link>}
        </nav>
      </>}
        </>}
        spatial={<Suspense fallback={<p className={styles.mapLoading} role="status">Preparing Tokyo ward map…</p>}>
          <TokyoMapPanel city={scope.city} year={scope.year} quarter={scope.quarter}
            filters={{ q: filters.q, type: filters.type, minArea: filters.minArea, maxArea: filters.maxArea }} />
        </Suspense>}
      />
      <div className={styles.sourcePanel}>
      <details className={styles.method}><summary>About these recorded prices</summary>
        <p>These are completed transactions reported by area, not homes currently for sale. The source does not disclose building names, exact addresses or unit identities.</p>
        <p>Dates are reported by quarter. Prices and areas use the precision supplied by MLIT. Homes with an area range are left out when you set a minimum or maximum area; similar-looking records can be separate transactions.</p>
      </details>
      <p className={styles.source}>Source: <a href="https://www.reinfolib.mlit.go.jp/">MLIT Real Estate Information Library</a> · Transaction price information, edited by SignedPrice.</p>
      <nav className={styles.links} aria-label="Tokyo research"><Link href="/jp/tokyo/">Market overview</Link><Link href="/news/?market=tokyo">Tokyo stories &amp; insights</Link><a href="https://www.reinfolib.mlit.go.jp/" rel="noreferrer">Data source</a></nav>
      </div>
    </main>
    <SiteFooter copy={homepageCopy.footer} />
  </>;
}
