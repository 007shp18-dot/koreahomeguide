import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  AdvertisingConsent,
  buildAdSenseScriptSrc,
  shouldLoadAdvertising,
} from '../components/consent/advertising-consent';
import { advertisingConfigFromEnvironment } from '../lib/advertising/advertising-config.server';

afterEach(() => vi.unstubAllEnvs());

function readyOperator() {
  vi.stubEnv('SIGNEDPRICE_OPERATOR_NAME', 'SignedPrice Labs Ltd.');
  vi.stubEnv('SIGNEDPRICE_PRIVACY_CONTACT', 'privacy@signedprice.com');
}

describe('advertising consent boundary', () => {
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
      <AdvertisingConsent publisherId="pub-1234567890123456" />,
    );

    expect(html).toContain('Choose privacy settings');
    expect(html).toContain('Allow advertising');
    expect(html).toContain('Reject advertising');
    expect(html).toContain('href="/privacy"');
    expect(html).not.toMatch(/googlesyndication|adsbygoogle/);
  });

  it('allows the script only after an affirmative stored choice', () => {
    expect(shouldLoadAdvertising('unknown')).toBe(false);
    expect(shouldLoadAdvertising('denied')).toBe(false);
    expect(shouldLoadAdvertising('granted')).toBe(true);
    expect(buildAdSenseScriptSrc('pub-1234567890123456')).toBe(
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456',
    );
  });
});
