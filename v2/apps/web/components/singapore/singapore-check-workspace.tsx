
import { DefaultAmountInput } from '../amount-input';
import { formatPricePercentile } from '../../lib/locale/price-percentile';
import { sgText } from '../../lib/locale/singapore-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import { PassportLink as Link, PassportFormContext } from '../passport/passport-journey';
import { BuyerNextSteps } from '../buyer-next-steps';

import type { SingaporeCheckMarket, SingaporeCheckResult } from '@signedprice/singapore-property';
import type { SingaporeCheckCatalog, SingaporeCheckDraft, SingaporeCheckRouteModel } from '../../lib/singapore/check-route-model.server';
import { SingaporePage, singaporeStyles as styles } from './singapore-shell';
import { ToolResearchShare } from '../tools/tool-research-share';
import { createSingaporeResearchSnapshot } from '../../lib/tool-research/client';

const labels: Readonly<Record<SingaporeCheckMarket, string>> = {
  'ura-private-sale': 'URA private sale', 'hdb-resale': 'HDB resale', 'hdb-rent': 'HDB rent',
};
const number = new Intl.NumberFormat('en-SG', { maximumFractionDigits: 0 });
const money = (value: number) => `SGD ${number.format(value)}`;

function options(locale: MarketLocale, values: readonly string[], _selected?: string) {
  void _selected;
  return values.map((value) => <option key={value} value={value}>{sgText(locale, value)}</option>);
}
function pairOptions(locale: MarketLocale, values: readonly Readonly<{ id: string; label: string }>[], _selected?: string) {
  void _selected;
  return <><option value="">{sgText(locale, "Any")}</option>{values.map((value) => <option key={value.id} value={value.id}>{value.label}</option>)}</>;
}

function OfferFields({ locale = 'en', prefix, draft, catalog }: Readonly<{ locale?: MarketLocale; prefix: 'a' | 'b'; draft: SingaporeCheckDraft; catalog: SingaporeCheckCatalog }>) {
  if (!catalog.available) return <fieldset className={styles.offerFields}>
    <legend>{sgText(locale, "Offer ")}{sgText(locale, prefix.toUpperCase())}{sgText(locale, " · ")}{sgText(locale, labels[draft.market])}</legend>
    <p>{sgText(locale, "Transaction records for this comparison are unavailable.")}</p>
    <Link href={marketHref(locale, draft.market === 'ura-private-sale' ? '/sg/singapore/explore/' : '/sg/singapore/explore/')}>{sgText(locale, "Explore Singapore transactions")}</Link>
  </fieldset>;
  const field = (label: string, name: string, content: React.ReactNode) => <label><span>{sgText(locale, label)}</span>{sgText(locale, content)}</label>;
  return <fieldset className={styles.offerFields} data-offer={prefix.toUpperCase()}>
    <legend>{sgText(locale, "Offer ")}{sgText(locale, prefix.toUpperCase())}</legend><input type="hidden" name={`${prefix}-market`} value={draft.market} />
    {field(draft.market === 'hdb-rent' ? 'Monthly rent (SGD)' : 'Asking price (SGD)', `${prefix}-amount`, <DefaultAmountInput name={`${prefix}-amount`}  min="1" step="1" defaultValue={draft.amount} required />)}
    {draft.market === 'ura-private-sale' ? <>
      {field('Market segment', `${prefix}-segment`, <select name={`${prefix}-segment`} defaultValue={draft.segment}>{options(locale, catalog.segments, draft.segment)}</select>)}
      {field('Project', `${prefix}-project`, <select name={`${prefix}-project`} defaultValue={draft.project}>{pairOptions(locale, catalog.projects, draft.project)}</select>)}
      {field('District', `${prefix}-district`, <select name={`${prefix}-district`} defaultValue={draft.district}>{options(locale, catalog.districts, draft.district)}</select>)}
      {field('Property type', `${prefix}-property-type`, <select name={`${prefix}-property-type`} defaultValue={draft['property-type']}>{options(locale, catalog.propertyTypes, draft['property-type'])}</select>)}
      {field('Area minimum (㎡)', `${prefix}-area-min`, <DefaultAmountInput name={`${prefix}-area-min`}  min="1" defaultValue={draft['area-min'] ?? '80'} required />)}
      {field('Area maximum (㎡)', `${prefix}-area-max`, <DefaultAmountInput name={`${prefix}-area-max`}  min="1" defaultValue={draft['area-max'] ?? '120'} required />)}
      {field('Floor range', `${prefix}-floor-range`, <select name={`${prefix}-floor-range`} defaultValue={draft['floor-range']}><option value="">{sgText(locale, "Any")}</option>{options(locale, catalog.floorRanges, draft['floor-range'])}</select>)}
      {field('Sale type', `${prefix}-sale-type`, <select name={`${prefix}-sale-type`} defaultValue={draft['sale-type']}><option value="">{sgText(locale, "Any")}</option>{options(locale, catalog.saleTypes, draft['sale-type'])}</select>)}
    </> : <>
      {field('Town', `${prefix}-town`, <select name={`${prefix}-town`} defaultValue={draft.town}>{options(locale, catalog.towns, draft.town)}</select>)}
      {field('Block / street', `${prefix}-block`, <select name={`${prefix}-block`} defaultValue={draft.block}>{pairOptions(locale, catalog.blocks, draft.block)}</select>)}
      {field('Flat type', `${prefix}-flat-type`, <select name={`${prefix}-flat-type`} defaultValue={draft['flat-type']}>{options(locale, catalog.flatTypes, draft['flat-type'])}</select>)}
      {draft.market === 'hdb-resale' ? <>
        {field('Storey range', `${prefix}-storey-range`, <select name={`${prefix}-storey-range`} defaultValue={draft['storey-range']}><option value="">{sgText(locale, "Any")}</option>{options(locale, catalog.storeyRanges, draft['storey-range'])}</select>)}
        {field('Area minimum (㎡)', `${prefix}-area-min`, <DefaultAmountInput name={`${prefix}-area-min`}  min="1" defaultValue={draft['area-min'] ?? '50'} required />)}
        {field('Area maximum (㎡)', `${prefix}-area-max`, <DefaultAmountInput name={`${prefix}-area-max`}  min="1" defaultValue={draft['area-max'] ?? '130'} required />)}
      </> : null}
    </>}
    {field('Reporting month', `${prefix}-month`, <select name={`${prefix}-month`} defaultValue={draft.month}><option value="">{sgText(locale, "Latest available")}</option>{options(locale, catalog.months, draft.month)}</select>)}
  </fieldset>;
}

function MarketTabs({ locale = 'en', prefix, model }: Readonly<{ locale?: MarketLocale; prefix: 'a' | 'b'; model: SingaporeCheckRouteModel }>) {
  const draft = model.drafts[prefix];
  return <nav className={styles.checkMarkets} aria-label={sgText(locale, `Offer ${prefix.toUpperCase()} market`)}>
    {sgText(locale, Object.entries(labels).map(([market, label]) => {
      const typed = market as SingaporeCheckMarket; const available = model.catalogs[typed].available;
      const nextA = prefix === 'a' ? typed : model.drafts.a.market;
      const nextB = prefix === 'b' ? typed : model.drafts.b.market;
      const query = new URLSearchParams({ mode: model.mode, 'a-market': nextA });
      if (model.mode === 'compare') query.set('b-market', nextB);
      return <Link key={market} href={marketHref(locale, `/sg/singapore/check/?${query}`)} aria-current={draft.market === market ? 'page' : undefined} data-evidence={available ? 'ready' : 'unavailable'}><strong>{sgText(locale, label)}</strong><span>{sgText(locale, available ? 'Data available' : 'Evidence unavailable')}</span></Link>;
    }))}
  </nav>;
}

function ReadyResult({ locale = 'en', result, label = 'Offer' }: Readonly<{ locale?: MarketLocale; result: Extract<SingaporeCheckResult, { status: 'ready' }>; label?: string }>) {
  return <article className={styles.resultCard}><p className={styles.sectionLabel}>{sgText(locale, label)}{sgText(locale, " · ")}{sgText(locale, labels[result.market])}</p><strong className={styles.resultMedian}>{sgText(locale, money(result.distribution.median))}</strong><dl><div><dt>{sgText(locale, "Middle 50% (P25–P75)")}</dt><dd>{sgText(locale, money(result.distribution.p25))}{sgText(locale, "–")}{sgText(locale, money(result.distribution.p75))}</dd></div><div><dt>{sgText(locale, "Price percentile")}</dt><dd>{formatPricePercentile(result.percentile, locale)}</dd></div><div><dt>{sgText(locale, "Comparable scope")}</dt><dd>{sgText(locale, result.scope.label)}</dd></div><div><dt>{sgText(locale, "Sample")}</dt><dd>{sgText(locale, result.sampleCount)}</dd></div><div><dt>{sgText(locale, "Reporting period")}</dt><dd>{sgText(locale, result.window.from)}{sgText(locale, "–")}{sgText(locale, result.window.to)}</dd></div><div><dt>{sgText(locale, "Source")}</dt><dd>{sgText(locale, result.sourceIdentifier)}</dd></div></dl>{result.fallbackDisclosure === null ? null : <p>{sgText(locale, result.fallbackDisclosure)}</p>}</article>;
}
function OfferResult({ locale = 'en', result, label }: Readonly<{ locale?: MarketLocale; result: SingaporeCheckResult; label?: string }>) {
  if (result.status === 'ready') return <ReadyResult locale={locale} result={result} label={sgText(locale, label)} />;
  if (result.status === 'insufficient') return <article className={styles.resultCard}><p className={styles.sectionLabel}>{sgText(locale, label)}</p><h3>{sgText(locale, "Insufficient recent evidence")}</h3><p>{locale === 'ko' ? `비교 거래 ${result.sampleCount}건 · 최소 ${result.minimumSample}건 필요` : `${result.sampleCount} comparable records · minimum ${result.minimumSample}`}</p><p>{sgText(locale, result.window.from)}{sgText(locale, "–")}{sgText(locale, result.window.to)}{sgText(locale, "; the time window was not widened.")}</p></article>;
  return <article className={styles.resultCard}><p className={styles.sectionLabel}>{sgText(locale, label)}</p><h3>{sgText(locale, "Evidence unavailable")}</h3><p>{sgText(locale, result.message)}</p></article>;
}
function ResearchOffer({ locale, draft, result, label }: Readonly<{
  locale: MarketLocale;
  draft: SingaporeCheckDraft;
  result: SingaporeCheckResult;
  label?: string;
}>) {
  const snapshot = result.status === 'ready'
    ? createSingaporeResearchSnapshot({ draft, result })
    : null;
  return <ToolResearchShare
    locale={locale}
    resultRevision={globalThis.crypto.randomUUID()}
    snapshot={snapshot}
    label={label}
  />;
}
function ResultPanel({ locale = 'en', model }: Readonly<{ locale?: MarketLocale; model: SingaporeCheckRouteModel }>) {
  if (model.result.kind === 'empty') return <><p className={styles.sectionLabel}>{sgText(locale, "Result")}</p><h2>{sgText(locale, "Enter an asking price.")}</h2><p>{sgText(locale, "Compare the median, middle 50% (P25–P75) and price percentile. Scope, sample, reporting period and source are shown with each result.")}</p></>;
  if (model.result.kind === 'invalid') return <><p className={styles.sectionLabel}>{sgText(locale, "Result")}</p><h2>{sgText(locale, "Check the entered fields.")}</h2><p>{sgText(locale, model.result.message)}</p></>;
  if (model.result.kind === 'single') return <><OfferResult locale={locale} result={model.result.offer} /><ResearchOffer locale={locale} draft={model.drafts.a} result={model.result.offer} /></>;
  return <><header className={styles.tradeoff}><p className={styles.sectionLabel}>{sgText(locale, "A/B result")}</p><h2>{sgText(locale, "Trade-off")}</h2><p>{sgText(locale, "Each offer remains in its native market. No winner or conversion is inferred.")}</p></header><OfferResult locale={locale} result={model.result.offers[0]} label={sgText(locale, "Offer A")} /><ResearchOffer locale={locale} draft={model.drafts.a} result={model.result.offers[0]} label={sgText(locale, "Offer A")} /><OfferResult locale={locale} result={model.result.offers[1]} label={sgText(locale, "Offer B")} /><ResearchOffer locale={locale} draft={model.drafts.b} result={model.result.offers[1]} label={sgText(locale, "Offer B")} /></>;
}

export function SingaporeCheckWorkspace({ locale = 'en', model }: Readonly<{ locale?: MarketLocale; model: SingaporeCheckRouteModel }>) {
  const available = model.catalogs[model.drafts.a.market].available && (model.mode === 'single' || model.catalogs[model.drafts.b.market].available);
  return <SingaporePage locale={locale} currentHref={marketHref(locale, "/sg/singapore/check/")}><div className={styles.checkWorkspace} data-singapore-check-workspace="true">
    <header className={styles.checkHeader}><div><p className={styles.eyebrow}>{sgText(locale, "Singapore Check")}</p><h1>{sgText(locale, "Compare an asking price")}</h1></div><p>{sgText(locale, "Recent completed months only")}<br />{sgText(locale, "Minimum 5 comparable transactions")}</p></header>
    <nav className={styles.checkMode} aria-label={sgText(locale, "Check mode")}><Link aria-current={model.mode === 'single' ? 'page' : undefined} href={marketHref(locale, "/sg/singapore/check/")}>{sgText(locale, "One offer")}</Link><Link aria-current={model.mode === 'compare' ? 'page' : undefined} href={marketHref(locale, "/sg/singapore/check/?mode=compare")}>{sgText(locale, "Compare A/B")}</Link></nav>
    <section className={styles.checkBody}><div className={styles.checkForm}><form action={marketHref(locale, "/sg/singapore/check/")} method="get"><PassportFormContext /><input type="hidden" name="submitted" value="1" /><input type="hidden" name="mode" value={model.mode} /><MarketTabs locale={locale} prefix="a" model={model} /><OfferFields locale={locale} prefix="a" draft={model.drafts.a} catalog={model.catalogs[model.drafts.a.market]} />{model.mode === 'compare' ? <><MarketTabs locale={locale} prefix="b" model={model} /><OfferFields locale={locale} prefix="b" draft={model.drafts.b} catalog={model.catalogs[model.drafts.b.market]} /></> : null}<button className={styles.checkSubmit} type="submit" disabled={!available}>{sgText(locale, model.mode === 'compare' ? 'Compare offers' : model.drafts.a.market === 'hdb-rent' ? 'Compare an asking rent' : 'Compare an asking price')}</button></form></div><aside className={styles.checkResult} aria-label={sgText(locale, "Check result")}><ResultPanel locale={locale} model={model} /></aside></section>
    <BuyerNextSteps locale={locale} market="singapore" />
  </div></SingaporePage>;
}
