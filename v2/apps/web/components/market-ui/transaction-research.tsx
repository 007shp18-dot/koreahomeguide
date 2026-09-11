import { localizedMarketCopy } from '../../lib/locale/market-localization';
import type { ResearchSize } from '../../lib/research/property-research';
import styles from './property-research.module.css';

const money = (value: number, currency: 'SGD' | 'KRW', compact = false) => new Intl.NumberFormat('en', {
  style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: compact ? 1 : 0,
  notation: compact ? 'compact' : 'standard',
}).format(value);

export { MonthlyTransactionResearch } from './monthly-transaction-research';

export function SizeCohortResearch({ rows, currency, locale = 'en', periodUnit }: Readonly<{ rows: readonly ResearchSize[]; currency: 'SGD' | 'KRW'; locale?: 'en' | 'ko' | 'zh-CN'; periodUnit?: 'month' }>) {
  const unit = periodUnit === 'month' ? (localizedMarketCopy(locale, " /month", " /월")) : '';
  const populated = rows.filter(row => row.count > 0);
  const empty = rows.filter(row => row.count === 0);
  const max = Math.max(...rows.map((row) => row.median ?? 0), 1);
  const table = (visible: readonly ResearchSize[]) => <div className={styles.tableWrap} data-size-comparison={currency} role="region" aria-label={localizedMarketCopy(locale, "Prices by home size — scroll horizontally", "면적별 가격 비교표 — 가로로 스크롤")} tabIndex={0}><table className={styles.table}>
    <thead><tr><th>{localizedMarketCopy(locale, "Cohort", "비교 조건")}</th><th>{localizedMarketCopy(locale, "Size", "면적")}</th><th>{localizedMarketCopy(locale, "Transactions", "거래 수")}</th><th>{localizedMarketCopy(locale, "Median", "중앙값")}</th></tr></thead>
    <tbody>{visible.map((row) => <tr key={`${row.group}-${row.size}`}><td>{locale === 'ko' ? row.group.replaceAll('New Sale', '신규 분양').replaceAll('Resale', '재판매').replaceAll('Sub Sale', '분양권 전매').replaceAll('Non-landed', '공동주택').replaceAll('Landed', '토지 포함 주택').replaceAll('Apartment', '아파트').replaceAll('Condominium', '콘도미니엄') : locale === 'zh-CN' ? row.group.replaceAll('New Sale', '新房销售').replaceAll('Resale', '转售').replaceAll('Sub Sale', '转售期房').replaceAll('Non-landed', '非有地住宅').replaceAll('Landed', '有地住宅').replaceAll('Apartment', '公寓').replaceAll('Condominium', '共管公寓') : row.group}</td><td>{locale === 'ko' ? row.size.replace('Under 60 m²', '60㎡ 미만').replace('135 m² and over', '135㎡ 이상').replaceAll('m²', '㎡') : locale === 'zh-CN' ? row.size.replace('Under 60 m²', '60 m² 以下').replace('135 m² and over', '135 m² 及以上') : row.size}</td><td>{row.count}</td><td>{row.median === null ? (localizedMarketCopy(locale, "Not published", "게시 기준 미달")) : <>{money(row.median, currency)}{unit}<span className={styles.bar} style={{ width: `${row.median / max * 100}%` }} aria-hidden="true" /></>}</td></tr>)}</tbody>
  </table></div>;
  return <>
    {populated.length ? table(populated) : <p>{localizedMarketCopy(locale, "No size cohorts have transactions for these filters.", "선택 조건의 면적별 거래가 없습니다.")}</p>}
    {empty.length ? <details><summary>{locale === 'ko' ? `거래가 없는 면적 구간 ${empty.length}개` : locale === 'zh-CN' ? `${empty.length} 个面积分组暂无交易` : `${empty.length} size cohorts without transactions`}</summary>{table(empty)}</details> : null}
  </>;
}

export function RecentTransactionPlot({ rows, locale = 'en', periodUnit }: Readonly<{
  rows: readonly Readonly<{ filedMonth: string; areaSqm: number; primaryWon: number; primaryLabel: string }>[];
  locale?: 'en' | 'ko' | 'zh-CN';
  periodUnit?: 'month';
}>) {
  const unit = periodUnit === 'month' ? (localizedMarketCopy(locale, " /month", " /월")) : '';
  if (rows.length === 0) return null;
  const months = [...new Set(rows.map((row) => row.filedMonth))].sort();
  const monthIndex = (month: string) => Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7));
  const start = monthIndex(months[0]!);
  const span = monthIndex(months.at(-1)!) - start;
  const max = Math.max(...rows.map((row) => row.primaryWon), 1);
  return <section className={styles.section} aria-labelledby="building-price-trend-heading" data-transaction-research="recent">
    <h3 id="building-price-trend-heading">{localizedMarketCopy(locale, "Recent reported prices", "최근 신고 가격")}</h3>
    <p>{locale === 'ko' ? `선택 조건에 해당하는 보관 거래 ${rows.length}건입니다. 각 점은 실제 신고 거래이며, 월별 전체 거래량이나 가격 지수가 아닙니다. 거래별 면적·층을 아래 표에서 함께 확인하세요.` : locale === 'zh-CN' ? `所选分组保留 ${rows.length} 笔交易。每个点是一笔申报合同，并非月度中位数或完整成交量序列。请结合下表比较面积和楼层。` : `${rows.length} retained transactions in the selected cohort. Each point is a reported contract, not a monthly median or complete volume series. Compare unit areas and floors in the table below.`}</p>
    <p className={styles.chartHint}>{localizedMarketCopy(locale, "On narrow screens, scroll the chart horizontally. Exact prices are in the transaction table below.", "좁은 화면에서는 그래프를 좌우로 스크롤하세요. 정확한 금액은 아래 거래표에서 확인할 수 있습니다.")}</p>
    <div className={styles.chartWrap} role="region" aria-label={localizedMarketCopy(locale, "Recent reported prices chart — scroll horizontally", "최근 신고 가격 그래프 — 가로로 스크롤")} tabIndex={0}>
    <svg className={styles.chart} viewBox="0 0 720 205" role="img" aria-label={localizedMarketCopy(locale, "Individual reported prices by month, with exact transactions in the table below.", "신고월별 실제 거래 가격. 각 거래는 아래 표에서 확인할 수 있습니다.")}>
      {[0, .5, 1].map((fraction) => <g key={fraction}><line x1="105" y1={160 - fraction * 130} x2="704" y2={160 - fraction * 130} /><text x="0" y={164 - fraction * 130}>{money(max * fraction, 'KRW', true)}{unit}</text></g>)}
      {rows.map((row, i) => <circle key={i} cx={span === 0 ? 400 : 115 + (monthIndex(row.filedMonth) - start) / span * 575} cy={160 - row.primaryWon / max * 130} r="4" fill="currentColor" opacity=".65"><title>{`${row.filedMonth} · ${row.areaSqm} m² · ${row.primaryLabel}${unit}`}</title></circle>)}
      <text x={span === 0 ? 400 : 115} y="190" textAnchor="middle">{months[0]}</text>{span === 0 ? null : <text x="690" y="190" textAnchor="end">{months.at(-1)}</text>}
    </svg>
    </div>
  </section>;
}
