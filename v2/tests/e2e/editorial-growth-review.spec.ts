import { expect, test, type Locator, type Page } from '@playwright/test';

const surfaces = ['home', 'content', 'check', 'explore'] as const;
const locales = ['en', 'zh-CN'] as const;

function observeRuntimeFailures(page: Page) {
  const consoleErrors: string[] = [];
  const serverErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
  });

  return () => {
    expect(consoleErrors).toEqual([]);
    expect(serverErrors).toEqual([]);
  };
}

async function expectVisibleTargetsAtLeast44(locator: Locator) {
  const targets = locator.locator('a, button, input, select');

  for (let index = 0; index < await targets.count(); index += 1) {
    const target = targets.nth(index);
    if (!(await target.isVisible())) continue;
    const box = await target.boundingBox();
    expect(box, `visible target ${index} has a box`).not.toBeNull();
    expect(box!.height, `visible target ${index} is at least 44px tall`).toBeGreaterThanOrEqual(44);
  }
}

for (const surface of surfaces) {
  for (const locale of locales) {
    test(`${surface} ${locale} is contained and visually stable`, async ({ page }, testInfo) => {
      const assertNoRuntimeFailures = observeRuntimeFailures(page);
      await page.goto(`/design-review/editorial-growth/${surface}/?locale=${locale}&state=ready&ad=loaded`);

      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^noindex,\s*nofollow$/);
      await expect(page.locator(`[data-review-surface="${surface}"]`)).toBeVisible();
      const overflow = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);
      await expectVisibleTargetsAtLeast44(page.locator(`[data-review-surface="${surface}"]`));
      await expect(page).toHaveScreenshot(`${surface}-${locale}-${testInfo.project.name}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
      assertNoRuntimeFailures();
    });
  }
}

test('article measure and typography match the approved contract', async ({ page }, testInfo) => {
  await page.goto('/design-review/editorial-growth/content/?locale=en&state=ready&ad=empty');
  const body = page.locator('[data-article-body]');
  const mobile = testInfo.project.name === 'mobile-chromium';

  await expect(body).toHaveCSS('font-size', mobile ? '17px' : '18px');
  await expect(body).toHaveCSS('line-height', mobile ? '29.24px' : '30.96px');
  expect((await body.boundingBox())!.width).toBeLessThanOrEqual(720);
});

test('Chinese does not inherit Latin negative tracking', async ({ page }) => {
  await page.goto('/design-review/editorial-growth/content/?locale=zh-CN&state=ready&ad=empty');
  // Chromium may serialize a zero letter-spacing as "normal".
  const zeroTracking = /^(?:normal|0px)$/;
  await expect(page.locator('[data-review-locale="zh-CN"]')).toHaveCSS('letter-spacing', zeroTracking);
  const headings = page.locator('[data-review-locale="zh-CN"] h1, [data-review-locale="zh-CN"] h2, [data-review-locale="zh-CN"] h3');
  for (let index = 0; index < await headings.count(); index += 1) {
    await expect(headings.nth(index)).toHaveCSS('letter-spacing', zeroTracking);
  }
});

test('ready evidence surfaces do not expose unusable rows or wrapped figures', async ({ page }) => {
  await page.goto('/design-review/editorial-growth/check/?locale=en&state=ready&ad=empty');
  const figures = page.locator('[data-check-region="figures"] dd');
  for (let index = 0; index < await figures.count(); index += 1) {
    const figure = figures.nth(index);
    const dimensions = await figure.evaluate((element) => {
      const style = getComputedStyle(element);
      return { height: element.getBoundingClientRect().height, lineHeight: Number.parseFloat(style.lineHeight) };
    });
    expect(dimensions.height).toBeLessThanOrEqual(dimensions.lineHeight * 1.1);
  }

  await page.goto('/design-review/editorial-growth/explore/?locale=en&state=ready&ad=empty');
  const results = page.locator('[data-review-surface="explore"]');
  await expect(results).not.toContainText('Evidence withheld');
  await expect(results).not.toContainText('0 reported contracts');
});

test('wide homepage keeps the opening proposition above the fold', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'wide-chromium', 'Wide composition only.');
  await page.goto('/design-review/editorial-growth/home/?locale=en&state=ready&ad=empty');
  const heading = await page.locator('[data-review-surface="home"] h1').boundingBox();
  expect(heading).not.toBeNull();
  expect(heading!.y).toBeLessThan(240);
});

test('toolbar focus is visible and cobalt', async ({ page }) => {
  await page.goto('/design-review/editorial-growth/home/?locale=en&state=ready&ad=empty');
  const wordmark = page.locator('[data-review-surface="home"] > header')
    .getByRole('link', { name: /^signed\s*price$/i });

  await page.keyboard.press('Tab');
  await expect(wordmark).toBeFocused();
  await expect(wordmark).toHaveCSS('outline-width', '2px');
  await expect(wordmark).toHaveCSS('outline-style', 'solid');
  await expect(wordmark).toHaveCSS('outline-color', 'rgb(29, 78, 216)');
});

test('empty advertising leaves no reserved article gap', async ({ page }) => {
  await page.goto('/design-review/editorial-growth/content/?locale=en&state=ready&ad=empty');
  const slot = page.locator('[data-ad-slot="article-1"]');
  const box = await slot.boundingBox();

  expect(box).not.toBeNull();
  expect(box!.height).toBe(0);
  await expect(slot).not.toContainText('Advertisement');
});

for (const state of ['insufficient', 'error'] as const) {
  test(`${state} tool states contain no fabricated evidence`, async ({ page }) => {
    for (const surface of ['check', 'explore'] as const) {
      await page.goto(`/design-review/editorial-growth/${surface}/?locale=en&state=${state}&ad=empty`);
      const root = page.locator(`[data-review-surface="${surface}"]`);
      const sentence = state === 'insufficient'
        ? 'Not enough compatible reported contracts for a distribution.'
        : 'Official evidence is temporarily unavailable.';

      await expect(root).toContainText(sentence);
      await expect(root).not.toContainText('₩0');
      await expect(root).not.toContainText('0 contracts');
      await expect(root.locator('svg')).toHaveCount(0);
    }
  });
}

test('mobile Explore switches between one visible mode at a time', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile composition only.');
  await page.goto('/design-review/editorial-growth/explore/?locale=en&state=ready&ad=empty');

  await expect(page.locator('[data-mobile-mode="list"] > aside')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Seoul district evidence map' })).toBeHidden();
  await page.getByRole('button', { name: 'Map' }).click();
  await expect(page.getByRole('region', { name: 'Seoul district evidence map' })).toBeVisible();
});
