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
  await expect(page.locator('input[inputmode="numeric"]')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Compare two offers' }).first())
    .toHaveAttribute('href', '/kr/seoul/check/compare/');
  const primaryIndexable = releaseTarget.usesExternalServer;
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    primaryIndexable ? /^index,\s*follow$/ : /^noindex,\s*follow$/,
  );
  if (primaryIndexable) {
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://www.signedprice.com/kr/seoul/check/',
    );
  } else {
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  }
  const alternates = page.locator('link[rel="alternate"][hreflang]');
  if (primaryIndexable) {
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
  } else {
    await expect(alternates).toHaveCount(0);
  }

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
  expect(comparisonHtml).toContain('MOLIT reported sale contracts');

  const sitemap = await page.request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const sitemapXml = await sitemap.text();
  if (primaryIndexable) {
    expect(sitemapXml).toContain('<loc>https://www.signedprice.com/kr/seoul/check/</loc>');
  } else {
    expect(sitemapXml).not.toContain('<loc>https://www.signedprice.com/kr/seoul/check/</loc>');
  }
  expect(sitemapXml).toContain('<loc>https://www.signedprice.com/kr/seoul/check/compare/</loc>');
  assertNoRuntimeFailures();
});

test('Contract Check stays ordered, touch-sized, and keyboard reachable', async ({ page }) => {
  const assertNoRuntimeFailures = observeRuntimeFailures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    '/kr/seoul/check/compare/?compare=1&district=gangnam-gu&housing=apartment&area=84' +
    '&a-transaction=sale&a-price=1200000000' +
    '&b-transaction=monthly&b-deposit=50000000&b-monthly-rent=2000000',
  );
  await expectNoHorizontalOverflow(page);
  await expect(page.locator('[data-result-focus-target="true"]')).toContainText('7 completed months');

  const panels = page.locator('fieldset, [data-result-focus-target="true"]');
  await expect(panels).toHaveCount(4);
  await expect(panels.nth(0)).toContainText('Conditions');
  await expect(panels.nth(1)).toContainText('Offer A');
  await expect(panels.nth(2)).toContainText('Offer B');
  await expect(panels.nth(3)).toContainText('Result');

  const controls = page.locator('form input:not([type="hidden"]), form select, form button');
  for (const control of await controls.all()) await expectTouchTarget(control);

  const district = page.locator('select[name="district"]');
  await district.focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('select[name="housing"]')).toBeFocused();

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
    name: 'Check one asking price',
  }).first()).toHaveAttribute('href', '/kr/seoul/check/');
  assertNoRuntimeFailures();
});

test('each offer changes type independently and sale versus rent stays a neutral trade-off', async ({ page }) => {
  const assertNoRuntimeFailures = observeRuntimeFailures(page);
  await page.goto('/kr/seoul/check/compare/');

  await page.locator('select[name="a-transaction"]').selectOption('sale');
  await expect(page.locator('input[name="a-price"]')).toBeVisible();
  await expect(page.locator('input[name="a-deposit"]')).toHaveCount(0);
  await page.locator('select[name="b-transaction"]').selectOption('monthly');
  await expect(page.locator('input[name="b-deposit"]')).toBeVisible();
  await expect(page.locator('input[name="b-monthly-rent"]')).toBeVisible();
  await expect(page.locator('input[name="b-price"]')).toHaveCount(0);

  const response = await page.goto(
    '/kr/seoul/check/compare/?compare=1&district=gangnam-gu&housing=apartment&area=84' +
    '&a-transaction=sale&a-price=1200000000' +
    '&b-transaction=monthly&b-deposit=50000000&b-monthly-rent=2000000',
  );
  expect(response?.status()).toBe(200);
  const result = page.locator('[data-result-focus-target="true"]');
  await expect(result.locator('[data-comparison-basis="tradeoff"]')).toBeVisible();
  await expect(result).toContainText('Trade-off — no winner declared');
  await expect(result).toContainText('Sale price as filed');
  await expect(result).toContainText('Deposit as filed');
  await expect(result).toContainText('Monthly rent as filed');
  await expect(result).toContainText('7 completed months');
  await expect(result).not.toContainText(/Offer [AB] (?:has the lower|wins)/i);
  await expect(result.locator('[data-responsive-ticks="5-desktop-3-mobile"]')).toHaveCount(2);
  assertNoRuntimeFailures();
});
