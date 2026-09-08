import type { ResearchSize } from '../../lib/research/property-research';
import styles from './property-research.module.css';

const money = (value: number, currency: 'SGD' | 'KRW', compact = false) => new Intl.NumberFormat('en', {
  style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: compact ? 1 : 0,
  notation: compact ? 'compact' : 'standard',
}).format(value);

export { MonthlyTransactionResearch } from './monthly-transaction-research';

export function SizeCohortResearch({ rows, currency, locale = 'en', periodUnit }: Readonly<{ rows: readonly ResearchSize[]; currency: 'SGD' | 'KRW'; locale?: 'en' | 'ko'; periodUnit?: 'month' }>) {
  const unit = periodUnit === 'month' ? (locale === 'ko' ? ' /월' : ' /month') : '';
  const max = Math.max(...rows.map((row) => row.median ?? 0), 1);
  return <div className={styles.tableWrap} data-size-comparison={currency} role="region" aria-label={locale === 'ko' ? '면적별 가격 비교표 — 가로로 스크롤' : 'Prices by home size — scroll horizontally'} tabIndex={0}><table className={styles.table}>
    <thead><tr><th>{locale === 'ko' ? '비교 조건' : 'Cohort'}</th><th>{locale === 'ko' ? '면적' : 'Size'}</th><th>{locale === 'ko' ? '거래 수' : 'Transactions'}</th><th>{locale === 'ko' ? '중앙값' : 'Median'}</th></tr></thead>
    <tbody>{rows.map((row) => <tr key={`${row.group}-${row.size}`}><td>{locale === 'ko' ? row.group.replaceAll('New Sale', '신규 분양').replaceAll('Resale', '재판매').replaceAll('Sub Sale', '분양권 전매').replaceAll('Non-landed', '공동주택').replaceAll('Landed', '토지 포함 주택').replaceAll('Apartment', '아파트').replaceAll('Condominium', '콘도미니엄') : row.group}</td><td>{locale === 'ko' ? row.size.replace('Under 60 m²', '60㎡ 미만').replace('135 m² and over', '135㎡ 이상').replaceAll('m²', '㎡') : row.size}</td><td>{row.count}</td><td>{row.median === null ? (locale === 'ko' ? '게시 기준 미달' : 'Not published') : <>{money(row.median, currency)}{unit}<span className={styles.bar} style={{ width: `${row.median / max * 100}%` }} aria-hidden="true" /></>}</td></tr>)}</tbody>
  </table></div>;
}

export function RecentTransactionPlot({ rows, locale = 'en', periodUnit }: Readonly<{
  rows: readonly Readonly<{ filedMonth: string; areaSqm: number; primaryWon: number; primaryLabel: string }>[];
  locale?: 'en' | 'ko';
  periodUnit?: 'month';
}>) {
  const unit = periodUnit === 'month' ? (locale === 'ko' ? ' /월' : ' /month') : '';
  if (rows.length === 0) return null;
  const months = [...new Set(rows.map((row) => row.filedMonth))].sort();
  const monthIndex = (month: string) => Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7));
  const start = monthIndex(months[0]!);
  const span = monthIndex(months.at(-1)!) - start;
  const max = Math.max(...rows.map((row) => row.primaryWon), 1);
  return <section className={styles.section} aria-labelledby="building-price-trend-heading" data-transaction-research="recent">
    <h3 id="building-price-trend-heading">{locale === 'ko' ? '최근 신고 가격' : 'Recent reported prices'}</h3>
    <p>{locale === 'ko' ? `선택 조건에 해당하는 보관 거래 ${rows.length}건입니다. 각 점은 실제 신고 거래이며, 월별 전체 거래량이나 가격 지수가 아닙니다. 거래별 면적·층을 아래 표에서 함께 확인하세요.` : `${rows.length} retained transactions in the selected cohort. Each point is a reported contract, not a monthly median or complete volume series. Compare unit areas and floors in the table below.`}</p>
    <p className={styles.chartHint}>{locale === 'ko' ? '좁은 화면에서는 그래프를 좌우로 스크롤하세요. 정확한 금액은 아래 거래표에서 확인할 수 있습니다.' : 'On narrow screens, scroll the chart horizontally. Exact prices are in the transaction table below.'}</p>
    <div className={styles.chartWrap} role="region" aria-label={locale === 'ko' ? '최근 신고 가격 그래프 — 가로로 스크롤' : 'Recent reported prices chart — scroll horizontally'} tabIndex={0}>
    <svg className={styles.chart} viewBox="0 0 720 205" role="img" aria-label={locale === 'ko' ? '신고월별 실제 거래 가격. 각 거래는 아래 표에서 확인할 수 있습니다.' : 'Individual reported prices by month, with exact transactions in the table below.'}>
      {[0, .5, 1].map((fraction) => <g key={fraction}><line x1="105" y1={160 - fraction * 130} x2="704" y2={160 - fraction * 130} /><text x="0" y={164 - fraction * 130}>{money(max * fraction, 'KRW', true)}{unit}</text></g>)}
      {rows.map((row, i) => <circle key={i} cx={span === 0 ? 400 : 115 + (monthIndex(row.filedMonth) - start) / span * 575} cy={160 - row.primaryWon / max * 130} r="4" fill="currentColor" opacity=".65"><title>{`${row.filedMonth} · ${row.areaSqm} m² · ${row.primaryLabel}${unit}`}</title></circle>)}
      <text x={span === 0 ? 400 : 115} y="190" textAnchor="middle">{months[0]}</text>{span === 0 ? null : <text x="690" y="190" textAnchor="end">{months.at(-1)}</text>}
    </svg>
    </div>
  </section>;
}
