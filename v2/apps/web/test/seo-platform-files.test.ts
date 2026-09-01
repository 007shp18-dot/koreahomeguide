import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

afterEach(() => vi.unstubAllEnvs());

describe('SignedPrice search and advertising platform files', () => {
  it('publishes a crawlable robots policy with the standalone sitemap', async () => {
    let robotsRoute: { default: () => unknown } | null = null;
    try {
      robotsRoute = await import('../app/robots');
    } catch {
      // Missing module is asserted below during the RED phase.
    }
    expect(robotsRoute).not.toBeNull();
    if (robotsRoute === null) return;
    expect(robotsRoute.default()).toEqual({
      rules: { userAgent: '*', allow: '/' },
      sitemap: 'https://www.signedprice.com/sitemap.xml',
      host: 'https://www.signedprice.com',
    });
  });

  it('serves an exact configured AdSense publisher record and never invents one', async () => {
    let adsRoute: { GET: () => Response } | null = null;
    try {
      adsRoute = await import('../app/ads.txt/route');
    } catch {
      // Missing module is asserted below during the RED phase.
    }
    expect(adsRoute).not.toBeNull();
    if (adsRoute === null) return;

    vi.stubEnv('SIGNEDPRICE_ADSENSE_PUBLISHER_ID', 'pub-1234567890123456');
    const configured = adsRoute.GET();
    expect(configured.status).toBe(200);
    expect(configured.headers.get('content-type')).toContain('text/plain');
    expect(await configured.text()).toBe(
      'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n',
    );

    vi.stubEnv('SIGNEDPRICE_ADSENSE_PUBLISHER_ID', 'not-a-publisher');
    const invalid = adsRoute.GET();
    expect(invalid.status).toBe(503);
    expect(await invalid.text()).not.toMatch(/pub-[0-9]{16}/);
  });
});
