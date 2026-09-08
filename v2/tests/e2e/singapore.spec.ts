import { expect, test, type Locator, type Page } from '@playwright/test';
import { visibleMarketNavigation, visibleProductNavigation } from './site-header-helpers';

function observeRuntimeFailures(page: Page) {
  const consoleErrors: string[] = [];
  const serverErrors: string[] = [];
  const providerCalls: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('response', (response) => {
    if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
  });
  page.on('request', (request) => {
    if (/uraDataService|insertNewToken|invokeUraDS/i.test(request.url())) providerCalls.push(request.url());
  });
  return () => {
    expect(consoleErrors).toEqual([]);
    expect(serverErrors).toEqual([]);
    expect(providerCalls).toEqual([]);
  };
}

async function noOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    body: [document.body.clientWidth, document.body.scrollWidth],
    root: [document.documentElement.clientWidth, document.documentElement.scrollWidth],
  }));
  expect(sizes.body[1]).toBeLessThanOrEqual(sizes.body[0]);
  expect(sizes.root[1]).toBeLessThanOrEqual(sizes.root[0]);
}

async function touchTarget(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
}

async function expectImmediatePending(locator: Locator) {
  const href = await locator.getAttribute('href');
  expect(href).not.toBeNull();
  await locator.evaluate((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      const started = performance.now();
      const observer = new MutationObserver(() => {
        if (element.getAttribute('aria-busy') !== 'true') return;
        element.setAttribute('data-test-pending-ms', String(performance.now() - started));
        observer.disconnect();
      });
      observer.observe(element, { attributes: true, attributeFilter: ['aria-busy'] });
    }, { once: true });
  });
  await locator.click();
  await expect(locator).toHaveAttribute('aria-busy', 'true');
  await expect(locator).toHaveAttribute('data-test-pending-ms', /\d/);
  // Measure the browser's response, excluding Playwright transport and click actionability.
  const elapsed = Number(await locator.getAttribute('data-test-pending-ms'));
  expect(Number.isFinite(elapsed)).toBe(true);
  expect(elapsed).toBeLessThanOrEqual(100);
  return href!;
}

test('Singapore routes fail closed while display rights are pending', async ({ page }) => {
  const assertClean = observeRuntimeFailures(page);
  const response = await page.goto('/sg/');
  expect(response?.status()).toBe(200);
  const unavailable = page.locator('[data-singapore-entry="unavailable"]');
  const ready = page.locator('[data-singapore-entry="ready"]');
  expect(await unavailable.count() + await ready.count()).toBe(1);
  if (await unavailable.count()) {
    await expect(unavailable).toContainText('Verified Singapore evidence unavailable');
    await expect(page.locator('body')).not.toContainText(/SGD [\d,]+|PSF|PSM/);
    await expect(page.getByRole('link', { name: 'Singapore evidence' })).toHaveCount(0);
  }
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index,\s*follow$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://www.signedprice.com/sg/',
  );
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  await noOverflow(page);
  assertClean();
});

test('ready Singapore evidence flows entry to project when promotion gates open', async ({ page }) => {
  const assertClean = observeRuntimeFailures(page);
  await page.goto('/sg/');
  test.skip(await page.locator('[data-singapore-entry="ready"]').count() === 0,
    'Ready browser flow remains blocked until dataset-specific display rights are confirmed.');

  await page.getByRole('link', { name: 'Explore reported prices', exact: true }).click();
  await expect(page.locator('[data-singapore-evidence="ready"]')).toBeVisible();
  for (const code of ['CCR', 'RCR', 'OCR']) await expect(page.getByText(code, { exact: true }).first()).toBeVisible();
  await page.getByRole('tab', { name: /^CCR/ }).click();
  const segmentLink = page.getByRole('link', { name: 'Open CCR evidence' });
  await touchTarget(segmentLink);
  const segmentHref = await expectImmediatePending(segmentLink);
  const coldStarted = Date.now();
  await page.goto(segmentHref);
  await expect(page.locator('[data-singapore-segment="ready"]')).toBeVisible();
  expect(Date.now() - coldStarted).toBeLessThanOrEqual(2_000);
  const projectLink = page.getByRole('link', { name: 'Open project evidence' }).first();
  await touchTarget(projectLink);
  const projectHref = await expectImmediatePending(projectLink);
  const warmStarted = Date.now();
  await page.goto(projectHref);
  await expect(page.locator('[data-singapore-project="ready"]')).toBeVisible();
  const numericLayout = await page.locator('[data-market-detail-shell]').evaluate((shell) => ({
    overflowing: Array.from(shell.querySelectorAll('#detail-evidence dd, #detail-overview strong'))
      .filter((element) => element.scrollWidth > element.clientWidth + 1)
      .map((element) => element.textContent),
    priceWhiteSpace: getComputedStyle(shell.querySelector('[aria-labelledby="transaction-heading"] tbody td:nth-child(2)')!).whiteSpace,
  }));
  expect(numericLayout.overflowing).toEqual([]);
  expect(numericLayout.priceWhiteSpace).toBe('nowrap');

  expect(Date.now() - warmStarted).toBeLessThanOrEqual(1_000);
  for (const label of ['SGD', 'PSF', 'PSM', 'New sale', 'Subsale', 'Resale', 'URA']) {
    await expect(page.locator('body')).toContainText(label);
  }
  await expect(page.getByRole('link', { name: 'Explore' }).first()).toBeVisible();
  await noOverflow(page);

  await expect(page.locator('[data-transaction-research="monthly"] svg')).toBeVisible();
  const history = page.locator('[data-transaction-research="monthly"]');
  await history.getByRole('button', { name: '1Y', exact: true }).click();
  await expect(history.getByRole('button', { name: '1Y', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await history.getByText('Monthly figures and sample sizes', { exact: true }).click();
  expect(await history.locator('tbody tr').count()).toBeLessThanOrEqual(12);
  await history.getByRole('button', { name: 'All', exact: true }).click();
  await expect(history.getByRole('button', { name: 'All', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const scenario = page.locator('[data-property-scenario="SGD"]');
  await scenario.getByLabel('Purchase price (SGD)', { exact: true }).fill('1000000');
  await scenario.getByLabel('Acquisition costs, including taxes and fees (SGD)').fill('100000');
  await scenario.getByLabel('Expected monthly rent (SGD)').fill('5000');
  await scenario.getByLabel('Annual operating costs, including taxes (SGD)').fill('12000');
  await scenario.getByLabel('Expected vacant months per year').fill('2');
  await expect(scenario.locator('dl')).toContainText('3.45%');
  await noOverflow(page);

  const raw = await page.request.get(page.url());
  expect(raw.status()).toBe(200);
  const html = await raw.text();
  expect(html).toContain('data-singapore-project="ready"');
  expect(html).not.toMatch(/SIGNEDPRICE_URA_ACCESS_KEY|sentinel-ura-key|insertNewToken|invokeUraDS|AccessKey/);
  assertClean();
});

test('released Singapore discovery pages appear in the sitemap and browser never calls URA', async ({ page }) => {
  const assertClean = observeRuntimeFailures(page);
  await page.goto('/sg/singapore/explore/');
  const sitemap = await page.request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  for (const path of [
    '/sg/',
    '/sg/singapore/explore/',
    '/sg/singapore/explore/ccr/',
    '/sg/singapore/explore/rcr/',
    '/sg/singapore/explore/ocr/',
  ]) expect(xml).toContain(`<loc>https://www.signedprice.com${path}</loc>`);
  assertClean();
});

test('native Singapore Check submits single and cross-market A/B evidence', async ({ page }) => {
  const assertClean = observeRuntimeFailures(page);
  await page.goto('/sg/singapore/check/');
  await expect(page.locator('[data-singapore-check-workspace="true"]')).toBeVisible();
  // Active-state markup is a desktop contract; visible destinations are checked below.
  await expect(page.locator('.site-header__product-nav a[aria-current="page"]')).toHaveText('Tools');
  for (const market of ['URA private sale', 'HDB resale', 'HDB rent']) {
    await expect(page.getByRole('link', { name: new RegExp(market) }).first()).toContainText('Data available');
  }
  await page.getByLabel('Asking price (SGD)', { exact: true }).fill('350000');
  await page.getByRole('button', { name: 'Compare an asking price', exact: true }).click();
  await expect(page.getByLabel('Check result')).toContainText('SGD 300,000');
  await expect(page.getByLabel('Check result')).toContainText('60th percentile');
  await expect(page.getByLabel('Check result')).toContainText('2026-08–2026-08');

  await page.getByRole('link', { name: 'Compare A/B' }).click();
  await page.getByLabel('Asking price (SGD)', { exact: true }).fill('350000');
  await page.getByLabel('Monthly rent (SGD)').fill('2150');
  await page.getByRole('button', { name: 'Compare offers' }).click();
  await expect(page.getByLabel('Check result')).toContainText('Trade-off');
  await expect(page.getByLabel('Check result')).toContainText('Offer A');
  await expect(page.getByLabel('Check result')).toContainText('Offer B');
  await expect(page.getByLabel('Check result')).toContainText(
    'No winner or conversion is inferred.',
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^noindex,\s*nofollow$/);
  const productNavigation = await visibleProductNavigation(page);
  await expect(productNavigation.getByRole('link', { name: 'Tools', exact: true })).toHaveAttribute('href', '/tools/');
  expect(await productNavigation.getByRole('link').evaluateAll((links) => links.map((link) => link.getAttribute('href')))).not.toContainEqual(expect.stringMatching(/kr\/seoul/));
  await noOverflow(page);
  assertClean();
});

test('Seoul and Singapore Explore share the same desktop rail width', async ({ page }) => {
  await page.goto('/sg/singapore/explore/');
  const singaporeRail = await page.locator('[data-market-shell-region="discovery"]').boundingBox();
  const singaporeHeader = await page.locator('.site-header__inner').boundingBox();
  await expect(await visibleProductNavigation(page)).toHaveCount(1);
  await expect(await visibleMarketNavigation(page, 'Singapore')).toBeVisible();
  await page.goto('/kr/seoul/explore/');
  const seoulRail = await page.locator(
    '[data-explorer-layout="split"] > [data-explorer-region="results"]',
  ).boundingBox();
  const seoulHeader = await page.locator('.site-header__inner').boundingBox();
  await expect(await visibleProductNavigation(page)).toHaveCount(1);
  await expect(await visibleMarketNavigation(page, 'Seoul')).toBeVisible();
  expect(singaporeHeader?.height).toBeGreaterThanOrEqual(44);
  expect(seoulHeader?.height).toBe(singaporeHeader?.height);
  if (page.viewportSize()!.width > 1120) {
    expect(Math.abs((singaporeRail?.width ?? 0) - 420)).toBeLessThanOrEqual(2);
    expect(Math.abs((seoulRail?.width ?? 0) - 420)).toBeLessThanOrEqual(2);
  }
  await noOverflow(page);
});

test('Singapore Explore shows only the selected regional summary', async ({ page }) => {
  await page.goto('/sg/singapore/explore/');
  await expect(page.getByRole('heading', { name: 'Explore', exact: true, level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open CCR evidence', exact: true })).toBeHidden();
  await page.getByRole('tab', { name: /^CCR/ }).click();
  await expect(page.getByRole('link', { name: 'Open CCR evidence', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open RCR evidence', exact: true })).toBeHidden();
  await page.getByRole('tab', { name: /^RCR/ }).click();
  await expect(page.getByRole('link', { name: 'Open RCR evidence', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open CCR evidence', exact: true })).toBeHidden();
});

test('Singapore Explore keeps filters and project selection in its shareable URL', async ({ page }) => {
  await page.goto('/sg/singapore/explore/');
  await page.getByRole('tab', { name: /^CCR/ }).click();
  await expect(page).toHaveURL(/region=ccr/);
  const districtSelect = page.getByRole('combobox', { name: 'District' });
  const district = await districtSelect.locator('option').nth(1).getAttribute('value');
  expect(district).not.toBeNull();
  await districtSelect.selectOption(district!);
  await expect(page).toHaveURL(new RegExp(`district=${district}`));
  await page.getByRole('combobox', { name: 'Sort' }).selectOption('name');
  await expect(page).toHaveURL(/sort=name/);
  await page.locator('[data-selected] > button').first().click();
  await expect(page).toHaveURL(/project=[^&]+/);
  const selectedHref = page.url();

  await page.reload();
  await expect(page).toHaveURL(selectedHref);
  await expect(page.getByRole('tab', { name: /^CCR/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('combobox', { name: 'District' })).toHaveValue(district!);
  await expect(page.getByRole('combobox', { name: 'Sort' })).toHaveValue('name');
  await expect(page.locator('[data-selected="true"]')).toHaveCount(1);
});


test('Prices sends a Singapore project search to Singapore Explore', async ({ page }) => {
  await page.goto('/sg/singapore/explore/');
  const projectTitle = page.locator('[data-selected] > button strong[title]').first();
  const projectName = await projectTitle.textContent();
  await expect(projectTitle).toHaveAttribute('title', projectName!);
  await expect(projectTitle).toHaveCSS('white-space', 'nowrap');
  const price = page.locator('[data-selected] > button > span:last-child strong').first();
  await expect(price).toHaveCSS('white-space', 'nowrap');
  await noOverflow(page);
  expect(projectName?.trim()).toBeTruthy();
  await page.goto('/prices/');
  await page.getByRole('combobox', { name: 'Market', exact: true }).selectOption('singapore');
  await page.getByRole('searchbox', { name: 'Find a property' }).fill(projectName!.trim());
  await page.getByRole('button', { name: 'Explore prices', exact: true }).click();
  await expect(page).toHaveURL(/\/sg\/singapore\/explore\/\?q=/);
  await expect(page.getByRole('searchbox', { name: 'Search Singapore projects' })).toHaveValue(projectName!.trim());
  await expect(page.locator('[data-selected] > button strong').first()).toHaveText(projectName!.trim());
});
