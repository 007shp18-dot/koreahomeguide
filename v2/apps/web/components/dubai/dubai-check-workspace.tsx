import toolSurface from '../tools/tool-surface.module.css';
import { DefaultAmountInput } from '../amount-input';
import { PassportLink as Link, PassportFormContext } from '../passport/passport-journey';
import { BuyerNextSteps } from '../buyer-next-steps';

import {
  calculateDubaiCheck,
  createDubaiCheckHref,
  type DubaiCheckRouteState,
  type DubaiCheckResult,
} from '../../lib/dubai/check-model';
import type { DubaiCheckModel } from '../../lib/dubai/route-types';
import { createPropertyScenarioHref } from '../../lib/tools/property-scenario-context';
import styles from './dubai-research.module.css';
import { marketText, marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import { ToolResearchShare } from '../tools/tool-research-share';
import { createDubaiResearchSnapshot } from '../../lib/tool-research/client';
import type { NormalizedToolResearchSnapshot } from '../../lib/tool-research/contract';


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
  researchSnapshot: Extract<NormalizedToolResearchSnapshot, { tool: 'dubai-check' }>;
  researchRevision: string;
}>;

function resolveCheck(model: Extract<DubaiCheckModel, { status: 'ready' }>, state: DubaiCheckRouteState, locale: MarketLocale = 'en'):
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
  const resultHref = marketHref(locale, createDubaiCheckHref(query));
  const result = calculateDubaiCheck({
    askingPriceAed: query.askingPriceAed,
    areaSqm: query.areaSqm,
    annualRentAed: query.annualRentAed,
    benchmark: sale,
  });
  return {
    kind: 'ready',
    value: Object.freeze({
      result,
      areaName: area.name,
      saleCount: sale.n,
      completion: query.completion,
      housing: query.housing,
      resultHref,
      calculatorHref: createPropertyScenarioHref({
        locale,
        market: 'ae-dubai',
        currency: 'AED',
        entity: area.slug,
        propertyName: area.name,
        transaction: 'sale',
        housing: query.housing,
        areaSqm: query.areaSqm,
        price: query.askingPriceAed,
        annualRent: query.annualRentAed,
        returnTo: resultHref,
      }),
      researchSnapshot: createDubaiResearchSnapshot({
        askingPriceAed: result.askingPriceAed,
        areaSqm: query.areaSqm,
        annualRentAed: query.annualRentAed,
        yieldPct: result.grossYieldPct,
        sample: sale.n,
        stage: query.completion,
        housingType: query.housing,
        verdict: result.verdict === 'below-middle-range' ? 'below'
          : result.verdict === 'above-middle-range' ? 'above' : 'typical',
      }),
      researchRevision: globalThis.crypto.randomUUID(),
    }),
  };
}

function ResultPanel({ locale = 'en',  value, model }: Readonly<{
  value: ResolvedCheck;
  model: Extract<DubaiCheckModel, { status: 'ready' }>;
}> & { locale?: MarketLocale }) {
  const t = <T,>(value: T): T => marketText(locale, value);

  const { result } = value;
  return <article className={styles.checkResultCard} data-dubai-check-result="ready">
    <p className={styles.eyebrow}>{t(value.completion === 'ready' ? 'Ready' : 'Off-Plan')}{t(" area comparison")}</p>
    <h2>{t(verdicts[result.verdict])}</h2>
    <p>{t(value.areaName)}{t(" · ")}{t(value.housing)}{t(" · ")}{t(value.saleCount.toLocaleString('en'))}{t(" registered sales")}</p>
    <dl>
      <div><dt>{t("Asking price")}</dt><dd>{t(money(result.askingPriceAed))}</dd></div>
      <div><dt>{t("Area median price")}</dt><dd>{t(money(result.benchmarkMedianPriceAed))}</dd></div>
      <div><dt>{t("Price difference")}</dt><dd>{t(signedPercent(result.priceDifferencePct))}</dd></div>
      <div><dt>{t("Asking AED/m²")}</dt><dd>{t(perSqm(result.askingPricePerSqmAed))}</dd></div>
      <div><dt>{t("Area median AED/m²")}</dt><dd>{t(perSqm(result.benchmarkMedianPricePerSqmAed))}</dd></div>
      <div><dt>{t("AED/m² difference")}</dt><dd>{t(signedPercent(result.pricePerSqmDifferencePct))}</dd></div>
      <div><dt>{t(value.completion === 'off-plan' ? 'Hypothetical gross scenario from your rent input' : 'Gross scenario from your rent input')}</dt><dd>{t(result.grossYieldPct.toFixed(1))}{t("%")}</dd></div>
    </dl>
    <div className={styles.checkResultActions}>
      <Link href={marketHref(locale, value.calculatorHref)}>{t("Calculate ownership costs")}</Link>
      <Link href={marketHref(locale, value.resultHref)}>{t("Open result link")}</Link>
    </div>
    <p className={styles.checkDisclosure}>{t("The typical range covers the middle 50% of recorded prices per m² for the selected area and property type. It is not an appraisal, forecast, or recommendation. The gross scenario uses only your annual-rent input and excludes vacancy, service charges, financing, taxes, acquisition costs, repairs, and management.")}</p>
    <p className={styles.checkDisclosure}>{t("Reporting period ")}{t(model.context.comparisonPeriod.from)}{t("–")}{t(model.context.comparisonPeriod.to)}{t(" · ")}{t(model.context.attribution)}</p>
    <ToolResearchShare locale={locale} resultRevision={value.researchRevision} snapshot={value.researchSnapshot} />
  </article>;
}

export function DubaiCheckWorkspace({ locale = 'en',
  model,
  state,
}: Readonly<{
  model: DubaiCheckModel;
  state: DubaiCheckRouteState;
}> & { locale?: MarketLocale }) {
  const t = <T,>(value: T): T => marketText(locale, value);

  if (model.status === 'unavailable') return <section className={styles.checkUnavailable} data-dubai-check-workspace="unavailable">
    <p className={styles.eyebrow}>{t("Dubai Check")}</p>
    <h1>{t(model.message)}</h1>
    <p>{t("Explore the available Dubai area guides while price comparisons are unavailable.")}</p>
    <Link href={marketHref(locale, "/ae/dubai/explore/")}>{t("Return to Dubai Explore")}</Link>
  </section>;

  const firstArea = model.areas[0];
  const query = state.kind === 'ready' ? state.query : null;
  const areaValue = query?.area ?? firstArea?.slug ?? '';
  const housingValue = query?.housing ?? firstArea?.housing[0] ?? 'apartment';
  const completionValue = query?.completion ?? 'ready';
  const resolved = resolveCheck(model, state, locale);
  return <div className={`${styles.checkPage} ${toolSurface.surface}`} data-dubai-check-workspace="ready">
    <header data-tool-header className={styles.checkHeader}>
      <div><p className={styles.eyebrow}>{t("Dubai Check")}</p><h1>{t("Compare an asking price")}</h1></div>
      <p>{t(model.context.comparisonPeriod.from)}{t("–")}{t(model.context.comparisonPeriod.to)}<br />{locale === 'ko' ? `비교 그룹별 최소 ${model.context.publicationMinimum}건` : `Minimum ${model.context.publicationMinimum} records per cohort`}</p>
    </header>
    <div data-tool-layout className={styles.checkGrid}>
      <section data-tool-input className={styles.checkFormPanel}>
        <form action={marketHref(locale, "/ae/dubai/check/")} method="get"><PassportFormContext />
          <label><span>{t("Area")}</span><select name="area" defaultValue={areaValue} required>{model.areas.map((area) => <option key={area.slug} value={area.slug}>{t(area.name)}</option>)}</select></label>
          <label><span>{t("Home type")}</span><select name="housing" defaultValue={housingValue} required><option value="apartment">{t("Apartment")}</option><option value="villa">{t("Villa")}</option></select></label>
          <label><span>{t("Completion")}</span><select name="completion" defaultValue={completionValue} required><option value="ready">{t("Ready")}</option><option value="off-plan">{t("Off-Plan")}</option></select></label>
          <label><span>{t("Asking price (AED)")}</span><DefaultAmountInput name="price"  min="100000" max="500000000" step="1" defaultValue={query?.askingPriceAed ?? ''} required /></label>
          <label><span>{t("Area (m²)")}</span><DefaultAmountInput name="areaSqm"  min="10" max="1000" step="0.01" defaultValue={query?.areaSqm ?? ''} required /></label>
          <label><span>{t("Expected annual rent (AED, your assumption)")}</span><DefaultAmountInput name="annualRent"  min="5000" max="20000000" step="1" defaultValue={query?.annualRentAed ?? ''} required /></label>
          {query?.returnTo === null || query?.returnTo === undefined ? null : <input type="hidden" name="returnTo" value={query.returnTo} />}
          <button type="submit">{t("Compare price and gross yield")}</button>
        </form>
      </section>
      <aside data-tool-result className={styles.checkResultPanel} aria-live="polite">
        {resolved.kind === 'ready' ? <ResultPanel locale={locale} value={resolved.value} model={model} /> : null}
        {resolved.kind === 'empty' ? <div className={styles.checkEmpty}><p className={styles.eyebrow}>{t("Result")}</p><h2>{t("Enter an asking price, size and expected annual rent.")}</h2><p>{t("Compare with area transactions. The rent input is your own assumption.")}</p></div> : null}
        {resolved.kind === 'invalid' ? <div className={styles.checkEmpty}><p className={styles.eyebrow}>{t("Result")}</p><h2>{t("Check the entered fields.")}</h2><p>{t("Use one valid area, stage, positive decimal amounts, and a local return link.")}</p></div> : null}
        {resolved.kind === 'unknown' ? <div className={styles.checkEmpty}><p className={styles.eyebrow}>{t("Result")}</p><h2>{t(completionValue === 'ready' ? 'No Ready transaction data is available for the selected area and property type.' : 'No Off-Plan transaction data is available for the selected area and property type.')}</h2><p>{t("No other area’s distribution has been substituted.")}</p></div> : null}
      </aside>
    </div>
    <BuyerNextSteps locale={locale} market="dubai" />
  </div>;
}
