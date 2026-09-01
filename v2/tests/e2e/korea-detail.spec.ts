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
  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/\?district=jongno-gu$/);
  await expect(page.locator('[data-building-browser="jongno-gu"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Jongno-gu building evidence' })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/\?district=jongno-gu$/);
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
      .toHaveAttribute('href', '/kr/seoul/explore/jongno-gu/synthetic-test-building/');
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

test('verified synthetic building detail keeps decision state, evidence, and layout accessible', async ({
  page,
}, testInfo) => {
  test.skip(releaseTarget.usesExternalServer, 'Synthetic building exists only in the local release fixture.');
  const noFailures = observeFailures(page);
  const response = await page.goto('/kr/seoul/explore/jongno-gu/synthetic-test-building/');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: PUBLIC_BUILDING_TEST_NAME })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Overview' }))
    .toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('Verified building image is not available')).toBeVisible();
  await expectTouchTarget(
    page,
    '[aria-label="Building detail market navigation"] a[aria-current="location"]',
  );
  await expectTouchTarget(page, '[data-selected-mode="overview"] a');
  for (let index = 1; index <= 5; index += 1) {
    await expectTouchTarget(page, `[role="tab"]:nth-child(${index})`);
  }

  const identityColumns = await page.locator('[data-identity-hero="true"]').evaluate(
    (hero) => getComputedStyle(hero).gridTemplateColumns.split(' ').filter(Boolean).length,
  );
  if (testInfo.project.name === 'desktop-chromium' || testInfo.project.name === 'wide-chromium') {
    expect(identityColumns).toBe(2);
  } else {
    expect(identityColumns).toBe(1);
  }

  await page.getByRole('tab', { name: 'Rent' }).click();
  await expect(page).toHaveURL(/\?mode=rent$/);
  await page.getByRole('button', { name: 'All' }).click();
  await expect(page).toHaveURL(/\?mode=rent&contract=all$/);
  await expect(page.locator('[data-plot-variant="full"]')).toBeVisible();

  await page.getByRole('tab', { name: 'Buy' }).click();
  await expect(page.getByText('Official sale evidence is not ready')).toBeVisible();
  await expect(page.getByRole('tabpanel').getByText(/₩/)).toHaveCount(0);

  await page.getByRole('tab', { name: 'Invest' }).click();
  await expect(page.getByText('Investment evidence is incomplete')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('tab', { name: 'Buy' }))
    .toHaveAttribute('aria-selected', 'true');
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Buy' }))
    .toHaveAttribute('aria-selected', 'true');

  await page.getByRole('tab', { name: 'Evidence' }).click();
  await expect(page.getByRole('tabpanel').getByText('kr-molit-rent-v1')).toBeVisible();
  const disclosure = page.locator('details');
  const summary = disclosure.locator('summary');
  await expectTouchTarget(page, 'details > summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(disclosure).toHaveAttribute('open', '');
  await expect(page.getByText('Privacy-safe reported contracts')).toBeVisible();
  await expectContained(page);

  const overviewTab = page.getByRole('tab', { name: 'Overview' });
  await overviewTab.focus();
  await page.keyboard.press('Enter');
  await expect(overviewTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel'))
    .toHaveAttribute('aria-labelledby', 'building-mode-overview-tab');

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^noindex,\s*follow$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);

  if (testInfo.project.name === 'mobile-chromium') {
    await page.setViewportSize({ width: 320, height: 844 });
    await expect(page.locator('[aria-label="Building detail market navigation"]')).toBeVisible();
    await expect(page.getByRole('tablist')).toBeVisible();
    await expect(page.getByRole('tabpanel')).toBeVisible();
    await expect(page.locator('details > summary')).toBeVisible();
  }
  await expectContained(page);
  noFailures();
});
