'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useState, useSyncExternalStore } from 'react';

import styles from './advertising-consent.module.css';

export type AdvertisingConsentChoice = 'unknown' | 'granted' | 'denied';

const ANALYTICS_STORAGE_KEY = 'signedprice_analytics_consent_v1';
const ADVERTISING_STORAGE_KEY = 'signedprice_advertising_consent_v1';
const ANALYTICS_CONSENT_EVENT = 'signedprice:analytics-consent';
const ADVERTISING_CONSENT_EVENT = 'signedprice:advertising-consent';
let volatileAnalyticsChoice: AdvertisingConsentChoice = 'unknown';
let volatileAdvertisingChoice: AdvertisingConsentChoice = 'unknown';

export function shouldLoadAdvertising(choice: AdvertisingConsentChoice): boolean {
  return choice === 'granted';
}

export function shouldLoadAnalytics(choice: AdvertisingConsentChoice): boolean {
  return choice === 'granted';
}

export function buildAdSenseScriptSrc(publisherId: string): string {
  const client = `ca-${publisherId}`;
  return `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
}

export function buildGoogleAnalyticsScriptSrc(measurementId: string): string {
  return `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
}

function GoogleAnalytics({ measurementId }: Readonly<{ measurementId: string }>) {
  return (
    <>
      <Script id="signedprice-ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}');`}
      </Script>
      <Script
        id="signedprice-ga4"
        src={buildGoogleAnalyticsScriptSrc(measurementId)}
        strategy="afterInteractive"
      />
    </>
  );
}

function storedChoice(
  storageKey: string,
  fallback: AdvertisingConsentChoice,
): AdvertisingConsentChoice {
  try {
    const value = window.localStorage.getItem(storageKey);
    return value === 'granted' || value === 'denied' ? value : 'unknown';
  } catch {
    return fallback;
  }
}

function persistChoice(
  storageKey: string,
  consentEvent: string,
  choice: Exclude<AdvertisingConsentChoice, 'unknown'>,
): void {
  try {
    window.localStorage.setItem(storageKey, choice);
  } catch {
    // A blocked storage API leaves the in-memory choice valid for this page only.
  }
  window.dispatchEvent(new Event(consentEvent));
}

function subscribeToConsent(consentEvent: string, onStoreChange: () => void): () => void {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(consentEvent, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(consentEvent, onStoreChange);
  };
}

function serverConsentChoice(): AdvertisingConsentChoice {
  return 'unknown';
}

function storedAnalyticsChoice(): AdvertisingConsentChoice {
  return storedChoice(ANALYTICS_STORAGE_KEY, volatileAnalyticsChoice);
}

function storedAdvertisingChoice(): AdvertisingConsentChoice {
  return storedChoice(ADVERTISING_STORAGE_KEY, volatileAdvertisingChoice);
}

function subscribeToAnalyticsConsent(onStoreChange: () => void): () => void {
  return subscribeToConsent(ANALYTICS_CONSENT_EVENT, onStoreChange);
}

function subscribeToAdvertisingConsent(onStoreChange: () => void): () => void {
  return subscribeToConsent(ADVERTISING_CONSENT_EVENT, onStoreChange);
}

type AdvertisingConsentProps = Readonly<{
  analyticsMeasurementId?: string;
  publisherId?: string;
}>;

export function AdvertisingConsent({
  analyticsMeasurementId,
  publisherId,
}: AdvertisingConsentProps) {
  const analyticsChoice = useSyncExternalStore(
    subscribeToAnalyticsConsent,
    storedAnalyticsChoice,
    serverConsentChoice,
  );
  const advertisingChoice = useSyncExternalStore(
    subscribeToAdvertisingConsent,
    storedAdvertisingChoice,
    serverConsentChoice,
  );
  const [manualOpen, setManualOpen] = useState(false);
  const preferencesOpen =
    manualOpen ||
    (analyticsMeasurementId !== undefined && analyticsChoice === 'unknown') ||
    (publisherId !== undefined && advertisingChoice === 'unknown');

  function chooseAnalytics(next: Exclude<AdvertisingConsentChoice, 'unknown'>) {
    volatileAnalyticsChoice = next;
    persistChoice(ANALYTICS_STORAGE_KEY, ANALYTICS_CONSENT_EVENT, next);
    setManualOpen(false);
  }

  function chooseAdvertising(next: Exclude<AdvertisingConsentChoice, 'unknown'>) {
    volatileAdvertisingChoice = next;
    persistChoice(ADVERTISING_STORAGE_KEY, ADVERTISING_CONSENT_EVENT, next);
    setManualOpen(false);
  }

  return (
    <>
      {analyticsMeasurementId && shouldLoadAnalytics(analyticsChoice) ? (
        <GoogleAnalytics measurementId={analyticsMeasurementId} />
      ) : null}
      {publisherId && shouldLoadAdvertising(advertisingChoice) ? (
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
          aria-labelledby="privacy-consent-title"
        >
          <h2 id="privacy-consent-title">Choose privacy settings</h2>
          <p>
            SignedPrice loads optional services only after you allow them. Rejecting keeps
            those scripts off; the property evidence remains available. Read the{' '}
            <Link href="/privacy/">privacy notice</Link>.
          </p>
          {analyticsMeasurementId ? (
            <section className={styles.choiceGroup} aria-labelledby="analytics-choice-title">
              <h3 id="analytics-choice-title">Analytics</h3>
              <p>Help us understand anonymous page usage with Google Analytics.</p>
              <div className={styles.actions}>
                <button type="button" onClick={() => chooseAnalytics('granted')}>
                  Allow analytics
                </button>
                <button type="button" onClick={() => chooseAnalytics('denied')}>
                  Reject analytics
                </button>
              </div>
            </section>
          ) : null}
          {publisherId ? (
            <section className={styles.choiceGroup} aria-labelledby="advertising-choice-title">
              <h3 id="advertising-choice-title">Advertising</h3>
              <p>Allow Google advertising scripts to load on SignedPrice.</p>
              <div className={styles.actions}>
                <button type="button" onClick={() => chooseAdvertising('granted')}>
                  Allow advertising
                </button>
                <button type="button" onClick={() => chooseAdvertising('denied')}>
                  Reject advertising
                </button>
              </div>
            </section>
          ) : null}
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
