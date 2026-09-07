import { expect, test } from '@playwright/test';

test('Passport restores the selected currency and converts the input when currency changes', async ({ page }) => {
  await page.goto('/passport/?budget=500000&currency=USD');
  await expect(page.getByLabel('Budget currency', { exact: true })).toHaveValue('USD');
  await expect(page.getByLabel('Budget', { exact: true })).toHaveValue('500,000');
  await page.getByLabel('Budget currency', { exact: true }).selectOption('AED');
  await expect(page.getByLabel('Budget', { exact: true })).toHaveValue('1,836,250');
  await page.getByRole('button', { name: 'Update comparison' }).click();
  await expect(page).toHaveURL(/budget=1836250&currency=AED$/);
  await page.reload();
  await expect(page.getByLabel('Budget currency', { exact: true })).toHaveValue('AED');
  await expect(page.getByLabel('Budget', { exact: true })).toHaveValue('1,836,250');
});

test('Passport restores a shared budget and keeps all city result rows aligned', async ({ page }) => {
  await page.goto('/passport/?budget=750000000');
  await expect(page.getByLabel('Budget', { exact: true })).toHaveValue('750,000,000');
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
  const input = page.getByLabel('예산', { exact: true });
  await input.fill('600000000');
  await page.getByRole('button', { name: '비교 다시 계산' }).click();
  await expect(page).toHaveURL(/\/ko\/passport\/?\?budget=600000000$/);
  await expect(input).toHaveValue('600,000,000');
});

test('Passport follows restored browser budgets after a comparison update', async ({ page }) => {
  await page.goto('/passport/?budget=500000000');
  const input = page.getByLabel('Budget', { exact: true });
  await expect(input).toHaveValue('500,000,000');
  await input.fill('600000000');
  await page.getByRole('button', { name: 'Update comparison', exact: true }).click();
  await expect(input).toHaveValue('600,000,000');
  await page.evaluate(() => {
    history.replaceState(history.state, '', '/passport/?budget=750000000');
    window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
  });
  await expect(input).toHaveValue('750,000,000');
});

test('Passport handles clipboard denial without claiming that the result was copied', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } });
  });
  await page.goto('/passport/?budget=500000&currency=USD');
  await expect(page.getByLabel('Budget', { exact: true })).toHaveValue('500,000');
  await page.getByRole('button', { name: 'Copy result link', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('The link could not be copied. Copy the address from your browser to share this result.');
  await expect(page.getByRole('button', { name: 'Link copied', exact: true })).toHaveCount(0);
});
