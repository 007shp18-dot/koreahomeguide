import { expect, test } from '@playwright/test';

test('Tokyo ward map changes the ward while retaining period and property filters', async ({ page }) => {
  await page.goto('/jp/tokyo/explore/?city=13103&year=2025&quarter=4&minArea=50');
  const map = page.locator('[data-tokyo-ward-map]');
  await expect(map).toBeVisible();
  await expect(map.locator('a[data-ward]')).toHaveCount(23);
  const shibuya = map.locator('a[data-ward="13113"]');
  await shibuya.focus();
  await expect(shibuya).toBeFocused();
  await shibuya.press('Enter');
  await expect(page).toHaveURL(/city=13113&year=2025&quarter=4&minArea=50/);
  await expect(map.locator('a[data-ward="13113"]')).toHaveAttribute('aria-current', 'location');
  await expect(page.locator('select[name="city"]')).toHaveValue('13113');
  await expect(page.locator('input[name="minArea"]')).toHaveValue('50');
  const geometry = await map.boundingBox();
  const viewport = page.viewportSize()!;
  expect(geometry).not.toBeNull();
  expect(geometry!.x).toBeGreaterThanOrEqual(0);
  expect(geometry!.x + geometry!.width).toBeLessThanOrEqual(viewport.width + 1);
  if (viewport.width <= 760) {
    const list = await page.locator('[data-market-shell-region="discovery"]').boundingBox();
    expect(geometry!.y + geometry!.height).toBeLessThanOrEqual(list!.y + 1);
  }
  await test.info().attach('tokyo-ward-map', { body: await map.screenshot(), contentType: 'image/png' });
});
