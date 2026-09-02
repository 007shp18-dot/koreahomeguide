import { expect, test, type Page } from '@playwright/test';

import { resolveReleaseTestTarget } from '../../release-test-target';
import {
  PUBLIC_BUILDING_TEST_NAME,
  PUBLIC_BUILDING_TEST_SELECTION_HREF,
} from './public-building-summary-fixture';

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

async function expectTouchTarget(page: Page, selector: string) {
  const target = page.locator(selector).first();
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
}

test('map and table select the same reload-safe district workspace', async ({ page }, testInfo) => {
  const noFailures = observeFailures(page);
  await page.goto('/kr/seoul/explore/');
  const tableHref = await page.locator('[data-district-row="jongno-gu"] a').first().getAttribute('href');
  expect(tableHref).toBe('/kr/seoul/explore/jongno-gu/');
  if (testInfo.project.name !== 'mobile-chromium') {
    await page.locator('[data-district-path="jongno-gu"]').dispatchEvent('pointerup');
  } else {
    await page.locator('[data-district-row="jongno-gu"] a').first().click();
  }
  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/jongno-gu\/$/);
  await expect(page.locator('[data-building-browser="jongno-gu"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Jongno-gu building evidence' })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/jongno-gu\/$/);
  await expect(page.locator('[data-building-browser="jongno-gu"]')).toBeVisible();
  if (releaseTarget.usesExternalServer) {
    const ready = await page.locator('[data-building-browser="jongno-gu"] ul button').count();
    const notLoaded = await page.getByText('Building evidence is not loaded').count();
    expect(ready + notLoaded).toBeGreaterThan(0);
  } else {
    await expect(page.getByText('Building evidence is not loaded')).toHaveCount(0);
    const building = page.getByRole('button', { name: new RegExp(PUBLIC_BUILDING_TEST_NAME) });
    await expect(building).toBeVisible();
    await building.click();
    await expect(page.locator('[data-building-panel="synthetic-test-building"]')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open full building evidence' }))
      .toHaveAttribute('href', PUBLIC_BUILDING_TEST_SELECTION_HREF);
  }
  await expectContained(page);
  noFailures();
});

test('district detail composes official evidence before verified context', async ({
  page,
}, testInfo) => {
  const noFailures = observeFailures(page);
  const response = await page.goto('/kr/seoul/explore/jongno-gu/');
  expect(response?.status()).toBe(200);

  const detailMain = page.locator('[data-detail-main="true"]');
  const detailRail = page.locator('[data-detail-rail="true"]');
  await expect(detailMain).toBeVisible();
  await expect(detailRail).toBeVisible();
  await expect(detailRail.getByRole('heading', { name: 'Latest verified News' })).toBeVisible();
  await expect(detailRail.getByRole('heading', { name: 'Community signal' })).toBeVisible();
  await expect(detailRail.getByRole('link', { name: 'Back to Seoul map' }))
    .toHaveAttribute('href', '/kr/seoul/explore/?district=jongno-gu');
  await expectTouchTarget(page, '[data-detail-rail="true"] a[href^="/kr/seoul/news/"]');

  const layout = await page.locator('[data-detail-main="true"]').evaluate((main) => {
    const rail = main.parentElement?.querySelector('[data-detail-rail="true"]');
    const parent = main.parentElement;
    if (rail === null || parent === null) throw new Error('Detail layout is incomplete.');
    return {
      mainBeforeRail: Boolean(main.compareDocumentPosition(rail) & Node.DOCUMENT_POSITION_FOLLOWING),
      columns: getComputedStyle(parent).gridTemplateColumns.split(' ').filter(Boolean).length,
    };
  });
  expect(layout.mainBeforeRail).toBe(true);
  if (testInfo.project.name === 'desktop-chromium' || testInfo.project.name === 'wide-chromium') {
    expect(layout.columns).toBe(2);
  } else {
    expect(layout.columns).toBe(1);
  }

  const htmlResponse = await page.request.get('/kr/seoul/explore/jongno-gu/');
  const html = await htmlResponse.text();
  expect(html).toContain('data-detail-main="true"');
  expect(html).toContain('data-detail-rail="true"');
  expect(html).toContain('Latest verified News');
  expect(html).toContain('Community signal');
  await expectContained(page);
  noFailures();
});

test('verified synthetic building detail is server rendered only in the local release fixture', async ({ page }) => {
  test.skip(releaseTarget.usesExternalServer, 'Synthetic building exists only in the local release fixture.');
  const noFailures = observeFailures(page);
  const response = await page.goto('/kr/seoul/explore/jongno-gu/synthetic-test-building/');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: PUBLIC_BUILDING_TEST_NAME })).toBeVisible();
  await page.locator('details > summary', {
    hasText: 'See records, adjustments, and methodology',
  }).click();
  await expect(page.getByRole('heading', {
    level: 2,
    name: 'Privacy-safe reported contracts',
  })).toBeVisible();
  const evidenceDetails = page.locator('details');
  await expect(evidenceDetails).toHaveAttribute('open', '');
  await expect(evidenceDetails).toContainText('Latest verified News');
  await expect(evidenceDetails).toContainText('Community signal');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^noindex,\s*follow$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  await expectContained(page);
  noFailures();
});
