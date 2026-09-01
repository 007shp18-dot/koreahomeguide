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

  it('serves the registered SignedPrice AdSense publisher when deployment env is absent', async () => {
    let adsRoute: { GET: () => Response } | null = null;
    try {
      adsRoute = await import('../app/ads.txt/route');
    } catch {
      // Missing module is asserted below during the RED phase.
    }
    expect(adsRoute).not.toBeNull();
    if (adsRoute === null) return;

    const registered = adsRoute.GET();
    expect(registered.status).toBe(200);
    expect(registered.headers.get('content-type')).toContain('text/plain');
    expect(await registered.text()).toBe(
      'google.com, pub-8103101324753433, DIRECT, f08c47fec0942fa0\n',
    );

    vi.stubEnv('SIGNEDPRICE_ADSENSE_PUBLISHER_ID', 'pub-1234567890123456');
    const staleEnvironment = adsRoute.GET();
    expect(staleEnvironment.status).toBe(200);
    expect(await staleEnvironment.text()).toBe(
      'google.com, pub-8103101324753433, DIRECT, f08c47fec0942fa0\n',
    );

    vi.stubEnv('SIGNEDPRICE_ADSENSE_PUBLISHER_ID', 'not-a-publisher');
    const invalidEnvironment = adsRoute.GET();
    expect(invalidEnvironment.status).toBe(200);
    expect(await invalidEnvironment.text()).toBe(
      'google.com, pub-8103101324753433, DIRECT, f08c47fec0942fa0\n',
    );
  });
});
