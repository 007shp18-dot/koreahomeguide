'use client';
import { sgText } from '../../lib/locale/singapore-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';


import Link from 'next/link';
import { useMemo, useState } from 'react';

import styles from './singapore-rankings.module.css';

export type SingaporeRankingRow = Readonly<{
  id: string;
  name: string;
  segment: 'CCR' | 'RCR' | 'OCR';
  district: string;
  street: string;
  sample: number;
  medianPriceSgd: number;
  medianPsf: number;
  href: string;
}>;

type Metric = 'price' | 'psf' | 'sample';

const METRICS = Object.freeze([
  { id: 'price', label: 'Sale median' },
  { id: 'psf', label: 'Price / sq ft' },
  { id: 'sample', label: 'Filing volume' },
] as const);

const money = new Intl.NumberFormat('en-SG', {
  style: 'currency', currency: 'SGD', currencyDisplay: 'code', maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat('en-SG', { maximumFractionDigits: 0 });

function metricValue(row: SingaporeRankingRow, metric: Metric): number {
  if (metric === 'price') return row.medianPriceSgd;
  if (metric === 'psf') return row.medianPsf;
  return row.sample;
}

function metricLabel(row: SingaporeRankingRow, metric: Metric): string {
  if (metric === 'price') return money.format(row.medianPriceSgd);
  if (metric === 'psf') return `SGD ${number.format(row.medianPsf)} PSF`;
  return `${number.format(row.sample)} filings`;
}

export function SingaporeRankings({ locale = 'en', rows, periodLabel }: Readonly<{ locale?: MarketLocale;
  rows: readonly SingaporeRankingRow[];
  periodLabel: string;
}>) {
  const [metric, setMetric] = useState<Metric>('price');
  const ranked = useMemo(() => [...rows].sort((left, right) => (
    metricValue(right, metric) - metricValue(left, metric) || left.name.localeCompare(right.name)
  )), [metric, rows]);
  const maximum = Math.max(1, ...ranked.map((row) => metricValue(row, metric)));
  const metricName = METRICS.find((item) => item.id === metric)?.label ?? 'Sale median';

  return <section className={styles.page} aria-labelledby="singapore-rankings-heading">
    <header className={styles.hero}>
      <div><p>{sgText(locale, "Singapore project rankings")}</p><h1 id="singapore-rankings-heading">{sgText(locale, "Compare reported project evidence.")}</h1><span>{sgText(locale, "URA private residential sales · ")}{sgText(locale, periodLabel)}</span></div>
      <dl><div><dt>{sgText(locale, "Published projects")}</dt><dd>{sgText(locale, rows.length)}</dd></div><div><dt>{sgText(locale, "Default metric")}</dt><dd>{sgText(locale, "Sale median")}</dd></div></dl>
    </header>
    <nav className={styles.tabs} aria-label={sgText(locale, "Singapore ranking metric")}>
      {METRICS.map((item) => <button key={item.id} type="button" aria-pressed={metric === item.id} onClick={() => setMetric(item.id)}>{sgText(locale, item.label)}</button>)}
    </nav>
    <div className={styles.summary}><span>{sgText(locale, "Ranking by")}</span><strong>{sgText(locale, metricName)}</strong><p>{sgText(locale, "Only projects meeting the publication minimum are included. This is not a quality or investment score.")}</p></div>
    {ranked.length === 0 ? <p className={styles.empty}>{sgText(locale, "No published project distribution is available.")}</p> : <ol className={styles.rows}>
      {ranked.map((row, index) => <li key={row.id}>
        <span className={styles.rank}>{sgText(locale, index + 1)}</span>
        <Link href={marketHref(locale, row.href)}><strong>{row.name}</strong><span>{sgText(locale, row.segment)}{sgText(locale, " · District ")}{sgText(locale, row.district)}{sgText(locale, " · ")}{row.street}</span></Link>
        <div className={styles.value}><strong>{sgText(locale, metricLabel(row, metric))}</strong><span aria-hidden="true"><i style={{ width: `${Math.max(4, metricValue(row, metric) / maximum * 100)}%` }} /></span></div>
      </li>)}
    </ol>}
  </section>;
}
