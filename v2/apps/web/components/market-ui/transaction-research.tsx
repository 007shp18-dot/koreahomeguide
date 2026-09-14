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
    <tbody>{visible.map((row) => <tr key={`${row.group}-${row.size}`}><td>{locale === 'ko' ? row.group.replaceAll('New Sale', '신규 분양').replaceAll('Resale', '재판매').replaceAll('Sub Sale', '분양권 전매').replaceAll('Non-landed', '공동주택').replaceAll('Landed', '토지 포함 주택').replaceAll('Apartment', '아파트').replaceAll('Condominium', '콘도미니엄').replaceAll('Monthly rent', '월세').replaceAll('Jeonse deposit', '전세 보증금').replaceAll('All contracts', '전체 계약').replaceAll('New contracts', '신규 계약').replaceAll('Renewals', '갱신 계약').replaceAll('Sale', '매매') : locale === 'zh-CN' ? row.group.replaceAll('New Sale', '新房销售').replaceAll('Resale', '转售').replaceAll('Sub Sale', '转售期房').replaceAll('Non-landed', '非有地住宅').replaceAll('Landed', '有地住宅').replaceAll('Apartment', '公寓').replaceAll('Condominium', '共管公寓').replaceAll('Monthly rent', '月租').replaceAll('Jeonse deposit', '全租押金').replaceAll('All contracts', '所有合同').replaceAll('New contracts', '新合同').replaceAll('Renewals', '续约').replaceAll('Sale', '买卖') : row.group}</td><td>{locale === 'ko' ? row.size.replace('Under 40 m²', '40㎡ 미만').replace('85 m² and over', '85㎡ 이상').replace('Under 60 m²', '60㎡ 미만').replace('135 m² and over', '135㎡ 이상').replaceAll('m²', '㎡') : locale === 'zh-CN' ? row.size.replace('Under 40 m²', '40 m² 以下').replace('85 m² and over', '85 m² 及以上').replace('Under 60 m²', '60 m² 以下').replace('135 m² and over', '135 m² 及以上') : row.size}</td><td>{row.count}</td><td>{row.median === null ? (localizedMarketCopy(locale, "Not published", "게시 기준 미달")) : <>{money(row.median, currency)}{unit}<span className={styles.bar} style={{ width: `${row.median / max * 100}%` }} aria-hidden="true" /></>}</td></tr>)}</tbody>
  </table></div>;
  return <>
    {populated.length ? table(populated) : <p>{localizedMarketCopy(locale, "No size cohorts have transactions for these filters.", "선택 조건의 면적별 거래가 없습니다.")}</p>}
    {empty.length ? <details><summary>{locale === 'ko' ? `거래가 없는 면적 구간 ${empty.length}개` : locale === 'zh-CN' ? `${empty.length} 个面积分组暂无交易` : `${empty.length} size cohorts without transactions`}</summary>{table(empty)}</details> : null}
  </>;
}

export function RecentTransactionSummary({ rows, locale = 'en', periodUnit }: Readonly<{
  rows: readonly Readonly<{ filedMonth: string; areaSqm: number; primaryWon: number; primaryLabel: string }>[];
  locale?: 'en' | 'ko' | 'zh-CN';
  periodUnit?: 'month';
}>) {
  const valid = rows.filter(row => Number.isFinite(row.primaryWon) && row.primaryWon > 0 && /^\d{4}-(0[1-9]|1[0-2])$/.test(row.filedMonth));
  if (!valid.length) return null;
  const ko = locale === 'ko', zh = locale === 'zh-CN';
  const months = [...new Set(valid.map(row => row.filedMonth))].sort();
  const prices = valid.map(row => row.primaryWon);
  const format = (value: number) => ko
    ? value >= 100_000_000 ? `${(value / 100_000_000).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}억 원`
      : value >= 10_000 ? `${(value / 10_000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}만 원` : `${value.toLocaleString('ko-KR')}원`
    : money(value, 'KRW');
  const low = Math.min(...prices), high = Math.max(...prices);
  const unit = periodUnit === 'month' ? (ko ? ' /월' : zh ? ' /月' : ' /month') : '';
  return <section className={styles.recentSummary} aria-label={ko ? '최근 거래 요약' : zh ? '近期成交概览' : 'Recent transaction summary'} data-transaction-research="recent">
    <dl>
      <div><dt>{ko ? '아래 표의 거래' : zh ? '下表交易' : 'Transactions below'}</dt><dd>{valid.length.toLocaleString(locale)}{ko ? '건' : zh ? '笔' : ''}</dd></div>
      <div><dt>{ko ? '계약 월' : zh ? '合同月份' : 'Contract months'}</dt><dd>{months[0]}{months.length > 1 ? ` – ${months.at(-1)}` : ''}</dd></div>
      <div><dt>{ko ? '보관 거래 금액 범위' : zh ? '保留成交的金额范围' : 'Retained price range'}</dt><dd>{format(low)}{low !== high ? ` – ${format(high)}` : ''}{unit}</dd></div>
    </dl>
    <p>{ko ? '면적·층·보증금이 다른 개별 계약입니다. 아래 거래 목록을 비교하세요. 이 범위는 가격 추세나 월별 전체 거래의 중앙값이 아닙니다.' : zh ? '每笔合同的面积、楼层及押金可能不同，请逐笔比较下表。此范围不是价格趋势，也不是每月全部成交的中位数。' : 'Individual contracts can differ in area, floor and deposit. Compare the records below. This range is not a price trend or a median of all monthly transactions.'}</p>
  </section>;
}
