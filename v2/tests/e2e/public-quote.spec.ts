import { expect, test } from '@playwright/test';

test('public quote editing is keyboard-safe and performs zero network requests', async ({ page }) => {
  await page.goto('/kr/check/seoul');
  await page.waitForLoadState('networkidle');

  const initialUrl = page.url();
  const clientRequests: string[] = [];
  page.on('request', (request) => {
    if (['document', 'fetch', 'xhr'].includes(request.resourceType())) {
      clientRequests.push(request.url());
    }
  });
  const quote = page.getByLabel('Deposit (KRW)');
  await quote.focus();
  await expect(quote).toBeFocused();
  await quote.fill('');
  expect(clientRequests).toEqual([]);
  expect(page.url()).toBe(initialUrl);

  let expectedQuote = '';
  for (const digit of '350') {
    expectedQuote += digit;
    await quote.press(digit);
    await expect(quote).toHaveValue(expectedQuote);
    expect(clientRequests).toEqual([]);
    expect(page.url()).toBe(initialUrl);
  }

  await expect(page.locator('[data-rent-result]')).toHaveCount(0);
  await expect(quote).toHaveValue('350');
  expect(clientRequests).toEqual([]);
  expect(page.url()).toBe(initialUrl);
});

test('public quote controls retain 44px targets and natural mobile scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/kr/check/seoul');

  for (const control of [
    page.getByLabel('Area', { exact: true }),
    page.getByLabel('Deposit (KRW)'),
  ]) {
    const box = await control.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByLabel('Deposit (KRW)').press('Tab');
});
