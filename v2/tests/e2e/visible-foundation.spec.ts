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

type BoundingBox = NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>;

async function expectContainedTouchTargets(
  page: Page,
  targets: readonly Locator[],
): Promise<BoundingBox[]> {
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  if (!viewport) throw new Error('The project must define a viewport');

  const boxes: BoundingBox[] = [];
  for (const target of targets) {
    await target.scrollIntoViewIfNeeded();
    await expect(target).toBeVisible();
    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    if (!box) throw new Error('Visible touch target has no bounding box');

    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    boxes.push(box);
  }
  return boxes;
}

function expectTargetsNotToOverlap(boxes: readonly BoundingBox[]) {
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
      name: 'Real prices. Better property decisions.',
    }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Explore Seoul' }).click();
  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/$/);
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Compare refundable jeonse deposits by district.',
  })).toBeVisible();

  await page.getByRole('navigation', { name: 'Public evidence sections' })
    .getByRole('link', { name: 'Check' }).click();
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

  const cityTabs = page.getByRole('tablist', { name: 'Choose a city' });
  await expect(cityTabs).toBeInViewport({ ratio: 1 });
  for (const city of ['Seoul', 'Singapore', 'Dubai']) {
    await expect(cityTabs.getByRole('tab', { name: city })).toBeInViewport({ ratio: 1 });
  }
  const liveSeoul = page.locator('[data-seoul-live="ready"]');
  await expect(liveSeoul).toBeVisible();
  for (const label of ['New contracts', 'Renewals']) {
    await expect(liveSeoul.getByText(label, { exact: true })).toBeInViewport({ ratio: 1 });
  }
  for (const label of ['Explore', 'Rankings', 'News', 'Guide']) {
    await expect(
      liveSeoul.getByRole('link', { name: new RegExp(`^${label}`) }),
    ).toBeInViewport({ ratio: 1 });
  }
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
  await expect(visibleLinks).toHaveCount(2);
  const primaryBoxes = await expectContainedTouchTargets(
    page,
    await visibleLinks.all(),
  );
  expectTargetsNotToOverlap(primaryBoxes);

  const marketTabs = page.getByRole('tablist', { name: 'Choose a city' }).getByRole('tab');
  await expect(marketTabs).toHaveCount(3);
  const marketTabBoxes = await expectContainedTouchTargets(
    page,
    await marketTabs.all(),
  );
  expectTargetsNotToOverlap(marketTabBoxes);

  await page.getByRole('tab', { name: 'Singapore' }).tap();
  await expect(page.getByRole('tab', { name: 'Singapore' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByRole('tabpanel', { name: 'Singapore' })).toBeVisible();

  await page.getByRole('tab', { name: 'Dubai' }).tap();
  await expect(page.getByRole('tabpanel', { name: 'Dubai' })).toContainText(
    'DLD and RERA display-rights clearance is incomplete.',
  );

  await primaryNavigation.getByRole('link', { name: 'Markets' }).tap();
  await expect(page).toHaveURL(/\/#markets$/);
  await expect(page.getByRole('tablist', { name: 'Choose a city' })).toBeInViewport();

  await page.getByRole('tab', { name: 'Seoul' }).tap();
  const exploreSeoul = page.getByRole('tabpanel', { name: 'Seoul' })
    .getByRole('link', { name: /Explore/ });
  await expectContainedTouchTargets(page, [exploreSeoul]);
  await exploreSeoul.tap();
  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/$/);
  await expectNoHorizontalPageOverflow(page);

  const actionsRegion = page.getByRole('navigation', { name: 'Public evidence sections' });
  const marketActions = actionsRegion.getByRole('link');
  await expect(marketActions).toHaveCount(4);
  const actionBoxes = await expectContainedTouchTargets(
    page,
    await marketActions.all(),
  );
  expectTargetsNotToOverlap(actionBoxes);

  await actionsRegion.getByRole('link', { name: 'Check' }).tap();
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

  const seoulTab = page.getByRole('tab', { name: 'Seoul' });
  await seoulTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Singapore' })).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: 'Singapore' })).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Dubai' })).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: 'Dubai' })).toBeVisible();
  await page.keyboard.press('Home');
  await expect(seoulTab).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: 'Seoul' })).toBeVisible();

  const exploreSeoul = page.getByRole('link', { name: 'Explore Seoul' });
  await tabTo(page, exploreSeoul);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/$/);

  const checkDeposit = page.getByRole('navigation', { name: 'Public evidence sections' })
    .getByRole('link', { name: 'Check' });
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
  expect(xml).not.toContain('/kr/seoul/tools/rent-check/');
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
