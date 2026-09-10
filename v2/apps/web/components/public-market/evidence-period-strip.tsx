import type { EvidencePeriodModel } from '../../lib/public-market/evidence-interpretation';
import {
  PUBLIC_MARKET_COPY,
  type ProductLocale,
} from '../../lib/locale/product-copy';
import styles from './public-market.module.css';

function monthLabel(month: string, fallback: string, locale: ProductLocale): string {
  if (locale === 'en') return fallback;
  const [year, monthNumber] = month.split('-');
  return `${year}년 ${Number(monthNumber)}월`;
}

export function EvidencePeriodStrip({
  model,
  label,
  locale = 'en',
}: Readonly<{
  model: EvidencePeriodModel;
  label: string;
  locale?: ProductLocale;
}>) {
  const copy = PUBLIC_MARKET_COPY[locale].period;
  return (
    <section className={styles.periodEvidence} aria-label={label}>
      <ol className={styles.periodStrip}>
        {model.months.map((month) => (
          <li
            className={month.state === 'complete'
              ? styles.periodComplete
              : styles.periodFiling}
            data-month-state={month.state}
            key={month.month}
          >
            <time dateTime={month.month}>{monthLabel(month.month, month.label, locale)}</time>
          </li>
        ))}
      </ol>
      <div className={styles.periodLegend} aria-label={copy.legendAria}>
        {model.legend.map((item) => (
          <span data-period-legend-state={item.state} key={item.state}>
            <i aria-hidden="true" />
            {item.state === 'complete' ? copy.complete : copy.filing}
          </span>
        ))}
      </div>
      {model.caveat === null ? null : (
        <p className={styles.periodCaveat}>
          {locale === 'ko' ? copy.filingCaveat : model.caveat}
        </p>
      )}
    </section>
  );
}
