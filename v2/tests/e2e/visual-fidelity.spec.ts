import { expect, test } from '@playwright/test';

test('approved photographic layout includes the missing chart and illustration', async ({ page }, testInfo) => {
  await page.goto('/ko/', { waitUntil: 'domcontentloaded' });
  const hero = page.locator('[data-visual-hero="home"]');
  await expect(hero).toBeVisible();
  await expect(hero.locator('img').first()).toBeVisible();
  await expect(page.locator('[data-home-search] form')).toBeVisible();
  await expect(page.locator('[data-city-destination]')).toHaveCount(4);
  await expect(page.locator('[data-market-pulse] svg[role="img"]').first()).toBeVisible();
  await expect(page.locator('[data-illustrated-cta] img')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await testInfo.attach('photographic-home', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
});
