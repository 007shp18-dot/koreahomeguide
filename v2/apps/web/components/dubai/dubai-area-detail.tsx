import { DubaiAreaSummary } from './dubai-area-selection';
import { PassportLink as Link } from '../passport/passport-journey';

import type { DubaiSaleDistribution } from '../../lib/dubai/evidence-contract';
import type { DubaiAreaModel, DubaiAreaSegmentModel } from '../../lib/dubai/route-types';
import { DubaiShell } from './dubai-shell';
import { MarketDetailShell } from '../market-ui/market-shell';
import styles from './dubai-research.module.css';
import { marketText, marketHref, type MarketLocale } from '../../lib/locale/market-localization';


const integer = new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 });
const money = (value: number) => `AED\u00a0${integer.format(value)}`;
const perSqm = (value: number) => `${money(value)}/m²`;

function SaleStageCard({ locale = 'en',
  label,
  distribution,
}: Readonly<{
  label: 'Ready' | 'Off-Plan';
  distribution: DubaiSaleDistribution | null;
}> & { locale?: MarketLocale }) {
  const t = <T,>(value: T): T => marketText(locale, value);

  return <article className={styles.stageCard}>
    <h3>{t(label)}</h3>
    {distribution === null ? <p>{t("Not published for this area and home type.")}</p> : <dl>
      <div><dt>{t("Median sale price")}</dt><dd>{t(money(distribution.medianPriceAed))}</dd></div>
      <div><dt>{t("Middle half")}</dt><dd>{t(money(distribution.priceP25Aed))}{t("–")}<wbr />{t(money(distribution.priceP75Aed))}</dd></div>
      <div><dt>{t("Median AED/m²")}</dt><dd>{t(perSqm(distribution.medianPricePerSqmAed))}</dd></div>
      <div><dt>{t("Middle-half AED/m²")}</dt><dd>{t(perSqm(distribution.pricePerSqmP25Aed))}{t("–")}<wbr />{t(perSqm(distribution.pricePerSqmP75Aed))}</dd></div>
      <div><dt>{t("Sample")}</dt><dd>{t(distribution.n.toLocaleString('en'))}{t(" registered sales")}</dd></div>
    </dl>}
  </article>;
}

function SegmentSales({ locale = 'en', segment }: Readonly<{ segment: DubaiAreaSegmentModel }> & { locale?: MarketLocale }) {
  const t = <T,>(value: T): T => marketText(locale, value);

  const housingLabel = segment.housing === 'apartment' ? 'Apartment' : 'Villa';
  return <section className={styles.segmentSection}>
    <p className={styles.eyebrow}>{t(housingLabel)}{t(" evidence")}</p>
    <h2>{t("Ready vs Off-Plan")}</h2>
    <p>{t("Sale stages remain separate. Their samples are not combined to pass publication thresholds.")}</p>
    <div className={styles.stageGrid}>
      <SaleStageCard locale={locale} label={t("Ready")} distribution={segment.sales.ready} />
      <SaleStageCard locale={locale} label={t("Off-Plan")} distribution={segment.sales.offPlan} />
    </div>
  </section>;
}

function SegmentRent({ locale = 'en', segment }: Readonly<{ segment: DubaiAreaSegmentModel }> & { locale?: MarketLocale }) {
  const t = <T,>(value: T): T => marketText(locale, value);
  return <section className={styles.segmentSection}>
    <p className={styles.eyebrow}>{t(segment.housing === 'apartment' ? 'Apartment' : 'Villa')}</p>
    <article className={styles.rentCard}>
      <h3>{t("Registered rent evidence")}</h3>
      <dl>
        <div><dt>{t("Median annual rent")}</dt><dd>{t(money(segment.rent.medianAnnualRentAed))}{t("/year")}</dd></div>
        <div><dt>{t("New-contract sample")}</dt><dd>{t(segment.rent.newN.toLocaleString('en'))}{t(" new rent contracts")}</dd></div>
        <div><dt>{t("New / renewed mix")}</dt><dd>{t((segment.rent.newShare * 100).toFixed(1))}{t("% / ")}{t((segment.rent.renewedShare * 100).toFixed(1))}{t("%")}</dd></div>
        <div><dt>{t("Estimated gross rent-to-price ratio")}</dt><dd>{t(segment.readyGrossYieldPct === null ? 'Not published without Ready evidence' : `${segment.readyGrossYieldPct.toFixed(1)}%`)}</dd></div>
      </dl>
      <p>{t("The ratio divides the area’s median new annual rent by its median Ready sale price. It is not a forecast or net return.")}</p>
    </article>
  </section>;
}

export function DubaiAreaDetail({ locale = 'en',  model }: Readonly<{ model: DubaiAreaModel }> & { locale?: MarketLocale }) {
  const t = <T,>(value: T): T => marketText(locale, value);

  const comparableGroups = model.segments.flatMap((segment) => ([
    { housing: segment.housing, stage: 'ready' as const, areas: segment.comparableAreas.ready },
    { housing: segment.housing, stage: 'off-plan' as const, areas: segment.comparableAreas.offPlan },
  ])).filter(({ areas }) => areas.length > 0);
  return <DubaiShell locale={locale} href={marketHref(locale, "/ae/dubai/explore/")}>
    <main data-dubai-area-evidence="ready">
      <MarketDetailShell locale={locale}
      breadcrumb={<nav className={styles.breadcrumbs} aria-label={t("Breadcrumb")}>
        <Link href={marketHref(locale, "/ae/dubai/")}>{t("Dubai")}</Link><span>{t("/")}</span>
        <Link href={marketHref(locale, "/ae/dubai/explore/")}>{t("Explore")}</Link><span>{t("/")}</span>
        <span>{t(model.identity.name)}</span>
      </nav>}
      summary={<DubaiAreaSummary locale={locale} model={model} />}
      evidence={<>
        {model.segments.map((segment) => <SegmentSales locale={locale} key={segment.housing} segment={segment} />)}
        <p>{t("Rent source period")}: {model.context.sourcePeriods.rents.from}–{model.context.sourcePeriods.rents.to}</p>
        {model.segments.map((segment) => <SegmentRent locale={locale} key={segment.housing} segment={segment} />)}
      </>}
      rail={<div className={styles.areaRail}>
          <section className={styles.sourceCard}>
            <h2>{t("Comparable areas")}</h2>
            <p>{t("Same home type, sale stage, method, and comparison window—not a geographic-nearness claim.")}</p>
            <nav className={styles.comparableLinks} aria-label={t("Comparable Dubai areas")}>
              {comparableGroups.length === 0 ? <span>{t("No same-cohort comparison is published.")}</span> : comparableGroups.map((group) => <div key={`${group.housing}-${group.stage}`} data-comparable-stage={group.stage}>
                <strong>{t(group.housing === 'apartment' ? 'Apartment' : 'Villa')}{t(" · ")}{t(group.stage === 'ready' ? 'Ready' : 'Off-Plan')}</strong>
                {group.areas.map((area) => <Link key={area.id} href={marketHref(locale, `${area.href}?housing=${group.housing}&stage=${group.stage}`)}>{t(area.name)}</Link>)}
              </div>)}
            </nav>
          </section>
          <section className={styles.sourceCard}>
            <h2>{t("Evidence scope")}</h2>
            <dl>
              <div><dt>{t("Comparison window")}</dt><dd>{t(model.context.comparisonPeriod.from)}{t("–")}{t(model.context.comparisonPeriod.to)}</dd></div>
              <div><dt>{t("Transaction source period")}</dt><dd>{t(model.context.sourcePeriods.transactions.from)}{t("–")}{t(model.context.sourcePeriods.transactions.to)}</dd></div>
              <div><dt>{t("Rent source period")}</dt><dd>{t(model.context.sourcePeriods.rents.from)}{t("–")}{t(model.context.sourcePeriods.rents.to)}</dd></div>
              <div><dt>{t("Publication minimum")}</dt><dd>{t(model.context.publicationMinimum)}{t(" records per displayed cohort")}</dd></div>
            </dl>
            <p>{t(model.context.attribution)}</p>
            <p><a href={marketHref(locale, model.context.sourceUrl)} target="_blank" rel="noreferrer">{t("DLD source page")}</a> {t(" · ")}<a href={marketHref(locale, model.context.licenseUrl)} target="_blank" rel="noreferrer">{t("Dataset licence")}</a></p>
            <p>{t("Gross ratios exclude service charges, vacancy, financing, taxes, acquisition costs, repairs, and management.")}</p>
            <p><Link href={marketHref(locale, "/trust/")}>{t("Method and corrections")}</Link></p>
          </section>
        </div>}
      />
    </main>
  </DubaiShell>;
}
