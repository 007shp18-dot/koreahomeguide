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
  const filters = page.getByRole('form', { name: 'Tokyo transaction filters' });
  await filters.getByRole('combobox', { name: 'Ward', exact: true }).selectOption('13113');
  await filters.getByRole('button', { name: 'Explore transactions' }).click();
  await expect(page).toHaveURL(url => url.searchParams.get('city') === '13113'
    && url.searchParams.get('year') === '2025' && url.searchParams.get('quarter') === '4'
    && url.searchParams.get('minArea') === '50');
  await expect(page.locator('select[name="city"]')).toHaveValue('13113');
  await expect(page.locator('input[name="minArea"]')).toHaveValue('50');
  if (mobile) {
    await directory.getByRole('button', { name: 'View neighbourhoods & prices', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Neighbourhoods & prices', exact: true })).toBeVisible();
  }
  await expect(directory.getByRole('heading', { name: 'Neighbourhoods in Shibuya' })).toBeVisible();
  await expect(directory.locator('a[data-ward]')).toHaveCount(0);
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
    // The mobile discovery action stays at the viewport bottom while the map
    // scrolls. Its position is intentionally independent of the map's bottom.
    const action = await directory.getByRole('button', { name: 'View neighbourhoods & prices', exact: true }).boundingBox();
    expect(action).not.toBeNull();
    expect(action!.height).toBeGreaterThanOrEqual(44);
    expect(action!.x).toBeGreaterThanOrEqual(0);
    expect(action!.x + action!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(action!.y).toBeGreaterThanOrEqual(0);
    expect(action!.y + action!.height).toBeLessThanOrEqual(viewport.height + 1);
  } else {
    expect(geometry.listRight).not.toBeNull();
    expect(geometry.listRight!).toBeLessThanOrEqual(geometry.x + 1);
  }
  await test.info().attach('tokyo-ward-map', { body: await map.screenshot(), contentType: 'image/png' });
});
