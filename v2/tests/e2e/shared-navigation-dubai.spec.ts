import { expect, test } from '@playwright/test';

test('uses one navigation order and published language links across markets', async ({ page }) => {
  for (const [path, languages] of [
    ['/prices/', ['EN', 'KO']],
    ['/news/', ['EN', 'KO', '中文']],
    ['/guides/', ['EN', 'KO', '中文']],
    ['/kr/seoul/explore/', ['EN', 'KO']],
    ['/sg/singapore/explore/', ['EN', 'KO']],
    ['/ae/dubai/explore/', ['EN', 'KO']],
  ] as const) {
    await page.goto(path);
    const header = page.locator('header.site-header');
    const menu = header.getByLabel('Open menu', { exact: true });
    if (await menu.isVisible()) await menu.click();
    const navigation = header.getByRole('navigation', {
      name: page.viewportSize()!.width <= 760 ? 'Site menu' : 'Primary navigation',
      exact: true,
    });
    await expect(navigation.getByRole('link')).toHaveText(['Markets', 'Prices', 'Tools', 'Insights', 'Guides']);
    await expect(header.getByRole('navigation', { name: 'Language navigation', exact: true }).getByRole('link')).toHaveText([...languages]);
    await expect(page.locator('footer').getByRole('link', { name: 'Singapore', exact: true })).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
});

for (const width of [320, 390, 430]) {
  test.describe(`mobile language alignment at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });
    test('keeps Chinese glyphs and language buttons on one line', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile viewport regression');
      for (const path of ['/', '/ko/passport/', '/zh-cn/passport/']) {
        await page.goto(path);
        await page.locator('header.site-header summary').click();
        const languages = page.getByRole('navigation', { name: 'Language navigation', exact: true });
        await expect(languages.getByRole('link')).toHaveText(['EN', 'KO', '中文']);
        const boxes = await languages.getByRole('link').evaluateAll(nodes => nodes.map(node => {
          const box = node.getBoundingClientRect();
          return { top: box.top, width: box.width, height: box.height };
        }));
        expect(Math.max(...boxes.map(box => box.top)) - Math.min(...boxes.map(box => box.top))).toBeLessThanOrEqual(1);
        for (const box of boxes) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
        const chinese = languages.getByRole('link', { name: '中文', exact: true });
        await expect(chinese).toHaveCSS('white-space', 'nowrap');
        expect(await chinese.evaluate(node => {
          const range = document.createRange();
          range.selectNodeContents(node);
          const text = range.getBoundingClientRect();
          const box = node.getBoundingClientRect();
          return text.height <= parseFloat(getComputedStyle(node).lineHeight) + 1
            && text.left >= box.left && text.right <= box.right;
        })).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      }
    });
  });
}

test('opens Singapore from Prices and removes the Seoul-only sample', async ({ page }) => {
  await page.goto('/prices/');
  await expect(page.getByText('Seoul jeonse sample', { exact: false })).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Market', exact: true }).selectOption('singapore');
  await page.getByRole('searchbox', { name: 'Find a property' }).fill('Civic');
  await page.getByRole('button', { name: 'Explore prices' }).click();
  await expect(page).toHaveURL(/\/sg\/singapore\/explore\/?\?q=Civic/);
  await expect(page.getByRole('heading', { name: 'Explore', exact: true })).toBeVisible();
});

test('opens area research, uses AED assumptions and connects Dubai news', async ({ page }) => {
  await page.goto('/ae/dubai/explore/');
  await page.getByRole('button', { name: /Dubai Marina/ }).click();
  await expect(page.getByRole('link', { name: 'Official neighbourhood guide' })).toHaveAttribute('href', /dubai-marina/);
  await expect(page).toHaveURL(/area=dubai-marina/);
  await page.getByRole('link', { name: 'Buying research guide', exact: true }).click();
  await expect(page.locator('[data-property-scenario="AED"]')).toBeVisible();
  await page.getByLabel('Purchase price (AED)', { exact: true }).fill('1000000');
  await page.getByLabel('Acquisition costs, including taxes and fees (AED)').fill('50000');
  await page.getByLabel('Expected monthly rent (AED)').fill('7000');
  await page.getByLabel('Annual operating costs, including taxes (AED)').fill('12000');
  await page.getByLabel('Expected vacant months per year').fill('1');
  await expect(page.getByText('6.19%', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Dubai news', exact: true }).click();
  await expect(page).toHaveURL(/market=dubai/);
  await expect(page.getByRole('navigation', { name: 'News markets' }).getByRole('link', { name: 'Dubai' })).toHaveAttribute('aria-current', 'page');
});
