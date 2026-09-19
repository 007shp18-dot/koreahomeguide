import { expect, test } from '@playwright/test';

test('the home house rotates by keyboard and explains cost categories without changing the calculator link', async ({ page }) => {
  await page.goto('/ko/');
  const scene = page.locator('[data-budget-house="interactive"]');
  await expect(scene).toHaveAttribute('data-view', 'right');
  const front = scene.getByRole('button', { name: '정면', exact: true });
  await front.focus();
  await page.keyboard.press('Enter');
  await expect(scene).toHaveAttribute('data-view', 'front');
  await expect(front).toHaveAttribute('aria-pressed', 'true');
  await scene.getByRole('button', { name: '왼쪽', exact: true }).click();
  await expect(scene).toHaveAttribute('data-view', 'left');
  await scene.getByRole('combobox', { name: '비용 항목', exact: true }).selectOption('fees');
  await expect(scene).toHaveAttribute('data-cost', 'fees');
  await expect(scene).toContainText('집값과 별도로 적용되는 세금과 거래 수수료를 확인하세요.');
  await scene.getByRole('combobox', { name: '비용 항목', exact: true }).selectOption('ongoing');
  await expect(scene).toContainText('유지·보수, 보험, 대출 등 내 조건에 해당하는 반복 비용을 살펴보세요.');
  await expect(page.getByRole('link', { name: '내 예산 계산하기', exact: true })).toHaveAttribute('href', /\/ko\/tools\/property-scenario\/?$/);
  expect(await scene.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const geometry = scene.locator('[aria-hidden="true"] > div');
  await expect(geometry).toHaveCSS('transition-duration', '0s');
});
