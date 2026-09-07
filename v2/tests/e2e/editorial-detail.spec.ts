import { expect, test } from '@playwright/test';

for (const route of ['/guides/read-singapore-private-transactions/', '/news/singapore-private-market-quarterly-brief/']) {
  test(`article figures remain readable: ${route}`, async ({ page }, testInfo) => {
    await page.goto(route);
    const article = page.locator('main[data-editorial-content-id]:visible');
    await expect(article.locator('h1')).toBeVisible();
    const figure = article.locator('[data-infographic-template="district-comparison"]');
    await expect(figure).toBeVisible();
    await expect(figure.getByRole('img')).toBeVisible();
    if (route.startsWith('/guides/')) {
      await expect(page.locator('[data-building-media="curated-market-photo"]')).toBeVisible();
      await expect(figure.getByRole('img')).toContainText('SGD 1,200,000');
    } else {
      await expect(figure.getByRole('img')).toContainText('-1.2% q/q');
    }
    await figure.locator('summary').click();
    await expect(figure.locator('table')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await testInfo.attach('article-figure', { body: await figure.screenshot(), contentType: 'image/png' });
  });
}
