import type { ResearchMonth, ResearchSize } from '../../lib/research/property-research';
import styles from './property-research.module.css';

const money = (value: number, currency: 'SGD' | 'KRW', compact = false) => new Intl.NumberFormat('en', {
  style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: compact ? 1 : 0,
  notation: compact ? 'compact' : 'standard',
}).format(value);

export function MonthlyTransactionResearch({ months }: Readonly<{ months: readonly ResearchMonth[] }>) {
  const hasPrices = months.some((month) => month.median !== null);
  const maxPrice = Math.max(...months.map((month) => month.median ?? 0), 1);
  const maxCount = Math.max(...months.map((month) => month.count), 1);
  const baseline = hasPrices ? 224 : 90;
  const x = (i: number) => 96 + i * 600 / Math.max(months.length - 1, 1);
  const priceY = (value: number) => 146 - value / maxPrice * 116;
  return <section className={styles.section} aria-labelledby="project-history-heading" data-transaction-research="monthly">
    <h2 id="project-history-heading">{hasPrices ? 'Reported price and activity' : 'Reported transaction activity'}</h2>
    <p>{hasPrices ? 'Monthly median sale price and reported transaction count across the released period. Changes in unit size, property type and sale mix can move the median. A price point requires at least five transactions.' : 'Monthly transaction counts across the released period. No month has five transactions, so monthly median prices are not published.'}</p>
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
    <details><summary>Monthly figures and sample sizes</summary><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Month</th><th>Reported sales</th><th>Median price</th></tr></thead><tbody>{months.map((month) => <tr key={month.month}><td>{month.month}</td><td>{month.count}</td><td>{month.median === null ? (month.count === 0 ? 'No transactions' : 'Below 5 transactions') : money(month.median, 'SGD')}</td></tr>)}</tbody></table></div></details>
  </section>;
}

export function SizeCohortResearch({ rows, currency, locale = 'en' }: Readonly<{ rows: readonly ResearchSize[]; currency: 'SGD' | 'KRW'; locale?: 'en' | 'ko' }>) {
  const max = Math.max(...rows.map((row) => row.median ?? 0), 1);
  return <div className={styles.tableWrap} data-size-comparison={currency}><table className={styles.table}>
    <thead><tr><th>{locale === 'ko' ? '비교 조건' : 'Cohort'}</th><th>{locale === 'ko' ? '면적' : 'Size'}</th><th>{locale === 'ko' ? '거래 수' : 'Transactions'}</th><th>{locale === 'ko' ? '중앙값' : 'Median'}</th></tr></thead>
    <tbody>{rows.map((row) => <tr key={`${row.group}-${row.size}`}><td>{row.group}</td><td>{row.size}</td><td>{row.count}</td><td>{row.median === null ? (locale === 'ko' ? '게시 기준 미달' : 'Not published') : <>{money(row.median, currency)}<span className={styles.bar} style={{ width: `${row.median / max * 100}%` }} aria-hidden="true" /></>}</td></tr>)}</tbody>
  </table></div>;
}

export function RecentTransactionPlot({ rows, locale = 'en' }: Readonly<{
  rows: readonly Readonly<{ filedMonth: string; areaSqm: number; primaryWon: number; primaryLabel: string }>[];
  locale?: 'en' | 'ko';
}>) {
  if (rows.length === 0) return null;
  const months = [...new Set(rows.map((row) => row.filedMonth))].sort();
  const monthIndex = (month: string) => Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7));
  const start = monthIndex(months[0]!);
  const span = monthIndex(months.at(-1)!) - start;
  const max = Math.max(...rows.map((row) => row.primaryWon), 1);
  return <section className={styles.section} aria-labelledby="building-price-trend-heading" data-transaction-research="recent">
    <h3 id="building-price-trend-heading">{locale === 'ko' ? '최근 신고 가격' : 'Recent reported prices'}</h3>
    <p>{locale === 'ko' ? `선택 조건에 해당하는 보관 거래 ${rows.length}건입니다. 각 점은 실제 신고 거래이며, 월별 전체 거래량이나 가격 지수가 아닙니다. 거래별 면적·층을 아래 표에서 함께 확인하세요.` : `${rows.length} retained transactions in the selected cohort. Each point is a reported contract, not a monthly median or complete volume series. Compare unit areas and floors in the table below.`}</p>
    <svg className={styles.chart} viewBox="0 0 720 205" role="img" aria-label={locale === 'ko' ? '신고월별 실제 거래 가격. 각 거래는 아래 표에서 확인할 수 있습니다.' : 'Individual reported prices by month, with exact transactions in the table below.'}>
      {[0, .5, 1].map((fraction) => <g key={fraction}><line x1="105" y1={160 - fraction * 130} x2="704" y2={160 - fraction * 130} /><text x="0" y={164 - fraction * 130}>{money(max * fraction, 'KRW', true)}</text></g>)}
      {rows.map((row, i) => <circle key={i} cx={span === 0 ? 400 : 115 + (monthIndex(row.filedMonth) - start) / span * 575} cy={160 - row.primaryWon / max * 130} r="4" fill="currentColor" opacity=".65"><title>{`${row.filedMonth} · ${row.areaSqm} m² · ${row.primaryLabel}`}</title></circle>)}
      <text x={span === 0 ? 400 : 115} y="190" textAnchor="middle">{months[0]}</text>{span === 0 ? null : <text x="690" y="190" textAnchor="end">{months.at(-1)}</text>}
    </svg>
  </section>;
}
