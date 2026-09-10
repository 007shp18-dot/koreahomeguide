'use client';

import Link from 'next/link';
import { useSyncExternalStore, type ComponentProps } from 'react';
import { normalizePassportCurrency } from '../../lib/passport/model';
import { passportReturn } from '../../lib/tools/property-scenario-context';
import { retainPassportContext } from '../../lib/passport/journey';
import styles from './passport.module.css';

const subscribe = (notify: () => void) => {
  window.addEventListener('popstate', notify);
  return () => window.removeEventListener('popstate', notify);
};
export function usePassportLocation() {
  return useSyncExternalStore(subscribe, () => `${window.location.pathname}${window.location.search}`, () => '');
}
export function PassportLink({ href, ...props }: ComponentProps<typeof Link>) {
  const current = usePassportLocation();
  return <Link {...props} href={typeof href === 'string' ? retainPassportContext(href, current, true) : href} />;
}
export function PassportFormContext() {
  const current = usePassportLocation();
  if (!current) return null;
  const params = new URL(current, 'https://signedprice.invalid').searchParams;
  const passport = params.getAll('passport').length === 1 ? passportReturn(params.get('passport')) : undefined;
  return passport ? <input type="hidden" name="passport" value={passport} /> : null;
}
export function PassportBudgetContext() {
  const current = usePassportLocation();
  if (!current) return null;
  const url = new URL(current, 'https://signedprice.invalid');
  const passport = url.searchParams.getAll('passport').length === 1 ? passportReturn(url.searchParams.get('passport')) : undefined;
  if (!passport) return null;
  const params = new URL(passport, url).searchParams;
  const currency = normalizePassportCurrency(params.get('currency'));
  // The return URL carries the entered budget, not its FX snapshot. Show that
  // original amount rather than recomputing it with unrelated bundled rates.
  const budget = Number(params.get('budget'));
  const ko = passport.startsWith('/ko/');
  const label = `${currency} ${budget.toLocaleString(ko ? 'ko-KR' : 'en')}`;
  const compact = `${currency} ${new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(budget)}`;
  return <aside className={styles.journey} aria-label="Passport budget">
    <span title={label}>{ko ? '참고 예산' : 'Budget'} · <strong aria-label={label}>≈ {compact}</strong></span>
    <Link href={passport}>{ko ? '예산 비교로' : 'Back to Passport'}</Link>
  </aside>;
}
