import { expect, test } from '@playwright/test';

test('Tokyo TOP 50 exposes exact anonymous records within the viewport', async ({ page }) => {
  const response = await page.goto('/rankings/?city=tokyo');
  expect(response?.status()).toBe(200);
  const ranking = page.getByRole('region', { name: '50 highest reported resale-condo prices' });
  await expect(ranking.getByRole('listitem')).toHaveCount(50);
  await expect(ranking.getByText('JPY 1,200,000,000', { exact: true })).toBeVisible();
  await expect(ranking.getByRole('heading', { name: 'Minamicho · Shinjuku Ward' })).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  await ranking.getByRole('link', { name: 'Source and ordering', exact: true }).click();
  await expect(page).toHaveURL(/#tokyo-ranking-source$/);
});
