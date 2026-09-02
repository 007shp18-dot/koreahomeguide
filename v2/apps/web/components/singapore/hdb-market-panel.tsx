import Link from 'next/link';
import type { CSSProperties } from 'react';

import type { HdbExploreModel, HdbTownDisplay } from '../../lib/singapore/hdb-route-model.server';
import { singaporeStyles as styles } from './singapore-shell';

function ComparisonChart({
  title,
  description,
  towns,
  kind,
}: Readonly<{
  title: string;
  description: string;
  towns: readonly HdbTownDisplay[];
  kind: 'resale' | 'rental';
}>) {
  const value = (town: HdbTownDisplay) => (
    kind === 'resale' ? town.resaleMedianSgd : town.rentalMedianSgd
  ) ?? 0;
  const label = (town: HdbTownDisplay) => (
    kind === 'resale' ? town.resaleMedianLabel : town.rentalMedianLabel
  ) ?? 'Not published';
  const maximum = Math.max(1, ...towns.map(value));
  return (
    <figure className={styles.chart} aria-labelledby={`hdb-${kind}-chart-title`}>
      <figcaption>
        <h3 id={`hdb-${kind}-chart-title`}>{title}</h3>
        <p>{description}</p>
      </figcaption>
      <div className={styles.chartRows} role="img" aria-label={`${title}. ${description}`}>
        {towns.map((town) => (
          <div className={styles.chartRow} key={town.town}>
            <span className={styles.chartName}>{town.town}</span>
            <span className={styles.chartTrack} aria-hidden="true">
              <span
                className={styles.chartBar}
                style={{ '--bar-width': `${Math.max(2, (value(town) / maximum) * 100)}%` } as CSSProperties}
              />
            </span>
            <strong className={styles.chartValue}>{label(town)}</strong>
          </div>
        ))}
      </div>
    </figure>
  );
}

export function HdbMarketPanel({ model }: Readonly<{ model: HdbExploreModel }>) {
  if (model.status === 'unavailable') return (
    <section className={styles.section} aria-labelledby="hdb-heading" data-hdb-evidence="unavailable">
      <p className={styles.sectionLabel}>03 / HDB evidence</p>
      <h2 id="hdb-heading">Verified HDB evidence is unavailable.</h2>
    </section>
  );
  return (
    <section className={styles.section} aria-labelledby="hdb-heading" data-hdb-evidence="ready">
      <p className={styles.sectionLabel}>03 / HDB public housing</p>
      <div className={styles.sectionIntro}>
        <div>
          <h2 id="hdb-heading">Resale, rent, and block facts—kept separate.</h2>
          <p>Official data.gov.sg records. Each median uses only its own transaction type and is withheld below {model.publicationMinimum} observations.</p>
        </div>
        <dl className={styles.compactStats}>
          <div><dt>Resale records</dt><dd>{model.resaleTotalLabel}</dd></div>
          <div><dt>Rental records</dt><dd>{model.rentalTotalLabel}</dd></div>
          <div><dt>Property blocks</dt><dd>{model.propertyTotalLabel}</dd></div>
        </dl>
      </div>
      <nav className={styles.dataTabs} aria-label="Singapore housing evidence layers">
        <a href="#ura-private">URA private sale</a>
        <a href="#hdb-resale">HDB resale</a>
        <a href="#hdb-rent">HDB rent</a>
        <a href="#hdb-towns">All towns</a>
      </nav>
      <div className={styles.chartGrid}>
        <div id="hdb-resale">
          <ComparisonChart
            title="HDB resale median"
            description={`Most-observed towns · full reported period ${model.resalePeriod}`}
            towns={model.featuredResale}
            kind="resale"
          />
        </div>
        <div id="hdb-rent">
          <ComparisonChart
            title="HDB monthly rent median"
            description={`Most-observed towns · full reported period ${model.rentalPeriod}`}
            towns={model.featuredRental}
            kind="rental"
          />
        </div>
      </div>
      <div className={styles.tableWrap} id="hdb-towns">
        <table className={`${styles.table} ${styles.hdbTable}`}>
          <caption className={styles.srOnly}>HDB resale and rental evidence by town</caption>
          <thead><tr>
            <th scope="col">Town</th><th scope="col">Resale median</th><th scope="col">Resale n</th>
            <th scope="col">Monthly rent median</th><th scope="col">Rental n</th>
          </tr></thead>
          <tbody>{model.towns.map((town) => <tr key={town.town}>
            <th scope="row"><Link href={town.href}>{town.town}</Link></th>
            <td>{town.resaleMedianLabel ?? 'Not published'}</td><td>{town.resaleCountLabel}</td>
            <td>{town.rentalMedianLabel ?? 'Not published'}</td><td>{town.rentalCountLabel}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <ul className={styles.limitations}>
        <li>HDB resale prices are indicative historical transactions, not a valuation.</li>
        <li>Rental data is owner-declared when the flat is rented out and is not independently verified by HDB.</li>
        <li>Property facts are reported through {model.propertyThrough}; map and nearby Street View use Google separately.</li>
      </ul>
    </section>
  );
}
