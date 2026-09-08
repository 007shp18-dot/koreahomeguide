import { expect, test, type Locator, type Page } from '@playwright/test';
import { visibleProductNavigation } from './site-header-helpers';

import { resolveReleaseTestTarget } from '../../release-test-target';
import { openPrimaryNavigation } from './navigation-helpers';

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

test('rankings server HTML exposes the three supported evidence lists', async ({ page }) => {
  const assertNoRuntimeFailures = observeRuntimeFailures(page);
  const response = await page.goto('/kr/seoul/rankings/');

  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Seoul building price rankings');
  const buildingRows = page.locator('[data-building-ranking-row]');
  await expect(buildingRows).not.toHaveCount(0);
  await expect(buildingRows.first().getByRole('link')).toHaveAttribute(
    'href',
    /\/kr\/seoul\/explore\/[^/]+\/[^/?]+\?transaction=sale&area=all&propertyType=/,
  );
  await expect(page.locator('[data-ranking-section]')).toHaveCount(3);
  await expect(page.getByRole('tab', { name: 'Median price', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Price spread' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Middle-half spread (P75 − P25)' })).toBeVisible();
  await page.getByRole('tab', { name: 'Filing volume' }).click();
  await expect(page.getByRole('heading', { name: 'Qualifying reported contracts' }))
    .toBeVisible();
  expect(await page.locator('[data-ranking-row]').count()).toBeGreaterThan(0);
  await expect(page.getByRole('tab', { name: 'QoQ change' })).toHaveCount(0);
  await expect(page.getByText('Preparing')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /^index,\s*follow$/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://www.signedprice.com/kr/seoul/rankings/',
  );
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(3);

  const htmlResponse = await page.request.get('/kr/seoul/rankings/');
  expect(htmlResponse.status()).toBe(200);
  const html = await htmlResponse.text();
  expect((html.match(/data-ranking-section=/g) ?? [])).toHaveLength(3);
  expect(html).toContain('data-ranking-row=');
  assertNoRuntimeFailures();
});

test('fixture district context preserves descending order and stable ranks across page boundaries', async ({ page }) => {
  test.skip(releaseTarget.usesExternalServer, 'Exact fixture values are local-release only.');
  await page.goto('/kr/seoul/rankings/');

  const firstPageRows = page.getByRole('tabpanel', { name: 'Median price' }).locator('[data-ranking-row]');
  await expect(firstPageRows).toHaveCount(20);
  const firstPage = await firstPageRows.evaluateAll((rows) => rows.map((row) => ({
    id: row.getAttribute('data-ranking-row'),
    rank: Number(row.querySelector('[aria-label^="Rank "]')?.textContent),
    value: Number(row.querySelector(':scope > strong')?.textContent?.replace(/[^0-9]/gu, '')),
  })));
  await page.getByRole('link', { name: 'Next', exact: true }).click();
  const secondPageRows = page.getByRole('tabpanel', { name: 'Median price' }).locator('[data-ranking-row]');
  const secondPage = await secondPageRows.evaluateAll((rows) => rows.map((row) => ({
    id: row.getAttribute('data-ranking-row'),
    rank: Number(row.querySelector('[aria-label^="Rank "]')?.textContent),
    value: Number(row.querySelector(':scope > strong')?.textContent?.replace(/[^0-9]/gu, '')),
  })));
  const combined = [...firstPage, ...secondPage];
  expect(combined.map(({ rank }) => rank)).toEqual(combined.map((_, index) => index + 1));
  expect(new Set(combined.map(({ id }) => id)).size).toBe(combined.length);
  expect(combined.every((row, index) => index === 0 || combined[index - 1]!.value >= row.value)).toBe(true);
});

test('rankings remain contained and keyboard-readable at every release width', async ({ page }) => {
  const assertNoRuntimeFailures = observeRuntimeFailures(page);
  await page.goto('/kr/seoul/rankings/');
  await expectNoHorizontalOverflow(page);

  await page.getByRole('tab', { name: 'Median price', exact: true }).click();
  const medianPanel = page.getByRole('tabpanel', { name: 'Median price' });
  const districtLinks = medianPanel.locator('[data-ranking-row] a');
  await expect(districtLinks).not.toHaveCount(0);
  for (const link of await districtLinks.all()) await expectTouchTarget(link);

  const first = districtLinks.nth(0);
  const second = districtLinks.nth(1);
  await first.focus();
  await page.keyboard.press('Tab');
  await expect(second).toBeFocused();

  const sitemap = await page.request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain(
    '<loc>https://www.signedprice.com/kr/seoul/rankings/</loc>',
  );
  assertNoRuntimeFailures();
});

test('Explore and district evidence keep Rankings reachable beside the five global product links', async ({ page }) => {
  await page.goto('/kr/seoul/explore/');
  const productNavigation = await openPrimaryNavigation(page);
  await expect(productNavigation.getByRole('link', { name: 'Explore' }))
    .toHaveAttribute('href', '/prices/');
  await expect(productNavigation.getByRole('link')).toHaveText(['Explore', 'Rankings', 'Tools', 'News & Insights', 'Guides']);

  await page.goto('/kr/seoul/explore/jongno-gu/');
  await expect(page.getByRole('link', { name: 'View district rankings' }))
    .toHaveAttribute('href', '/kr/seoul/rankings/');
});
