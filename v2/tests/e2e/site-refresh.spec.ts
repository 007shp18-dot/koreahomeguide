import { expect, test } from '@playwright/test';

test('public refresh renders the real localized city search and four licensed city photographs', async ({ page }) => {
  await page.goto('/ko/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toHaveAttribute('data-interface-release', '2026-09');
  await expect(page.locator('[data-home-search] form[role="search"]')).toBeVisible();
  await expect(page.locator('[data-home-city-mosaic] img')).toHaveCount(4);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.locator('[data-buying-city]')).toHaveCount(4);
  await expect(page.locator('[data-home-region="analysis"] article')).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
