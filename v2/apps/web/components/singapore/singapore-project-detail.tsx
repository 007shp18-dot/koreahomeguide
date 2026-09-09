
import { sgText } from '../../lib/locale/singapore-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import { singaporeProjectDisplayName } from '../../lib/singapore/project-display-name';
import { createPropertyScenarioHref } from '../../lib/tools/property-scenario-context';
import { buildProjectMonthlyResearch, summarizeSizeCohorts } from '../../lib/research/property-research';
import { MonthlyTransactionResearch, SizeCohortResearch } from '../market-ui/transaction-research';
import { PropertyScenarioCalculator } from '../market-ui/property-scenario';
import { PassportLink as Link } from '../passport/passport-journey';

import type {
  SingaporeProjectModel,
  SingaporeUnavailableModel,
} from '../../lib/singapore/route-types';
import type { PublicEntityProximity } from '../../lib/public-data/entity-location-projection.server';
import { ProjectedEntityMedia, type ProjectedEntityMediaModel } from '../public-market/projected-entity-media';
import {
  SingaporeEvidence,
  SingaporePage,
  singaporeStyles as styles,
} from './singapore-shell';
import { MarketDetailShell } from '../market-ui/market-shell';
import { MarketSummary } from '../market-ui/market-summary';
import { SingaporeNearbyPlaces } from './singapore-nearby-places';
import { SingaporeTransactionsTable } from './singapore-transactions-table';

function PriceRange({ locale = 'en', value }: Readonly<{ locale?: MarketLocale; value: string }>) {
  const separator = value.indexOf('–');
  if (separator < 0) return value;
  return <>{sgText(locale, value.slice(0, separator + 1))}<wbr />{sgText(locale, value.slice(separator + 1))}</>;
}

export function SingaporeProjectDetail({ locale = 'en', model, googleMapsBrowserKey = null, proximity = null, media = null }: Readonly<{ locale?: MarketLocale;
  model: SingaporeProjectModel | SingaporeUnavailableModel;
  googleMapsBrowserKey?: string | null;
  proximity?: PublicEntityProximity | null;
  media?: ProjectedEntityMediaModel | null;
}>) {
  if (model.status === 'unavailable') return (
    <SingaporePage locale={locale} currentHref={marketHref(locale, "/sg/singapore/explore/")}>
      <section className={styles.unavailable} data-singapore-project="unavailable" data-product-intro="true">
        <h1>{sgText(locale, model.message)}</h1><p>{sgText(locale, "No project value is substituted.")}</p>
      </section>
    </SingaporePage>
  );
  const displayName = singaporeProjectDisplayName(model.identity);
  if (model.status === 'insufficient') return (
    <SingaporePage locale={locale} currentHref={marketHref(locale, "/sg/singapore/explore/")}>
      <div className={styles.insufficientProject}>
        <section className={styles.withheld} data-singapore-project="insufficient" data-product-intro="true">
          <p className={styles.eyebrow}>{sgText(locale, "Singapore · ")}{sgText(locale, model.identity.marketSegment)}</p>
          <h1>{displayName}{sgText(locale, ": distribution not published.")}</h1>
          <p>{sgText(locale, model.count)}{sgText(locale, " reported transactions. At least ")}{sgText(locale, model.threshold)}{sgText(locale, " are required.")}</p>
        </section>
        <div className={styles.insufficientMedia} aria-label={sgText(locale, `${displayName} building media`)}>
          <ProjectedEntityMedia locale={locale}
            media={media}
            fallbackMarket="singapore"
            browserKey={googleMapsBrowserKey}
            buildingName={model.identity.project}
          buildingKey={`singapore:project:${model.identity.id}`}
          address={`${model.identity.street}, Singapore`}
            displayBuildingName={displayName}
            registryKey={`sg-project:${model.identity.marketSegment}:${model.identity.project}`}
            evidenceHref="#singapore-source-heading"
          />
        </div>
      </div>
      <SingaporeNearbyPlaces locale={locale} proximity={proximity} />
      <SingaporeEvidence locale={locale} model={model.evidence} />
    </SingaporePage>
  );
  const records = model.transactions.map(({ source, propertyTypeLabel, saleTypeLabel, areaBasisLabel, tenureLabel }) => ({
    month: source.contractMonth.slice(0, 7), price: source.priceSgd, area: source.areaSqm,
    group: `${propertyTypeLabel} · ${saleTypeLabel} · ${areaBasisLabel} · ${tenureLabel}`,
  }));
  const [from, to] = model.evidence.period.split('..');
  const months = buildProjectMonthlyResearch(records, from ?? '', to ?? '');
  const sizes = summarizeSizeCohorts(records);
  return (
    <SingaporePage locale={locale} currentHref={marketHref(locale, "/sg/singapore/explore/")} unframed>
      <MarketDetailShell locale={locale}
        breadcrumb={<nav className={styles.breadcrumbs} aria-label={sgText(locale, "Breadcrumb")}>
        <Link href={marketHref(locale, "/sg/singapore/explore/")}>{sgText(locale, "Explore")}</Link>
        <Link href={marketHref(locale, `/sg/singapore/explore/${model.identity.marketSegment.toLowerCase()}/`)}>
          {sgText(locale, model.identity.marketSegment)}
        </Link>
        <span>{displayName}</span></nav>}
        summary={<div data-singapore-project="ready"><MarketSummary locale={locale} kind="project"
          title={displayName}
          location={model.identity.street}
          context={`${sgText(locale, 'Singapore')} · ${model.identity.marketSegment} · ${sgText(locale, 'District')} ${model.identity.district}`}
          metric={{
            label: locale === 'ko' ? '집계 기간 매매가격 중앙값' : 'Median sale price for this period',
            value: sgText(locale, model.display.medianPriceLabel),
            secondary: sgText(locale, model.display.medianPsfLabel),
            note: `${sgText(locale, 'Reporting period')} · ${model.evidence.period}`,
          }}
          facts={[
            { label: sgText(locale, 'Sample'), value: sgText(locale, model.display.sampleLabel) },
            ...(model.identity.tenures.filter(Boolean).length ? [{ label: sgText(locale, 'Tenure in reported records'), value: sgText(locale, model.identity.tenures.filter(Boolean).join(' · ')) }] : []),
          ]}
          actions={<Link href={marketHref(locale, model.checkHref)}>{sgText(locale, 'Compare an asking price')}</Link>}
        /></div>}
        media={<ProjectedEntityMedia locale={locale}
          media={media}
          fallbackMarket="singapore"
          browserKey={googleMapsBrowserKey}
          buildingName={model.identity.project}
          buildingKey={`singapore:project:${model.identity.id}`}
          address={`${model.identity.street}, Singapore`}
          displayBuildingName={displayName}
          registryKey={`sg-project:${model.identity.marketSegment}:${model.identity.project}`}
          evidenceHref="#project-summary-heading"
        />}
        evidence={<><section className={styles.section} aria-labelledby="project-summary-heading">
        <p className={styles.sectionLabel}>{sgText(locale, "01 / Project distribution")}</p>
        <h2 id="project-summary-heading">{sgText(locale, "Price and unit-price evidence.")}</h2>
        <dl className={styles.stats}>
          <div className={styles.stat}><dt>{sgText(locale, "Middle half")}</dt><dd><PriceRange locale={locale} value={model.display.middlePriceLabel} /></dd></div>
          <div className={styles.stat}><dt>{sgText(locale, "Median")}</dt><dd>{sgText(locale, model.display.medianPsfLabel)}</dd></div>
        </dl>
      </section>
      <MonthlyTransactionResearch locale={locale} months={months} />
      <section className={styles.section} aria-labelledby="transaction-heading">
        <p className={styles.sectionLabel}>{sgText(locale, "02 / Recent reported transactions")}</p>
        <h2 id="transaction-heading">{sgText(locale, "Reported sales, unit sizes and floors.")}</h2>
        <SingaporeTransactionsTable key={model.identity.id} locale={locale} rows={model.transactions.map(({ source, ...row }) => { void source; return row; })} />
      </section>
      <SingaporeNearbyPlaces locale={locale} proximity={proximity} />
      <section className={styles.section} aria-labelledby="project-size-heading"><h2 id="project-size-heading">{sgText(locale, "Compare prices by home size")}</h2><p>{sgText(locale, "Same project and reporting period. Property type, sale type, area basis and tenure stay separate. A cohort needs at least five transactions to publish its median.")}</p><SizeCohortResearch locale={locale} rows={sizes} currency="SGD" /></section>
      <PropertyScenarioCalculator locale={locale} key={model.identity.id} price={model.identity.medianPriceSgd} currency="SGD" analytics={{market:'sg-singapore',surface:'property-detail'}} />
      <Link href={marketHref(locale, createPropertyScenarioHref({locale,market:'sg-singapore',currency:'SGD',entity:model.identity.id,propertyName:displayName,transaction:'sale',price:model.identity.medianPriceSgd,returnTo:marketHref(locale, `/sg/singapore/explore/${model.identity.marketSegment.toLowerCase()}/${model.identity.id}/`)}))}>{sgText(locale, "Open calculator")}</Link>
      <section className={styles.section} aria-labelledby="project-profile-heading"><h2 id="project-profile-heading">{sgText(locale, "Project profile")}</h2><dl className={styles.stats}><div className={styles.stat}><dt>{sgText(locale, "Street")}</dt><dd>{model.identity.street}</dd></div><div className={styles.stat}><dt>{sgText(locale, "Tenure in reported records")}</dt><dd>{sgText(locale, model.identity.tenures.join(' · '))}</dd></div><div className={styles.stat}><dt>{sgText(locale, "Property types")}</dt><dd>{sgText(locale, [...new Set(model.transactions.map((row) => row.propertyTypeLabel))].join(' · '))}</dd></div></dl><Link href={marketHref(locale, `/sg/singapore/explore/?q=${encodeURIComponent(displayName)}&project=${encodeURIComponent(model.identity.id)}`)}>{sgText(locale, "View this project on the map")}</Link></section>
</>}
        rail={<SingaporeEvidence locale={locale} model={model.evidence} />}
      />
    </SingaporePage>
  );
}
