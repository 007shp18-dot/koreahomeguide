import { expect, test } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('exports SignedPrice property seed artifact for DB migration verification', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'single CI export is sufficient');
  const { stdout } = await execFileAsync(process.execPath, [
    'apps/web/scripts/export-property-seed-artifact.mjs',
    'test-results/property-seed-export.json',
  ], { cwd: process.cwd(), maxBuffer: 1024 * 1024 });
  testInfo.attachments.push({ name: 'seed-export-summary', contentType: 'text/plain', body: Buffer.from(stdout) });
  expect(false, 'intentional one-run failure so CI uploads test-results seed artifact').toBe(true);
});
