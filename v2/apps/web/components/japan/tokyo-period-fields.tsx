'use client';

import { useState } from 'react';
import { tokyoText, type TokyoLocale } from './tokyo-copy';
import styles from './tokyo-explorer.module.css';

export function TokyoPeriodFields({ years, year, quarter, useLatest, locale = 'en' }: {
  locale?: TokyoLocale; years: string[]; year: string; quarter: string; useLatest: boolean;
}) {
  const t = (text: string) => tokyoText(locale, text);
  const [latest, setLatest] = useState(useLatest);
  return <>
    <label className={styles.latestPeriod}>
      <input type="checkbox" checked={latest} onChange={event => setLatest(event.target.checked)} />
      {t('Latest available period for this ward')}
    </label>
    <label>{t('Year')}<select name="year" defaultValue={year} disabled={latest}>{years.map(value => <option key={value}>{value}</option>)}</select></label>
    <label>{t('Quarter')}<select name="quarter" defaultValue={quarter} disabled={latest}>{['1', '2', '3', '4'].map(value => <option value={value} key={value}>Q{value}</option>)}</select></label>
  </>;
}
