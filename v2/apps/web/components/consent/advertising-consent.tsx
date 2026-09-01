'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useState, useSyncExternalStore } from 'react';

import styles from './advertising-consent.module.css';

export type AdvertisingConsentChoice = 'unknown' | 'granted' | 'denied';

const STORAGE_KEY = 'signedprice_advertising_consent_v1';
const CONSENT_EVENT = 'signedprice:advertising-consent';
let volatileChoice: AdvertisingConsentChoice = 'unknown';

export function shouldLoadAdvertising(choice: AdvertisingConsentChoice): boolean {
  return choice === 'granted';
}

export function buildAdSenseScriptSrc(publisherId: string): string {
  const client = `ca-${publisherId}`;
  return `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
}

function storedChoice(): AdvertisingConsentChoice {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : 'unknown';
  } catch {
    return volatileChoice;
  }
}

function persistChoice(choice: Exclude<AdvertisingConsentChoice, 'unknown'>): void {
  volatileChoice = choice;
  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // A blocked storage API leaves the in-memory choice valid for this page only.
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

function subscribeToConsent(onStoreChange: () => void): () => void {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(CONSENT_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(CONSENT_EVENT, onStoreChange);
  };
}

function serverConsentChoice(): AdvertisingConsentChoice {
  return 'unknown';
}

export function AdvertisingConsent({ publisherId }: Readonly<{ publisherId: string }>) {
  const choice = useSyncExternalStore(
    subscribeToConsent,
    storedChoice,
    serverConsentChoice,
  );
  const [manualOpen, setManualOpen] = useState(false);
  const preferencesOpen = choice === 'unknown' || manualOpen;

  function choose(next: Exclude<AdvertisingConsentChoice, 'unknown'>) {
    persistChoice(next);
    setManualOpen(false);
  }

  return (
    <>
      {shouldLoadAdvertising(choice) ? (
        <Script
          id="signedprice-adsense"
          src={buildAdSenseScriptSrc(publisherId)}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      ) : null}
      {preferencesOpen ? (
        <aside
          className={styles.banner}
          role="dialog"
          aria-modal="false"
          aria-labelledby="advertising-consent-title"
        >
          <h2 id="advertising-consent-title">Choose privacy settings</h2>
          <p>
            SignedPrice can load advertising only after you allow it. Rejecting keeps
            advertising scripts off; the property evidence remains available. Read the{' '}
            <Link href="/privacy/">privacy notice</Link>.
          </p>
          <div className={styles.actions}>
            <button type="button" onClick={() => choose('granted')}>
              Allow advertising
            </button>
            <button type="button" onClick={() => choose('denied')}>
              Reject advertising
            </button>
          </div>
        </aside>
      ) : (
        <button
          className={styles.preferences}
          type="button"
          onClick={() => setManualOpen(true)}
        >
          Privacy choices
        </button>
      )}
    </>
  );
}
