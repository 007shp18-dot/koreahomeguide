import { expect, test, type Locator, type Page } from '@playwright/test';

import { resolveReleaseTestTarget } from '../../release-test-target';

const releaseTarget = resolveReleaseTestTarget();
const submittedComparisonPath =
  '/kr/seoul/check/compare/?compare=1&district=gangnam-gu&housing=apartment&area=84' +
  '&a-transaction=sale&a-price=1200000000' +
  '&b-transaction=monthly&b-deposit=50000000&b-monthly-rent=2000000';

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

test('fixture-isolated release serves deterministic all-type A/B evidence', async ({ request }) => {
  test.skip(releaseTarget.usesExternalServer, 'Synthetic Check evidence is local-release only.');
  const blankComparison = await request.get('/kr/seoul/check/compare/');
  const comparison = await request.get(submittedComparisonPath);
  const englishSale = await request.get(
    '/kr/seoul/check/?check=1&district=gangnam-gu&housing=apartment&area=84' +
    '&transaction=sale&price=1200000000',
  );
  const koreanMonthly = await request.get(
    '/ko/kr/seoul/check/?check=1&district=gangnam-gu&housing=apartment&area=84' +
    '&transaction=monthly&deposit=50000000&monthly-rent=2000000',
  );
  const blankComparisonHtml = await blankComparison.text();
  const comparisonHtml = await comparison.text();
  const englishSaleHtml = await englishSale.text();
  const koreanMonthlyHtml = await koreanMonthly.text();

  expect(blankComparison.status()).toBe(200);
  expect(blankComparisonHtml).toContain('data-contract-check-form="ready"');
  expect(blankComparisonHtml).toContain('data-offer="a"');
  expect(blankComparisonHtml).toContain('data-offer="b"');
  expect(blankComparisonHtml).toContain('data-result-state="blank"');
  expect(comparison.status()).toBe(200);
  expect(comparisonHtml).toContain('Trade-off — no winner declared');
  expect(comparisonHtml).toContain('7 completed months');
  expect(comparisonHtml).toContain('MOLIT reported sale and rental contracts');
  expect(comparisonHtml).not.toContain('Verified transaction evidence is unavailable.');
  expect(englishSale.status()).toBe(200);
  expect(englishSaleHtml).toContain('data-single-result');
  expect(englishSaleHtml).toContain('7 completed months · 2026-02–2026-08');
  expect(englishSaleHtml).not.toContain('Verified transaction evidence is unavailable.');
  expect(koreanMonthly.status()).toBe(200);
  expect(koreanMonthlyHtml).toContain('data-single-result');
  expect(koreanMonthlyHtml).toContain('7개월 완료 · 2026-02–2026-08');
  expect(koreanMonthlyHtml).not.toContain('Verified transaction evidence is unavailable.');
});

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

  await page.getByRole('link', { name: 'Compare two offers' }).first().click();
  await expect(page).toHaveURL(/\/kr\/seoul\/check\/compare\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Compare two offers' })).toBeVisible();
  await expect(page.locator('[data-contract-check-form="ready"]')).toBeVisible();
  await expect(page.locator('[data-offer="a"]')).toContainText('Offer A');
  await expect(page.locator('[data-offer="b"]')).toContainText('Offer B');
  await expect(page.locator('[data-result-state="blank"]')).toBeVisible();

  const comparison = await page.goto(submittedComparisonPath);
  expect(comparison?.status()).toBe(200);
  const orderedComparison = page.locator(
    '[data-offer="a"], [data-offer="b"], [data-result-focus-target="true"]',
  );
  await expect(orderedComparison).toHaveCount(3);
  for (const panel of await orderedComparison.all()) await expect(panel).toBeVisible();
  await expect(orderedComparison.nth(0)).toContainText('Offer A');
  await expect(orderedComparison.nth(1)).toContainText('Offer B');
  await expect(orderedComparison.nth(2)).toContainText('Result');
  await expect(orderedComparison.nth(2)).toContainText(
    '7 completed months · 2026-02–2026-08',
  );
  const disclosure = page.locator('[data-check-section="disclosure"]');
  await expect(disclosure).toBeVisible();
  await expect(disclosure).toContainText(
    'MOLIT reported sale and rental contracts',
  );

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
  await page.goto(submittedComparisonPath);
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

  const response = await page.goto(submittedComparisonPath);
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
