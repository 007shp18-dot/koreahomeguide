import Link from 'next/link';

import { sgText } from '../../lib/locale/singapore-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import type {
  SingaporeRankingMetric,
  SingaporeRankingRow,
  SingaporeRankingsModel,
} from '../../lib/public-market/rankings-route-model.server';
import styles from './singapore-rankings.module.css';

export type { SingaporeRankingRow, SingaporeRankingsModel };

const METRICS = Object.freeze([
  { id: 'price', label: 'Sale median' },
  { id: 'psf', label: 'Price / sq ft' },
  { id: 'sample', label: 'Filing volume' },
] as const);

const money = new Intl.NumberFormat('en-SG', {
  style: 'currency', currency: 'SGD', currencyDisplay: 'code', maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat('en-SG', { maximumFractionDigits: 0 });

function metricValue(row: SingaporeRankingRow, metric: SingaporeRankingMetric): number {
  if (metric === 'price') return row.medianPriceSgd!;
  if (metric === 'psf') return row.medianPsf!;
  return row.sample;
}

function metricLabel(row: SingaporeRankingRow, metric: SingaporeRankingMetric): string {
  if (metric === 'price') return money.format(row.medianPriceSgd!);
  if (metric === 'psf') return `SGD ${number.format(row.medianPsf!)} PSF`;
  return `${number.format(row.sample)} filings`;
}

function rankingHref(locale: MarketLocale, metric: SingaporeRankingMetric, page = 1) {
  const query = new URLSearchParams();
  if (metric !== 'price') query.set('metric', metric);
  if (page > 1) query.set('page', String(page));
  const base = marketHref(locale, '/sg/singapore/rankings/');
  return query.size === 0 ? base : `${base}?${query.toString()}`;
}

export function SingaporeRankings({ locale = 'en', model, periodLabel }: Readonly<{
  locale?: MarketLocale;
  model: SingaporeRankingsModel;
  periodLabel: string;
}>) {
  const maximum = Math.max(1, ...model.rows.map((row) => metricValue(row, model.metric)));
  const metricName = METRICS.find((item) => item.id === model.metric)?.label ?? 'Sale median';
  return <section className={styles.page} aria-labelledby="singapore-rankings-heading">
    <header className={styles.hero}>
      <div><p>{sgText(locale, 'Singapore project rankings')}</p><h1 id="singapore-rankings-heading">{sgText(locale, 'Compare reported project evidence.')}</h1><span>{sgText(locale, 'URA private residential sales · ')}{sgText(locale, periodLabel)}</span></div>
      <dl><div><dt>{sgText(locale, 'Published projects')}</dt><dd>{sgText(locale, model.pagination.total)}</dd></div><div><dt>{sgText(locale, 'Default metric')}</dt><dd>{sgText(locale, 'Sale median')}</dd></div></dl>
    </header>
    <nav className={styles.tabs} aria-label={sgText(locale, 'Singapore ranking metric')}>
      {METRICS.map((item) => <Link key={item.id} href={rankingHref(locale, item.id)} aria-current={model.metric === item.id ? 'page' : undefined}>{sgText(locale, item.label)}</Link>)}
    </nav>
    <div className={styles.summary}><span>{sgText(locale, 'Ranking by')}</span><strong>{sgText(locale, metricName)}</strong><p>{sgText(locale, 'Only projects meeting the publication minimum are included. This is not a quality or investment score.')}</p></div>
    {model.rows.length === 0 ? <p className={styles.empty}>{sgText(locale, 'No published project distribution is available.')}</p> : <ol className={styles.rows} start={model.rows[0]?.rank}>
      {model.rows.map((row) => <li key={row.id} data-ranking-row={row.id}>
        <span className={styles.rank}>{sgText(locale, row.rank)}</span>
        <Link href={marketHref(locale, row.href)}><strong>{row.name}</strong><span>{sgText(locale, row.segment)}{sgText(locale, ' · District ')}{sgText(locale, row.district)}{sgText(locale, ' · ')}{row.street}</span></Link>
        <div className={styles.value}><strong>{sgText(locale, metricLabel(row, model.metric))}</strong><span aria-hidden="true"><i style={{ width: `${Math.max(4, metricValue(row, model.metric) / maximum * 100)}%` }} /></span></div>
      </li>)}
    </ol>}
    {model.pagination.pageCount > 1 ? <nav className={styles.pagination} aria-label={sgText(locale, 'Singapore ranking pages')}>
      {model.pagination.previousPage === null ? <span /> : <Link href={rankingHref(locale, model.metric, model.pagination.previousPage)}>{sgText(locale, 'Previous')}</Link>}
      <span>{sgText(locale, 'Page')} {model.pagination.page} / {model.pagination.pageCount}</span>
      {model.pagination.nextPage === null ? <span /> : <Link href={rankingHref(locale, model.metric, model.pagination.nextPage)}>{sgText(locale, 'Next')}</Link>}
    </nav> : null}
  </section>;
}
