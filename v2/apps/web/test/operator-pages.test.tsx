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

  it('keeps useful public privacy and contact routes available when operator identity is absent', () => {
    const privacyHtml = renderToStaticMarkup(<PrivacyPage />);
    const contactHtml = renderToStaticMarkup(<ContactPage />);

    expect(operatorProfileFromEnvironment()).toEqual({
      status: 'unavailable',
      missing: ['operator name', 'privacy contact'],
    });
    for (const html of [privacyHtml, contactHtml]) {
      expect(html).toContain('data-product-intro="true"');
      expect(html).not.toContain('SignedPrice Labs Ltd.');
    }
    expect(privacyHtml).toContain('We do not sell personal information');
    expect(privacyHtml).toContain('privacy@signedprice.com');
    expect(privacyHtml).toContain('Access, correction and deletion');
    expect(contactHtml).toContain('contact@signedprice.com');
    expect(contactHtml).toContain('privacy@signedprice.com');
  });

  it('publishes configured operator details on both pages', () => {
    vi.stubEnv('SIGNEDPRICE_OPERATOR_NAME', 'SignedPrice Labs Ltd.');
    vi.stubEnv('SIGNEDPRICE_PRIVACY_CONTACT', 'privacy@signedprice.com');

    const privacyHtml = renderToStaticMarkup(<PrivacyPage />);
    const contactHtml = renderToStaticMarkup(<ContactPage />);

    expect(privacyHtml).toContain('SignedPrice Labs Ltd.');
    expect(privacyHtml).toContain('privacy@signedprice.com');
    expect(privacyHtml).toContain('Privacy, in plain language.');
    expect(contactHtml).toContain('mailto:privacy@signedprice.com');
    expect(contactHtml).toContain('mailto:contact@signedprice.com');
    expect(contactHtml).toContain('Correct a data issue');
  });

  it('indexes and lists the useful privacy and contact pages without an operator gate', () => {
    vi.stubEnv('SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS', 'false');
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
