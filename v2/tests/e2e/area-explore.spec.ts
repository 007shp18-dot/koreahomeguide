import { expect, test, type Locator, type Page } from '@playwright/test';

import { resolveReleaseTestTarget } from '../../release-test-target';
import {
  PUBLIC_AREA_TEST_LEGEND_LABELS,
  PUBLIC_AREA_WITHHELD_SLUG,
} from './public-area-summary-fixture';
import {
  PUBLIC_BUILDING_TEST_ID,
  PUBLIC_BUILDING_TEST_NAME,
  PUBLIC_BUILDING_TEST_SELECTION_HREF,
} from './public-building-summary-fixture';

const releaseTarget = resolveReleaseTestTarget();

function observeRuntimeFailures(page: Page) {
  const consoleErrors: string[] = [];
  const serverErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
  });
  return () => {
    expect(consoleErrors).toEqual([]);
    expect(serverErrors).toEqual([]);
  };
}

async function expectNoHorizontalOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    body: [document.body.clientWidth, document.body.scrollWidth],
    root: [document.documentElement.clientWidth, document.documentElement.scrollWidth],
  }));
  expect(widths.body[1]).toBeLessThanOrEqual(widths.body[0]);
  expect(widths.root[1]).toBeLessThanOrEqual(widths.root[0]);
}

async function expectTouchTarget(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
}

async function expectCobaltFocus(locator: Locator) {
  await locator.focus();
  const focus = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      width: style.outlineWidth,
      style: style.outlineStyle,
      offset: style.outlineOffset,
    };
  });
  expect(focus).toEqual({ width: '2px', style: 'solid', offset: '2px' });
}

test('initial HTML and hydration expose one synchronized 25-district Explorer', async ({
  page,
}, testInfo) => {
  const assertNoRuntimeFailures = observeRuntimeFailures(page);
  const response = await page.goto('/kr/seoul/explore/');

  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Compare refundable jeonse deposits by district.',
  })).toBeVisible();
  await expect(page.locator('[data-district-path]')).toHaveCount(25);
  await expect(page.locator('[data-district-row]')).toHaveCount(25);
  const jongnoRow = page.locator('[data-district-row="jongno-gu"]');
  await expect(jongnoRow).toBeVisible();
  await expect(jongnoRow).toContainText('Jongno-gu');
  await expect(jongnoRow).toContainText('종로구');
  await expect(jongnoRow.getByRole('link', { name: 'Open Jongno-gu evidence' }).first())
    .toHaveAttribute('href', '/kr/seoul/explore/jongno-gu/');

  const gangnamRow = page.locator('[data-district-row="gangnam-gu"]');
  const gangnamPrimary = gangnamRow.getByRole('link', { name: 'Open Gangnam-gu evidence' }).first();
  await gangnamPrimary.focus();
  await expect(page.getByText('Selected · Gangnam-gu')).toBeVisible();
  await expect(gangnamPrimary).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('[data-district-path="gangnam-gu"]'))
    .toHaveClass(/selectedPath/);
  await expectNoHorizontalOverflow(page);

  if (testInfo.project.name === 'desktop-chromium') {
    const htmlResponse = await page.request.get('/kr/seoul/explore/');
    expect(htmlResponse.status()).toBe(200);
    const html = await htmlResponse.text();
    expect((html.match(/data-district-path=/g) ?? [])).toHaveLength(25);
    expect((html.match(/data-district-row=/g) ?? [])).toHaveLength(25);
  }
  assertNoRuntimeFailures();
});

test('synthetic release fixture shows exact five buckets and a money-free refusal', async ({
  page,
}) => {
  test.skip(releaseTarget.usesExternalServer, 'Exact fixture values are local-release only.');
  await page.goto('/kr/seoul/explore/');

  const legend = page.getByRole('group', { name: 'Map legend' });
  for (const label of PUBLIC_AREA_TEST_LEGEND_LABELS) {
    await expect(legend).toContainText(label);
  }
  await expect(legend).toContainText('Not published · fewer than 5 contracts');
  await expect(page.locator(`[data-district-path="${PUBLIC_AREA_WITHHELD_SLUG}"]`))
    .toHaveAttribute('data-map-state', 'withheld');
  const withheldRow = page.locator(`[data-district-row="${PUBLIC_AREA_WITHHELD_SLUG}"]`);
  await expect(withheldRow).toContainText('Not published');
  await expect(withheldRow).toContainText('4 reported contracts');
  await expect(withheldRow).not.toContainText('₩');
});

test('rail selection opens the canonical building panel and full-detail CTA', async ({ page }) => {
  test.skip(releaseTarget.usesExternalServer, 'Exact fixture values are local-release only.');
  await page.goto('/kr/seoul/explore/?district=jongno-gu');

  await page.getByRole('button', { name: new RegExp(PUBLIC_BUILDING_TEST_NAME) }).click();
  const panel = page.locator(`[data-building-panel="${PUBLIC_BUILDING_TEST_ID}"]`);
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('link', { name: 'Open full building evidence' }))
    .toHaveAttribute('href', PUBLIC_BUILDING_TEST_SELECTION_HREF);
});

test('published quote stays local and any withheld detail stays money-free', async ({ page }) => {
  const assertNoRuntimeFailures = observeRuntimeFailures(page);
  await page.goto('/kr/seoul/explore/');
  await page.waitForLoadState('networkidle');

  const publishedSlug = await page.locator('[data-district-path][data-map-state="published"]')
    .first()
    .getAttribute('data-district-path');
  expect(publishedSlug).not.toBeNull();
  if (publishedSlug === null) throw new Error('A published district is required.');

  await page.goto(`/kr/seoul/explore/${publishedSlug}/`);
  await expect(page.locator('[data-district-detail="published"]')).toBeVisible();
  await page.waitForLoadState('networkidle');
  const observedRequests: string[] = [];
  page.on('request', (request) => observedRequests.push(request.url()));
  await page.locator('input[name="quote"]').fill('1');
  await expect(page.locator('[data-median-comparison="true"]')).toContainText(
    'below the reported median',
  );
  expect(observedRequests).toEqual([]);
  await expect(page.getByRole('link', { name: 'Back to Seoul map' }))
    .toHaveAttribute('href', `/kr/seoul/explore/?district=${publishedSlug}`);

  await page.goto('/kr/seoul/explore/');
  const withheldSlug = await page.locator('[data-district-path][data-map-state="withheld"]')
    .first()
    .getAttribute('data-district-path');
  if (withheldSlug !== null) {
    await page.goto(`/kr/seoul/explore/${withheldSlug}/`);
    await expect(page.locator('[data-district-detail="withheld"]')).toBeVisible();
    await expect(page.locator('input[name="quote"]')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('₩');
    const structuredData = await page.locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(structuredData.join('\n')).not.toMatch(/"(?:min|p25|med|p75|max|chg3m)"|₩/);
  }
  assertNoRuntimeFailures();
});

test('mobile controls keep 44px focus targets and natural document scrolling', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium');
  await page.goto('/kr/seoul/explore/');

  const navigation = page.getByRole('navigation', { name: 'Seoul evidence navigation' });
  const checkTab = navigation.getByRole('link', { name: /Check/ });
  const exploreTab = navigation.getByRole('link', { name: /Explore/ });
  const districtLink = page.locator('[data-district-row="gangnam-gu"]')
    .getByRole('link', { name: 'Open Gangnam-gu evidence' }).first();
  const detailLink = page.getByRole('link', { name: 'Open Gangnam-gu evidence' }).last();
  for (const target of [checkTab, exploreTab, districtLink, detailLink]) {
    await expectTouchTarget(target);
    await expectCobaltFocus(target);
  }
  await expectNoHorizontalOverflow(page);
  const scroll = await page.evaluate(() => {
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    const before = window.scrollY;
    window.scrollTo(0, document.documentElement.scrollHeight);
    const result = {
      before,
      after: window.scrollY,
      height: document.documentElement.scrollHeight,
      viewport: window.innerHeight,
    };
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
    return result;
  });
  expect(scroll.height).toBeGreaterThan(scroll.viewport);
  expect(scroll.after).toBeGreaterThan(scroll.before);
});

test('an unknown ready-fixture pair keeps Explore usable at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto('/kr/seoul/explore/?district=gangnam-gu&station=missing&stationDistance=250');
  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-proximity-selectors="enabled"]')).toBeVisible();
  await expect(page.locator('[data-building-browser="gangnam-gu"]')).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const htmlResponse = await page.request.get('/kr/seoul/explore/?district=gangnam-gu&station=missing&stationDistance=250');
  expect(htmlResponse.status()).toBe(200);
  const html = await htmlResponse.text();
  expect(html).toContain('data-proximity-selectors="enabled"');
});

test('ready injected proximity fixture keeps controls touch-sized and round-trips pairs', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/kr/seoul/explore/?district=jongno-gu');
  const selectors = page.locator('[data-proximity-selectors="enabled"] select');
  await expect(selectors).toHaveCount(4);
  for (const index of [0, 1, 2, 3]) await expectTouchTarget(selectors.nth(index));
  await selectors.nth(0).selectOption('e2e-station');
  await expect(page).toHaveURL(/station=e2e-station.*stationDistance=500/);
  await selectors.nth(1).selectOption('750');
  await expect(page).toHaveURL(/station=e2e-station.*stationDistance=750/);
  await selectors.nth(2).selectOption('e2e-school');
  await expect(page).toHaveURL(/station=e2e-station.*stationDistance=750.*school=e2e-school.*schoolDistance=500/);
  await selectors.nth(3).selectOption('1000');
  await expect(page).toHaveURL(/school=e2e-school.*schoolDistance=1000/);
  await expect(page.locator('[data-building-browser="jongno-gu"]')).toContainText('E2E Station');
  await page.locator('[data-building-row="synthetic-test-building"] button').click();
  const detail = page.getByRole('link', { name: 'Open full building evidence' }).first();
  await expect(detail).toHaveAttribute('href', /station=e2e-station.*stationDistance=750.*school=e2e-school.*schoolDistance=1000/);
  await detail.click();
  await expect(page.locator('[data-building-detail="ready"]')).toBeVisible();
  const back = page.getByRole('link', { name: 'Back to Jongno Explore' });
  await expect(back)
    .toHaveAttribute('href', /station=e2e-station.*stationDistance=750.*school=e2e-school.*schoolDistance=1000/);
  await back.click();
  await expect(page).toHaveURL(/station=e2e-station.*stationDistance=750.*school=e2e-school.*schoolDistance=1000/);
  await selectors.nth(0).selectOption('');
  await expect(page).not.toHaveURL(/station=/);
  await expect(page).not.toHaveURL(/stationDistance=/);
  await expect(page).toHaveURL(/school=e2e-school.*schoolDistance=1000/);
  await selectors.nth(2).selectOption('');
  await expect(page).not.toHaveURL(/school=/);
  await expect(page).not.toHaveURL(/schoolDistance=/);
  await expectNoHorizontalOverflow(page);
});

test('wide workspace keeps map, table, and legend contained', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'wide-chromium');
  await page.goto('/kr/seoul/explore/');

  await expect(page.getByRole('group', { name: 'Map legend' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'All 25 districts' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('unsupported intent pages never relabel district artifact money', async ({ page }) => {
  test.skip(releaseTarget.usesExternalServer, 'Sentinel assertions use the local fixture.');
  for (const path of ['/kr/seoul/rent/', '/kr/seoul/buy/', '/kr/seoul/invest/']) {
    await page.goto(path);
    await expect(page.locator('body')).not.toContainText('₩500,000,000');
    await expect(page.locator('body')).not.toContainText('₩700,000,000');
  }
});
