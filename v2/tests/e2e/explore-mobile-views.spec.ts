import { expect, test } from '@playwright/test';

test('Singapore and Dubai keep filters when switching mobile list and map views', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const market of ['sg/singapore', 'ae/dubai']) {
    await page.goto(`/${market}/explore/`);
    const views = page.getByRole('group', { name: 'Explore view', exact: true });
    const list = page.locator('[data-market-shell-region="discovery"]');
    const map = page.locator('[data-market-shell-region="spatial"]');
    await expect(views).toBeVisible();
    await expect(list).toBeVisible();
    await expect(map).toBeHidden();
    const search = page.locator('[data-market-explore-shell]').getByRole('searchbox', {
      name: market === 'sg/singapore' ? 'Search Singapore projects' : /^Find an area(?: or project)?$/,
      exact: true,
    });
    await search.fill('marina');
    await views.getByRole('button', { name: 'Map', exact: true }).click();
    await expect(map).toBeVisible();
    await expect(list).toBeHidden();
    await expect(search).toHaveValue('marina');
    await views.getByRole('button', { name: 'List', exact: true }).click();
    await expect(list).toBeVisible();
    await expect(map).toBeHidden();
    await expect(search).toHaveValue('marina');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});
