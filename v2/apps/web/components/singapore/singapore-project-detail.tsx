import Link from 'next/link';

import type {
  SingaporeProjectModel,
  SingaporeUnavailableModel,
} from '../../lib/singapore/route-types';
import {
  SingaporeEvidence,
  SingaporePage,
  SingaporeScope,
  singaporeStyles as styles,
} from './singapore-shell';

export function SingaporeProjectDetail({ model }: Readonly<{
  model: SingaporeProjectModel | SingaporeUnavailableModel;
}>) {
  if (model.status === 'unavailable') return (
    <SingaporePage>
      <section className={styles.unavailable} data-singapore-project="unavailable">
        <h1>{model.message}</h1><p>No project value is substituted.</p>
      </section>
    </SingaporePage>
  );
  if (model.status === 'insufficient') return (
    <SingaporePage>
      <section className={styles.withheld} data-singapore-project="insufficient">
        <p className={styles.eyebrow}>Singapore · {model.identity.marketSegment}</p>
        <h1>{model.identity.project}: distribution not published.</h1>
        <p>{model.count} reported transactions. At least {model.threshold} are required.</p>
      </section>
      <SingaporeEvidence model={model.evidence} />
    </SingaporePage>
  );
  return (
    <SingaporePage>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/sg/singapore/explore/">Explore</Link>
        <Link href={`/sg/singapore/explore/${model.identity.marketSegment.toLowerCase()}/`}>
          {model.identity.marketSegment}
        </Link>
        <span>{model.identity.project}</span>
      </nav>
      <header className={styles.hero} data-singapore-project="ready">
        <p className={styles.eyebrow}>Singapore · {model.identity.marketSegment} · District {model.identity.district}</p>
        <h1>{model.identity.project}: {model.display.medianPriceLabel} median.</h1>
        <p>{model.identity.street} · {model.display.sampleLabel}</p>
        <SingaporeScope />
      </header>
      <section className={styles.section} aria-labelledby="project-summary-heading">
        <p className={styles.sectionLabel}>01 / Project distribution</p>
        <h2 id="project-summary-heading">Price and unit-price evidence.</h2>
        <dl className={styles.stats}>
          <div className={styles.stat}><dt>Median price</dt><dd>{model.display.medianPriceLabel}</dd></div>
          <div className={styles.stat}><dt>Middle half</dt><dd>{model.display.middlePriceLabel}</dd></div>
          <div className={styles.stat}><dt>Median</dt><dd>{model.display.medianPsfLabel}</dd></div>
        </dl>
      </section>
      <section className={styles.section} aria-labelledby="transaction-heading">
        <p className={styles.sectionLabel}>02 / Recent reported transactions</p>
        <h2 id="transaction-heading">Native source fields, with derived unit prices labelled.</h2>
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
      </section>
      <SingaporeEvidence model={model.evidence} />
    </SingaporePage>
  );
}
