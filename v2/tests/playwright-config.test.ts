import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { buildContractCheckRouteModel } from '../apps/web/lib/contract-check/route-model.server';
import { buildPublicAreaExploreModel } from '../apps/web/lib/public-market/area-route-model.server';
import { observedBuildingRepositoryFromEnvironment } from '../apps/web/lib/public-market/observed-building-repository.server';
import { buildPublicAreaRankingsModel } from '../apps/web/lib/public-market/rankings-route-model.server';
import { createPlaywrightConfig } from '../playwright.config';
import { PUBLIC_BUILDING_TEST_ID } from './e2e/public-building-summary-fixture';
import {
  E2E_KOREA_PROXIMITY_GZIP_BASE64,
  E2E_KOREA_PROXIMITY_REGISTRY,
} from './e2e/korea-proximity-fixture';

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
  it('keeps the config-loaded Check fixture independent of workspace TypeScript', () => {
    const source = readFileSync(
      new URL('./e2e/contract-check-evidence-fixture.ts', import.meta.url),
      'utf8',
    );
    const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)]
      .map((match) => match[1]);

    expect(imports).toEqual(['node:crypto', 'node:zlib']);
    expect(source).not.toMatch(/@signedprice\/|(?:packages|apps)\//);
  });

  it('keeps Singapore Check browser evidence isolated and available to the local server', () => {
    const source = readFileSync(new URL('./e2e/singapore-check-fixture.ts', import.meta.url), 'utf8');
    const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
    expect(imports).toEqual(['node:crypto']);
    expect(source).not.toMatch(/@signedprice\/(?:market|singapore)|(?:packages|apps)\//);
    const config = createPlaywrightConfig({});
    if (config.webServer === undefined || Array.isArray(config.webServer)) throw new Error('Expected local server.');
    expect(config.webServer.env).toMatchObject({
      SIGNEDPRICE_SINGAPORE_CHECK_URA_PERIOD: '2026-08/2026-08',
      SIGNEDPRICE_SINGAPORE_CHECK_HDB_RESALE_PERIOD: '2026-08/2026-08',
      SIGNEDPRICE_SINGAPORE_CHECK_HDB_RENT_PERIOD: '2026-08/2026-08',
    });
  });

  it('builds and serves the deterministic candidate locally', () => {
    const config = createPlaywrightConfig({});

    expect(config.use?.baseURL).toBe('http://127.0.0.1:3100');
    expect(config.webServer).toMatchObject({
      url: 'http://127.0.0.1:3100',
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
      env: {
        VERCEL_ENV: 'preview',
        VERCEL_GIT_COMMIT_SHA: '0123456789abcdef',
        SIGNEDPRICE_GA4_ENABLED: 'false',
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
    expect(JSON.parse(String(environment.SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY))).toMatchObject({
      registryVersion: 'signedprice-installed-snapshots-v1',
      snapshots: [{ marketId: 'kr-seoul', dataset: 'kr-proximity' }],
    });
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

  it('binds the file-backed proximity payload bytes to the installed registry digest', () => {
    const serialized = gunzipSync(Buffer.from(
      E2E_KOREA_PROXIMITY_GZIP_BASE64,
      'base64',
    )).toString('utf8');
    const registry = JSON.parse(E2E_KOREA_PROXIMITY_REGISTRY) as {
      snapshots: Array<{ sha256: string }>;
    };

    expect(createHash('sha256').update(serialized).digest('hex'))
      .toBe(registry.snapshots[0]?.sha256);
  });

  it('preserves pre-existing workspace data and cleans its temporary proximity fixture', () => {
    const config = createPlaywrightConfig({});
    if (config.webServer === undefined || Array.isArray(config.webServer)) {
      throw new Error('Expected one local release web server.');
    }
    const root = mkdtempSync(join(tmpdir(), 'signedprice-playwright-proximity-'));
    const bin = join(root, 'bin');
    const artifact = join(root, 'apps/web/data/korea-proximity.json.gz');
    const temporaryRoot = join(root, 'tmp');
    const nextExecutable = join(root, 'apps/web/node_modules/next/dist/bin/next');
    mkdirSync(bin, { recursive: true });
    mkdirSync(join(root, 'apps/web/data'), { recursive: true });
    mkdirSync(join(root, 'apps/web/node_modules/next/dist/bin'), { recursive: true });
    mkdirSync(temporaryRoot, { recursive: true });
    writeFileSync(join(bin, 'pnpm'), '#!/bin/sh\nexit 0\n');
    chmodSync(join(bin, 'pnpm'), 0o755);
    writeFileSync(
      nextExecutable,
      `const { readFileSync } = require('node:fs');\n` +
      `const { join } = require('node:path');\n` +
      `const fixture = readFileSync(join(process.argv[3], 'data/korea-proximity.json.gz'));\n` +
      `const gzip = fixture[0] === 0x1f && fixture[1] === 0x8b;\n` +
      `const payloadIsPrivate = process.env.SIGNEDPRICE_PLAYWRIGHT_PROXIMITY_GZIP_BASE64 === undefined;\n` +
      `process.exit(gzip && payloadIsPrivate ? 0 : 1);\n`,
    );
    const environment = {
      ...process.env,
      ...Object.fromEntries(Object.entries(config.webServer.env ?? {})
        .map(([key, value]) => [key, String(value)])),
      PATH: `${bin}:${process.env.PATH ?? ''}`,
      TMPDIR: temporaryRoot,
    };

    try {
      const original = Buffer.from('pre-existing-user-artifact');
      writeFileSync(artifact, original);
      const completed = spawnSync('/bin/sh', ['-c', config.webServer.command], {
        cwd: root,
        env: environment,
        encoding: 'utf8',
      });
      expect(completed.status).not.toBe(0);
      expect(readFileSync(artifact)).toEqual(original);
      expect(readdirSync(temporaryRoot)).toEqual([]);

      rmSync(artifact);
      const cleanRun = spawnSync('/bin/sh', ['-c', config.webServer.command], {
        cwd: root,
        env: environment,
        encoding: 'utf8',
      });
      expect(cleanRun.status).toBe(0);
      expect(readdirSync(join(root, 'apps/web/data'))).toEqual([]);
      expect(readdirSync(temporaryRoot)).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('defines all release viewports and a retained HTML failure report', () => {
    const config = createPlaywrightConfig({});

    expect(config.projects?.map((project) => project.name)).toEqual([
      'desktop-chromium',
      'mobile-chromium',
      'review-tablet-chromium',
      'tablet-chromium',
      'wide-chromium',
    ]);
    expect(config.projects?.[2]).toMatchObject({
      testMatch: /editorial-growth-review\.spec\.ts/,
      use: { viewport: { width: 1024, height: 900 } },
    });
    expect(config.projects?.[3]).toMatchObject({
      testMatch: /(?:rankings|contract-check|trust|korea-detail|korea-guide|singapore)\.spec\.ts/,
      use: { viewport: { width: 720, height: 900 } },
    });
    expect(config.projects?.[4]).toMatchObject({
      testMatch: /(?:area-explore|contract-check|trust|korea-detail|korea-guide|singapore|editorial-growth-review)\.spec\.ts/,
      use: { viewport: { width: 1440, height: 900 } },
    });
    expect((config.projects?.[2]?.testMatch as RegExp).test('editorial-growth-review.spec.ts')).toBe(true);
    expect((config.projects?.[3]?.testMatch as RegExp).test('trust.spec.ts')).toBe(true);
    expect((config.projects?.[4]?.testMatch as RegExp).test('trust.spec.ts')).toBe(true);
    expect((config.projects?.[3]?.testMatch as RegExp).test('korea-detail.spec.ts')).toBe(true);
    expect((config.projects?.[4]?.testMatch as RegExp).test('korea-guide.spec.ts')).toBe(true);
    expect(config.reporter).toEqual([
      ['line'],
      ['html', { open: 'never' }],
    ]);
    expect(config.use).toMatchObject({
      screenshot: 'only-on-failure',
      trace: 'retain-on-failure',
      storageState: {
        cookies: [],
        origins: [{
          origin: 'http://127.0.0.1:3100',
          localStorage: [
            { name: 'signedprice_analytics_consent_v1', value: 'denied' },
            { name: 'signedprice_advertising_consent_v1', value: 'denied' },
          ],
        }],
      },
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
