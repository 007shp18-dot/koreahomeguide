import { expect, test } from '@playwright/test';

test('public quote editing is keyboard-safe and performs zero network requests', async ({ page }) => {
  await page.goto('/kr/check/seoul');

  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  const quote = page.getByLabel('Monthly rent');
  await quote.focus();
  await expect(quote).toBeFocused();
  await quote.fill('3500000');
  await expect(page.getByText('Within the typical range')).toBeVisible();
  await expect(quote).toHaveValue('3500000');
  expect(requests).toEqual([]);
});

test('public quote controls retain 44px targets and natural mobile scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/kr/check/seoul');

  for (const control of [page.getByLabel('Area'), page.getByLabel('Monthly rent')]) {
    const box = await control.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByLabel('Monthly rent').press('Tab');
});
