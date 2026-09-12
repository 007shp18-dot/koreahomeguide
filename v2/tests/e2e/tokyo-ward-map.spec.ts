import { expect, test } from '@playwright/test';

test('Tokyo ward map changes the ward while retaining period and property filters', async ({ page }) => {
  await page.goto('/jp/tokyo/explore/?city=13103&year=2025&quarter=4&minArea=50');
  const map = page.locator('[data-tokyo-google-map]');
  const directory = page.locator('[data-market-shell-region="discovery"]');
  await expect(map).toHaveCount(1);
  await expect(map).toBeVisible();
  await expect(map.getByRole('heading', { name: 'Explore Tokyo by area' })).toBeVisible();
  await expect(map.getByRole('button', { name: 'Open ward and neighbourhood price map' })).toHaveCount(0);
  const mobile = page.viewportSize()!.width <= 760;
  if (mobile) {
    await directory.getByRole('button', { name: 'View neighbourhoods & prices', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Neighbourhoods & prices', exact: true })).toBeVisible();
  }
  await directory.getByText('Change ward · 23 wards', { exact: true }).click();
  await expect(directory.locator('a[data-ward]')).toHaveCount(23);
  const shibuya = directory.locator('a[data-ward="13113"]');
  await shibuya.focus();
  await expect(shibuya).toBeFocused();
  await shibuya.press('Enter');
  await expect(page).toHaveURL(/city=13113&year=2025&quarter=4&type=Pre-owned\+Condominiums%2C\+etc\.&minArea=50/);
  await expect(directory.locator('a[data-ward="13113"]')).toHaveAttribute('aria-current', 'location');
  await expect(page.locator('select[name="city"]')).toHaveValue('13113');
  await expect(page.locator('input[name="minArea"]')).toHaveValue('50');
  await expect(directory.getByRole('heading', { name: 'Neighbourhoods in Shibuya' })).toBeVisible();
  if (mobile) {
    await page.getByRole('button', { name: 'Close results', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Neighbourhoods & prices', exact: true })).not.toBeVisible();
    await expect(directory.getByRole('button', { name: 'View neighbourhoods & prices', exact: true })).toBeVisible();
  }
  // Keyboard navigation can still be smoothly scrolling the page. Measure both
  // regions in one frame so viewport-relative coordinates remain comparable.
  const geometry = await map.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const list = document.querySelector('[data-market-shell-region="discovery"]')?.getBoundingClientRect();
    return { x: bounds.x, width: bounds.width, bottom: bounds.bottom, listTop: list?.top ?? null, listRight: list?.right ?? null };
  });
  const viewport = page.viewportSize()!;
  expect(geometry.x).toBeGreaterThanOrEqual(0);
  expect(geometry.x + geometry.width).toBeLessThanOrEqual(viewport.width + 1);
  if (viewport.width <= 760) {
    expect(geometry.listTop).not.toBeNull();
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.listTop! + 1);
  } else {
    expect(geometry.listRight).not.toBeNull();
    expect(geometry.listRight!).toBeLessThanOrEqual(geometry.x + 1);
  }
  await test.info().attach('tokyo-ward-map', { body: await map.screenshot(), contentType: 'image/png' });
});
