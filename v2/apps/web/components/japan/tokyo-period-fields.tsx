'use client';

import { useState } from 'react';
import styles from './tokyo-explorer.module.css';

export function TokyoPeriodFields({ years, year, quarter, useLatest }: {
  years: string[]; year: string; quarter: string; useLatest: boolean;
}) {
  const [latest, setLatest] = useState(useLatest);
  return <>
    <label className={styles.latestPeriod}>
      <input type="checkbox" checked={latest} onChange={event => setLatest(event.target.checked)} />
      Latest available period for this ward
    </label>
    <label>Year<select name="year" defaultValue={year} disabled={latest}>{years.map(value => <option key={value}>{value}</option>)}</select></label>
    <label>Quarter<select name="quarter" defaultValue={quarter} disabled={latest}>{['1', '2', '3', '4'].map(value => <option value={value} key={value}>Q{value}</option>)}</select></label>
  </>;
}
