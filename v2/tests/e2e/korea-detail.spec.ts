import { expect, test, type Page } from '@playwright/test';

import { resolveReleaseTestTarget } from '../../release-test-target';
import { PUBLIC_BUILDING_TEST_NAME } from './public-building-summary-fixture';

const releaseTarget = resolveReleaseTestTarget();

function observeFailures(page: Page) {
  const failures: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') failures.push(message.text()); });
  page.on('response', (response) => { if (response.status() >= 500) failures.push(response.url()); });
  return () => expect(failures).toEqual([]);
}

async function expectContained(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test('map and table open the same reload-safe nested district journey', async ({ page }, testInfo) => {
  const noFailures = observeFailures(page);
  await page.goto('/kr/seoul/explore/');
  const tableHref = await page.locator('[data-district-row="jongno-gu"] a').first().getAttribute('href');
  expect(tableHref).toBe('/kr/seoul/explore/jongno-gu/');
  if (testInfo.project.name !== 'mobile-chromium') {
    await page.locator('[data-district-path="jongno-gu"]').dispatchEvent('pointerup');
    await expect(page).toHaveURL(/\/kr\/seoul\/explore\/jongno-gu\/$/);
  } else {
    await page.goto(tableHref!);
  }
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Jongno-gu');
  await page.reload();
  await expect(page.locator('[data-district-detail="published"]')).toBeVisible();
  if (releaseTarget.usesExternalServer) {
    const ready = await page.getByRole('link', { name: PUBLIC_BUILDING_TEST_NAME }).count();
    const notLoaded = await page.getByText('Building evidence is not loaded').count();
    expect(ready + notLoaded).toBeGreaterThan(0);
  } else {
    await expect(page.getByText('Building evidence is not loaded')).toHaveCount(0);
    await expect(page.getByRole('link', { name: PUBLIC_BUILDING_TEST_NAME })).toBeVisible();
  }
  await expectContained(page);
  noFailures();
});

test('verified synthetic building detail is server rendered only in the local release fixture', async ({ page }) => {
  test.skip(releaseTarget.usesExternalServer, 'Synthetic building exists only in the local release fixture.');
  const noFailures = observeFailures(page);
  const response = await page.goto('/kr/seoul/explore/jongno-gu/synthetic-test-building/');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: PUBLIC_BUILDING_TEST_NAME })).toBeVisible();
  await expect(page.getByText('Privacy-safe reported contracts')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^noindex,\s*follow$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  await expectContained(page);
  noFailures();
});
