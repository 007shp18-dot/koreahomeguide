import { createPropertyScenarioHref } from '../../lib/tools/property-scenario-context';
import { buildMonthlyResearch, summarizeSizeCohorts } from '../../lib/research/property-research';
import { MonthlyTransactionResearch, SizeCohortResearch } from '../market-ui/transaction-research';
import { PropertyScenarioCalculator } from '../market-ui/property-scenario';
import Link from 'next/link';

import type {
  SingaporeProjectModel,
  SingaporeUnavailableModel,
} from '../../lib/singapore/route-types';
import { GooglePlacePhoto } from '../maps/google-place-photo';
import { ProjectedEntityMedia } from '../public-market/projected-entity-media';
import {
  SingaporeEvidence,
  SingaporePage,
  SingaporeScope,
  singaporeStyles as styles,
} from './singapore-shell';
import { MarketDetailShell } from '../market-ui/market-shell';

function PriceRange({ value }: Readonly<{ value: string }>) {
  const separator = value.indexOf('–');
  if (separator < 0) return value;
  return <>{value.slice(0, separator + 1)}<wbr />{value.slice(separator + 1)}</>;
}

export function SingaporeProjectDetail({ model, googleMapsBrowserKey = null }: Readonly<{
  model: SingaporeProjectModel | SingaporeUnavailableModel;
  googleMapsBrowserKey?: string | null;
}>) {
  if (model.status === 'unavailable') return (
    <SingaporePage currentHref="/sg/singapore/explore/">
      <section className={styles.unavailable} data-singapore-project="unavailable" data-product-intro="true">
        <h1>{model.message}</h1><p>No project value is substituted.</p>
      </section>
    </SingaporePage>
  );
  if (model.status === 'insufficient') return (
    <SingaporePage currentHref="/sg/singapore/explore/">
      <div className={styles.insufficientProject}>
        <section className={styles.withheld} data-singapore-project="insufficient" data-product-intro="true">
          <p className={styles.eyebrow}>Singapore · {model.identity.marketSegment}</p>
          <h1>{model.identity.project}: distribution not published.</h1>
          <p>{model.count} reported transactions. At least {model.threshold} are required.</p>
        </section>
        <div className={styles.insufficientMedia} aria-label={`${model.identity.project} building media`}>
          <GooglePlacePhoto
            browserKey={googleMapsBrowserKey}
            buildingName={model.identity.project}
            address={`${model.identity.street}, Singapore`}
            registryKey={`sg-project:${model.identity.marketSegment}:${model.identity.project}`}
            fallback={<ProjectedEntityMedia buildingName={model.identity.project} media={null} evidenceHref="#singapore-source-heading" />}
          />
        </div>
      </div>
      <SingaporeEvidence model={model.evidence} />
    </SingaporePage>
  );
  const records = model.transactions.map(({ source, propertyTypeLabel, saleTypeLabel, areaBasisLabel, tenureLabel }) => ({
    month: source.contractMonth.slice(0, 7), price: source.priceSgd, area: source.areaSqm,
    group: `${propertyTypeLabel} · ${saleTypeLabel} · ${areaBasisLabel} · ${tenureLabel}`,
  }));
  const [from, to] = model.evidence.period.split('..');
  const months = buildMonthlyResearch(records, from ?? '', to ?? '');
  const sizes = summarizeSizeCohorts(records);
  return (
    <SingaporePage currentHref="/sg/singapore/explore/" unframed>
      <MarketDetailShell
        breadcrumb={<nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/sg/singapore/explore/">Explore</Link>
        <Link href={`/sg/singapore/explore/${model.identity.marketSegment.toLowerCase()}/`}>
          {model.identity.marketSegment}
        </Link>
        <span>{model.identity.project}</span></nav>}
        identity={<div className={styles.detailIdentity} data-singapore-project="ready"><p className={styles.eyebrow}>Singapore · {model.identity.marketSegment} · District {model.identity.district}</p><h1>{model.identity.project}</h1><p>{model.identity.street}</p><SingaporeScope activeSegment={model.identity.marketSegment} /><div className={styles.actions}><Link href={model.checkHref}>Check this project price</Link></div></div>}
        metric={<div className={styles.detailMetric}><small>Median price</small><strong>{model.display.medianPriceLabel}</strong><span>{model.display.sampleLabel}</span></div>}
        media={<GooglePlacePhoto
          browserKey={googleMapsBrowserKey}
          buildingName={model.identity.project}
          address={`${model.identity.street}, Singapore`}
          registryKey={`sg-project:${model.identity.marketSegment}:${model.identity.project}`}
          fallback={<ProjectedEntityMedia buildingName={model.identity.project} media={null} evidenceHref="#project-summary-heading" />}
        />}
        evidence={<><section className={styles.section} aria-labelledby="project-summary-heading">
        <p className={styles.sectionLabel}>01 / Project distribution</p>
        <h2 id="project-summary-heading">Price and unit-price evidence.</h2>
        <dl className={styles.stats}>
          <div className={styles.stat}><dt>Median price</dt><dd>{model.display.medianPriceLabel}</dd></div>
          <div className={styles.stat}><dt>Middle half</dt><dd><PriceRange value={model.display.middlePriceLabel} /></dd></div>
          <div className={styles.stat}><dt>Median</dt><dd>{model.display.medianPsfLabel}</dd></div>
        </dl>
      </section>
      <MonthlyTransactionResearch months={months} />
      <section className={styles.section} aria-labelledby="project-size-heading"><h2 id="project-size-heading">Compare prices by home size</h2><p>Same project and reporting period. Property type, sale type, area basis and tenure stay separate. A cohort needs at least five transactions to publish its median.</p><SizeCohortResearch rows={sizes} currency="SGD" /></section>
      <PropertyScenarioCalculator key={model.identity.id} price={model.identity.medianPriceSgd} currency="SGD" analytics={{market:'sg-singapore',surface:'property-detail'}} />
      <Link href={createPropertyScenarioHref({locale:'en',market:'sg-singapore',currency:'SGD',entity:model.identity.id,propertyName:model.identity.project,transaction:'sale',price:model.identity.medianPriceSgd,returnTo:`/sg/singapore/explore/${model.identity.marketSegment.toLowerCase()}/${model.identity.id}/`})}>Open calculator</Link>
      <section className={styles.section} aria-labelledby="project-profile-heading"><h2 id="project-profile-heading">Project profile</h2><dl className={styles.stats}><div className={styles.stat}><dt>Street</dt><dd>{model.identity.street}</dd></div><div className={styles.stat}><dt>Tenure in reported records</dt><dd>{model.identity.tenures.join(' · ')}</dd></div><div className={styles.stat}><dt>Property types</dt><dd>{[...new Set(model.transactions.map((row) => row.propertyTypeLabel))].join(' · ')}</dd></div></dl><Link href={`/sg/singapore/explore/?q=${encodeURIComponent(model.identity.project)}&project=${encodeURIComponent(model.identity.id)}`}>View this project on the map</Link></section>
      <section className={styles.section} aria-labelledby="transaction-heading">
        <p className={styles.sectionLabel}>02 / Recent reported transactions</p>
        <h2 id="transaction-heading">Reported sales, unit sizes and floors.</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Month</th><th>Price</th><th>Area</th><th>PSF</th><th>PSM</th><th>Sale</th><th>Property</th><th>Area basis</th><th>Tenure</th><th>Floor</th></tr></thead>
            <tbody>{model.transactions.map((transaction) => (
              <tr key={`${transaction.source.sourceOrder.batch}-${transaction.source.sourceOrder.project}-${transaction.source.sourceOrder.transaction}`}>
                <td>{transaction.contractMonthLabel}</td><td>{transaction.priceLabel}</td>
                <td>{transaction.areaLabel}</td><td>{transaction.psfLabel}</td><td>{transaction.psmLabel}</td>
                <td>{transaction.saleTypeLabel}</td><td>{transaction.propertyTypeLabel}</td>
                <td>{transaction.areaBasisLabel}</td><td>{transaction.tenureLabel}</td><td>{transaction.floorRangeLabel}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section></>}
        rail={<SingaporeEvidence model={model.evidence} />}
      />
    </SingaporePage>
  );
}
