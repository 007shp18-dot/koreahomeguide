import { defineConfig, devices } from '@playwright/test';
import {
  resolveReleaseTestTarget,
  type ReleaseTestEnvironment,
} from './release-test-target';
import {
  PUBLIC_AREA_SUMMARY_TEST_ARTIFACT,
} from './tests/e2e/public-area-summary-fixture';
import {
  PUBLIC_SUMMARY_TEST_ARTIFACT,
  PUBLIC_SUMMARY_TEST_PERIOD,
} from './tests/e2e/public-summary-fixture';

const port = 3100;

export function createPlaywrightConfig(
  environment: ReleaseTestEnvironment = process.env,
) {
  const target = resolveReleaseTestTarget(environment);
  const webServer = {
    command:
      `pnpm --filter @signedprice/web build && ` +
      `pnpm --filter @signedprice/web start --hostname 127.0.0.1 --port ${port}`,
    env: {
      VERCEL_ENV: target.expectedEnvironment,
      VERCEL_GIT_COMMIT_SHA: target.expectedCommit,
      VERCEL_URL: '127.0.0.1:3100',
      SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT: PUBLIC_SUMMARY_TEST_ARTIFACT,
      SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD: PUBLIC_SUMMARY_TEST_PERIOD,
      SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT: PUBLIC_AREA_SUMMARY_TEST_ARTIFACT,
    },
    reuseExistingServer: false,
    stderr: 'pipe',
    stdout: 'pipe',
    timeout: 180_000,
    url: target.baseURL,
  } as const;

  return defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: true,
    retries: 0,
    reporter: [
      ['line'],
      ['html', { open: 'never' }],
    ],
    timeout: 30_000,
    use: {
      baseURL: target.baseURL,
      screenshot: 'only-on-failure',
      trace: 'retain-on-failure',
    },
    ...(target.usesExternalServer ? {} : { webServer }),
    projects: [
      {
        name: 'desktop-chromium',
        use: {
          ...devices['Desktop Chrome'],
          viewport: { width: 1366, height: 768 },
        },
      },
      {
        name: 'mobile-chromium',
        use: {
          ...devices['Pixel 7'],
          viewport: { width: 390, height: 844 },
        },
      },
      {
        name: 'tablet-chromium',
        testMatch: /rankings\.spec\.ts/,
        use: {
          ...devices['Desktop Chrome'],
          viewport: { width: 720, height: 900 },
        },
      },
      {
        name: 'wide-chromium',
        testMatch: /area-explore\.spec\.ts/,
        use: {
          ...devices['Desktop Chrome'],
          viewport: { width: 1440, height: 900 },
        },
      },
    ],
  });
}

export default createPlaywrightConfig();
