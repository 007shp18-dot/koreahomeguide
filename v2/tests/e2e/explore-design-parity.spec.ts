import { expect, test } from '@playwright/test';

test('four Explore markets share heading geometry and contained controls', async ({ page }, testInfo) => {
  const measurements: { size: string; weight: string; left: number }[] = [];
  for (const city of ['kr/seoul', 'sg/singapore', 'ae/dubai', 'jp/tokyo']) {
    await page.goto(`/${city}/explore/`);
    const heading = page.locator('.explore-page-heading h1');
    await expect(heading).toHaveText('Explore');
    measurements.push(await heading.evaluate(node => ({ size: getComputedStyle(node).fontSize, weight: getComputedStyle(node).fontWeight, left: node.getBoundingClientRect().left })));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await testInfo.attach(city.replace('/', '-') + '-explore', { body: await page.screenshot(), contentType: 'image/png' });
  }
  expect(new Set(measurements.map(item => item.size)).size).toBe(1);
  expect(new Set(measurements.map(item => item.weight)).size).toBe(1);
  expect(Math.max(...measurements.map(item => item.left)) - Math.min(...measurements.map(item => item.left))).toBeLessThanOrEqual(4);
});

test('Tokyo filters remain usable and preserve the submitted ward and period', async ({ page }) => {
  await page.goto('/jp/tokyo/explore/');
  const filters = page.getByRole('form', { name: 'Tokyo transaction filters' });
  for (const control of await filters.locator('input, select, button').all()) {
    const box = await control.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await filters.getByLabel('Neighbourhood, layout or built year').fill('Azabu');
  await filters.getByRole('button', { name: 'Explore transactions' }).click();
  await expect(page).toHaveURL(/q=Azabu.*city=13103.*year=2025.*quarter=4/);
  await expect(filters.getByLabel('Neighbourhood, layout or built year')).toHaveValue('Azabu');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
