import { expect, test } from '@playwright/test';

test('clearing a manual fee total stays empty until the user restores the calculated subtotal', async ({ page }) => {
  await page.goto('/tools/property-scenario/?market=sg-singapore&currency=SGD&price=1000000');
  const costs = page.getByLabel('Acquisition costs, including taxes and fees (SGD)');
  await costs.fill('50000');
  await expect(page.locator('[data-tool-result]')).toContainText('1,050,000');
  await costs.fill('');
  await expect(costs).toHaveValue('');
  await expect(page.locator('[data-tool-result]')).not.toContainText('1,624,600');
  await page.getByRole('button', { name: 'Restore calculated subtotal', exact: true }).click();
  await expect(costs).toHaveValue('624,600');
  await expect(page.locator('[data-tool-result]')).toContainText('1,624,600');
});

test('purchase budget works before rental assumptions, explains invalid input and resets', async ({ page }) => {
  await page.goto('/ko/tools/property-scenario/?market=jp-tokyo&currency=JPY');
  const price = page.getByLabel('매입 가격 (JPY)', { exact: true });
  await price.fill('30000000');
  await page.getByLabel('취득세·중개·법무 등 취득 비용 합계 (JPY)').fill('3000000');
  const results = page.locator('[data-tool-result]');
  await expect(results).toContainText('33,000,000');
  await expect(results).not.toContainText('총매입 비용 대비 임대수익률');
  await page.getByLabel('예상 월 임대료 (JPY)', { exact: true }).fill('150000');
  await page.getByLabel('연간 관리·보수·세금 등 운영 비용 (JPY)').fill('100000');
  const vacancy = page.getByLabel('연간 예상 공실 개월', { exact: true });
  await vacancy.fill('13');
  await expect(vacancy).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('alert').filter({ hasText: '공실 개월은 0~12' })).toBeVisible();
  await expect(results).toContainText('33,000,000');
  await vacancy.fill('1');
  await expect(results).toContainText('4.70%');
  await page.getByRole('button', { name: '입력 초기화', exact: true }).click();
  await expect(price).toHaveValue('');
  await expect(results).not.toContainText('33,000,000');
  await expect(page.getByRole('combobox', { name: '도시 · 통화' })).toHaveValue('jp-tokyo');
  await expect(page.getByRole('link', { name: '매수·임대 가이드', exact: true })).toHaveAttribute('href', /\/ko\/guides\/?\?market=tokyo$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

