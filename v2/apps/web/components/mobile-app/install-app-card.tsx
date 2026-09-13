'use client';

import { mobileAppCopy } from '@/lib/mobile-app/model';
import type { SiteLocale } from '@/lib/navigation/site-navigation';
import { useAppInstallation } from './mobile-app-provider';
import styles from './mobile-app.module.css';

export function InstallAppCard({ locale }: { locale: SiteLocale }) {
  const installation = useAppInstallation();
  const copy = mobileAppCopy[locale];
  if (installation?.installed) return null;
  return <aside className={styles.install} data-mobile-app-install>
    <div><strong>{copy.installTitle}</strong><p>{copy.installDescription}</p></div>
    {installation?.canPrompt && <button type="button" onClick={() => void installation.install()}>{copy.install}</button>}
    <details><summary>{copy.instructions}</summary><p>{copy.iphone}</p><p>{copy.browser}</p><p className={styles.note}>{copy.note}</p></details>
    <p role="status" className={styles.status}>{installation?.status === 'opening' ? copy.installing : installation?.status === 'accepted' ? copy.accepted : installation?.status === 'fallback' ? copy.fallback : ''}</p>
  </aside>;
}
