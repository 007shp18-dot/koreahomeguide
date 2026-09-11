'use client';
import { localizedMarketCopy } from '../../lib/locale/market-localization';


import { useState } from 'react';
import type { SingaporeTransactionDisplay } from '../../lib/singapore/route-types';
import { sgText } from '../../lib/locale/singapore-copy';
import styles from './singapore.module.css';

export type ProjectTransactionRow = Omit<SingaporeTransactionDisplay, 'source'>;
const PAGE_SIZE = 20;
const columns = [
  ['Month', 'contractMonthLabel'], ['Price', 'priceLabel'], ['Area', 'areaLabel'],
  ['Floor', 'floorRangeLabel'],
] as const;

/** Paginate display rows; distributions above still use the full released sample. */
export function SingaporeTransactionsTable({ rows, locale = 'en' }: Readonly<{
  rows: readonly ProjectTransactionRow[];
  locale?: 'en' | 'ko' | 'zh-CN';
}>) {
  const [page, setPage] = useState(0);
  const [unit, setUnit] = useState<'psf' | 'psm'>('psf');
  const lastPage = Math.max(0, Math.ceil(rows.length / PAGE_SIZE) - 1);
  const currentPage = Math.min(page, lastPage);
  const start = currentPage * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, rows.length);
  const label = localizedMarketCopy(locale, "Reported transaction pages", "신고 거래 페이지");
  return <div data-project-transactions="paginated">
    <div className={styles.transactionControls} role="group" aria-label={localizedMarketCopy(locale, "Unit price", "단위면적 가격")}>
      <span>{localizedMarketCopy(locale, "Unit price", "단위면적 가격")}</span>
      {(['psf', 'psm'] as const).map(value => <button key={value} type="button" aria-pressed={unit === value} onClick={() => setUnit(value)}>{value === 'psf' ? 'SGD / ft²' : 'SGD / m²'}</button>)}
    </div>
    <div className={styles.tableWrap} tabIndex={0} role="region" aria-label={localizedMarketCopy(locale, "Reported transactions · scroll horizontally", "신고 거래표 · 가로로 스크롤")}>
      <table className={styles.table}>
        <thead><tr>{columns.map(([label]) => <th key={label} scope="col">{sgText(locale, label)}</th>)}<th scope="col">{unit === 'psf' ? 'SGD / ft²' : 'SGD / m²'}</th><th scope="col">{localizedMarketCopy(locale, "Details", "상세")}</th></tr></thead>
        <tbody>{rows.slice(start, end).map((row, index) => <tr key={start + index}>
          {columns.map(([, field]) => <td key={field}>{sgText(locale, row[field])}</td>)}
          <td>{sgText(locale, unit === 'psf' ? row.psfLabel : row.psmLabel)}</td>
          <td><details className={styles.transactionDetails}><summary>{localizedMarketCopy(locale, "View", "보기")}</summary><dl>
            {([['Sale', 'saleTypeLabel'], ['Property', 'propertyTypeLabel'], ['Area basis', 'areaBasisLabel'], ['Tenure', 'tenureLabel']] as const).map(([label, field]) => <div key={field}><dt>{sgText(locale, label)}</dt><dd>{sgText(locale, row[field])}</dd></div>)}
          </dl></details></td>
        </tr>)}</tbody>
      </table>
    </div>
    <nav className={styles.transactionPagination} aria-label={label}>
      <p role="status">{locale === 'ko'
        ? `총 ${rows.length.toLocaleString('ko-KR')}건 중 ${rows.length ? start + 1 : 0}–${end}건`
        : locale === 'zh-CN' ? `共 ${rows.length.toLocaleString('zh-CN')} 笔交易，显示 ${rows.length ? start + 1 : 0}–${end} 笔` : `${rows.length ? start + 1 : 0}–${end} of ${rows.length.toLocaleString('en')} transactions`}</p>
      {lastPage > 0 ? <div>
        <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>{localizedMarketCopy(locale, "Previous", "이전")}</button>
        <button type="button" disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>{localizedMarketCopy(locale, "Next", "다음")}</button>
      </div> : null}
    </nav>
  </div>;
}
