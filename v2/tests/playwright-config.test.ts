import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { parseObservedBuildingArtifact } from '../apps/web/lib/public-market/observed-building-schema';
import { createPlaywrightConfig } from '../playwright.config';
import {
  OBSERVED_BUILDING_INVENTORY_TEST_ARTIFACT,
} from './e2e/observed-building-inventory-fixture';
import { PUBLIC_BUILDING_TEST_ID } from './e2e/public-building-summary-fixture';
import { PUBLIC_SUMMARY_TEST_PERIOD } from './e2e/public-summary-fixture';

describe('Playwright release target configuration', () => {
  it('builds and serves the deterministic candidate locally', () => {
    const config = createPlaywrightConfig({});

    expect(config.use?.baseURL).toBe('http://127.0.0.1:3100');
    expect(config.webServer).toMatchObject({
      url: 'http://127.0.0.1:3100',
      env: {
        VERCEL_ENV: 'preview',
        VERCEL_GIT_COMMIT_SHA: '0123456789abcdef',
        SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS: 'true',
        SIGNEDPRICE_CONVERSION_CURVE_PERIOD: '2026-03/2026-08',
        SIGNEDPRICE_CONVERSION_CURVE_SHA256: 'a'.repeat(64),
      },
    });
    expect(config.webServer?.env).toHaveProperty('SIGNEDPRICE_CONVERSION_CURVE_ARTIFACT');
    expect(config.webServer?.env).toHaveProperty('SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT');
    expect(config.webServer?.env).toHaveProperty('SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT');
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

  it('joins the browser price fixture to a verified observed-building fixture', () => {
    const artifact = parseObservedBuildingArtifact(
      JSON.parse(OBSERVED_BUILDING_INVENTORY_TEST_ARTIFACT),
      { marketId: 'kr-seoul', period: PUBLIC_SUMMARY_TEST_PERIOD },
    );

    expect(artifact.records).toHaveLength(1);
    expect(artifact.records[0]?.buildingId).toBe(PUBLIC_BUILDING_TEST_ID);
    expect(artifact.records[0]?.coordinate.state).toBe('ready');
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
