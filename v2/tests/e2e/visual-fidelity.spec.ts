import { expect, test, type Page, type TestInfo } from '@playwright/test';

async function ready(page: Page) {
  await expect(page.locator('body')).toHaveAttribute('data-interface-release', '2026-09');
  await expect(page.getByRole('contentinfo')).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready);
}

async function photograph(page: Page, info: TestInfo, name: string) {
  // Trigger lazy image loads before taking the complete page; never approve empty image boxes.
  const images = page.locator('main img');
  for (const img of await images.all()) {
    if (!await img.isVisible()) continue;
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0)).toBe(true);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await info.attach(name, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
}

test('approved photographic layout includes the missing chart and illustration', async ({ page }, info) => {
  await page.goto('/ko/', { waitUntil: 'domcontentloaded' });
  await ready(page);
  const hero = page.locator('[data-visual-hero="home"]');
  await expect(hero).toBeVisible();
  await expect(hero.locator('img').first()).toBeVisible();
  await expect(page.locator('[data-home-search] form')).toBeVisible();
  await expect(page.locator('[data-city-destination]')).toHaveCount(4);
  await expect(page.locator('[data-market-pulse] svg[role="img"]').first()).toBeVisible();
  await expect(page.locator('[data-illustrated-cta] img')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await photograph(page, info, 'home-ko');
});

for (const width of [320, 820, 1440]) {
  test(`home photographs and charts fit at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await ready(page);
    const hero = await page.locator('[data-visual-hero="home"]').boundingBox();
    expect(hero?.width).toBeGreaterThan(width * .95);
    const buttons = page.locator('[data-market-pulse] button');
    const sizes = await buttons.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect()));
    expect(sizes.every(box => box.width >= 44 && box.height >= 44)).toBe(true);
    await photograph(page, info, `home-en-${width}`);
  });
}

test('report graph switches cities, retains source periods and exposes exact values', async ({ page }) => {
  await page.goto('/ko/');
  await ready(page);
  const pulse = page.locator('[data-market-pulse]');
  await expect(pulse.locator('aside strong')).toContainText('5,321');
  await pulse.getByRole('button', { name: '싱가포르', exact: true }).click();
  await expect(pulse).toHaveAttribute('data-market-pulse', 'singapore');
  await expect(pulse.locator('aside strong')).toContainText('630');
  await pulse.getByRole('button', { name: /^2월:/ }).click();
  await expect(pulse.locator('aside strong')).toContainText('594');
  await pulse.getByRole('button', { name: '두바이', exact: true }).click();
  await expect(pulse.locator('aside strong')).toContainText('7,142');
  await expect(pulse.getByRole('link', { name: /근거 보고서/ })).toHaveAttribute('href', '/ko/news/dubai-monthly-2026-09/');
  await pulse.locator('summary').click();
  await expect(pulse.locator('tbody tr')).toHaveCount(6);
  await expect(pulse.locator('caption')).toContainText('가격지수가 아닙니다');
});

for (const [city, path] of [
  ['seoul', '/ko/kr/seoul/'], ['singapore', '/ko/sg/singapore/'],
  ['dubai', '/ko/ae/dubai/'], ['tokyo', '/ko/jp/tokyo/'],
] as const) {
  test(`${city} overview keeps photography, a sourced chart and useful destinations`, async ({ page }, info) => {
    await page.goto(path);
    await ready(page);
    await expect(page.locator('[data-visual-hero="city"]')).toBeVisible();
    await expect(page.locator('[data-market-pulse] svg[role="img"]').first()).toBeVisible();
    await expect(page.locator('[data-illustrated-cta] img')).toBeVisible();
    await expect(page.locator('[data-home-search] select')).toHaveValue(city);
    await photograph(page, info, `city-${city}`);
  });
}

test('published monthly article includes its real interactive graph', async ({ page }, info) => {
  await page.goto('/ko/news/seoul-monthly-2026-09/');
  await ready(page);
  await expect(page.locator('[data-market-pulse="seoul"] svg[role="img"]')).toBeVisible();
  await photograph(page, info, 'monthly-article');
});
