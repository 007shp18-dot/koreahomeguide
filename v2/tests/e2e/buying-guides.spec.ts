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
