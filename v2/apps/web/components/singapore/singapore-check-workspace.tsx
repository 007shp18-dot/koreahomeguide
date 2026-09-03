import Link from 'next/link';

import type { SingaporeCheckMarket, SingaporeCheckResult } from '@signedprice/singapore-property';
import type { SingaporeCheckCatalog, SingaporeCheckDraft, SingaporeCheckRouteModel } from '../../lib/singapore/check-route-model.server';
import { SingaporePage, singaporeStyles as styles } from './singapore-shell';

const labels: Readonly<Record<SingaporeCheckMarket, string>> = {
  'ura-private-sale': 'URA private sale', 'hdb-resale': 'HDB resale', 'hdb-rent': 'HDB rent',
};
const number = new Intl.NumberFormat('en-SG', { maximumFractionDigits: 0 });
const money = (value: number) => `SGD ${number.format(value)}`;

function options(values: readonly string[], _selected?: string) {
  void _selected;
  return values.map((value) => <option key={value} value={value}>{value}</option>);
}
function pairOptions(values: readonly Readonly<{ id: string; label: string }>[], _selected?: string) {
  void _selected;
  return <><option value="">Any</option>{values.map((value) => <option key={value.id} value={value.id}>{value.label}</option>)}</>;
}

function OfferFields({ prefix, draft, catalog }: Readonly<{ prefix: 'a' | 'b'; draft: SingaporeCheckDraft; catalog: SingaporeCheckCatalog }>) {
  const field = (label: string, name: string, content: React.ReactNode) => <label><span>{label}</span>{content}</label>;
  return <fieldset className={styles.offerFields} data-offer={prefix.toUpperCase()}>
    <legend>Offer {prefix.toUpperCase()}</legend><input type="hidden" name={`${prefix}-market`} value={draft.market} />
    {field(draft.market === 'hdb-rent' ? 'Monthly rent (SGD)' : 'Price (SGD)', `${prefix}-amount`, <input name={`${prefix}-amount`} type="number" min="1" step="1" defaultValue={draft.amount} required />)}
    {draft.market === 'ura-private-sale' ? <>
      {field('Market segment', `${prefix}-segment`, <select name={`${prefix}-segment`} defaultValue={draft.segment}>{options(catalog.segments, draft.segment)}</select>)}
      {field('Project', `${prefix}-project`, <select name={`${prefix}-project`} defaultValue={draft.project}>{pairOptions(catalog.projects, draft.project)}</select>)}
      {field('District', `${prefix}-district`, <select name={`${prefix}-district`} defaultValue={draft.district}>{options(catalog.districts, draft.district)}</select>)}
      {field('Property type', `${prefix}-property-type`, <select name={`${prefix}-property-type`} defaultValue={draft['property-type']}>{options(catalog.propertyTypes, draft['property-type'])}</select>)}
      {field('Area minimum (㎡)', `${prefix}-area-min`, <input name={`${prefix}-area-min`} type="number" min="1" defaultValue={draft['area-min'] ?? '80'} required />)}
      {field('Area maximum (㎡)', `${prefix}-area-max`, <input name={`${prefix}-area-max`} type="number" min="1" defaultValue={draft['area-max'] ?? '120'} required />)}
      {field('Floor range', `${prefix}-floor-range`, <select name={`${prefix}-floor-range`} defaultValue={draft['floor-range']}><option value="">Any</option>{options(catalog.floorRanges, draft['floor-range'])}</select>)}
      {field('Sale type', `${prefix}-sale-type`, <select name={`${prefix}-sale-type`} defaultValue={draft['sale-type']}><option value="">Any</option>{options(catalog.saleTypes, draft['sale-type'])}</select>)}
    </> : <>
      {field('Town', `${prefix}-town`, <select name={`${prefix}-town`} defaultValue={draft.town}>{options(catalog.towns, draft.town)}</select>)}
      {field('Block / street', `${prefix}-block`, <select name={`${prefix}-block`} defaultValue={draft.block}>{pairOptions(catalog.blocks, draft.block)}</select>)}
      {field('Flat type', `${prefix}-flat-type`, <select name={`${prefix}-flat-type`} defaultValue={draft['flat-type']}>{options(catalog.flatTypes, draft['flat-type'])}</select>)}
      {draft.market === 'hdb-resale' ? <>
        {field('Storey range', `${prefix}-storey-range`, <select name={`${prefix}-storey-range`} defaultValue={draft['storey-range']}><option value="">Any</option>{options(catalog.storeyRanges, draft['storey-range'])}</select>)}
        {field('Area minimum (㎡)', `${prefix}-area-min`, <input name={`${prefix}-area-min`} type="number" min="1" defaultValue={draft['area-min'] ?? '50'} required />)}
        {field('Area maximum (㎡)', `${prefix}-area-max`, <input name={`${prefix}-area-max`} type="number" min="1" defaultValue={draft['area-max'] ?? '130'} required />)}
      </> : null}
    </>}
    {field('Completed month', `${prefix}-month`, <select name={`${prefix}-month`} defaultValue={draft.month}><option value="">Latest available</option>{options(catalog.months, draft.month)}</select>)}
  </fieldset>;
}

function MarketTabs({ prefix, model }: Readonly<{ prefix: 'a' | 'b'; model: SingaporeCheckRouteModel }>) {
  const draft = model.drafts[prefix];
  return <nav className={styles.checkMarkets} aria-label={`Offer ${prefix.toUpperCase()} market`}>
    {Object.entries(labels).map(([market, label]) => {
      const typed = market as SingaporeCheckMarket; const available = model.catalogs[typed].available;
      const nextA = prefix === 'a' ? typed : model.drafts.a.market;
      const nextB = prefix === 'b' ? typed : model.drafts.b.market;
      const query = new URLSearchParams({ mode: model.mode, 'a-market': nextA });
      if (model.mode === 'compare') query.set('b-market', nextB);
      return <Link key={market} href={`/sg/singapore/check/?${query}`} aria-current={draft.market === market ? 'page' : undefined} data-evidence={available ? 'ready' : 'unavailable'}><strong>{label}</strong><span>{available ? 'Evidence ready' : 'Evidence unavailable'}</span></Link>;
    })}
  </nav>;
}

function ReadyResult({ result, label = 'Offer' }: Readonly<{ result: Extract<SingaporeCheckResult, { status: 'ready' }>; label?: string }>) {
  return <article className={styles.resultCard}><p className={styles.sectionLabel}>{label} · {labels[result.market]}</p><strong className={styles.resultMedian}>{money(result.distribution.median)}</strong><dl><div><dt>P25–P75</dt><dd>{money(result.distribution.p25)}–{money(result.distribution.p75)}</dd></div><div><dt>Offer position</dt><dd>{result.percentile}th percentile</dd></div><div><dt>Comparable scope</dt><dd>{result.scope.label}</dd></div><div><dt>Sample</dt><dd>{result.sampleCount}</dd></div><div><dt>Completed window</dt><dd>{result.window.from}–{result.window.to}</dd></div><div><dt>Source</dt><dd>{result.sourceIdentifier}</dd></div></dl>{result.fallbackDisclosure === null ? null : <p>{result.fallbackDisclosure}</p>}</article>;
}
function OfferResult({ result, label }: Readonly<{ result: SingaporeCheckResult; label?: string }>) {
  if (result.status === 'ready') return <ReadyResult result={result} label={label} />;
  if (result.status === 'insufficient') return <article className={styles.resultCard}><p className={styles.sectionLabel}>{label}</p><h3>Insufficient recent evidence</h3><p>{result.sampleCount} comparable records · minimum {result.minimumSample}</p><p>{result.window.from}–{result.window.to}; the time window was not widened.</p></article>;
  return <article className={styles.resultCard}><p className={styles.sectionLabel}>{label}</p><h3>Evidence unavailable</h3><p>{result.message}</p></article>;
}
function ResultPanel({ model }: Readonly<{ model: SingaporeCheckRouteModel }>) {
  if (model.result.kind === 'empty') return <><p className={styles.sectionLabel}>Result</p><h2>Enter an offer to check its market position.</h2><p>Results show median, P25–P75, percentile, sample, completed window, scope and source.</p></>;
  if (model.result.kind === 'invalid') return <><p className={styles.sectionLabel}>Result</p><h2>Check the entered fields.</h2><p>{model.result.message}</p></>;
  if (model.result.kind === 'single') return <OfferResult result={model.result.offer} />;
  return <><header className={styles.tradeoff}><p className={styles.sectionLabel}>A/B result</p><h2>Trade-off</h2><p>Each offer remains in its native market. No winner or conversion is inferred.</p></header><OfferResult result={model.result.offers[0]} label="Offer A" /><OfferResult result={model.result.offers[1]} label="Offer B" /></>;
}

export function SingaporeCheckWorkspace({ model }: Readonly<{ model: SingaporeCheckRouteModel }>) {
  return <SingaporePage currentHref="/sg/singapore/check/"><div className={styles.checkWorkspace} data-singapore-check-workspace="true">
    <header className={styles.checkHeader}><div><p className={styles.eyebrow}>Singapore Check</p><h1>Position an offer against its own market.</h1></div><p>Recent completed months only<br />Minimum 5 comparable transactions</p></header>
    <nav className={styles.checkMode} aria-label="Check mode"><Link aria-current={model.mode === 'single' ? 'page' : undefined} href="/sg/singapore/check/">One offer</Link><Link aria-current={model.mode === 'compare' ? 'page' : undefined} href="/sg/singapore/check/?mode=compare">Compare A/B</Link></nav>
    <section className={styles.checkBody}><div className={styles.checkForm}><form action="/sg/singapore/check/" method="get"><input type="hidden" name="submitted" value="1" /><input type="hidden" name="mode" value={model.mode} /><MarketTabs prefix="a" model={model} /><OfferFields prefix="a" draft={model.drafts.a} catalog={model.catalogs[model.drafts.a.market]} />{model.mode === 'compare' ? <><MarketTabs prefix="b" model={model} /><OfferFields prefix="b" draft={model.drafts.b} catalog={model.catalogs[model.drafts.b.market]} /></> : null}<button className={styles.checkSubmit} type="submit">{model.mode === 'compare' ? 'Compare offers' : 'Check offer'}</button></form></div><aside className={styles.checkResult} aria-label="Check result"><ResultPanel model={model} /></aside></section>
  </div></SingaporePage>;
}
