import type { Correction } from '@signedprice/market-core';

import styles from './trust.module.css';

function statusLabel(status: Correction['status']): string {
  return status === 'FIXED' ? 'Fixed' : 'Upheld';
}

export function CorrectionLedger({
  corrections,
}: Readonly<{ corrections: readonly Correction[] }>) {
  if (corrections.length === 0) {
    return (
      <section className={styles.emptyLedger} aria-label="Correction history">
        <h2>No published corrections</h2>
        <p>The ledger is empty. SignedPrice does not invent example corrections.</p>
      </section>
    );
  }

  return (
    <section className={styles.ledger} aria-labelledby="correction-ledger-heading">
      <h2 id="correction-ledger-heading">Published corrections</h2>
      <ol>
        {corrections.map((correction) => (
          <li key={correction.id}>
            <article>
              <header>
                <strong>{statusLabel(correction.status)}</strong>
                <time dateTime={correction.date}>{correction.date}</time>
              </header>
              <p>{correction.summary}</p>
              <small>{correction.scope} · {correction.raisedBy.toLowerCase()}</small>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
