import { expect, test, type Locator, type Page } from '@playwright/test';
import { resolveReleaseTestTarget } from '../../release-test-target';
import { editorialAlternates, publicRoutes } from './public-route-contract';
import {
  openCityNavigation,
  openMarketPagesNavigation,
  openPrimaryNavigation,
} from './navigation-helpers';
import {
  visibleLanguageNavigation,
  visibleMarketNavigation,
  visibleProductNavigation,
} from './site-header-helpers';

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
      name: /Four cities.\s*Many ways to live./,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: 'Seoul',
    }),
  ).toBeVisible();

  await (await openPrimaryNavigation(page)).getByRole('link', { name: 'Explore' }).click();
  await expect(page).toHaveURL(/\/prices\/$/);
  await page.getByRole('navigation', { name: 'Market price destinations' }).getByRole('link', { name: 'Seoul', exact: true }).click();
  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/$/);
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Explore',
  })).toBeVisible();

  await (await openPrimaryNavigation(page)).getByRole('link', { name: 'Explore' }).click();
  await expect(page).toHaveURL(/\/prices\/$/);
  await page.getByRole('navigation', { name: 'Market price destinations' }).getByRole('link', { name: 'Seoul', exact: true }).click();
  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/$/);
  await (await openMarketPagesNavigation(page, 'Seoul'))
    .getByRole('link', { name: 'Check', exact: true })
    .click();
  await expect(page).toHaveURL(/\/kr\/seoul\/check\/$/);
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Compare an asking price',
      exact: true,
    }),
  ).toBeVisible();
});

for (const route of publicRoutes) {
  test(`${route.path} is usable, contained, and follows its indexing cohort`, async ({ page }) => {
    test.skip('fixtureOnly' in route && route.fixtureOnly && releaseTarget.usesExternalServer);
    const response = await page.goto(route.path);
    const indexing = !releaseTarget.usesExternalServer && 'fixtureIndexing' in route
      ? route.fixtureIndexing
      : route.indexing;
    const hasCanonical = !releaseTarget.usesExternalServer && 'fixtureCanonical' in route
      ? route.fixtureCanonical
      : 'canonical' in route;
    const hasAlternates = !releaseTarget.usesExternalServer && 'fixtureAlternates' in route
      ? route.fixtureAlternates
      : 'alternates' in route && route.alternates;

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { level: 1, name: route.heading }),
    ).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      indexing === 'index' ? /^index,\s*follow$/ : /^noindex,\s*follow$/,
    );
    if (hasCanonical && 'canonical' in route) {
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://www.signedprice.com${route.canonical}`,
      );
    } else {
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    }
    const alternates = page.locator('link[rel="alternate"][hreflang]');
    const editorialLanguages = editorialAlternates[route.path];
    if (editorialLanguages !== undefined) {
      await expect(alternates).toHaveCount(Object.keys(editorialLanguages).length);
      for (const [language, path] of Object.entries(editorialLanguages)) {
        await expect(page.locator(`link[rel="alternate"][hreflang="${language}"]`)).toHaveAttribute(
          'href', `https://www.signedprice.com${path}`,
        );
      }
    } else if (hasAlternates && 'canonical' in route) {
      await expect(alternates).toHaveCount(3);
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
        'href', `https://www.signedprice.com${route.canonical}`,
      );
      await expect(page.locator('link[rel="alternate"][hreflang="ko"]')).toHaveAttribute(
        'href', `https://www.signedprice.com/ko${route.canonical}`,
      );
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
        'href', `https://www.signedprice.com${route.canonical}`,
      );
    } else {
      await expect(alternates).toHaveCount(0);
    }
    await expect(page.locator('input[type="email"]')).toHaveCount(0);
    await expectNoHorizontalPageOverflow(page);
  });
}

test('desktop exposes the city index and photo-led city destinations', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: /Four cities.\s*Many ways to live./ })).toBeInViewport();
  await expect(page.locator('main form')).toHaveCount(0);
  const markets = page.locator('[data-home-region="markets"]');
  await expect(markets).toHaveAttribute('aria-label', 'Choose a city');
  await expect(markets.getByRole('navigation', { name: 'Choose a city' })).toBeInViewport();
  await expect(markets.locator('[data-contextual-action]')).toHaveCount(4);
  await expect(markets.locator('[data-primary-action="explore"]')).toHaveCount(4);
});

test('mobile primary navigation remains tappable and reaches the market flow', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium');
  await page.goto('/');

  let primaryNavigation = await openPrimaryNavigation(page);
  await expect(primaryNavigation.locator('.site-header__product-link')).toHaveText(['Explore', 'Insights', 'News', 'Tools', 'Guides']);
  await expect(primaryNavigation.getByRole('link', { name: 'Rankings', exact: true })).toHaveCount(0);
  await expect(primaryNavigation.getByRole('link')).toHaveCount(5);
  const primaryLinks = await primaryNavigation.getByRole('link').all();
  await expectContainedTouchTargets(page, primaryLinks);
  await expectTargetsNotToOverlap(primaryLinks);
  const languageNavigation = await visibleLanguageNavigation(page);
  await expect(languageNavigation.getByRole('link')).toHaveCount(3);
  await expect(languageNavigation.getByRole('link')).toHaveText(['EN', 'KO', '中文']);
  for (const [index, href] of ['/', '/ko/', '/zh-cn/kr/seoul/'].entries()) {
    await expect(languageNavigation.getByRole('link').nth(index)).toHaveAttribute('href', href);
  }
  const languageLinks = await languageNavigation.getByRole('link').all();
  await expectContainedTouchTargets(page, languageLinks);
  await expectTargetsNotToOverlap(languageLinks);

  const marketNavigation = await openCityNavigation(page);
  await expect(marketNavigation).toBeVisible();
  const marketLinks = await marketNavigation.getByRole('link').all();
  await expectContainedTouchTargets(page, marketLinks);
  await expectTargetsNotToOverlap(marketLinks);
  for (const [city, href] of [
    ['Seoul', '/kr/seoul/'],
    ['Singapore', '/sg/'],
    ['Dubai', '/ae/dubai/'],
  ] as const) {
    await expect(marketNavigation.getByRole('link', { name: city, exact: true }))
      .toHaveAttribute('href', href);
  }
  const cityLinks = await marketNavigation.getByRole('link').all();
  await expectContainedTouchTargets(page, cityLinks);
  await expectTargetsNotToOverlap([...primaryLinks, ...languageLinks, ...cityLinks]);
  await expectNoHorizontalPageOverflow(page);

  const explore = primaryNavigation.getByRole('link', { name: 'Explore' });
  await expectContainedTouchTargets(page, [explore]);
  await explore.tap();
  await expect(page).toHaveURL(/\/prices\/$/);
  await page.getByRole('navigation', { name: 'Market price destinations' }).getByRole('link', { name: 'Seoul', exact: true }).tap();
  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/$/);
  await expectNoHorizontalPageOverflow(page);

  let localNavigation = await openMarketPagesNavigation(page, 'Seoul');
  await expect(localNavigation.getByRole('link')).toHaveCount(5);
  const localLinks = await localNavigation.getByRole('link').all();
  await expectContainedTouchTargets(page, localLinks);
  await expectTargetsNotToOverlap(localLinks);

  primaryNavigation = await openPrimaryNavigation(page);
  const exploreFromExplore = primaryNavigation.getByRole('link', { name: 'Explore' });
  await exploreFromExplore.tap();
  await expect(page).toHaveURL(/\/prices\/$/);

  await page.getByRole('navigation', { name: 'Market price destinations' }).getByRole('link', { name: 'Seoul', exact: true }).tap();
  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/$/);
  localNavigation = await openMarketPagesNavigation(page, 'Seoul');
  const checkAskingPrice = localNavigation.getByRole('link', { name: 'Check', exact: true });
  await expectContainedTouchTargets(page, [checkAskingPrice]);
  await checkAskingPrice.tap();
  await expect(page).toHaveURL(/\/kr\/seoul\/check\/$/);
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Compare an asking price',
      exact: true,
    }),
  ).toBeVisible();
});

test('keyboard traversal activates the Home to Seoul to Check flow', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await page.goto('/');

  const explore = (await visibleProductNavigation(page))
    .getByRole('link', { name: 'Explore' });
  await tabTo(page, explore);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/prices\/$/);

  const exploreSeoul = page.getByRole('navigation', { name: 'Market price destinations' }).getByRole('link', { name: 'Seoul', exact: true });
  await tabTo(page, exploreSeoul);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/$/);

  const exploreFromExplore = (await visibleProductNavigation(page))
    .getByRole('link', { name: 'Explore' });
  await tabTo(page, exploreFromExplore);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/prices\/$/);

  await tabTo(page, exploreSeoul);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/$/);
  const checkDeposit = (await visibleMarketNavigation(page, 'Seoul')).getByRole('link', { name: 'Check', exact: true });
  await tabTo(page, checkDeposit);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/kr\/seoul\/check\/$/);
});

test('the legacy Singapore overview permanently redirects to its canonical market hub', async ({ page, request }) => {
  const redirect = await request.get('/sg/singapore/', { maxRedirects: 0 });
  expect(redirect.status()).toBe(308);
  expect(redirect.headers().location).toBe('/sg/');
  const response = await page.goto('/sg/singapore/');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/sg\/$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.signedprice.com/sg/');
});

for (const path of [
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
    const indexing = !releaseTarget.usesExternalServer && 'fixtureIndexing' in route
      ? route.fixtureIndexing
      : route.indexing;
    const expected = indexing === 'index' && 'canonical' in route;
    expect(xml.includes(`<loc>https://www.signedprice.com${route.path}</loc>`)).toBe(expected);
  }
  expect(xml).toContain('<loc>https://www.signedprice.com/sg/</loc>');
  expect(xml).toContain(
    '<loc>https://www.signedprice.com/kr/seoul/tools/rent-check/</loc>',
  );
  expect(xml).not.toContain('/synthetic-test-building/');
});

for (const path of [
  '/news/',
  '/news/policy/singapore-absd-policy-status/',
  '/news/seoul-district-price-distribution/',
  '/guides/rent-an-apartment-in-korea/',
  '/zh-cn/news/',
  '/zh-cn/guides/rent-in-korea-zh/',
]) {
  test(`${path} keeps reviewed editorial metadata and sources visible`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index,\s*follow$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://www.signedprice.com${path}`);
    if (!path.endsWith('/news/') && !path.endsWith('/guides/')) {
      await expect(page.getByText(/Reviewed by|Reviewer|SignedPrice (Research|Chinese)/i)).toHaveCount(0);
      await expect(page.getByRole('heading', { name: /^Sources$|Source and verification/ }).first()).toBeVisible();
    }
    await expectNoHorizontalPageOverflow(page);
  });
}

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

// This existing alias was made canonical in the research release.
test('Singapore city alias redirects to the public overview', async ({request}) => {
 const response = await request.get('/sg/singapore/', {maxRedirects:0});
 expect(response.status()).toBe(308);
 expect(response.headers()['location']).toBe('/sg/');
});
