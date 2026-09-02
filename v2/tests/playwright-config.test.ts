import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { buildContractCheckRouteModel } from '../apps/web/lib/contract-check/route-model.server';
import { buildPublicAreaExploreModel } from '../apps/web/lib/public-market/area-route-model.server';
import { observedBuildingRepositoryFromEnvironment } from '../apps/web/lib/public-market/observed-building-repository.server';
import { buildPublicAreaRankingsModel } from '../apps/web/lib/public-market/rankings-route-model.server';
import { createPlaywrightConfig } from '../playwright.config';
import { PUBLIC_BUILDING_TEST_ID } from './e2e/public-building-summary-fixture';

afterEach(() => vi.unstubAllEnvs());

function installLocalReleaseEnvironment() {
  const config = createPlaywrightConfig({});
  if (config.webServer === undefined || Array.isArray(config.webServer)) {
    throw new Error('Expected one local release web server.');
  }
  for (const [key, value] of Object.entries(config.webServer.env ?? {})) {
    vi.stubEnv(key, String(value));
  }
  return config.webServer.env ?? {};
}

describe('Playwright release target configuration', () => {
  it('builds and serves the deterministic candidate locally', () => {
    const config = createPlaywrightConfig({});

    expect(config.use?.baseURL).toBe('http://127.0.0.1:3100');
    expect(config.webServer).toMatchObject({
      url: 'http://127.0.0.1:3100',
      env: {
        VERCEL_ENV: 'preview',
        VERCEL_GIT_COMMIT_SHA: '0123456789abcdef',
        SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS: 'false',
        SIGNEDPRICE_CONVERSION_CURVE_PERIOD: '2026-03/2026-08',
        SIGNEDPRICE_CONVERSION_CURVE_SHA256: 'a'.repeat(64),
      },
    });
    expect(config.webServer?.env).toHaveProperty('SIGNEDPRICE_CONVERSION_CURVE_ARTIFACT');
    expect(config.webServer?.env).toHaveProperty('SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT');
    expect(config.webServer?.env).toHaveProperty('SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT');
  });

  it('keeps Check evidence isolated from Explore, Rankings, and observed buildings', () => {
    const environment = installLocalReleaseEnvironment();
    const check = buildContractCheckRouteModel(undefined, {
      compare: '1', district: 'gangnam-gu', housing: 'apartment', area: '84',
      'a-transaction': 'sale', 'a-price': '1200000000',
      'b-transaction': 'monthly', 'b-deposit': '50000000',
      'b-monthly-rent': '2000000',
    });
    const explore = buildPublicAreaExploreModel('jongno-gu');
    const rankings = buildPublicAreaRankingsModel();
    const observed = observedBuildingRepositoryFromEnvironment({
      useCheckedInSnapshot: false,
    });

    expect(check).toMatchObject({
      status: 'ready',
      availability: { sale: true, jeonse: true, monthly: true, conversion: true },
      offerChecks: { a: { status: 'ready' }, b: { status: 'ready' } },
      comparison: { status: 'ready', basis: 'tradeoff' },
    });
    expect(explore).toMatchObject({
      status: 'ready',
      selectedSlug: 'jongno-gu',
      citySummary: { med: 410_000_000 },
    });
    expect(rankings).toMatchObject({ status: 'ready', withheldDistrictCount: 1 });
    if (rankings.status !== 'ready') throw new Error('Expected fixture Rankings.');
    expect(rankings.cheapest.slice(0, 2).map(({ slug }) => slug)).toEqual([
      'jung-gu', 'yongsan-gu',
    ]);
    expect(observed?.listRecords()).toHaveLength(1);
    expect(observed?.getById(PUBLIC_BUILDING_TEST_ID)).toMatchObject({
      buildingId: PUBLIC_BUILDING_TEST_ID,
      coordinate: { state: 'ready' },
    });
    expect(environment).not.toHaveProperty('SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY');
  });

  it('keeps every local web-server environment entry below the process spawn limit', () => {
    const config = createPlaywrightConfig({});
    if (config.webServer === undefined || Array.isArray(config.webServer)) {
      throw new Error('Expected one local release web server.');
    }

    expect(Object.entries(config.webServer.env ?? {}).every(([key, value]) => (
      Buffer.byteLength(`${key}=${String(value)}`, 'utf8') < 100_000
    ))).toBe(true);
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
      testMatch: /(?:rankings|contract-check|trust|korea-detail|korea-guide)\.spec\.ts/,
      use: { viewport: { width: 720, height: 900 } },
    });
    expect(config.projects?.[3]).toMatchObject({
      testMatch: /(?:area-explore|contract-check|trust|korea-detail|korea-guide)\.spec\.ts/,
      use: { viewport: { width: 1440, height: 900 } },
    });
    expect((config.projects?.[2]?.testMatch as RegExp).test('trust.spec.ts')).toBe(true);
    expect((config.projects?.[3]?.testMatch as RegExp).test('trust.spec.ts')).toBe(true);
    expect((config.projects?.[2]?.testMatch as RegExp).test('korea-detail.spec.ts')).toBe(true);
    expect((config.projects?.[3]?.testMatch as RegExp).test('korea-guide.spec.ts')).toBe(true);
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
