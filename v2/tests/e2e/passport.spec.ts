import { expect, test } from '@playwright/test';

test('Passport restores a shared budget and keeps all city result rows aligned', async ({ page }) => {
  await page.goto('/passport/?budget=750000000');
  await expect(page.getByLabel('Budget in Korean won')).toHaveValue('750,000,000');
  await expect(page.locator('[data-passport-market]')).toHaveCount(3);
  await expect(page.locator('[data-passport-row="local-budget"]')).toHaveCount(3);
  await expect(page.locator('[data-passport-row="area"]')).toHaveCount(3);

  const cards = await page.locator('[data-passport-market]').evaluateAll((nodes) => nodes.map((node) => {
    const box = node.getBoundingClientRect();
    return { top: box.top, height: box.height };
  }));
  if (page.viewportSize()!.width > 860) {
    expect(Math.max(...cards.map(({ top }) => top)) - Math.min(...cards.map(({ top }) => top))).toBeLessThanOrEqual(2);
    expect(Math.max(...cards.map(({ height }) => height)) - Math.min(...cards.map(({ height }) => height))).toBeLessThanOrEqual(2);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('Passport updates the complete result URL from one budget input', async ({ page }) => {
  await page.goto('/ko/passport/');
  const input = page.getByLabel('원화 예산');
  await input.fill('600000000');
  await page.getByRole('button', { name: '비교 다시 계산' }).click();
  await expect(page).toHaveURL(/\/ko\/passport\/?\?budget=600000000$/);
  await expect(input).toHaveValue('600,000,000');
});
