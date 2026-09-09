import { expect, test } from '@playwright/test';

test('mobile evidence has readable compact metrics and an inset guide link', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/kr/seoul/explore/?district=jongno-gu&transaction=jeonse&view=split');
  const card = page.locator('[data-district-summary]').first();
  const disclosure = page.locator('details').filter({ has: card });
  if (await disclosure.count()) await disclosure.locator('summary').first().click();
  await expect(card).toBeVisible();
  const layout = await card.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const metric = element.querySelector('dl > div')!;
    const explanation = element.querySelector('dd + dd')!;
    return { left: rect.left, right: rect.right, border: getComputedStyle(element).borderLeftWidth,
      minHeight: getComputedStyle(metric).minHeight, weight: getComputedStyle(explanation).fontWeight,
      overflow: Array.from(element.querySelectorAll('dd, a')).some(node => node.scrollWidth > node.clientWidth + 1) };
  });
  expect(layout.left).toBeGreaterThanOrEqual(0);
  expect(layout.right).toBeLessThanOrEqual(390);
  expect(layout.border).toBe('1px');
  expect(layout.minHeight).toBe('0px');
  expect(layout.weight).toBe('400');
  expect(layout.overflow).toBe(false);
  const guide = page.getByRole('link', { name: 'Apartment buying guide: budgets, costs and ownership checks' });
  await expect(guide).toBeVisible();
  const guideStyle = await guide.evaluate(element => ({ size: parseFloat(getComputedStyle(element).fontSize), padding: parseFloat(getComputedStyle(element.parentElement!).paddingLeft) }));
  expect(guideStyle.size).toBeGreaterThanOrEqual(14);
  expect(guideStyle.size).toBeLessThanOrEqual(16);
  expect(guideStyle.padding).toBeGreaterThanOrEqual(16);
  const preferences = page.getByRole('button', { name: 'Privacy choices', exact: true });
  if (await preferences.count()) expect(await preferences.evaluate(element => getComputedStyle(element).position)).toBe('static');
});
