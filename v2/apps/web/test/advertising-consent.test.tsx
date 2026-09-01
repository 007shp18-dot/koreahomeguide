import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  AdvertisingConsent,
  buildAdSenseScriptSrc,
  shouldLoadAnalytics,
  shouldLoadAdvertising,
} from '../components/consent/advertising-consent';
import { analyticsConfigFromEnvironment } from '../lib/analytics/analytics-config.server';
import { advertisingConfigFromEnvironment } from '../lib/advertising/advertising-config.server';
import EnglishRootLayout from '../app/(en)/layout';

afterEach(() => vi.unstubAllEnvs());

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
    expect(html).toContain('Allow analytics');
    expect(html).toContain('Reject analytics');
    expect(html).toContain('Allow advertising');
    expect(html).toContain('Reject advertising');
    expect(html).toContain('href="/privacy"');
    expect(html).not.toMatch(/googlesyndication|adsbygoogle|googletagmanager|G-KWHQXKY40N/);
  });

  it('installs the analytics consent boundary when GA4 is configured without advertising', () => {
    const html = renderToStaticMarkup(
      <EnglishRootLayout><main>Evidence</main></EnglishRootLayout>,
    );

    expect(html).toContain('Allow analytics');
    expect(html).not.toContain('Allow advertising');
    expect(html).not.toMatch(/googletagmanager|gtag\(/);
  });

  it('allows the script only after an affirmative stored choice', () => {
    expect(shouldLoadAnalytics('unknown')).toBe(false);
    expect(shouldLoadAnalytics('denied')).toBe(false);
    expect(shouldLoadAnalytics('granted')).toBe(true);
    expect(shouldLoadAdvertising('unknown')).toBe(false);
    expect(shouldLoadAdvertising('denied')).toBe(false);
    expect(shouldLoadAdvertising('granted')).toBe(true);
    expect(buildAdSenseScriptSrc('pub-1234567890123456')).toBe(
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456',
    );
  });
});
