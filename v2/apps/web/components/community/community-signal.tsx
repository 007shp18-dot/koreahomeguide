import type { CommunitySignalModel } from '../../lib/community/community-signal-model';
import { CommunitySignalClient } from './community-signal-client';
import styles from './community-signal.module.css';

const unavailableCopy = {
  storage_not_configured: 'Durable response storage is not configured. No response can be saved yet.',
  identity_not_configured: 'Private response identity is not configured. No response can be saved yet.',
  rate_limit_not_configured: 'Write protection is not configured. No response can be saved yet.',
  evidence_unavailable: 'A current verified evidence scope is required before responses can open.',
} as const;

export function CommunitySignal({ model }: Readonly<{ model: CommunitySignalModel }>) {
  return (
    <section className={styles.signal} aria-labelledby="community-signal-heading">
      <header className={styles.heading}>
        <p>Community response</p>
        <h2 id="community-signal-heading">Community signal</h2>
        <p>Compared with SignedPrice&apos;s evidence, what are you seeing now?</p>
      </header>

      {model.state === 'unavailable' ? (
        <div className={styles.unavailable} data-community-state="unavailable">
          <h3>Community responses are not open yet</h3>
          <p>{unavailableCopy[model.code]}</p>
        </div>
      ) : (
        <CommunitySignalClient model={model} />
      )}

      <footer className={styles.caveat}>
        <p>Self-selected response, not a representative survey.</p>
        <p>Community responses never change official evidence, Rankings, Contract Check, or News.</p>
      </footer>
    </section>
  );
}
