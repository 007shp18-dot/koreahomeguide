import type { CSSProperties } from 'react';
import type { SeoulRentCheckResult } from '@signedprice/korea-rent/browser';

import styles from './rent-check.module.css';

type RentRangeProps = {
  readonly result: SeoulRentCheckResult;
};

type RangeStyle = CSSProperties & {
  readonly '--range-start': string;
  readonly '--range-end': string;
  readonly '--asking-position': string;
};

function won(value: number): string {
  return `₩${value.toLocaleString('en-US')}`;
}

function position(value: number, minimum: number, maximum: number): number {
  if (minimum === maximum) return 50;
  return Math.max(0, Math.min(100, ((value - minimum) / (maximum - minimum)) * 100));
}

export function RentRange({ result }: RentRangeProps) {
  if (result.comparableCount < 5 || result.p25ValueWon === null ||
    result.p75ValueWon === null || result.minValueWon === null || result.maxValueWon === null) {
    return null;
  }

  const style: RangeStyle = {
    '--range-start': `${position(result.p25ValueWon, result.minValueWon, result.maxValueWon)}%`,
    '--range-end': `${position(result.p75ValueWon, result.minValueWon, result.maxValueWon)}%`,
    '--asking-position': `${position(result.askingValueWon, result.minValueWon, result.maxValueWon)}%`,
  };
  const rangeLabel = result.comparisonBasis === 'deposit-adjusted-monthly-rent'
    ? 'Typical signedprice deposit-adjusted estimate range'
    : 'Typical reported jeonse deposit range';

  return (
    <div className={styles['rent-range']}>
      <p>
        {rangeLabel}: P25 {won(result.p25ValueWon)} to P75 {won(result.p75ValueWon)}.
        {' '}Asking quote: {won(result.askingValueWon)}.
      </p>
      <div className={styles['range-graphic']} style={style} aria-hidden="true">
        <span className={styles['range-typical']} />
        <span className={styles['range-asking']} />
      </div>
    </div>
  );
}
