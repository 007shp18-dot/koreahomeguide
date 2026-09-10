'use client';

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
  locale?: 'en' | 'ko';
}>) {
  const [page, setPage] = useState(0);
  const [unit, setUnit] = useState<'psf' | 'psm'>('psf');
  const lastPage = Math.max(0, Math.ceil(rows.length / PAGE_SIZE) - 1);
  const currentPage = Math.min(page, lastPage);
  const start = currentPage * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, rows.length);
  const label = locale === 'ko' ? '신고 거래 페이지' : 'Reported transaction pages';
  return <div data-project-transactions="paginated">
    <div className={styles.transactionControls} role="group" aria-label={locale === 'ko' ? '단위면적 가격' : 'Unit price'}>
      <span>{locale === 'ko' ? '단위면적 가격' : 'Unit price'}</span>
      {(['psf', 'psm'] as const).map(value => <button key={value} type="button" aria-pressed={unit === value} onClick={() => setUnit(value)}>{value === 'psf' ? 'SGD / ft²' : 'SGD / m²'}</button>)}
    </div>
    <div className={styles.tableWrap} tabIndex={0} role="region" aria-label={locale === 'ko' ? '신고 거래표 · 가로로 스크롤' : 'Reported transactions · scroll horizontally'}>
      <table className={styles.table}>
        <thead><tr>{columns.map(([label]) => <th key={label} scope="col">{sgText(locale, label)}</th>)}<th scope="col">{unit === 'psf' ? 'SGD / ft²' : 'SGD / m²'}</th><th scope="col">{locale === 'ko' ? '상세' : 'Details'}</th></tr></thead>
        <tbody>{rows.slice(start, end).map((row, index) => <tr key={start + index}>
          {columns.map(([, field]) => <td key={field}>{sgText(locale, row[field])}</td>)}
          <td>{sgText(locale, unit === 'psf' ? row.psfLabel : row.psmLabel)}</td>
          <td><details className={styles.transactionDetails}><summary>{locale === 'ko' ? '보기' : 'View'}</summary><dl>
            {([['Sale', 'saleTypeLabel'], ['Property', 'propertyTypeLabel'], ['Area basis', 'areaBasisLabel'], ['Tenure', 'tenureLabel']] as const).map(([label, field]) => <div key={field}><dt>{sgText(locale, label)}</dt><dd>{sgText(locale, row[field])}</dd></div>)}
          </dl></details></td>
        </tr>)}</tbody>
      </table>
    </div>
    <nav className={styles.transactionPagination} aria-label={label}>
      <p role="status">{locale === 'ko'
        ? `총 ${rows.length.toLocaleString('ko-KR')}건 중 ${rows.length ? start + 1 : 0}–${end}건`
        : `${rows.length ? start + 1 : 0}–${end} of ${rows.length.toLocaleString('en')} transactions`}</p>
      {lastPage > 0 ? <div>
        <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>{locale === 'ko' ? '이전' : 'Previous'}</button>
        <button type="button" disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>{locale === 'ko' ? '다음' : 'Next'}</button>
      </div> : null}
    </nav>
  </div>;
}
