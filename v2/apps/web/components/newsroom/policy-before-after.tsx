import type { PolicyRecord } from '../../lib/policy/policy-types';
import styles from './newsroom.module.css';

export function PolicyBeforeAfter({ comparison }: Readonly<{
  comparison: PolicyRecord['beforeAfter'];
}>) {
  if (comparison === null) return null;
  return <section className={styles.beforeAfter} aria-label="Policy before and after">
    <article><span>{comparison.beforeLabel}</span><p>{comparison.beforeValue}</p></article>
    <article><span>{comparison.afterLabel}</span><p>{comparison.afterValue}</p></article>
  </section>;
}
