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

test('primary Contract Check exposes one quote and routes to the two-offer comparison', async ({ page }) => {
  const assertNoRuntimeFailures = observeRuntimeFailures(page);
  const response = await page.goto('/kr/seoul/check/');

  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Check one asking price.',
  })).toBeVisible();
  await expect(page.locator('[data-primary-check="single-quote"]')).toHaveCount(1);
  await expect(page.locator('form select')).toHaveCount(3);
  await expect(page.locator('input[inputmode="numeric"]')).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'Compare two rental offers' }).first())
    .toHaveAttribute('href', '/kr/seoul/check/compare/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /^index,\s*follow$/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://www.signedprice.com/kr/seoul/check/',
  );
  const alternates = page.locator('link[rel="alternate"][hreflang]');
  await expect(alternates).toHaveCount(3);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    'href', 'https://www.signedprice.com/kr/seoul/check/',
  );
  await expect(page.locator('link[rel="alternate"][hreflang="ko"]')).toHaveAttribute(
    'href', 'https://www.signedprice.com/ko/kr/seoul/check/',
  );
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
    'href', 'https://www.signedprice.com/kr/seoul/check/',
  );

  const htmlResponse = await page.request.get('/kr/seoul/check/');
  const html = await htmlResponse.text();
  expect(htmlResponse.status()).toBe(200);
  expect(html).toContain('Compare a sale, jeonse or monthly-rent quote');
  expect(html).toContain('/kr/seoul/check/compare/');
  const visibleDecisionCopy = await page.locator('main').innerText();
  expect(visibleDecisionCopy).not.toMatch(/Singapore|Dubai|72,291|29\.4%/i);

  const comparison = await page.request.get('/kr/seoul/check/compare/');
  const comparisonHtml = await comparison.text();
  expect(comparison.status()).toBe(200);
  expect(comparisonHtml.indexOf('Offer A')).toBeLessThan(comparisonHtml.indexOf('Offer B'));
  expect(comparisonHtml.indexOf('Offer B')).toBeLessThan(comparisonHtml.indexOf('Result'));
  expect(comparisonHtml).toContain('MOLIT reported rental contracts');

  const sitemap = await page.request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const sitemapXml = await sitemap.text();
  expect(sitemapXml).toContain('<loc>https://www.signedprice.com/kr/seoul/check/</loc>');
  expect(sitemapXml).toContain('<loc>https://www.signedprice.com/kr/seoul/check/compare/</loc>');
  assertNoRuntimeFailures();
});

test('Contract Check stays ordered, touch-sized, and keyboard reachable', async ({ page }) => {
  const assertNoRuntimeFailures = observeRuntimeFailures(page);
  await page.goto('/kr/seoul/check/compare/');
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

  const productNavigation = page.getByRole('navigation', {
    name: 'Seoul product navigation',
  });
  await expect(productNavigation.getByRole('link')).toHaveCount(5);
  await expect(productNavigation.getByRole('link', { name: /Check/ }))
    .toHaveAttribute('href', '/kr/seoul/check/');
  await expect(productNavigation.getByRole('link', { name: /Explore/ }))
    .toHaveAttribute('href', '/kr/seoul/explore/');
  await expect(productNavigation.getByRole('link', { name: /Guide/ }))
    .toHaveAttribute('href', '/kr/seoul/guide/');
  await expect(productNavigation.getByText('Planned')).toHaveCount(0);
  await expect(page.getByRole('link', {
    name: 'Check one offer against its local distribution',
  })).toHaveAttribute('href', '/kr/seoul/tools/rent-check/');
  assertNoRuntimeFailures();
});

test('fixture curve covers interpolation, range rejection, tie, and ranking flip', async ({ page }) => {
  test.skip(releaseTarget.usesExternalServer, 'Exact fixture calculations are local-release only.');
  await page.goto('/kr/seoul/check/compare/');

  await fillOffer(page, 'a', '100000000', '100000');
  await fillOffer(page, 'b', '30000000', '300000');
  const result = page.locator('[data-result-focus-target="true"]');
  await expect(result).toContainText('Offer B has the lower normalized cost.');
  await expect(result).toContainText('₩8,333');
  await expect(result).toContainText('4.00% · Within measured range');
  await expect(result).toContainText('5.00% · Within measured range');
  await expect(result).toContainText(
    'The lower listed rent is not the lower normalized cost.',
  );

  await expect(page.getByRole('button', { name: 'Compare offers' })).toHaveCount(0);
  await expect(result.locator('[data-calculation-row]')).toHaveCount(4);
  await expect(result.locator('svg text')).toHaveCount(0);

  await page.locator('input[name="a-deposit"]').fill('120000000');
  await expect(page.locator('#a-offer-error')).toContainText(
    'Deposit falls outside the measured range. No comparison is produced.',
  );
  await expect(result.locator('[data-result-state="invalid"]')).toBeVisible();

  await fillOffer(page, 'a', '30000000', '300000');
  await fillOffer(page, 'b', '30000000', '300000');
  await expect(result).toContainText('The offers are effectively equal.');

  await page.locator('input[name="a-deposit"]').fill('-1');
  await expect(result.locator('[data-empty-title="true"]')).toBeVisible();
  await expect(result.locator('[data-empty-reason="true"]')).toBeVisible();
  await expect(result.locator('[data-empty-action="true"]')).toBeVisible();
});
