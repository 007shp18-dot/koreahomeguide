'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from 'react';
import { validBudgetFilters, type OverseasMarket, type BudgetItem, type BudgetResult } from '@/lib/global-shortlist/model';
import { parseGlobalSaved, readGlobalSaved, subscribeGlobalSaved, writeGlobalSaved, type GlobalSaved } from '@/lib/global-shortlist/storage';
import { SavedCities, ShortlistCities } from './saved-cities';
import styles from '../seoul-shortlist/shortlist.module.css';
const empty = () => '';
export function BudgetSearch({ market }: { market: OverseasMarket }) {
  const sg = market === 'singapore', currency = sg ? 'SGD' : 'AED';
  const raw = useSyncExternalStore(subscribeGlobalSaved, readGlobalSaved, empty);
  const stored = useMemo(() => parseGlobalSaved(raw), [raw]);
  const filters = stored.filters[market], filterKey = JSON.stringify(filters);
  const saved = stored.places.filter(p => p.market === market), idsKey = saved.map(p => p.key).sort().join(',');
  const [page, setPage] = useState(1), [refresh, setRefresh] = useState(0), [message, setMessage] = useState('');
  const requestKey = `${market}:${filterKey}:${idsKey}:${page}:${refresh}`;
  const [response, setResponse] = useState<{ key: string; data: BudgetResult | null } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams(Object.entries(JSON.parse(filterKey) as Record<string, string | number>).map(([k, v]) => [k, String(v)]));
    query.set('page', String(page)); if (idsKey) idsKey.split(',').forEach(id => query.append('saved', id));
    fetch(`/api/shortlist/${market}?${query}`, { signal: controller.signal }).then(async r => { if (!r.ok) throw new Error(); return r.json() as Promise<BudgetResult>; }).then(data => { if (!controller.signal.aborted) setResponse({ key: requestKey, data }); }).catch(() => { if (!controller.signal.aborted) setResponse({ key: requestKey, data: null }); });
    return () => controller.abort();
  }, [market, filterKey, idsKey, page, refresh, requestKey]);
  const current = response?.key === requestKey ? response : null, data = current?.data;
  function persist(value: GlobalSaved, notice: string) { setMessage(writeGlobalSaved(value) ? notice : 'Browser storage is blocked. Changes last only for this page session.'); }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const next = { ...filters, budget: Number(form.get('budget')), region: String(form.get('region')), housing: String(form.get('housing')), ...(sg ? { minArea: Number(form.get('minArea')), maxArea: Number(form.get('maxArea')) } : { completion: String(form.get('completion')) }) };
    if (!validBudgetFilters(next, market)) { setMessage('Check the budget and area range.'); return; }
    setPage(1); persist({ ...stored, filters: { ...stored.filters, [market]: next } }, 'Search conditions saved in this browser.');
  }
  function remove(key: string) { persist({ ...stored, places: stored.places.filter(p => p.market !== market || p.key !== key) }, 'Removed from saved places.'); }
  function save(item: BudgetItem) {
    if (saved.some(p => p.key === item.key)) return;
    if (saved.length >= 30) { setMessage('You can save up to 30 places per city.'); return; }
    persist({ ...stored, places: [...stored.places, { market, key: item.key, name: item.name, signature: item.signature, checkedAt: new Date().toISOString() }] }, 'Place saved.');
  }
  function card(item: BudgetItem, savedCard = false) {
    const baseline = saved.find(p => p.key === item.key), changed = baseline && baseline.signature !== item.signature;
    return <article className={styles.card} key={item.key}><p className={styles.meta}>{sg ? item.region : 'Area-level evidence'}</p><h3>{item.name}</h3>
      {savedCard && changed && <p className={styles.badge}>Evidence updated</p>}
      <p className={styles.meta}>{sg ? savedCard ? 'Latest recorded resale · all published sizes and types' : 'Latest matching resale' : 'Median transaction price · all sizes'}</p><p className={styles.price}>{currency} {item.price.toLocaleString('en-US')}</p><p>{item.description}</p>
      <p className={styles.meta}>{item.count.toLocaleString()} {sg ? savedCard ? 'released resale records' : 'matching resale records' : 'transactions in this area segment'}</p>
      <div className={styles.actions}><Link href={item.evidenceHref}>View evidence</Link><Link href={item.checkHref}>Check an asking price</Link><button type="button" onClick={() => baseline ? remove(item.key) : save(item)}>{baseline ? 'Remove saved' : sg ? 'Save project' : 'Save area'}</button>
        {savedCard && changed && <button type="button" onClick={() => persist({ ...stored, places: stored.places.map(p => p.market === market && p.key === item.key ? { ...p, signature: item.signature, checkedAt: new Date().toISOString() } : p) }, 'Update marked as seen.')}>Mark as seen</button>}</div>
      {savedCard && baseline && <p className={styles.meta}>Last checked · {baseline.checkedAt.slice(0, 10)}</p>}
    </article>;
  }
  return <main className={styles.page}><header className={styles.heading}><p className={styles.eyebrow}>{sg ? 'SINGAPORE · PRIVATE RESALE' : 'DUBAI · AREA PRICE SCREEN'}</p><h1>{sg ? 'Find projects within your budget' : 'Find areas by median sale price'}</h1><p>{sg ? 'Search recorded resales, save projects and check an asking price against local evidence.' : 'Screen area medians against your budget, save areas and continue to a price check.'}</p></header>
    <ShortlistCities current={market} /><form className={styles.form} key={filterKey} onSubmit={submit} aria-label="Budget search conditions">
      <label>Purchase-price ceiling · {currency}<input name="budget" type="number" min="1" max="500000000" required defaultValue={filters.budget} /></label>
      <label>{sg ? 'Market segment' : 'Area'}<select name="region" defaultValue={filters.region}><option value="all">{sg ? 'All released segments' : 'All released areas'}</option>{(data?.regions ?? (sg ? ['CCR','RCR','OCR'].map(value => ({ value, label: value })) : [{ value: filters.region, label: filters.region }].filter(r => r.value !== 'all'))).map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></label>
      <label>Property type<select name="housing" defaultValue={filters.housing}>{(sg ? ['condominium', 'apartment', 'executive_condominium'] : ['apartment', 'villa']).map(type => <option value={type} key={type}>{type.replaceAll('_', ' ')}</option>)}</select></label>
      {sg ? <><label>Minimum strata area · m²<input name="minArea" type="number" min="1" max="2000" step="0.01" required defaultValue={filters.minArea} /></label><label>Maximum strata area · m²<input name="maxArea" type="number" min="1" max="2000" step="0.01" required defaultValue={filters.maxArea} /></label></> : <label>Completion<select name="completion" defaultValue={filters.completion}><option value="ready">Ready</option><option value="off-plan">Off-plan</option></select></label>}
      <button className={styles.primary} type="submit">Find & save conditions</button></form>
    <p className={styles.notice}>{sg ? 'Search covers the latest three months of released single-unit private resales; HDB is not included. These are recorded sales, not available listings. Strata area is not the same as Seoul net area.' : 'This filters area medians, not individual homes. A median within your budget does not establish that a particular home is available. Unit size and bedroom counts are not available in this release.'} Purchase price only; taxes, fees, financing and buyer eligibility are excluded. Coverage is limited to the released dataset.</p>
    <p role="status" className={styles.message}>{message}</p><SavedCities />
    <section aria-labelledby="saved-title"><div className={styles.sectionHeading}><h2 id="saved-title">{sg ? 'Saved projects' : 'Saved areas'} <span>{saved.length}/30</span></h2><button type="button" onClick={() => setRefresh(n => n + 1)}>Check for updates</button></div><p className={styles.meta}>Saved in this browser only. Updates are checked on opening or refresh, with no background notifications. Changes can include corrections{sg ? '.' : ' or a changed reporting period, not new individual transaction alerts.'}</p>
      {!saved.length ? <p className={styles.empty}>Save a place from the results below.</p> : !current ? <p role="status">Checking saved places…</p> : !data ? <p role="alert">Evidence could not be checked. Your saved list is retained.</p> : <div className={styles.grid}>{data.saved.map(i => card(i, true))}{data.missing.map(key => <article className={styles.card} key={key}><h3>{saved.find(p => p.key === key)?.name}</h3><p>Not available in the current release. This does not mean there were no transactions.</p><button onClick={() => remove(key)}>Remove saved</button></article>)}</div>}
    </section><section aria-labelledby="results-title" aria-busy={!current}><h2 id="results-title">{sg ? 'Matching projects' : 'Areas with a median within budget'}{data ? ` · ${data.total}` : ''}</h2>
      {!current ? <p role="status">Loading evidence…</p> : !data ? <div role="alert"><p>Verified evidence is unavailable. Try again shortly.</p><button onClick={() => setRefresh(n => n + 1)}>Retry</button></div> : <><p className={styles.meta}>Period · {data.period} · Updated {data.updated.slice(0, 10)} · {data.source}</p>{data.items.length ? <div className={styles.grid}>{data.items.map(i => card(i))}</div> : <p className={styles.empty}>No matches in the released data. Try a broader budget or filter.</p>}{data.total > data.pageSize && <nav className={styles.pagination} aria-label="Search pages"><button disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>Previous</button><span>{data.page} / {Math.ceil(data.total / data.pageSize)}</span><button disabled={data.page * data.pageSize >= data.total} onClick={() => setPage(data.page + 1)}>Next</button></nav>}</>}
    </section></main>;
}
