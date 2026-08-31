import { expect, test, type Locator, type Page } from '@playwright/test';

import { resolveReleaseTestTarget } from '../../release-test-target';

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

test('rankings server HTML exposes four complete evidence lists', async ({ page }) => {
  const assertNoRuntimeFailures = observeRuntimeFailures(page);
  const response = await page.goto('/kr/seoul/rankings/');

  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: 'Seoul district rankings' }))
    .toBeVisible();
  await expect(page.locator('[data-ranking-section]')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: 'Median refundable jeonse deposit' }))
    .toBeVisible();
  await expect(page.getByRole('heading', {
    name: 'Median change: latest 3 months vs prior 3 months',
  })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Middle-half spread (P75 − P25)' }))
    .toBeVisible();
  await expect(page.getByRole('heading', { name: 'Qualifying reported contracts' }))
    .toBeVisible();
  expect(await page.locator('[data-ranking-row]').count()).toBeGreaterThan(0);
  await expect(page.locator('[data-change-centre="true"]')).toHaveCount(1);
  await expect(page.locator('[data-change-direction]')).toHaveCount(
    await page.locator('[data-ranking-section="change"] [data-ranking-row]').count(),
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /^noindex,\s*follow$/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);

  const htmlResponse = await page.request.get('/kr/seoul/rankings/');
  expect(htmlResponse.status()).toBe(200);
  const html = await htmlResponse.text();
  expect((html.match(/data-ranking-section=/g) ?? [])).toHaveLength(4);
  expect(html).toContain('data-ranking-row=');
  assertNoRuntimeFailures();
});

test('fixture rankings reconcile exact eligibility, order, and values', async ({ page }) => {
  test.skip(releaseTarget.usesExternalServer, 'Exact fixture values are local-release only.');
  await page.goto('/kr/seoul/rankings/');

  const sections = page.locator('[data-ranking-section]');
  await expect(sections.nth(0).locator('[data-ranking-row]')).toHaveCount(24);
  await expect(sections.nth(1).locator('[data-ranking-row]')).toHaveCount(11);
  await expect(sections.nth(2).locator('[data-ranking-row]')).toHaveCount(24);
  await expect(sections.nth(3).locator('[data-ranking-row]')).toHaveCount(24);

  const cheapest = sections.nth(0).locator('[data-ranking-row]');
  await expect(cheapest.first()).toContainText('Jung-gu');
  await expect(cheapest.first()).toContainText('₩100,000,000');
  await expect(cheapest.last()).toContainText('Gwangjin-gu');
  await expect(cheapest.last()).toContainText('₩700,000,000');

  const change = sections.nth(1).locator('[data-ranking-row]');
  await expect(change.first()).toContainText('+1.2%');
  await expect(page.getByText('No eligible district fell in the latest comparison.')).toBeVisible();
  await expect(page.locator('[data-change-direction="positive"]')).toHaveCount(11);
});

test('rankings remain contained and keyboard-readable at every release width', async ({ page }) => {
  const assertNoRuntimeFailures = observeRuntimeFailures(page);
  await page.goto('/kr/seoul/rankings/');
  await expectNoHorizontalOverflow(page);

  const districtLinks = page.locator('[data-ranking-row] a');
  const count = await districtLinks.count();
  expect(count).toBeGreaterThan(0);
  for (const link of await districtLinks.all()) await expectTouchTarget(link);

  const first = districtLinks.nth(0);
  const second = districtLinks.nth(1);
  await first.focus();
  await page.keyboard.press('Tab');
  await expect(second).toBeFocused();

  const directions = await page.locator('[data-change-direction]')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute('data-change-direction')));
  expect(directions.every((direction) => (
    direction === 'negative' || direction === 'zero' || direction === 'positive'
  ))).toBe(true);

  const sitemap = await page.request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toContain('/kr/seoul/rankings/');
  assertNoRuntimeFailures();
});

test('Explore and district evidence link into Rankings without a fifth primary tab', async ({ page }) => {
  await page.goto('/kr/seoul/explore/');
  await expect(page.getByRole('link', { name: 'View district rankings' }))
    .toHaveAttribute('href', '/kr/seoul/rankings/');
  await expect(page.locator('[data-public-tab]')).toHaveCount(4);

  const districtHref = await page.locator('[data-district-row] a').last().getAttribute('href');
  expect(districtHref).not.toBeNull();
  if (districtHref === null) throw new Error('District evidence link is required.');
  await page.goto(districtHref);
  await expect(page.getByRole('link', { name: 'View district rankings' }))
    .toHaveAttribute('href', '/kr/seoul/rankings/');
});
