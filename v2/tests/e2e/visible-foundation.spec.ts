import { expect, test, type Locator, type Page } from '@playwright/test';
import { resolveReleaseTestTarget } from '../../release-test-target';
import { publicRoutes } from './public-route-contract';

const releaseTarget = resolveReleaseTestTarget();

async function expectNoHorizontalPageOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    body: {
      clientWidth: document.body.clientWidth,
      scrollWidth: document.body.scrollWidth,
    },
    document: {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    },
  }));

  expect(dimensions.body.scrollWidth).toBeLessThanOrEqual(dimensions.body.clientWidth);
  expect(dimensions.document.scrollWidth).toBeLessThanOrEqual(
    dimensions.document.clientWidth,
  );
}

async function expectContainedTouchTargets(
  page: Page,
  targets: readonly Locator[],
): Promise<void> {
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  if (!viewport) throw new Error('The project must define a viewport');

  for (const target of targets) {
    await target.scrollIntoViewIfNeeded();
    await expect(target).toBeVisible();
    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    if (!box) throw new Error('Visible touch target has no bounding box');

    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    // Browser layout may report fractional CSS pixels just beyond the integer viewport.
    const subpixelTolerance = 0.5;
    expect(box.x).toBeGreaterThanOrEqual(-subpixelTolerance);
    expect(box.y).toBeGreaterThanOrEqual(-subpixelTolerance);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + subpixelTolerance);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + subpixelTolerance);
  }
}

async function expectTargetsNotToOverlap(targets: readonly Locator[]) {
  const boxes = await Promise.all(targets.map((target) => target.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    };
  })));
  for (let leftIndex = 0; leftIndex < boxes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < boxes.length; rightIndex += 1) {
      const left = boxes[leftIndex]!;
      const right = boxes[rightIndex]!;
      const overlapWidth = Math.max(
        0,
        Math.min(left.x + left.width, right.x + right.width) -
          Math.max(left.x, right.x),
      );
      const overlapHeight = Math.max(
        0,
        Math.min(left.y + left.height, right.y + right.height) -
          Math.max(left.y, right.y),
      );

      expect(overlapWidth * overlapHeight).toBe(0);
    }
  }
}

async function tabTo(page: Page, target: Locator, maximumTabs = 30) {
  for (let tabCount = 0; tabCount < maximumTabs; tabCount += 1) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }

  throw new Error(`Target was not keyboard reachable within ${maximumTabs} Tab presses`);
}

test('navigates the first signedprice decision flow', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'See what homes actually signed for.',
    }),
  ).toBeVisible();

  await page.getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: /Explore/ }).click();
  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/$/);
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Compare refundable jeonse deposits by district.',
  })).toBeVisible();

  await page.getByRole('navigation', { name: 'Seoul evidence navigation' })
    .getByRole('link', { name: /Check/ }).click();
  await expect(page).toHaveURL(/\/kr\/seoul\/check\/$/);
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Which rent offer actually costs less?',
    }),
  ).toBeVisible();
});

for (const route of publicRoutes) {
  test(`${route.path} is usable, contained, and follows its indexing cohort`, async ({ page }) => {
    test.skip('fixtureOnly' in route && route.fixtureOnly && releaseTarget.usesExternalServer);
    const response = await page.goto(route.path);

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { level: 1, name: route.heading }),
    ).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      route.indexing === 'index' ? /^index,\s*follow$/ : /^noindex,\s*follow$/,
    );
    if ('canonical' in route) {
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://www.signedprice.com${route.canonical}`,
      );
    } else {
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    }
    const alternates = page.locator('link[rel="alternate"][hreflang]');
    if ('alternates' in route && route.alternates) {
      await expect(alternates).toHaveCount(3);
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
        'href', `https://www.signedprice.com${route.canonical}`,
      );
      await expect(page.locator('link[rel="alternate"][hreflang="ko"]')).toHaveAttribute(
        'href', `https://www.signedprice.com/ko${route.canonical}`,
      );
    } else {
      await expect(alternates).toHaveCount(0);
    }
    await expect(page.locator('input[type="email"]')).toHaveCount(0);
    await expectNoHorizontalPageOverflow(page);
  });
}

test('desktop exposes live Seoul evidence in the 1366 by 768 first viewport', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await page.goto('/');

  const marketNavigation = page.getByRole('navigation', { name: 'Market navigation' });
  await expect(marketNavigation).toBeInViewport({ ratio: 1 });
  for (const city of ['Seoul', 'Singapore', 'Dubai']) {
    await expect(marketNavigation.getByRole('link', { name: city }))
      .toBeInViewport({ ratio: 1 });
  }
  const liveSeoul = page.locator('[data-seoul-live="ready"]');
  await expect(liveSeoul).toBeVisible();
  await expect(liveSeoul.getByText('Verified contracts', { exact: true }))
    .toBeInViewport({ ratio: 1 });
});

test('mobile primary navigation remains tappable and reaches the market flow', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium');
  await page.goto('/');

  const primaryNavigation = page.getByRole('navigation', {
    name: 'Primary navigation',
  });
  const visibleLinks = primaryNavigation.getByRole('link').filter({ visible: true });
  await expect(visibleLinks).toHaveCount(5);
  const primaryLinks = await visibleLinks.all();
  await expectContainedTouchTargets(page, primaryLinks);
  await expectTargetsNotToOverlap(primaryLinks);

  const marketLinks = page.getByRole('navigation', { name: 'Market navigation' })
    .getByRole('link');
  await expect(marketLinks).toHaveCount(3);
  const marketLinkTargets = await marketLinks.all();
  await expectContainedTouchTargets(page, marketLinkTargets);
  await expectTargetsNotToOverlap(marketLinkTargets);

  const exploreSeoul = primaryNavigation.getByRole('link', { name: /Explore/ });
  await expectContainedTouchTargets(page, [exploreSeoul]);
  await exploreSeoul.tap();
  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/$/);
  await expectNoHorizontalPageOverflow(page);

  const actionsRegion = page.getByRole('navigation', { name: 'Seoul evidence navigation' });
  const marketActions = actionsRegion.getByRole('link');
  await expect(marketActions).toHaveCount(5);
  const marketActionTargets = await marketActions.all();
  await expectContainedTouchTargets(page, marketActionTargets);
  await expectTargetsNotToOverlap(marketActionTargets);

  await actionsRegion.getByRole('link', { name: /Check/ }).tap();
  await expect(page).toHaveURL(/\/kr\/seoul\/check\/$/);
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Which rent offer actually costs less?',
    }),
  ).toBeVisible();
});

test('keyboard traversal activates the Home to Seoul to Check flow', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await page.goto('/');

  const exploreSeoul = page.getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: /Explore/ });
  await tabTo(page, exploreSeoul);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/$/);

  const checkDeposit = page.getByRole('navigation', { name: 'Seoul evidence navigation' })
    .getByRole('link', { name: /Check/ });
  await tabTo(page, checkDeposit);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/kr\/seoul\/check\/$/);
});

for (const path of [
  '/sg/singapore/',
  '/sg/singapore/rent/',
  '/sg/singapore/buy/',
  '/sg/singapore/invest/',
  '/ae/dubai/',
  '/ae/dubai/rent/',
  '/ae/dubai/buy/',
  '/ae/dubai/invest/',
  '/us/new-york/',
  '/kr/seoul/sell/',
  '/kr/seoul/not-a-district/',
  '/not-a-real-route/',
]) {
  test(`${path} returns the custom 404`, async ({ page }) => {
    const response = await page.goto(path);

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole('heading', { level: 1, name: 'This route is not available.' }),
    ).toBeVisible();
    const robotsDirectives = await page
      .locator('meta[name="robots"]')
      .evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('content') ?? ''),
      );
    expect(robotsDirectives.length).toBeGreaterThan(0);
    expect(
      robotsDirectives.some((content) =>
        content.split(/[\s,]+/).includes('noindex'),
      ),
    ).toBe(true);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
    await expectNoHorizontalPageOverflow(page);
  });
}

test('sitemap includes only indexable canonical public routes', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const xml = await response.text();

  for (const route of publicRoutes) {
    const expected = route.indexing === 'index' && 'canonical' in route;
    expect(xml.includes(`<loc>https://www.signedprice.com${route.path}</loc>`)).toBe(expected);
  }
  expect(xml).not.toContain('/sg/');
  expect(xml).toContain(
    '<loc>https://www.signedprice.com/kr/seoul/tools/rent-check/</loc>',
  );
  expect(xml).not.toContain('/synthetic-test-building/');
});

test('status API returns only public release readiness', async ({ request }) => {
  const response = await request.get('/api/status');

  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toContain('no-store');
  expect(await response.json()).toEqual({
    brand: 'signedprice',
    commit: releaseTarget.expectedCommit,
    environment: releaseTarget.expectedEnvironment,
    markets: ['kr-seoul', 'sg-singapore', 'ae-dubai'],
    indexing: 'enabled',
  });
});
