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

async function fillOffer(
  page: Page,
  id: 'a' | 'b',
  depositWon: string,
  monthlyRentWon: string,
) {
  await page.locator(`input[name="${id}-deposit"]`).fill(depositWon);
  await page.locator(`input[name="${id}-monthly-rent"]`).fill(monthlyRentWon);
}

test('Contract Check server HTML is ready, contained, and claim-safe', async ({ page }) => {
  const assertNoRuntimeFailures = observeRuntimeFailures(page);
  const response = await page.goto('/kr/');

  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Which rent offer actually costs less?',
  })).toBeVisible();
  await expect(page.locator('[data-contract-check-form="ready"]')).toHaveCount(1);
  await expect(page.locator('input[inputmode="numeric"]')).toHaveCount(4);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /^index,\s*follow$/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://www.signedprice.com/kr/',
  );
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);

  const htmlResponse = await page.request.get('/kr/');
  const html = await htmlResponse.text();
  expect(htmlResponse.status()).toBe(200);
  expect(html.indexOf('Offer A')).toBeLessThan(html.indexOf('Offer B'));
  expect(html.indexOf('Offer B')).toBeLessThan(html.indexOf('Result'));
  expect(html).toContain('MOLIT reported rental contracts');
  expect(html).not.toMatch(/Singapore|Dubai|72,291|29\.4%/i);

  const sitemap = await page.request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain('<loc>https://www.signedprice.com/kr/</loc>');
  assertNoRuntimeFailures();
});

test('Contract Check stays ordered, touch-sized, and keyboard reachable', async ({ page }) => {
  const assertNoRuntimeFailures = observeRuntimeFailures(page);
  await page.goto('/kr/');
  await expectNoHorizontalOverflow(page);

  const panels = page.locator('fieldset, [data-result-focus-target="true"]');
  await expect(panels).toHaveCount(3);
  await expect(panels.nth(0)).toContainText('Offer A');
  await expect(panels.nth(1)).toContainText('Offer B');
  await expect(panels.nth(2)).toContainText('Result');

  const controls = page.locator('form input, form select, form button');
  for (const control of await controls.all()) await expectTouchTarget(control);

  const housingType = page.locator('#contract-housing-type');
  await housingType.focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('input[name="a-label"]')).toBeFocused();

  const primaryNavigation = page.getByRole('navigation', { name: 'Primary' });
  await expect(primaryNavigation.getByRole('link', { name: 'Check', exact: true }))
    .toHaveAttribute('href', '/kr/');
  await expect(primaryNavigation.getByRole('link', { name: 'Explore', exact: true }))
    .toHaveAttribute('href', '/kr/seoul/explore/');
  await expect(primaryNavigation.getByRole('link', { name: 'Guide', exact: true }))
    .toHaveAttribute('href', '/kr/seoul/guide/');
  await expect(primaryNavigation.getByText('Planned')).toHaveCount(0);
  await expect(page.getByRole('link', {
    name: 'Check one offer against its local distribution',
  })).toHaveAttribute('href', '/kr/seoul/tools/rent-check/');
  assertNoRuntimeFailures();
});

test('fixture curve covers interpolation, held range, tie, and ranking flip', async ({ page }) => {
  test.skip(releaseTarget.usesExternalServer, 'Exact fixture calculations are local-release only.');
  await page.goto('/kr/');

  await fillOffer(page, 'a', '100000000', '100000');
  await fillOffer(page, 'b', '30000000', '300000');
  await page.getByRole('button', { name: 'Compare offers' }).click();
  const result = page.locator('[data-result-focus-target="true"]');
  await expect(result).toBeFocused();
  await expect(result).toContainText('Offer B has the lower normalized cost.');
  await expect(result).toContainText('₩33,333');
  await expect(result).toContainText('4.00% / year');
  await expect(result).toContainText('5.00% / year');
  await expect(result).toContainText(
    'The lower listed rent is not the lower normalized cost.',
  );

  await page.locator('input[name="a-deposit"]').fill('120000000');
  await expect(result).not.toContainText('Offer B has the lower normalized cost.');
  await page.getByRole('button', { name: 'Compare offers' }).click();
  await expect(result).toContainText('Held at the highest verified anchor');

  await fillOffer(page, 'a', '30000000', '300000');
  await fillOffer(page, 'b', '30000000', '300000');
  await page.getByRole('button', { name: 'Compare offers' }).click();
  await expect(result).toContainText('The offers are effectively equal.');
  await expect(result).toContainText('Within verified anchors');
});
