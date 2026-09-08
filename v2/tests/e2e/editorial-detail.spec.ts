import { expect, test } from '@playwright/test';

test('Korean news filters stay on separate rows at phone widths', async ({ page }, testInfo) => {
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/ko/news/?market=seoul');
    const types = page.getByRole('navigation', { name: '뉴스와 인사이트 유형', exact: true });
    const cities = page.getByRole('navigation', { name: '기사 도시', exact: true });
    await expect(types).toBeVisible();
    await expect(cities).toBeVisible();
    const top = await types.boundingBox();
    const lower = await cities.boundingBox();
    expect(lower!.y).toBeGreaterThanOrEqual(top!.y + top!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390) await testInfo.attach('korean-news-phone', { body: await page.screenshot(), contentType: 'image/png' });
  }
});

test('Korean guide directory separates practical reference from budget analysis', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/ko/guides/');
  const main = page.locator('main[data-guide-directory="practical"]');
  await expect(main.getByRole('heading', { name: '가이드', exact: true })).toBeVisible();
  await expect(main.getByRole('link', { name: '가이드 보기', exact: true })).toHaveCount(0);
  await expect(main.locator('a[href*="buying-budget-guide"]')).toHaveCount(0);
  await main.getByRole('navigation', { name: '가이드 도시 선택' }).getByRole('link', { name: '싱가포르', exact: true }).click();
  await expect(main.getByRole('heading', { name: '싱가포르 콘도 가격과 매입 비용 읽는 법' })).toBeVisible();
  await expect(main.locator('a[href*="korea-rental-contract-checklist"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await testInfo.attach('korean-guides-phone', { body: await page.screenshot(), contentType: 'image/png' });
});

for (const city of ['seoul', 'singapore', 'dubai', 'tokyo']) {
  test(`city story has contextual body photos that load: ${city}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/ko/news/city-stories/${city}/`);
    const photos = page.locator('main figure[data-story-photo] img');
    await expect(photos).toHaveCount(2);
    for (const photo of await photos.all()) {
      await photo.scrollIntoViewIfNeeded();
      await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await testInfo.attach(`${city}-body-photo`, { body: await page.screenshot(), contentType: 'image/png' });
  });
}

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
