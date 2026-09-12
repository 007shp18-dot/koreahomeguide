import Link from 'next/link';
import { Suspense } from 'react';
import { UiIcon } from '../ui-icon';
import { SiteHeader } from '@/components/site-header';
import { homepageCopy } from '@/lib/site-copy';
import { parseJapanScope } from '@/lib/japan/source.server';
import { japanExploreQuery, parseJapanFilters, TOKYO_CONDOMINIUM_TYPE, TOKYO_WARDS } from '@/lib/japan/query';
import type { JapanFilters, JapanPublished, JapanPublishedScope } from '@/lib/japan/repository.server';
import { readCachedJapanCoverage, readCachedJapanPublication } from '@/lib/japan/publication-cache.server';
import { SiteFooter } from '@/components/site-footer';
import { MarketExploreShell } from '../market-ui/market-shell';
import { ExplorePriceGuide } from '../market-ui/explore-price-guide';
import { ExploreResultsLoading } from '../market-ui/explore-results-loading';
import { AppliedFilters, type AppliedFilter } from '../market-ui/applied-filters';
import { TokyoPeriodFields } from './tokyo-period-fields';
import { TokyoMapPanel } from './tokyo-map-panel';
import styles from './tokyo-explorer.module.css';
import { tokyoText, tokyoHref, type TokyoLocale } from './tokyo-copy';
import { RecentPlaces, RecordPlaceVisit } from '../discovery/recent-places';
import { DiscoveryReading } from '../discovery/discovery-reading';

type Params = Record<string, string | string[] | undefined>;
export default async function TokyoExplorer({ searchParams, locale = 'en' }: { searchParams: Promise<Params>; locale?: TokyoLocale }) {
  const t = (text: string) => tokyoText(locale, text);
  const href = (path: string) => tokyoHref(locale, path);
  const params = await searchParams;
  const query = japanExploreQuery(params);
  let data: JapanPublished | null = null;
  let coverage: JapanPublishedScope[] | null = null;
  let error = '';
  let scope = { city: '13103', year: '2025', quarter: '4' };
  let filters: JapanFilters = { q: '', type: '', minArea: null as number | null, maxArea: null as number | null, page: 1, release: null as string | null };
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
    return href(`/jp/tokyo/explore/?${next}#tokyo-transactions`);
  };
  const numberLocale = locale === 'ko' ? 'ko-KR' : locale === 'zh-CN' ? 'zh-CN' : 'en-GB';
  const yen = new Intl.NumberFormat(numberLocale, { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 });
  const wardName = (city: string) => TOKYO_WARDS.find(([code]) => code === city)?.[1] ? t(TOKYO_WARDS.find(([code]) => code === city)![1]) : t('Ward');
  const scopeLink = ({ city, year, quarter }: JapanPublishedScope) => {
    const next = new URLSearchParams({ city, year, quarter, type: filters.type });
    if (filters.minArea !== null) next.set('minArea', String(filters.minArea));
    if (filters.maxArea !== null) next.set('maxArea', String(filters.maxArea));
    return href(`/jp/tokyo/explore/?${next}`);
  };
  const availableInWard = coverage?.find(item => item.city === scope.city);
  const periodCoverage = coverage?.filter(item => item.year === scope.year && item.quarter === scope.quarter);
  const publishedWards = TOKYO_WARDS.flatMap(([city]) => {
    const available = periodCoverage?.find(item => item.city === city) ?? coverage?.find(item => item.city === city);
    return available ? [available] : [];
  });
  const years = Array.from({ length: new Date().getUTCFullYear() - 2023 }, (_, i) => String(2024 + i));
  const advancedFiltersActive = Boolean(error)
    || filters.type !== TOKYO_CONDOMINIUM_TYPE || filters.minArea !== null || filters.maxArea !== null;
  const filterLink = (remove: string[], values: Record<string, string> = {}) => {
    const next = new URLSearchParams(query);
    next.set('city', scope.city);
    if (!useLatestPeriod) { next.set('year', scope.year); next.set('quarter', scope.quarter); }
    for (const key of [...remove, 'page', 'release']) next.delete(key);
    for (const [key, value] of Object.entries(values)) next.set(key, value);
    return href(`/jp/tokyo/explore/?${next}`);
  };
  const typeLabel = filters.type === TOKYO_CONDOMINIUM_TYPE ? t('Apartments & condominiums')
    : filters.type === 'Residential Land(Land and Building)' ? t('Land with a building')
    : filters.type === 'Residential Land(Land Only)' ? t('Land only') : filters.type || t('All property types');
  const applied: AppliedFilter[] = error ? [] : [
    ...(filters.type ? [{ id: 'type', label: typeLabel, href: filterLink([], { type: '' }) }] : []),
    ...(!useLatestPeriod ? [{ id: 'period', label: `${scope.year} Q${scope.quarter}`, href: filterLink(['year', 'quarter']) }] : []),
    ...(filters.q ? [{ id: 'q', label: filters.q, href: filterLink(['q']) }] : []),
    ...(filters.neighbourhood ? [{ id: 'neighbourhood', label: filters.neighbourhood, href: filterLink(['neighbourhood']) }] : []),
    ...(filters.minArea !== null || filters.maxArea !== null ? [{ id: 'area',
      label: filters.minArea !== null && filters.maxArea !== null ? `${filters.minArea}–${filters.maxArea} m²`
        : filters.minArea !== null ? `≥ ${filters.minArea} m²` : `≤ ${filters.maxArea} m²`,
      href: filterLink(['minArea', 'maxArea']) }] : []),
  ];
  return <>
    <SiteHeader copy={{ ...homepageCopy.header, languageLabel: locale === 'ko' ? 'KO' : locale === 'zh-CN' ? 'ZH' : 'EN', homeHref: locale === 'en' ? '/' : locale === 'ko' ? '/ko/' : '/zh-cn/', marketLabel: t('Tokyo'), links: [{ label: t('Explore'), href: href('/jp/tokyo/explore/'), isCurrent: true }] }} />
    <main className={styles.page}>
      {data && data.filteredCount > 0 && filters.neighbourhood && <RecordPlaceVisit place={{ market: 'tokyo', key: `${scope.city}/${filters.neighbourhood}`, name: `${filters.neighbourhood} · ${wardName(scope.city)}`, href: pageLink(filters.page) }} />}
      <MarketExploreShell eyebrow={t("Tokyo")} title={t("Explore")} period={`${wardName(scope.city)} · ${scope.year} Q${scope.quarter} · JPY`}
        history={<RecentPlaces market="tokyo" locale={locale} excludeKey={filters.neighbourhood ? `${scope.city}/${filters.neighbourhood}` : undefined} />}
        related={<DiscoveryReading market="tokyo" locale={locale} />}
        priceGuide={<ExplorePriceGuide locale={locale} market="tokyo" />}
        discoveryPanel={{ title: t('Neighbourhoods & prices'), open: t('View neighbourhoods & prices'), close: t('Close results'), anchorId: 'tokyo-transactions' }}
        layers={<div>
      <form key={JSON.stringify([scope, filters.q, filters.type, filters.minArea, filters.maxArea, useLatestPeriod])} className={styles.filters} action={href("/jp/tokyo/explore/")} method="get" aria-label="Tokyo transaction filters">
        <div className={styles.primaryFilters}>
        <label className={styles.search}>{t('Neighbourhood, layout or built year')}<input name="q" placeholder="Azabu, 2LDK, 2010…" defaultValue={filters.q} maxLength={100} /></label>
        <label>{t('Ward')}<select name="city" defaultValue={scope.city}>{TOKYO_WARDS.map(([code, name]) => <option value={code} key={code}>{t(name)}</option>)}</select></label>
        <button type="submit">{t('Explore transactions')}</button>
        </div>
        <details className={styles.advancedFilters} aria-label="More filters" open={advancedFiltersActive}>
        <summary>{t('More filters')} <span>{t('Period, property type and area')}</span></summary>
        <fieldset className={styles.secondaryFilters} aria-label="Period, property type and area">
        <TokyoPeriodFields locale={locale} key={`${scope.city}:${scope.year}:${scope.quarter}:${useLatestPeriod}`} years={years} year={scope.year} quarter={scope.quarter} useLatest={useLatestPeriod} />
        <label className={styles.propertyType}>{t('Property type')}<select name="type" defaultValue={filters.type}><option value={TOKYO_CONDOMINIUM_TYPE}>{t('Apartments & condominiums')}</option><option value="Residential Land(Land and Building)">{t('Land with a building')}</option><option value="Residential Land(Land Only)">{t('Land only')}</option><option value="">{t('All property types')}</option></select></label>
        <label>{t('Min area (m²)')}<input name="minArea" type="number" min="1" max="100000" step="any" defaultValue={filters.minArea ?? ''} /></label>
        <label>{t('Max area (m²)')}<input name="maxArea" type="number" min="1" max="100000" step="any" defaultValue={filters.maxArea ?? ''} /></label>
        </fieldset>
        </details>
      </form>
      <AppliedFilters items={applied} label={t('Applied filters')} removeLabel={t('Remove filter')}
        clearLabel={t('Reset filters')} clearHref={href(`/jp/tokyo/explore/?city=${scope.city}`)} />
      {coverage !== null && <div className={styles.coverage}>
        <p className={styles.source}>{scope.year} Q{scope.quarter} · {periodCoverage?.length ?? 0} {t('of 23 wards available')}</p>
        {publishedWards.length > 0 && <details>
          <summary>{t('Browse published wards')}</summary>
          <nav className={styles.coverageLinks} aria-label="Published Tokyo wards">
            {publishedWards.map(item => <Link href={scopeLink(item)} key={item.city} prefetch={false}>
              <span>{wardName(item.city)}</span><span>{item.year} Q{item.quarter}</span>
            </Link>)}
          </nav>
        </details>}
      </div>}
        </div>}
        discovery={<>
      <div data-tokyo-area-directory="true"><Suspense fallback={<ExploreResultsLoading label={t('Loading area transactions…')} />}>
        <TokyoMapPanel view="directory" locale={locale} city={scope.city} year={scope.year} quarter={scope.quarter}
          filters={{ q: filters.q, neighbourhood: filters.neighbourhood, type: filters.type, minArea: filters.minArea, maxArea: filters.maxArea }} />
      </Suspense></div>
      {error ? <div className={styles.empty} role="alert"><h2>{t('Transactions are unavailable')}</h2><p>{t(error)}</p></div> : data === null ? <div className={styles.empty}>
        <h2>{t('Prices for this period are not available yet.')}</h2>
        <p>{t('We have not published records for this ward and quarter. This does not mean that no homes traded.')}</p>
        {availableInWard && <Link className={styles.emptyLink} href={scopeLink(availableInWard)}>{t('View')} {wardName(availableInWard.city)} · {availableInWard.year} Q{availableInWard.quarter} <UiIcon name="arrow-right" /></Link>}
        <Link className={styles.emptyLink} href={locale === 'ko' ? "/ko/news/city-stories/tokyo/" : locale === 'zh-CN' ? "/zh-cn/news/?market=tokyo" : "/news/city-stories/tokyo/"}>{t('Find your Tokyo neighbourhood')} <UiIcon name="arrow-right" /></Link>
      </div> : <>
        <div id="tokyo-transactions" className={styles.results}><h2>{data.filteredCount.toLocaleString('en')} {t('recorded transactions')}</h2><p>{(filters.neighbourhood || filters.q) ? `${filters.neighbourhood || filters.q} · ` : ''}{wardName(scope.city)} · {scope.year} Q{scope.quarter}</p></div>
        {(filters.neighbourhood || filters.q) && <Link className={styles.clearSearch} href={scopeLink({ ...scope, sourceCount: data.sourceCount })} prefetch={false}>{locale === 'ko' ? `${wardName(scope.city)} 전체 동네 보기` : locale === 'zh-CN' ? `查看${wardName(scope.city)}所有街区` : `Show all neighbourhoods in ${wardName(scope.city)}`}</Link>}
        <p className={styles.source}>{data.sourceCount.toLocaleString(numberLocale)} {locale === 'ko' ? '건 · 이 구·분기 전체 거래' : locale === 'zh-CN' ? '笔 · 本区本季度全部成交' : 'records in this ward and quarter'} · {t('Source retrieved')} {new Intl.DateTimeFormat(numberLocale, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(data.retrievedAt))}</p>
        <p className={styles.source}>{t('Price, high to low · Area-level records; building names are not disclosed.')}</p>
        <div className={styles.list}>
          {data.records.map(row => <article className={styles.row} key={row.recordReference}>
            <div className={styles.rowHeading}><h3>{row.district || row.municipality}</h3><strong className={styles.price}>{yen.format(row.price)}</strong></div>
            <div className={styles.details}><p>{row.areaLabel || t('Area not disclosed')}{row.areaLabel ? ' m²' : ''} · {row.floorPlan || t('Layout not disclosed')}</p><p>{t('Built')} {row.buildingYear || t('not disclosed')} · {row.structure || t('Structure not disclosed')}</p><details className={styles.recordDetails}><summary>{t('Record details')}</summary><p>{row.municipality} · {row.type}</p></details>
            </div>
          </article>)}
        </div>
        {!data.records.length && <p>{t('No published records match these filters. Try a wider area range or another neighbourhood.')}</p>}
        <nav className={styles.pagination} aria-label="Transaction pages">
          {filters.page > 1 && <Link href={pageLink(filters.page - 1)}><UiIcon name="arrow-left" /> {t('Previous')}</Link>}
          <span>{t('Page')} {filters.page} {t('of')} {Math.max(1, Math.ceil(data.filteredCount / 20))}</span>
          {filters.page * 20 < data.filteredCount && <Link href={pageLink(filters.page + 1)}>{t('Next')} <UiIcon name="arrow-right" /></Link>}
        </nav>
      </>}
        </>}
        spatial={<Suspense fallback={<p className={styles.mapLoading} role="status">{t('Preparing Tokyo ward map…')}</p>}>
          <TokyoMapPanel view="map" locale={locale} city={scope.city} year={scope.year} quarter={scope.quarter}
            filters={{ q: filters.q, neighbourhood: filters.neighbourhood, type: filters.type, minArea: filters.minArea, maxArea: filters.maxArea }} />
        </Suspense>}
      />
      <div className={styles.sourcePanel}>
      <details className={styles.method}><summary>{t('About these recorded prices')}</summary>
        <p>{t('These are completed transactions reported by area, not homes currently for sale. The source does not disclose building names, exact addresses or unit identities.')}</p>
        <p>{t('Dates are reported by quarter. Prices and areas use the precision supplied by MLIT. Homes with an area range are left out when you set a minimum or maximum area; similar-looking records can be separate transactions.')}</p>
      </details>
      <p className={styles.source}>{t('Source')}: <a href="https://www.reinfolib.mlit.go.jp/">{t('MLIT Real Estate Information Library')}</a> · {t('Transaction price information, edited by SignedPrice.')}</p>
      <nav className={styles.links} aria-label="Tokyo research"><Link href={href("/jp/tokyo/")}>{t('Market overview')}</Link><Link href={`${locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn'}/news/?market=tokyo`}>{t('Tokyo stories & insights')}</Link><a href="https://www.reinfolib.mlit.go.jp/" rel="noreferrer">{t('Data source')}</a></nav>
      </div>
    </main>
    <SiteFooter locale={locale} copy={homepageCopy.footer} />
  </>;
}
