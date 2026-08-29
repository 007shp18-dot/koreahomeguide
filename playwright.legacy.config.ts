import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'legacy-production-baseline.spec.ts',
  timeout: 60_000,
  use: {
    baseURL: process.env.LEGACY_BASE_URL || 'https://koreahomeguide.com',
    viewport: { width: 1363, height: 936 },
    trace: 'off',
    screenshot: 'off',
    video: 'off'
  },
  reporter: 'list'
});
