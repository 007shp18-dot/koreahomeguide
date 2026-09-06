'use client';

import { useState } from 'react';
import { selectResearchPeriod, type ResearchMonth, type ResearchPeriod } from '../../lib/research/property-research';
import styles from './property-research.module.css';

const money = (value: number, currency: 'SGD' | 'KRW', compact = false) => new Intl.NumberFormat('en', {
  style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: compact ? 1 : 0,
  notation: compact ? 'compact' : 'standard',
}).format(value);

export function MonthlyTransactionResearch({ months: releasedMonths }: Readonly<{ months: readonly ResearchMonth[] }>) {
  const [period, setPeriod] = useState<ResearchPeriod>('all');
  const months = selectResearchPeriod(releasedMonths, period);
  const hasPrices = months.some((month) => month.median !== null);
  const maxPrice = Math.max(...months.map((month) => month.median ?? 0), 1);
  const maxCount = Math.max(...months.map((month) => month.count), 1);
  const baseline = hasPrices ? 224 : 90;
  const x = (i: number) => 96 + i * 600 / Math.max(months.length - 1, 1);
  const priceY = (value: number) => 146 - value / maxPrice * 116;
  return <section className={styles.section} aria-labelledby="project-history-heading" data-transaction-research="monthly">
    <h2 id="project-history-heading">{hasPrices ? 'Reported price and activity' : 'Reported transaction activity'}</h2>
    <p>{hasPrices ? 'Monthly median sale price and reported transaction count in the selected reporting period. Changes in unit size, property type and sale mix can move the median. A price point requires at least five transactions.' : 'Monthly transaction counts in the selected reporting period. No selected month has five transactions, so monthly median prices are not published.'}</p>
    <div className={styles.chartToolbar}>
      <div role="group" aria-label="Chart reporting period">{([['12', '1Y'], ['36', '3Y'], ['all', 'All']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={period === value} onClick={() => setPeriod(value)}>{label}</button>)}</div>
      <span aria-live="polite">{months.length ? `${months[0]!.month} – ${months.at(-1)!.month} · ${months.reduce((sum, month) => sum + month.count, 0).toLocaleString('en')} reported sales` : 'No released months'}</span>
    </div>
    <svg className={styles.chart} viewBox={`0 0 720 ${baseline + 36}`} role="img" aria-label={hasPrices ? 'Monthly sale-price points and transaction-volume bars. Exact values are in the table below.' : 'Monthly reported transaction counts. Exact values are in the table below.'}>
      {hasPrices ? [0, .5, 1].map((fraction) => <g key={fraction}><line x1="90" y1={priceY(maxPrice * fraction)} x2="704" y2={priceY(maxPrice * fraction)} /><text x="0" y={priceY(maxPrice * fraction) + 4}>{money(maxPrice * fraction, 'SGD', true)}</text></g>) : null}
      <text x="0" y={baseline - 45}>{maxCount} sales</text>
      <line x1="90" x2="704" y1={baseline} y2={baseline} />
      {months.map((month, i) => <g key={month.month}>
        {month.median === null ? null : <circle cx={x(i)} cy={priceY(month.median)} r="3.5" fill="currentColor"><title>{`${month.month}: ${money(month.median, 'SGD')} · ${month.count} sales`}</title></circle>}
        <rect x={x(i) - 3} y={baseline - month.count / maxCount * 50} width={Math.min(10, 500 / Math.max(months.length, 1))} height={month.count / maxCount * 50} fill="currentColor" opacity=".5"><title>{`${month.month}: ${month.count} reported sales`}</title></rect>
        {i === 0 || i === months.length - 1 || (i === Math.floor(months.length / 2)) ? <text x={x(i)} y={baseline + 22} textAnchor={i === months.length - 1 ? 'end' : 'middle'}>{month.month}</text> : null}
      </g>)}
    </svg>
    <p>Source: URA released private residential transactions{hasPrices ? ' · SGD total sale prices' : ''}. <a href="#detail-source">Dataset and methodology</a>.</p>
    <details><summary>Monthly figures and sample sizes</summary><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Month</th><th>Reported sales</th><th>Median price</th></tr></thead><tbody>{months.map((month) => <tr key={month.month}><td>{month.month}</td><td>{month.count}</td><td>{month.median === null ? (month.count === 0 ? 'No transactions' : 'Below 5 transactions') : money(month.median, 'SGD')}</td></tr>)}</tbody></table></div></details>
  </section>;
}

