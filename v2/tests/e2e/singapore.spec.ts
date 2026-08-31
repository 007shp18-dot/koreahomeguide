import { expect, test, type Locator, type Page } from '@playwright/test';

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
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^noindex,\s*follow$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  await noOverflow(page);
  assertClean();
});

test('ready Singapore evidence flows entry to project when promotion gates open', async ({ page }) => {
  const assertClean = observeRuntimeFailures(page);
  await page.goto('/sg/');
  test.skip(await page.locator('[data-singapore-entry="ready"]').count() === 0,
    'Ready browser flow remains blocked until dataset-specific display rights are confirmed.');

  await page.getByRole('link', { name: 'Open Singapore Explore' }).click();
  await expect(page.locator('[data-singapore-evidence="ready"]')).toBeVisible();
  for (const code of ['CCR', 'RCR', 'OCR']) await expect(page.getByText(code, { exact: true }).first()).toBeVisible();
  await touchTarget(page.getByRole('link', { name: 'Open CCR evidence' }));
  await page.getByRole('link', { name: 'Open CCR evidence' }).click();
  await expect(page.locator('[data-singapore-segment="ready"]')).toBeVisible();
  const projectLink = page.getByRole('link', { name: 'Open project evidence' }).first();
  await touchTarget(projectLink);
  await projectLink.click();
  await expect(page.locator('[data-singapore-project="ready"]')).toBeVisible();
  for (const label of ['SGD', 'PSF', 'PSM', 'New sale', 'Subsale', 'Resale', 'URA']) {
    await expect(page.locator('body')).toContainText(label);
  }
  await expect(page.getByRole('link', { name: 'Explore' }).first()).toBeVisible();
  await noOverflow(page);

  const raw = await page.request.get(page.url());
  expect(raw.status()).toBe(200);
  const html = await raw.text();
  expect(html).toContain('data-singapore-project="ready"');
  expect(html).not.toMatch(/SIGNEDPRICE_URA_ACCESS_KEY|sentinel-ura-key|insertNewToken|invokeUraDS|AccessKey/);
  assertClean();
});

test('Singapore remains absent from the sitemap and browser never calls URA', async ({ page }) => {
  const assertClean = observeRuntimeFailures(page);
  await page.goto('/sg/singapore/explore/');
  const sitemap = await page.request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toContain('/sg/');
  assertClean();
});
