import { expect, test } from '@playwright/test';

test('Passport opens published candidate costs and restores the original currency and budget', async ({ page }) => {
  const passport = '/ko/passport/?budget=10000000&currency=USD';
  await page.goto(passport);
  const singapore = page.locator('[data-passport-market="sg-singapore"]');
  const candidates = singapore.locator('[data-passport-candidate="project"]');
  await expect(candidates).toHaveCount(3);
  const heading = candidates.first().getByRole('heading');
  await expect(heading.getByRole('link')).toHaveCSS('white-space', 'nowrap');
  await expect(heading.getByRole('link')).toHaveAttribute('title', /.+/);
  const price = candidates.first().locator('div > strong').first();
  await expect(price).toHaveCSS('white-space', 'nowrap');
  expect(await price.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  await page.getByLabel('예산', { exact: true }).fill('9000000');
  await page.getByRole('button', { name: '다시 비교하기', exact: true }).click();
  const calculate = candidates.first().getByRole('link', { name: '비용 계산', exact: true });
  await calculate.click();
  await expect(page.getByLabel('매입 가격 (SGD)', { exact: true })).toHaveValue('2,162,500');
  await expect(page.getByRole('link', { name: '거래 내역으로 돌아가기', exact: true })).toHaveAttribute('href', /\/sg\/singapore\/explore\/ocr\//);
  await page.getByRole('link', { name: '내 예산 비교로 돌아가기', exact: true }).click();
  await expect(page.getByLabel('예산', { exact: true })).toHaveValue('9,000,000');
  await expect(page.getByLabel('예산 통화', { exact: true })).toHaveValue('USD');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

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
  await expect(page.locator('[data-passport-market]')).toHaveCount(4);
  await expect(page.locator('[data-passport-row="local-budget"]')).toHaveCount(4);
  await expect(page.locator('[data-passport-row="area"]')).toHaveCount(4);

  const cards = await page.locator('[data-passport-market]').evaluateAll((nodes) => nodes.map((node) => {
    const box = node.getBoundingClientRect();
    return { top: box.top, height: box.height };
  }));
  if (page.viewportSize()!.width > 860) {
    for (const row of [cards.slice(0, 2), cards.slice(2, 4)]) {
      expect(Math.abs(row[0]!.top - row[1]!.top)).toBeLessThanOrEqual(2);
      expect(Math.abs(row[0]!.height - row[1]!.height)).toBeLessThanOrEqual(2);
    }
    expect(cards[2]!.top).toBeGreaterThan(cards[0]!.top);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('Passport updates the complete result URL from one budget input', async ({ page }) => {
  await page.goto('/ko/passport/');
  const input = page.getByLabel('예산', { exact: true });
  await input.fill('600000000');
  await page.getByRole('button', { name: '다시 비교하기', exact: true }).click();
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


test('Passport validates drafts without replacing them with another budget', async ({ page }) => {
  await page.goto('/passport/?budget=500000&currency=USD');
  const budget = page.getByLabel('Budget', { exact: true });
  const currency = page.getByLabel('Budget currency', { exact: true });
  await expect(budget).toHaveValue('500,000');
  for (const invalid of ['', '1', '999999999999', '500000.001']) {
    await budget.fill(invalid);
    await page.getByRole('button', { name: 'Update comparison', exact: true }).click();
    await expect(budget).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('status')).toContainText('Enter a budget from USD');
    await expect(page).toHaveURL(/budget=500000&currency=USD$/);
  }
  await budget.fill('');
  await currency.selectOption('AED');
  await expect(budget).toHaveValue('');
  await expect(page.getByRole('status')).toContainText('Enter a budget from AED');
  await budget.fill('1');
  await currency.selectOption('USD');
  await expect(budget).toHaveValue('0.27');
  await expect(budget).toHaveAttribute('aria-invalid', 'true');
  await budget.fill('600000.25');
  await page.getByRole('button', { name: 'Update comparison', exact: true }).click();
  await expect(page).toHaveURL(/budget=600000.25&currency=USD$/);
  await expect(budget).toHaveAttribute('aria-invalid', 'false');
});

for (const locale of [
  { route: '', label: 'Budget', currency: 'Budget currency', reset: 'Reset budget', amount: '500,000', code: 'USD' },
  { route: '/ko', label: '예산', currency: '예산 통화', reset: '기본 예산으로 초기화', amount: '500,000,000', code: 'KRW' },
  { route: '/zh-cn', label: '预算', currency: '预算币种', reset: '恢复默认预算', amount: '500,000', code: 'USD' },
]) {
  test(`Passport resets saved and unsaved budgets while retaining locale and Dubai stage: ${locale.code}-${locale.route}`, async ({ page }) => {
    await page.goto(`${locale.route}/passport/?budget=1000000&currency=USD&dubaiStage=off-plan`);
    const budget = page.getByLabel(locale.label, { exact: true });
    await expect(budget).toHaveValue('1,000,000');
    await budget.fill('');
    await page.getByRole('button', { name: locale.reset, exact: true }).click();
    await expect(budget).toHaveValue(locale.amount);
    await expect(page.getByLabel(locale.currency, { exact: true })).toHaveValue(locale.code);
    const url = new URL(page.url());
    expect(url.pathname.replace(/\/$/, '')).toBe(`${locale.route}/passport`);
    expect(url.searchParams.get('dubaiStage')).toBe('off-plan');
    await expect(budget).toHaveAttribute('aria-invalid', 'false');
    // Reset must also clear an unsaved edit when the applied budget is already the default.
    await budget.fill('1');
    await page.getByRole('button', { name: locale.reset, exact: true }).click();
    await expect(budget).toHaveValue(locale.amount);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}
