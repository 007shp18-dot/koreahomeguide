import { expect, test } from '@playwright/test';

// Capture the actual responsive routes for visual comparison with the approved mockups.
test('completed home, article and discovery layouts render their images without overflow', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  for (const [name, path] of [
    ['home-ko', '/ko/'],
    ['home-en', '/'],
    ['article', '/news/seoul-apartment-buying-budget-guide/'],
    ['explore-singapore', '/sg/singapore/explore/'],
    ['guides', '/guides/'],
    ['tools-zh', '/zh-cn/tools/'],
  ]) {
    await page.goto(path!, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    // Trigger lazy media before checking real image decode, including offscreen article cards.
    for (const img of await page.locator('main img').filter({visible:true}).all()) {
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0)).toBe(true);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), name).toBe(true);
    await testInfo.attach(`${name}-${testInfo.project.name}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  }
});
