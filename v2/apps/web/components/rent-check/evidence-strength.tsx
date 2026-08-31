import type { SeoulRentCheckResult } from '@signedprice/korea-rent/browser';

import styles from '../../app/kr/seoul/tools/rent-check/rent-check.module.css';

type EvidenceStrengthProps = {
  readonly result: SeoulRentCheckResult;
};

export function EvidenceStrength({ result }: EvidenceStrengthProps) {
  const label = result.comparableCount < 3
    ? 'Insufficient'
    : result.comparableCount < 5
      ? 'Limited'
      : `${result.confidence === null ? 'Unrated' : result.confidence} confidence`;

  return (
    <p className={styles['evidence-strength']}>
      <strong>{label}</strong>
      <span>{result.comparableCount.toLocaleString('en-US')} compatible contracts</span>
    </p>
  );
}
