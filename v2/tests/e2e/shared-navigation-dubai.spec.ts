import { expect, test } from '@playwright/test';

test('uses one navigation order and stable language slots across markets', async ({ page }) => {
  for (const path of ['/prices/', '/news/', '/guides/', '/kr/seoul/explore/', '/sg/singapore/explore/', '/ae/dubai/explore/']) {
    await page.goto(path);
    const header = page.locator('header.site-header');
    await expect(header.locator('.site-header__product-link')).toHaveText(['Markets', 'Prices', 'News', 'Guides']);
    await expect(header.locator('.site-header__language')).toHaveText(['EN', 'KO', '中文']);
    await expect(page.locator('footer').getByRole('link', { name: 'Singapore', exact: true })).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
});

test('opens Singapore from Prices and removes the Seoul-only sample', async ({ page }) => {
  await page.goto('/prices/');
  await expect(page.getByText('Seoul jeonse sample', { exact: false })).toHaveCount(0);
  await page.getByLabel('Market', { exact: true }).selectOption('singapore');
  await page.getByRole('searchbox', { name: 'Find a property' }).fill('Civic');
  await page.getByRole('button', { name: 'Explore prices' }).click();
  await expect(page).toHaveURL(/\/sg\/singapore\/explore\/?\?q=Civic/);
  await expect(page.getByRole('heading', { name: 'Explore', exact: true })).toBeVisible();
});

test('opens area research, uses AED assumptions and connects Dubai news', async ({ page }) => {
  await page.goto('/ae/dubai/explore/');
  await page.getByRole('button', { name: /Dubai Marina/ }).click();
  await expect(page.getByRole('link', { name: 'Official neighbourhood guide' })).toHaveAttribute('href', /dubai-marina/);
  await expect(page).toHaveURL(/area=dubai-marina/);
  await page.getByRole('link', { name: 'Buying research guide', exact: true }).click();
  await expect(page.locator('[data-property-scenario="AED"]')).toBeVisible();
  await page.getByLabel('Purchase price (AED)', { exact: true }).fill('1000000');
  await page.getByLabel('Acquisition costs, including taxes and fees (AED)').fill('50000');
  await page.getByLabel('Expected monthly rent (AED)').fill('7000');
  await page.getByLabel('Annual operating costs, including taxes (AED)').fill('12000');
  await page.getByLabel('Expected vacant months per year').fill('1');
  await expect(page.getByText('6.19%', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Dubai news', exact: true }).click();
  await expect(page).toHaveURL(/market=dubai/);
  await expect(page.getByRole('navigation', { name: 'News markets' }).getByRole('link', { name: 'Dubai' })).toHaveAttribute('aria-current', 'page');
});
