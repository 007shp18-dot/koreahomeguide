import { expect, test } from '@playwright/test';

async function noOverflow(page: import('@playwright/test').Page) {
  await page.evaluate(() => document.fonts.ready);
  const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  expect(layout.scroll).toBeLessThanOrEqual(layout.width + 1);
}

test('public refresh renders the real localized city search and four licensed city photographs', async ({ page }, testInfo) => {
  await page.goto('/ko/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toHaveAttribute('data-interface-release', '2026-09');
  await expect(page.locator('[data-home-search] form[role="search"]')).toBeVisible();
  await expect(page.locator('[data-home-city-mosaic] img')).toHaveCount(4);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.locator('[data-buying-city]')).toHaveCount(4);
  await expect(page.locator('[data-home-region="analysis"] article')).toHaveCount(3);
  await expect.poll(() => page.locator('[data-home-city-mosaic] img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await noOverflow(page);
  await testInfo.attach('home-ko', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
});

test('home search retains the selected city, locale and query when submitted', async ({ page }) => {
  await page.goto('/ko/');
  const form = page.locator('[data-home-search] form');
  await form.getByRole('combobox').selectOption('tokyo');
  await form.getByRole('searchbox').fill('Shibuya');
  await form.getByRole('button', { name: '선택 도시 탐색' }).click();
  await expect(page).toHaveURL(/\/ko\/jp\/tokyo\/explore\/?\?q=Shibuya/);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await noOverflow(page);
});

test('narrow homepage and reduced motion keep controls and text usable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await noOverflow(page);
  const form = page.locator('[data-home-search] form');
  const controls = await form.locator('input,select,button').evaluateAll(nodes => nodes.map(node => ({ height: node.getBoundingClientRect().height, width: node.getBoundingClientRect().width, font: getComputedStyle(node).fontSize })));
  expect(controls.every(control => control.height >= 44 && control.width >= 44)).toBe(true);
  expect(controls.slice(0, 2).every(control => parseFloat(control.font) >= 16)).toBe(true);
  await form.getByRole('combobox').focus();
  await expect(form.getByRole('combobox')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(form.getByRole('searchbox')).toBeFocused();
  const credits = page.locator('details').filter({ hasText: 'Photography & sources' });
  await credits.locator('summary').click();
  await expect(credits.locator('[data-photo-credit]')).toHaveCount(4);
});

const surfaces = [
  ['home-en', '/'], ['home-zh', '/zh-cn/'],
  ['city-seoul', '/kr/seoul/'], ['city-singapore', '/sg/singapore/'],
  ['city-dubai', '/ae/dubai/'], ['city-tokyo', '/jp/tokyo/'],
  ['explore-entry', '/prices/'], ['rankings', '/rankings/'],
  ['explore-seoul', '/kr/seoul/explore/'], ['explore-singapore', '/sg/singapore/explore/'],
  ['explore-dubai', '/ae/dubai/explore/'], ['explore-tokyo', '/jp/tokyo/explore/'],
  ['seoul-building', '/kr/seoul/explore/jongno-gu/synthetic-test-building/'],
  ['dubai-project', '/ae/dubai/explore/projects/ae-skyflame-1/'],
  ['tokyo-property', '/jp/tokyo/explore/properties/jp-park-city-toyosu/'],
  ['guides', '/guides/'], ['guide-checklist', '/guides/seoul/checklist/'],
  ['insights', '/news/'], ['neighbourhood', '/news/neighbourhoods/yeonhui-dong/'],
  ['tools', '/tools/'], ['scenario', '/tools/property-scenario/'],
  ['saved', '/saved/'], ['about', '/about/'], ['contact', '/ko/contact/'],
  ['trust', '/trust/'], ['corrections', '/kr/seoul/corrections/'],
] as const;

for (const [name, path] of surfaces) {
  test(`public surface ${name} is readable and inside the viewport`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.ok(), path).toBe(true);
    await expect(page.locator('body')).toHaveAttribute('data-interface-release', '2026-09');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await noOverflow(page);
    expect(errors).toEqual([]);
    await testInfo.attach(name, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });
}
