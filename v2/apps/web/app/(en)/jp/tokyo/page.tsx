import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { homepageCopy } from '@/lib/site-copy';
import { parseJapanScope } from '@/lib/japan/source.server';
import { japanPageQuery, parseJapanFilters, TOKYO_WARDS } from '@/lib/japan/query';
import type { JapanPublished } from '@/lib/japan/repository.server';
import { readCachedJapanPublication } from '@/lib/japan/publication-cache.server';
import styles from './tokyo.module.css';

type Params = Record<string, string | string[] | undefined>;
export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const params = await searchParams;
  return { title: 'Tokyo recorded property prices | SignedPrice',
    description: 'Explore official anonymous Tokyo transactions by ward, neighbourhood, area and quarter. Prices in JPY.',
    alternates: { canonical: '/jp/tokyo/' }, robots: japanPageQuery(params).size ? { index: false, follow: true } : { index: true, follow: true } };
}
export default async function Tokyo({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const query = japanPageQuery(params);
  let data: JapanPublished | null = null;
  let error = '';
  let scope = { city: '13103', year: '2025', quarter: '4' };
  let filters = { q: '', type: '', minArea: null as number | null, maxArea: null as number | null, page: 1, release: null as string | null };
  try { scope = parseJapanScope(query); filters = parseJapanFilters(query); }
  catch { error = 'Some filters are invalid. Choose a ward, year and quarter below.'; }
  if (!error) {
    try { data = await readCachedJapanPublication(scope, filters); }
    catch { error = 'Published records are temporarily unavailable. Please try again shortly.'; }
  }
  const pageLink = (page: number) => {
    const next = new URLSearchParams(query);
    for (const [key, value] of Object.entries(scope)) next.set(key, value);
    next.set('page', String(page));
    if (data) next.set('release', data.releaseId);
    return `/jp/tokyo/?${next}`;
  };
  const yen = new Intl.NumberFormat('en', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 });
  const years = Array.from({ length: new Date().getUTCFullYear() - 2023 }, (_, i) => String(2024 + i));
  return <>
    <SiteHeader copy={{ ...homepageCopy.header, marketLabel: 'Tokyo', links: [{ label: 'Explore', href: '/jp/tokyo/', isCurrent: true }] }} />
    <main className={styles.main}>
      <p className={styles.eyebrow}>JAPAN / TOKYO</p>
      <h1>A closer look at Tokyo.</h1>
      <p className={styles.intro}>Recorded prices by neighbourhood. Find the area, size and layout that fit.</p>
      <form className={styles.filters} action="/jp/tokyo/">
        <label className={styles.search}>Neighbourhood, layout or built year<input name="q" placeholder="Azabu, 2LDK, 2010…" defaultValue={filters.q} maxLength={100} /></label>
        <label>Ward<select name="city" defaultValue={scope.city}>{TOKYO_WARDS.map(([code, name]) => <option value={code} key={code}>{name}</option>)}</select></label>
        <label>Year<select name="year" defaultValue={scope.year}>{years.map(year => <option key={year}>{year}</option>)}</select></label>
        <label>Quarter<select name="quarter" defaultValue={scope.quarter}>{['1','2','3','4'].map(q => <option value={q} key={q}>Q{q}</option>)}</select></label>
        <label>Property type<select name="type" defaultValue={filters.type}><option value="">All types</option><option>Pre-owned Condominiums, etc.</option><option>Residential Land(Land and Building)</option><option>Residential Land(Land Only)</option></select></label>
        <label>Min area (m²)<input name="minArea" type="number" min="1" max="100000" step="any" defaultValue={filters.minArea ?? ''} /></label>
        <label>Max area (m²)<input name="maxArea" type="number" min="1" max="100000" step="any" defaultValue={filters.maxArea ?? ''} /></label>
        <button type="submit">Explore transactions</button>
      </form>
      {error ? <p role="alert">{error}</p> : data === null ? <div className={styles.empty}>
        <h2>This ward and quarter is not published yet.</h2>
        <p>Try Minato, 2025 Q4. An unpublished quarter does not mean that no homes traded.</p>
      </div> : <>
        <div className={styles.results}><h2>{data.filteredCount.toLocaleString('en')} recorded transactions</h2><p>{scope.year} Q{scope.quarter} · JPY · Price, high to low</p></div>
        <p className={styles.source}>{data.sourceCount.toLocaleString('en')} records in this ward and quarter · Source retrieved {new Date(data.retrievedAt).toLocaleDateString('en-GB', { timeZone: 'UTC' })}</p>
        <div className={styles.list}>
          {data.records.map(row => <article className={styles.row} key={row.recordReference}>
            <div className={styles.areaIcon} aria-hidden="true">区</div>
            <div className={styles.details}><h3>{row.district || row.municipality}</h3><p>{row.municipality} · {row.type}</p>
              <p>{row.areaLabel || 'Area not disclosed'}{row.areaLabel ? ' m²' : ''} · {row.floorPlan || 'Layout not disclosed'} · Built {row.buildingYear || 'not disclosed'} · {row.structure || 'Structure not disclosed'}</p>
            </div><div className={styles.price}><strong>{yen.format(row.price)}</strong><span>{scope.year} Q{scope.quarter}</span></div>
          </article>)}
        </div>
        {!data.records.length && <p>No published records match these filters. Try a wider area range or another neighbourhood.</p>}
        <nav className={styles.pagination} aria-label="Transaction pages">
          {filters.page > 1 && <Link href={pageLink(filters.page - 1)}>← Previous</Link>}
          <span>Page {filters.page} of {Math.max(1, Math.ceil(data.filteredCount / 20))}</span>
          {filters.page * 20 < data.filteredCount && <Link href={pageLink(filters.page + 1)}>Next →</Link>}
        </nav>
      </>}
      <details className={styles.method}><summary>About these recorded prices</summary>
        <p>These are anonymous regional transactions, not available listings. Building names, exact addresses and unit identities are not disclosed. No building or property location is inferred.</p>
        <p>Dates retain quarter precision. Area and prices retain the precision disclosed by the provider; area ranges are excluded when a numeric area filter is applied. Identical disclosed records can represent separate transactions.</p>
        <p>Each published version replaces the complete ward and quarter. Earlier versions remain in the evidence history. The source does not identify which individual transactions were corrected or removed.</p>
        {data && <p>Version: {data.releaseId}. Retrieved {new Date(data.retrievedAt).toISOString()}.</p>}
      </details>
      <p className={styles.source}>Source: <a href="https://www.reinfolib.mlit.go.jp/">MLIT Real Estate Information Library</a>. Transaction price information (XIT001), edited and presented by SignedPrice.</p>
    </main>
  </>;
}
