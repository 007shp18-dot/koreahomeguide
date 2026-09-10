import Link from 'next/link';

import type { SeoulLiveModel } from '../../lib/public-market/seoul-live-model.server';
import styles from './seoul-live.module.css';

const number = new Intl.NumberFormat('en-US');

export function SeoulLive({
  model,
  mode,
}: Readonly<{
  model: SeoulLiveModel;
  mode: 'global' | 'korea' | 'seoul';
}>) {
  return (
    <section
      className={styles.section}
      data-seoul-live={model.status}
      data-seoul-live-mode={mode}
      aria-labelledby={`seoul-live-${mode}`}
    >
      <header className={styles.header}>
        <p>Seoul live</p>
        <h2 id={`seoul-live-${mode}`}>Official evidence, one click from the front door.</h2>
        <p>
          Signed contracts, split by new and renewal status, with publication limits shown.
        </p>
      </header>

      {model.status === 'ready' ? (
        <dl className={styles.stats} aria-label={`Official contract counts for ${model.period}`}>
          <div className={styles.primaryStat}>
            <dt>All eligible</dt>
            <dd>{number.format(model.totalCount)}</dd>
          </div>
          <div>
            <dt>New contracts</dt>
            <dd>{number.format(model.newCount)}</dd>
          </div>
          <div>
            <dt>Renewals</dt>
            <dd>{number.format(model.renewalCount)}</dd>
          </div>
          <div>
            <dt>Unknown type</dt>
            <dd>{number.format(model.unknownCount)}</dd>
          </div>
          <div className={styles.period}>
            <dt>Completed period</dt>
            <dd>{model.period}</dd>
          </div>
        </dl>
      ) : (
        <div className={styles.unavailable} data-evidence-state="unavailable">
          <strong>{model.message}</strong>
          <span>The product routes stay open without substituting figures.</span>
        </div>
      )}

      <nav className={styles.links} aria-label="Seoul evidence products">
        {model.links.map((link) => (
          <Link href={link.href} key={link.href}>
            <strong>{link.label}</strong>
            <span>{link.description}</span>
            <i aria-hidden="true">→</i>
          </Link>
        ))}
      </nav>
    </section>
  );
}
