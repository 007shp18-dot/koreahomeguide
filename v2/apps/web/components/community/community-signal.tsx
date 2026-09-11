import { widgetText } from '../../lib/locale/public-widget-copy';
import type { ProductLocale } from '../../lib/locale/product-copy';
import type { CommunitySignalModel } from '../../lib/community/community-signal-model';
import { CommunitySignalClient } from './community-signal-client';
import styles from './community-signal.module.css';

const unavailableCopy = {
  storage_not_configured: 'Durable response storage is not configured. No response can be saved yet.',
  identity_not_configured: 'Private response identity is not configured. No response can be saved yet.',
  rate_limit_not_configured: 'Write protection is not configured. No response can be saved yet.',
  evidence_unavailable: 'A current verified evidence scope is required before responses can open.',
} as const;

export function CommunitySignal({ locale = 'en', model }: Readonly<{ locale?: ProductLocale; model: CommunitySignalModel }>) {
  const t = (text: string) => widgetText(locale, text);
  return (
    <section className={styles.signal} aria-labelledby="community-signal-heading">
      <header className={styles.heading}>
        <p>{t("Community response")}</p>
        <h2 id="community-signal-heading">{t("Community signal")}</h2>
        <p>{t("Compared with SignedPrice's evidence, what are you seeing now?")}</p>
      </header>

      {model.state === 'unavailable' ? (
        <div className={styles.unavailable} data-community-state="unavailable">
          <h3>{t("Community responses are not open yet")}</h3>
          <p>{t(unavailableCopy[model.code])}</p>
        </div>
      ) : (
        <CommunitySignalClient locale={locale} model={model} />
      )}

      <footer className={styles.caveat}>
        <p>{t("Self-selected response, not a representative survey.")}</p>
        <p>{t("Community responses never change official evidence, Rankings, Contract Check, or News.")}</p>
      </footer>
    </section>
  );
}
