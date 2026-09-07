import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  AdvertisingConsent,
  buildAdSenseScriptSrc,
  buildGoogleAnalyticsScriptSrc,
  shouldLoadAnalytics,
  setAnalyticsDisabled,
  shouldLoadAdvertising,
} from '../components/consent/advertising-consent';
import {
  analyticsConfigFromEnvironment,
  vercelAnalyticsEnabledFromEnvironment,
} from '../lib/analytics/analytics-config.server';
import { advertisingConfigFromEnvironment } from '../lib/advertising/advertising-config.server';
import EnglishRootLayout from '../app/(en)/layout';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function readyOperator() {
  vi.stubEnv('SIGNEDPRICE_OPERATOR_NAME', 'SignedPrice Labs Ltd.');
  vi.stubEnv('SIGNEDPRICE_PRIVACY_CONTACT', 'privacy@signedprice.com');
}

describe('advertising consent boundary', () => {
  it('enables analytics only for a valid configured GA4 measurement ID', () => {
    expect(analyticsConfigFromEnvironment()).toEqual({
      status: 'ready',
      measurementId: 'G-KWHQXKY40N',
    });

    vi.stubEnv('SIGNEDPRICE_GA4_MEASUREMENT_ID', 'UA-12345');
    expect(analyticsConfigFromEnvironment()).toEqual({ status: 'disabled' });

    vi.stubEnv('SIGNEDPRICE_GA4_MEASUREMENT_ID', 'G-KWHQXKY40N');
    expect(analyticsConfigFromEnvironment()).toEqual({
      status: 'ready',
      measurementId: 'G-KWHQXKY40N',
    });

    vi.stubEnv('SIGNEDPRICE_GA4_ENABLED', 'false');
    expect(analyticsConfigFromEnvironment()).toEqual({ status: 'disabled' });
  });

  it('lets deterministic and self-hosted environments disable Vercel analytics', () => {
    expect(vercelAnalyticsEnabledFromEnvironment()).toBe(true);
    vi.stubEnv('SIGNEDPRICE_VERCEL_ANALYTICS_ENABLED', 'false');
    expect(vercelAnalyticsEnabledFromEnvironment()).toBe(false);
  });

  it('requires an explicit enable flag and verified operator', () => {
    expect(advertisingConfigFromEnvironment()).toEqual({ status: 'disabled' });

    vi.stubEnv('SIGNEDPRICE_ADSENSE_ENABLED', 'true');
    expect(advertisingConfigFromEnvironment()).toEqual({ status: 'disabled' });

    readyOperator();
    expect(advertisingConfigFromEnvironment()).toEqual({
      status: 'ready',
      publisherId: 'pub-8103101324753433',
    });
  });

  it('does not allow stale deployment configuration to replace the registered publisher', () => {
    vi.stubEnv('SIGNEDPRICE_ADSENSE_ENABLED', 'true');
    vi.stubEnv('SIGNEDPRICE_ADSENSE_PUBLISHER_ID', 'pub-1234567890123456');
    readyOperator();
    expect(advertisingConfigFromEnvironment()).toEqual({
      status: 'ready',
      publisherId: 'pub-8103101324753433',
    });
  });

  it('renders a choice before any advertising script URL is emitted', () => {
    const html = renderToStaticMarkup(
      <AdvertisingConsent
        analyticsMeasurementId="G-KWHQXKY40N"
        publisherId="pub-1234567890123456"
      />,
    );

    expect(html).toContain('Choose privacy settings');
    expect(html).toContain('Enable analytics');
    expect(html).toContain('Disable analytics');
    expect(html).toContain('Allow advertising');
    expect(html).toContain('Reject advertising');
    expect(html).toContain('href="/privacy"');
    expect(html).not.toMatch(/googlesyndication|adsbygoogle|googletagmanager|G-KWHQXKY40N/);
  });

  it('installs the analytics consent boundary when GA4 is configured without advertising', () => {
    const html = renderToStaticMarkup(
      <EnglishRootLayout><main>Evidence</main></EnglishRootLayout>,
    );

    expect(html).toContain('Privacy choices');
    expect(html).not.toContain('Choose privacy settings');
    expect(html).not.toContain('Allow advertising');
    expect(html).not.toMatch(/googletagmanager|gtag\(/);
  });

  it('stops an already-loaded tag on opt-out and restores it on opt-in', () => {
    const analyticsWindow: Record<string, unknown> = {};
    vi.stubGlobal('window', analyticsWindow);
    setAnalyticsDisabled('G-KWHQXKY40N', true);
    expect(analyticsWindow['ga-disable-G-KWHQXKY40N']).toBe(true);
    setAnalyticsDisabled('G-KWHQXKY40N', false);
    expect(analyticsWindow['ga-disable-G-KWHQXKY40N']).toBe(false);
  });

  it('loads analytics by default while preserving explicit opt-outs and advertising opt-in', () => {
    expect(shouldLoadAnalytics('unknown')).toBe(true);
    expect(shouldLoadAnalytics('denied')).toBe(false);
    expect(shouldLoadAnalytics('granted')).toBe(true);
    expect(shouldLoadAdvertising('unknown')).toBe(false);
    expect(shouldLoadAdvertising('denied')).toBe(false);
    expect(shouldLoadAdvertising('granted')).toBe(true);
    expect(buildAdSenseScriptSrc('pub-1234567890123456')).toBe(
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456',
    );
    expect(buildGoogleAnalyticsScriptSrc('G-KWHQXKY40N')).toBe(
      'https://www.googletagmanager.com/gtag/js?id=G-KWHQXKY40N',
    );
  });
});
