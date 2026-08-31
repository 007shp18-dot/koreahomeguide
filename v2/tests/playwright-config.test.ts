import { describe, expect, it } from 'vitest';
import { createPlaywrightConfig } from '../playwright.config';

describe('Playwright release target configuration', () => {
  it('builds and serves the deterministic candidate locally', () => {
    const config = createPlaywrightConfig({});

    expect(config.use?.baseURL).toBe('http://127.0.0.1:3100');
    expect(config.webServer).toMatchObject({
      url: 'http://127.0.0.1:3100',
      env: {
        VERCEL_ENV: 'preview',
        VERCEL_GIT_COMMIT_SHA: '0123456789abcdef',
        SIGNEDPRICE_CONVERSION_CURVE_PERIOD: '2026-03/2026-08',
        SIGNEDPRICE_CONVERSION_CURVE_SHA256: 'a'.repeat(64),
      },
    });
    expect(config.webServer?.env).toHaveProperty('SIGNEDPRICE_CONVERSION_CURVE_ARTIFACT');
  });

  it('defines all release viewports and a retained HTML failure report', () => {
    const config = createPlaywrightConfig({});

    expect(config.projects?.map((project) => project.name)).toEqual([
      'desktop-chromium',
      'mobile-chromium',
      'tablet-chromium',
      'wide-chromium',
    ]);
    expect(config.projects?.[2]).toMatchObject({
      testMatch: /(?:rankings|contract-check)\.spec\.ts/,
      use: { viewport: { width: 720, height: 900 } },
    });
    expect(config.projects?.[3]).toMatchObject({
      testMatch: /(?:area-explore|contract-check)\.spec\.ts/,
      use: { viewport: { width: 1440, height: 900 } },
    });
    expect(config.reporter).toEqual([
      ['line'],
      ['html', { open: 'never' }],
    ]);
    expect(config.use).toMatchObject({
      screenshot: 'only-on-failure',
      trace: 'retain-on-failure',
    });
  });

  it('targets the explicit Preview without starting a local server', () => {
    const config = createPlaywrightConfig({
      PLAYWRIGHT_BASE_URL: 'https://signedprice-preview.example/',
      PLAYWRIGHT_EXPECTED_COMMIT_SHA: 'ABCDEF1234567890',
      PLAYWRIGHT_EXPECTED_ENVIRONMENT: 'PREVIEW',
    });

    expect(config.use?.baseURL).toBe('https://signedprice-preview.example');
    expect(Object.hasOwn(config, 'webServer')).toBe(false);
    expect(config.webServer).toBeUndefined();
  });

  it('rejects an external target without explicit candidate identity', () => {
    expect(() =>
      createPlaywrightConfig({
        PLAYWRIGHT_BASE_URL: 'https://signedprice-preview.example',
      }),
    ).toThrow(/PLAYWRIGHT_EXPECTED_COMMIT_SHA/);
  });

  it('rejects unsafe URLs and candidate values before test collection', () => {
    expect(() =>
      createPlaywrightConfig({
        PLAYWRIGHT_BASE_URL: 'file:///etc/passwd',
        PLAYWRIGHT_EXPECTED_COMMIT_SHA: 'abcdef123456',
        PLAYWRIGHT_EXPECTED_ENVIRONMENT: 'preview',
      }),
    ).toThrow(/http/i);
    expect(() =>
      createPlaywrightConfig({
        PLAYWRIGHT_EXPECTED_COMMIT_SHA: 'abcdef\nsecret',
      }),
    ).toThrow(/commit/i);
    expect(() =>
      createPlaywrightConfig({
        PLAYWRIGHT_EXPECTED_ENVIRONMENT: 'preview<script>',
      }),
    ).toThrow(/environment/i);
  });
});
