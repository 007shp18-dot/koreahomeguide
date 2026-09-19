import { expect, test } from '@playwright/test';

for (const slug of ['seoul-apartment-buying-budget-guide', 'singapore-condo-buying-budget-guide', 'dubai-ready-apartment-buying-budget-guide']) {
  test(`${slug} changes budgets without losing evidence or overflowing`, async ({ page }) => {
    await page.goto(`/guides/${slug}/`);
    const choices = page.getByRole('group', { name: 'Purchase-price ceiling' }).getByRole('button');
    await expect(choices).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await choices.nth(i).click();
      await expect(choices.nth(i)).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByText('Subtotal of displayed items')).toBeVisible();
      const expected = slug.startsWith('seoul') ? { market: 'kr-seoul', currency: 'KRW', prices: [600000000, 1000000000, 1500000000] } : slug.startsWith('singapore') ? { market: 'sg-singapore', currency: 'SGD', prices: [1000000, 1500000, 2000000] } : { market: 'ae-dubai', currency: 'AED', prices: [750000, 1000000, 1500000] };
      const calculator = page.getByRole('link', { name: 'Continue with this price in the cost calculator' });
      const url = new URL((await calculator.getAttribute('href'))!, page.url());
      expect(Object.fromEntries(url.searchParams)).toMatchObject({ market: expected.market, currency: expected.currency, price: String(expected.prices[i]) });
      const evidence = page.getByText('View transaction evidence', { exact: true }).first();
      await evidence.click();
      await expect(page.locator('table').first()).toBeVisible();
      await evidence.click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
    if (slug.startsWith('singapore')) {
      await choices.nth(1).click();
      await page.getByLabel('Buyer profile').selectOption('2');
      await expect(page.getByText('S$1,544,600', { exact: true })).toBeVisible();
      await page.getByLabel('Buyer profile').selectOption('0');
      await expect(page.getByText('S$2,444,600', { exact: true })).toBeVisible();
    }
    const check = page.getByRole('checkbox').first();
    await check.check();
    await expect(check).toBeChecked();
  });
}


test('Korean guide hands the latest selected price to its city calculator', async ({ page }) => {
  await page.goto('/ko/guides/singapore-condo-buying-budget-guide/');
  const choices = page.getByRole('group', { name: '매매가격 예산 상한' }).getByRole('button');
  await choices.nth(0).click();
  await choices.nth(2).click();
  await page.getByRole('link', { name: '선택한 집값으로 비용 계산 계속하기' }).click();
  await expect(page).toHaveURL(/\/ko\/tools\/property-scenario\/?\?market=sg-singapore&currency=SGD&price=2000000/);
});
