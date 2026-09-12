import { expect, test } from '@playwright/test';

test('Tokyo TOP 50 exposes exact anonymous records within the viewport', async ({ page }) => {
  const response = await page.goto('/rankings/?city=tokyo');
  expect(response?.status()).toBe(200);
  const ranking = page.getByRole('region', { name: 'Tokyo resale condos · highest reported sale prices', exact: true });
  await expect(ranking.locator('tbody tr')).toHaveCount(50);
  await expect(ranking.getByText('JPY 1,200,000,000', { exact: true })).toBeVisible();
  await expect(ranking.getByText('Minamicho', { exact: true })).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  await ranking.getByText('Sources, coverage and ranking rules', { exact: true }).click();
  await expect(ranking.getByRole('link', { name: 'Source terms and limitations' })).toBeVisible();
  await page.getByRole('combobox', { name: 'City', exact: true }).selectOption('singapore');
  await expect(page).toHaveURL(/city=singapore/);
  await page.getByRole('combobox', { name: 'Ranking', exact: true }).selectOption('rent');
  await page.getByRole('combobox', { name: 'Order', exact: true }).selectOption('lowest');
  await page.getByRole('button', { name: 'Show rankings' }).click();
  await expect(page).toHaveURL(/kind=rent/);
  await expect(page.getByRole('combobox', { name: 'Bedrooms', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'City', exact: true }).selectOption('tokyo');
  await expect(page).toHaveURL(/city=tokyo&kind=sale&order=highest/);
  await expect(page.getByRole('combobox', { name: 'Bedrooms', exact: true })).toHaveCount(0);
});
