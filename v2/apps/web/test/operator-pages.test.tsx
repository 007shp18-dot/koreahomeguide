import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import ContactPage, {
  generateMetadata as generateContactMetadata,
} from '../app/(en)/contact/page';
import PrivacyPage, {
  generateMetadata as generatePrivacyMetadata,
} from '../app/(en)/privacy/page';
import sitemap from '../app/sitemap';
import { operatorProfileFromEnvironment } from '../lib/operator/operator-profile.server';

afterEach(() => vi.unstubAllEnvs());

describe('SignedPrice operator configuration', () => {
  it('accepts only a complete, plausible operator profile', () => {
    vi.stubEnv('SIGNEDPRICE_OPERATOR_NAME', 'SignedPrice Labs Ltd.');
    vi.stubEnv('SIGNEDPRICE_PRIVACY_CONTACT', 'privacy@signedprice.com');

    expect(operatorProfileFromEnvironment()).toEqual({
      status: 'ready',
      operatorName: 'SignedPrice Labs Ltd.',
      privacyContact: 'privacy@signedprice.com',
    });

    vi.stubEnv('SIGNEDPRICE_PRIVACY_CONTACT', 'not-an-email');
    expect(operatorProfileFromEnvironment()).toEqual({
      status: 'unavailable',
      missing: ['privacy contact'],
    });
  });

  it('never invents an operator or contact when configuration is absent', () => {
    const privacyHtml = renderToStaticMarkup(<PrivacyPage />);
    const contactHtml = renderToStaticMarkup(<ContactPage />);

    expect(operatorProfileFromEnvironment()).toEqual({
      status: 'unavailable',
      missing: ['operator name', 'privacy contact'],
    });
    for (const html of [privacyHtml, contactHtml]) {
      expect(html).toContain('data-product-intro="true"');
      expect(html).toContain('Operator details are not configured');
      expect(html).not.toMatch(/privacy@signedprice\.com|SignedPrice Labs Ltd\./);
    }
  });

  it('publishes configured operator details on both pages', () => {
    vi.stubEnv('SIGNEDPRICE_OPERATOR_NAME', 'SignedPrice Labs Ltd.');
    vi.stubEnv('SIGNEDPRICE_PRIVACY_CONTACT', 'privacy@signedprice.com');

    const privacyHtml = renderToStaticMarkup(<PrivacyPage />);
    const contactHtml = renderToStaticMarkup(<ContactPage />);

    expect(privacyHtml).toContain('SignedPrice Labs Ltd.');
    expect(privacyHtml).toContain('privacy@signedprice.com');
    expect(privacyHtml).toContain('Privacy and data');
    expect(contactHtml).toContain('mailto:privacy@signedprice.com');
    expect(contactHtml).toContain('Evidence corrections');
  });

  it('indexes and lists operator pages only when the profile is ready', () => {
    expect(generatePrivacyMetadata().robots).toEqual({ index: false, follow: true });
    expect(generateContactMetadata().robots).toEqual({ index: false, follow: true });
    expect(sitemap().map(({ url }) => url)).not.toContain(
      'https://www.signedprice.com/privacy/',
    );

    vi.stubEnv('SIGNEDPRICE_OPERATOR_NAME', 'SignedPrice Labs Ltd.');
    vi.stubEnv('SIGNEDPRICE_PRIVACY_CONTACT', 'privacy@signedprice.com');

    expect(generatePrivacyMetadata()).toMatchObject({
      robots: { index: true, follow: true },
      alternates: { canonical: 'https://www.signedprice.com/privacy/' },
    });
    expect(generateContactMetadata()).toMatchObject({
      robots: { index: true, follow: true },
      alternates: { canonical: 'https://www.signedprice.com/contact/' },
    });
    expect(sitemap().map(({ url }) => url)).toEqual(expect.arrayContaining([
      'https://www.signedprice.com/privacy/',
      'https://www.signedprice.com/contact/',
    ]));
  });
});
