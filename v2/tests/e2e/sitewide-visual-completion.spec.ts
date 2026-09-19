import { expect, test } from '@playwright/test';

// Capture the actual responsive routes for visual comparison with the approved mockups.
test('completed home, article and discovery layouts render their images without overflow', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  for (const [name, path] of [
    ['home-ko', '/ko/'],
    ['home-en', '/'],
    ['article', '/guides/seoul-apartment-buying-budget-guide/'],
    ['explore-singapore', '/sg/singapore/explore/'],
    ['guides', '/guides/'],
    ['tools-zh', '/zh-cn/tools/'],
  ]) {
    await page.goto(path!, { waitUntil: 'domcontentloaded' });
    const main = page.locator('main:not([aria-busy="true"])').filter({ visible: true });
    await expect(main).toHaveCount(1);
    await expect(main).toBeVisible();
    await expect(page.getByRole('heading', { name: 'This route is not available.', exact: true })).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    // Trigger lazy media before checking real image decode, including offscreen article cards.
    for (const img of await main.locator('img').filter({ visible: true }).all()) {
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0)).toBe(true);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), name).toBe(true);
    await testInfo.attach(`${name}-${testInfo.project.name}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  }
});
