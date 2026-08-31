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
  await expect(page).toHaveURL(/\/kr\/seoul\/$/);
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Reported refundable-deposit distribution.',
  })).toBeVisible();

  await page.getByRole('link', { name: 'Check a Seoul deposit' }).click();
  await expect(page).toHaveURL(/\/kr\/check\/seoul\/$/);
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Where does this refundable deposit sit?',
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
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
    await expect(page.locator('input[type="email"]')).toHaveCount(0);
    await expectNoHorizontalPageOverflow(page);
  });
}

test('desktop shows the Korea market card in the 1366 by 768 first viewport', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await page.goto('/');
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  if (!viewport) throw new Error('The desktop project must define a viewport');

  for (const city of ['Seoul']) {
    const card = page.getByRole('article', { name: city });
    const heading = card.getByRole('heading', { level: 3, name: city });
    await expect(card).toBeVisible();
    await expect(heading).toBeInViewport({ ratio: 1 });
    const box = await card.boundingBox();

    expect(box).not.toBeNull();
    if (!box) throw new Error(`${city} market card has no bounding box`);
    const visibleHeight = Math.max(
      0,
      Math.min(box.y + box.height, viewport.height) - Math.max(box.y, 0),
    );
    expect(visibleHeight / box.height).toBeGreaterThanOrEqual(0.3);
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

  const intentButtons = page.locator('.intent-tabs__trigger');
  await expect(intentButtons).toHaveCount(3);
  const intentBoxes = await expectContainedTouchTargets(
    page,
    await intentButtons.all(),
  );
  expectTargetsNotToOverlap(intentBoxes);

  await page.getByRole('button', { name: /Buy/ }).tap();
  await expect(page.getByRole('button', { name: /Buy/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('heading', { name: 'Buy — market depth' }))
    .toBeVisible();
  await expect(page.getByRole('link', { name: 'Buy in Seoul' })).toHaveAttribute(
    'href',
    '/kr/seoul/buy/',
  );

  await page.getByRole('button', { name: /Invest/ }).tap();
  await expect(page.getByRole('heading', { name: 'Invest — market depth' }))
    .toBeVisible();
  await expect(page.getByRole('link', { name: 'Invest in Seoul' })).toHaveAttribute(
    'href',
    '/kr/seoul/invest/',
  );

  for (const marketAction of await page.locator('.market-card__intent-link').all()) {
    await expectContainedTouchTargets(page, [marketAction]);
  }

  await primaryNavigation.getByRole('link', { name: 'Markets' }).tap();
  await expect(page).toHaveURL(/\/#markets$/);
  await expect(page.getByRole('heading', { name: 'Invest — market depth' }))
    .toBeInViewport();

  const exploreSeoul = page.getByRole('link', { name: 'Explore Seoul' });
  await expectContainedTouchTargets(page, [exploreSeoul]);
  await exploreSeoul.tap();
  await expect(page).toHaveURL(/\/kr\/seoul\/$/);
  await expectNoHorizontalPageOverflow(page);

  const actionsRegion = page.getByRole('navigation', { name: 'Korea public pages' });
  const marketActions = actionsRegion.getByRole('link');
  await expect(marketActions).toHaveCount(3);
  const actionBoxes = await expectContainedTouchTargets(
    page,
    await marketActions.all(),
  );
  expectTargetsNotToOverlap(actionBoxes);

  await actionsRegion.getByRole('link', { name: 'Check a Seoul deposit' }).tap();
  await expect(page).toHaveURL(/\/kr\/check\/seoul\/$/);
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Where does this refundable deposit sit?',
    }),
  ).toBeVisible();
});

test('keyboard traversal activates the Home to Seoul to Check flow', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await page.goto('/');

  const exploreSeoul = page.getByRole('link', { name: 'Explore Seoul' });
  await tabTo(page, exploreSeoul);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/kr\/seoul\/$/);

  const checkDeposit = page.getByRole('link', { name: 'Check a Seoul deposit' });
  await tabTo(page, checkDeposit);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/kr\/check\/seoul\/$/);
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
