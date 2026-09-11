import { localizedMarketCopy } from '../../lib/locale/market-localization';

import { sgText } from '../../lib/locale/singapore-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import Link from 'next/link';
import type { CSSProperties } from 'react';

import type { HdbExploreModel, HdbTownDisplay } from '../../lib/singapore/hdb-route-model.server';
import { singaporeStyles as styles } from './singapore-shell';

function ComparisonChart({ locale = 'en',
  title,
  description,
  towns,
  kind,
}: Readonly<{ locale?: MarketLocale;
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
        <h3 id={`hdb-${kind}-chart-title`}>{sgText(locale, title)}</h3>
        <p>{sgText(locale, description)}</p>
      </figcaption>
      <div className={styles.chartRows} role="img" aria-label={sgText(locale, `${title}. ${description}`)}>
        {towns.map((town) => (
          <div className={styles.chartRow} key={town.town}>
            <span className={styles.chartName}>{town.town}</span>
            <span className={styles.chartTrack} aria-hidden="true">
              <span
                className={styles.chartBar}
                style={{ '--bar-width': `${Math.max(2, (value(town) / maximum) * 100)}%` } as CSSProperties}
              />
            </span>
            <strong className={styles.chartValue}>{sgText(locale, label(town))}</strong>
          </div>
        ))}
      </div>
    </figure>
  );
}

export function HdbMarketPanel({ locale = 'en', model }: Readonly<{ locale?: MarketLocale; model: HdbExploreModel }>) {
  if (model.status === 'unavailable') return (
    <section className={`${styles.section} ${styles.hdbPanel}`} aria-labelledby="hdb-heading" data-hdb-evidence="unavailable">
      <p className={styles.sectionLabel}>{sgText(locale, "03 / HDB evidence")}</p>
      <h2 id="hdb-heading">{sgText(locale, "Verified HDB evidence is unavailable.")}</h2>
    </section>
  );
  return (
    <section className={`${styles.section} ${styles.hdbPanel}`} aria-labelledby="hdb-heading" data-hdb-evidence="ready">
      <p className={styles.sectionLabel}>{sgText(locale, "03 / HDB public housing")}</p>
      <div className={styles.sectionIntro}>
        <div>
          <h2 id="hdb-heading">{sgText(locale, "Resale, rent, and block facts—kept separate.")}</h2>
          <p>{sgText(locale, "Official data.gov.sg records. Each median uses only its own transaction type and is withheld below ")}{sgText(locale, model.publicationMinimum)}{sgText(locale, " observations.")}</p>
        </div>
        <dl className={styles.compactStats}>
          <div><dt>{sgText(locale, "Resale records")}</dt><dd>{sgText(locale, model.resaleTotalLabel)}</dd></div>
          <div><dt>{sgText(locale, "Rental records")}</dt><dd>{sgText(locale, model.rentalTotalLabel)}</dd></div>
          <div><dt>{sgText(locale, "Property blocks")}</dt><dd>{sgText(locale, model.propertyTotalLabel)}</dd></div>
        </dl>
      </div>
      <div className={styles.chartGrid}>
        <div id="hdb-resale">
          <ComparisonChart locale={locale}
            title={sgText(locale, "HDB resale median")}
            description={sgText(locale, `Most-observed towns · full reported period ${model.resalePeriod}`)}
            towns={model.featuredResale}
            kind="resale"
          />
        </div>
        <div id="hdb-rent">
          <ComparisonChart locale={locale}
            title={sgText(locale, "HDB monthly rent median")}
            description={sgText(locale, `Most-observed towns · full reported period ${model.rentalPeriod}`)}
            towns={model.featuredRental}
            kind="rental"
          />
        </div>
      </div>
      <details id="hdb-towns" className={styles.evidenceDisclosure}><summary>{localizedMarketCopy(locale, "Compare all HDB towns · full reported period", "모든 HDB 타운 비교 · 전체 수록 기간")}</summary><div className={styles.tableWrap}>
        <table className={`${styles.table} ${styles.hdbTable}`}>
          <caption className={styles.srOnly}>{sgText(locale, "HDB resale and rental evidence by town")}</caption>
          <thead><tr>
            <th scope="col">{sgText(locale, "Town")}</th><th scope="col">{sgText(locale, "Resale median")}</th><th scope="col">{sgText(locale, "Resale n")}</th>
            <th scope="col">{sgText(locale, "Monthly rent median")}</th><th scope="col">{sgText(locale, "Rental n")}</th>
          </tr></thead>
          <tbody>{model.towns.map((town) => <tr key={town.town}>
            <th scope="row"><Link href={marketHref(locale, town.href)}>{town.town}</Link></th>
            <td>{sgText(locale, town.resaleMedianLabel ?? 'Not published')}</td><td>{sgText(locale, town.resaleCountLabel)}</td>
            <td>{sgText(locale, town.rentalMedianLabel ?? 'Not published')}</td><td>{sgText(locale, town.rentalCountLabel)}</td>
          </tr>)}</tbody>
        </table>
      </div></details>
      <details className={styles.evidenceDisclosure}>
        <summary>{localizedMarketCopy(locale, "Data & sources", "데이터·출처")}</summary>
        <div className={styles.disclosureBody}>
          <ul className={styles.limitations}>
            <li>{sgText(locale, "HDB resale prices are indicative historical transactions, not a valuation.")}</li>
            <li>{sgText(locale, "Rental data is owner-declared when the flat is rented out and is not independently verified by HDB.")}</li>
            <li>{sgText(locale, "Property facts are reported through ")}{sgText(locale, model.propertyThrough)}{sgText(locale, "; map and nearby Street View use Google separately.")}</li>
          </ul>
          <nav className={styles.sourceLinks} aria-label={sgText(locale, "Official HDB source datasets")}>
            <a href={marketHref(locale, "https://data.gov.sg/datasets/d_8b84c4ee58e3cfc0ece0d773c8ca6abc/view")} target="_blank" rel="noopener noreferrer">{sgText(locale, "HDB resale source")}</a>
            <a href={marketHref(locale, "https://data.gov.sg/datasets/d_c9f57187485a850908655db0e8cfe651/view")} target="_blank" rel="noopener noreferrer">{sgText(locale, "HDB rental source")}</a>
            <a href={marketHref(locale, "https://data.gov.sg/datasets/d_17f5382f26140b1fdae0ba2ef6239d2f/view")} target="_blank" rel="noopener noreferrer">{sgText(locale, "HDB property source")}</a>
          </nav>
        </div>
      </details>
    </section>
  );
}
