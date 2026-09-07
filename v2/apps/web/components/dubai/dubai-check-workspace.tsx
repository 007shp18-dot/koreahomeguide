import Link from 'next/link';

import {
  calculateDubaiCheck,
  createDubaiCheckHref,
  type DubaiCheckRouteState,
  type DubaiCheckResult,
} from '../../lib/dubai/check-model';
import type { DubaiCheckModel } from '../../lib/dubai/route-types';
import { createPropertyScenarioHref } from '../../lib/tools/property-scenario-context';
import styles from './dubai-research.module.css';

const integer = new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 });
const money = (value: number) => `AED\u00a0${integer.format(value)}`;
const perSqm = (value: number) => `${money(value)}/m²`;
const signedPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
const verdicts: Readonly<Record<DubaiCheckResult['verdict'], string>> = {
  'below-middle-range': 'Below the typical range',
  'within-middle-range': 'Within the typical range',
  'above-middle-range': 'Above the typical range',
};

type ResolvedCheck = Readonly<{
  result: DubaiCheckResult;
  areaName: string;
  saleCount: number;
  completion: 'ready' | 'off-plan';
  housing: 'apartment' | 'villa';
  resultHref: string;
  calculatorHref: string;
}>;

function resolveCheck(model: Extract<DubaiCheckModel, { status: 'ready' }>, state: DubaiCheckRouteState):
  | Readonly<{ kind: 'empty' | 'invalid' | 'unknown' }>
  | Readonly<{ kind: 'ready'; value: ResolvedCheck }> {
  if (state.kind !== 'ready') return { kind: state.kind };
  const query = state.query;
  const area = model.areas.find(({ slug }) => slug === query.area);
  const segment = area?.evidence.segments.find(({ housing }) => housing === query.housing);
  const sale = segment?.sales[query.completion === 'ready' ? 'ready' : 'offPlan'] ?? null;
  if (area === undefined || segment === undefined || sale === null) return { kind: 'unknown' };
  if (query.askingPriceAed === null || query.areaSqm === null || query.annualRentAed === null) {
    return { kind: 'empty' };
  }
  const resultHref = createDubaiCheckHref(query);
  return {
    kind: 'ready',
    value: Object.freeze({
      result: calculateDubaiCheck({
        askingPriceAed: query.askingPriceAed,
        areaSqm: query.areaSqm,
        annualRentAed: query.annualRentAed,
        benchmark: sale,
      }),
      areaName: area.name,
      saleCount: sale.n,
      completion: query.completion,
      housing: query.housing,
      resultHref,
      calculatorHref: createPropertyScenarioHref({
        locale: 'en',
        market: 'ae-dubai',
        currency: 'AED',
        entity: area.slug,
        propertyName: area.name,
        transaction: 'sale',
        housing: query.housing,
        areaSqm: query.areaSqm,
        price: query.askingPriceAed,
        returnTo: resultHref,
      }),
    }),
  };
}

function ResultPanel({ value, model }: Readonly<{
  value: ResolvedCheck;
  model: Extract<DubaiCheckModel, { status: 'ready' }>;
}>) {
  const { result } = value;
  return <article className={styles.checkResultCard} data-dubai-check-result="ready">
    <p className={styles.eyebrow}>{value.completion === 'ready' ? 'Ready' : 'Off-Plan'} area comparison</p>
    <h2>{verdicts[result.verdict]}</h2>
    <p>{value.areaName} · {value.housing} · {value.saleCount.toLocaleString('en')} registered sales</p>
    <dl>
      <div><dt>Asking price</dt><dd>{money(result.askingPriceAed)}</dd></div>
      <div><dt>Area median price</dt><dd>{money(result.benchmarkMedianPriceAed)}</dd></div>
      <div><dt>Price difference</dt><dd>{signedPercent(result.priceDifferencePct)}</dd></div>
      <div><dt>Asking AED/m²</dt><dd>{perSqm(result.askingPricePerSqmAed)}</dd></div>
      <div><dt>Area median AED/m²</dt><dd>{perSqm(result.benchmarkMedianPricePerSqmAed)}</dd></div>
      <div><dt>AED/m² difference</dt><dd>{signedPercent(result.pricePerSqmDifferencePct)}</dd></div>
      <div><dt>{value.completion === 'off-plan' ? 'Hypothetical gross scenario from your rent input' : 'Gross scenario from your rent input'}</dt><dd>{result.grossYieldPct.toFixed(1)}%</dd></div>
    </dl>
    <div className={styles.checkResultActions}>
      <Link href={value.calculatorHref}>Calculate ownership costs</Link>
      <Link href={value.resultHref}>Open result link</Link>
    </div>
    <p className={styles.checkDisclosure}>The typical range covers the middle 50% of recorded prices per m² for the selected area and property type. It is not an appraisal, forecast, or recommendation. The gross scenario uses only your annual-rent input and excludes vacancy, service charges, financing, taxes, acquisition costs, repairs, and management.</p>
    <p className={styles.checkDisclosure}>Evidence window {model.context.comparisonPeriod.from}–{model.context.comparisonPeriod.to} · {model.context.attribution}</p>
  </article>;
}

export function DubaiCheckWorkspace({
  model,
  state,
}: Readonly<{
  model: DubaiCheckModel;
  state: DubaiCheckRouteState;
}>) {
  if (model.status === 'unavailable') return <section className={styles.checkUnavailable} data-dubai-check-workspace="unavailable">
    <p className={styles.eyebrow}>Dubai Check</p>
    <h1>{model.message}</h1>
    <p>Explore the available Dubai area guides while price comparisons are unavailable.</p>
    <Link href="/ae/dubai/explore/">Return to Dubai Explore</Link>
  </section>;

  const firstArea = model.areas[0];
  const query = state.kind === 'ready' ? state.query : null;
  const areaValue = query?.area ?? firstArea?.slug ?? '';
  const housingValue = query?.housing ?? firstArea?.housing[0] ?? 'apartment';
  const completionValue = query?.completion ?? 'ready';
  const resolved = resolveCheck(model, state);
  return <div className={styles.checkPage} data-dubai-check-workspace="ready">
    <header className={styles.checkHeader}>
      <div><p className={styles.eyebrow}>Dubai Check</p><h1>How does this asking price compare?</h1></div>
      <p>{model.context.comparisonPeriod.from}–{model.context.comparisonPeriod.to}<br />Minimum {model.context.publicationMinimum} records per cohort</p>
    </header>
    <div className={styles.checkGrid}>
      <section className={styles.checkFormPanel}>
        <form action="/ae/dubai/check/" method="get">
          <label><span>Area</span><select name="area" defaultValue={areaValue} required>{model.areas.map((area) => <option key={area.slug} value={area.slug}>{area.name}</option>)}</select></label>
          <label><span>Home type</span><select name="housing" defaultValue={housingValue} required><option value="apartment">Apartment</option><option value="villa">Villa</option></select></label>
          <label><span>Completion</span><select name="completion" defaultValue={completionValue} required><option value="ready">Ready</option><option value="off-plan">Off-Plan</option></select></label>
          <label><span>Asking price (AED)</span><input name="price" type="number" min="100000" max="500000000" step="1" defaultValue={query?.askingPriceAed ?? ''} required /></label>
          <label><span>Area (m²)</span><input name="areaSqm" type="number" min="10" max="1000" step="0.01" defaultValue={query?.areaSqm ?? ''} required /></label>
          <label><span>Expected annual rent (AED, your assumption)</span><input name="annualRent" type="number" min="5000" max="20000000" step="1" defaultValue={query?.annualRentAed ?? ''} required /></label>
          {query?.returnTo === null || query?.returnTo === undefined ? null : <input type="hidden" name="returnTo" value={query.returnTo} />}
          <button type="submit">Check price and gross scenario</button>
        </form>
      </section>
      <aside className={styles.checkResultPanel} aria-live="polite">
        {resolved.kind === 'ready' ? <ResultPanel value={resolved.value} model={model} /> : null}
        {resolved.kind === 'empty' ? <div className={styles.checkEmpty}><p className={styles.eyebrow}>Result</p><h2>Enter a Dubai asking price, size, and annual-rent assumption.</h2><p>See where the offer sits among recorded sale prices in your chosen area.</p></div> : null}
        {resolved.kind === 'invalid' ? <div className={styles.checkEmpty}><p className={styles.eyebrow}>Result</p><h2>Check the entered fields.</h2><p>Use one valid area, stage, positive decimal amounts, and a local return link.</p></div> : null}
        {resolved.kind === 'unknown' ? <div className={styles.checkEmpty}><p className={styles.eyebrow}>Result</p><h2>This area and cohort are not published.</h2><p>No other area’s distribution has been substituted.</p></div> : null}
      </aside>
    </div>
  </div>;
}
