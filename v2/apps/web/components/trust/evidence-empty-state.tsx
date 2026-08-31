import type { EvidenceEmptyState } from '@signedprice/market-core';
import Link from 'next/link';

import styles from './trust.module.css';

export function EvidenceEmptyStatePanel({
  state,
  actionHref,
}: Readonly<{
  state: EvidenceEmptyState;
  actionHref?: string;
}>) {
  return (
    <section className={styles.emptyState} aria-label={state.title}>
      <h2>{state.title}</h2>
      <p>{state.reason}</p>
      {actionHref === undefined
        ? <p className={styles.nextAction}>{state.nextAction}</p>
        : <Link className={styles.actionLink} href={actionHref}>{state.nextAction}</Link>}
    </section>
  );
}
