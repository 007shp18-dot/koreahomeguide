import { expect, test } from '@playwright/test';

for (const width of [390, 760]) {
  test.describe(`Dubai Explore at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });
    test('puts the map before compact results and preserves area selection', async ({ page }) => {
      await page.goto('/ae/dubai/explore/');
      const spatial = page.locator('[data-market-shell-region="spatial"]');
      const discovery = page.locator('[data-market-shell-region="discovery"]');
      await expect(spatial).toBeVisible();
      const mapBox = await spatial.boundingBox();
      const resultsBox = await discovery.boundingBox();
      expect(mapBox).not.toBeNull();
      expect(resultsBox).not.toBeNull();
      expect(mapBox!.y + mapBox!.height).toBeLessThanOrEqual(resultsBox!.y + 1);
      // The isolated release fixture intentionally withholds Dubai prices.
      // Verify its curated fallback as well as the published evidence path.
      if (await discovery.getByRole('heading', { name: 'Area guide', exact: true }).count()) {
        const firstArea = discovery.getByRole('button').first();
        await firstArea.click();
        await expect(firstArea).toHaveAttribute('aria-pressed', 'true');
        await expect(discovery.getByRole('link', { name: 'Official neighbourhood guide' })).toBeVisible();
        await expect(page).toHaveURL(/[?&]area=/);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
        return;
      }
      const first = discovery.locator('article').first();
      await expect(first.locator('[data-area-evidence]')).not.toHaveAttribute('open');
      await first.getByRole('button').first().click();
      await expect(first.getByRole('button').first()).toHaveAttribute('aria-pressed', 'true');
      await expect(first.locator('[data-area-evidence]')).toHaveAttribute('open');
      await expect(page).toHaveURL(/[?&]area=/);
      await expect(spatial.getByRole('button', { name: 'Close area preview' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    });
  });
}
