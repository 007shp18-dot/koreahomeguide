import { expect, test, type Locator, type Page } from '@playwright/test';
import { visibleProductNavigation } from './site-header-helpers';

import { resolveReleaseTestTarget } from '../../release-test-target';
import { openPrimaryNavigation } from './navigation-helpers';
import {
  PUBLIC_AREA_WITHHELD_SLUG,
} from './public-area-summary-fixture';
import {
  PUBLIC_BUILDING_TEST_ID,
  PUBLIC_BUILDING_TEST_NAME,
  PUBLIC_BUILDING_TEST_SELECTION_HREF,
} from './public-building-summary-fixture';

const releaseTarget = resolveReleaseTestTarget();

test('Seoul area bubble opens and closes results without replacing its map', async ({ page }) => {
  test.skip(releaseTarget.usesExternalServer || process.env.SIGNEDPRICE_TEST_NAVER_MAP !== 'true',
    'Run with SIGNEDPRICE_TEST_NAVER_MAP=true NAVER_MAP_CLIENT_ID=e2e-map-fixture for the isolated SDK fixture.');
  await page.route('https://oapi.map.naver.com/openapi/v3/maps.js**', route => route.fulfill({
    contentType: 'application/javascript',
    body: `
      class FixtureMap {
        constructor(element) { this.element = element; this.zoom = 13; element.dataset.fixtureMap = String(Date.now()); }
        setCenter() {} setZoom(zoom) { this.zoom = zoom; } getZoom() { return this.zoom; }
      }
      class FixtureMarker {
        constructor({ map, title, icon }) {
          this.element = document.createElement('button');
          this.element.type = 'button'; this.element.title = title;
          this.element.innerHTML = icon?.content || title;
          this.element.style.cssText = 'position:relative;display:inline-block;margin:12px;min-width:48px;min-height:48px';
          map.element.append(this.element);
        }
        setMap(map) { if (map === null) this.element.remove(); }
      }
      window.naver = { maps: {
        Map: FixtureMap, Marker: FixtureMarker, LatLng: class {},
        Event: {
          addListener(target, event, callback) {
            target.element.addEventListener(event, callback); return { target, event, callback };
          },
          removeListener({ target, event, callback }) { target.element.removeEventListener(event, callback); }
        },
        Service: { Status: { OK: 'OK' }, geocode(_input, callback) { callback('ZERO_RESULTS', {}); } }
      } };
    `,
  }));
  await page.goto('/kr/seoul/explore/?district=jongno-gu&transaction=jeonse&view=map');
  const canvas = page.locator('[data-fixture-map]');
  await expect(canvas).toBeVisible();
  const mapIdentity = await canvas.getAttribute('data-fixture-map');
  const bubble = canvas.getByRole('button').filter({ has: page.locator('.spMapAreaGroup') }).first();
  await expect(bubble).toBeVisible();
  await bubble.click();
  const results = page.getByRole('complementary', { name: 'District and building discovery', exact: true });
  await expect(results).toBeVisible();
  await expect(results.locator('[data-building-row]').first()).toBeVisible();
  await expect(canvas).toHaveAttribute('data-fixture-map', mapIdentity!);
  await expect(page.locator('[data-explorer-layout="map"]')).toBeVisible();
  await results.getByRole('button', { name: 'Close area results', exact: true }).click();
  await expect(results).toHaveCount(0);
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('data-fixture-map', mapIdentity!);
});

for (const view of ['split', 'map'] as const) {
  test(`Seoul keeps ${view} and its map while drilling into a district`, async ({ page }) => {
    await page.goto(`/kr/seoul/explore/?view=${view}`);
    const map = page.locator('[data-explorer-region="map"]');
    await expect(map).toBeVisible();
    await page.getByRole('combobox', { name: 'All 25 Seoul districts', exact: true }).selectOption('gangnam-gu');
    await expect(page).toHaveURL(new RegExp(`district=gangnam-gu`));
    await expect(page.locator(`[data-explorer-layout="${view}"]`)).toBeVisible();
    await expect(map).toBeVisible();
    expect(new URL(page.url()).searchParams.get('view')).toBe(view);
    await page.getByRole('button', { name: 'All Seoul districts', exact: true }).click();
    await expect(page).not.toHaveURL(/district=/);
    await expect(page.locator(`[data-explorer-layout="${view}"]`)).toBeVisible();
    await expect(map).toBeVisible();
  });
}

test('Explore recovery keeps discovery primary and search touch-safe', async ({ page }) => {
  await page.goto('/kr/seoul/explore/');
  const rail = page.getByRole('complementary', { name: 'District and building discovery', exact: true });
  const map = page.locator('[data-explorer-region="map"]');
  const search = page.getByRole('searchbox', { name: 'Search area or building', exact: true });
  await expect(rail).toBeVisible();
  await expect(page.locator('[data-explorer-layout="list"]')).toBeVisible();
  await expect(map).toHaveCount(0);
  const railBox = await rail.boundingBox();
  expect(railBox).not.toBeNull();
  expect(railBox!.width).toBeGreaterThan(300);
  await expectTouchTarget(search);
  expect(await search.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
  await expectNoHorizontalOverflow(page);
});

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

async function expectNoHorizontalOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    body: [document.body.clientWidth, document.body.scrollWidth],
    root: [document.documentElement.clientWidth, document.documentElement.scrollWidth],
  }));
  expect(widths.body[1]).toBeLessThanOrEqual(widths.body[0]);
  expect(widths.root[1]).toBeLessThanOrEqual(widths.root[0]);
}

async function expectTouchTarget(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
}

async function expectCobaltFocus(page: Page, locator: Locator) {
  await page.keyboard.press('Tab');
  await locator.focus();
  await expect(locator).toBeFocused();
  const focus = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      width: style.outlineWidth,
      style: style.outlineStyle,
      offset: style.outlineOffset,
    };
  });
  expect(focus).toEqual({ width: '2px', style: 'solid', offset: '2px' });
}

test('initial HTML and hydration expose one synchronized 25-district Explorer', async ({
  page,
}, testInfo) => {
  const assertNoRuntimeFailures = observeRuntimeFailures(page);
  const response = await page.goto('/kr/seoul/explore/');

  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Explore',
  })).toBeAttached();
  await expect(page.locator('[data-explorer-layout="list"]')).toBeVisible();
  await expect(page.locator('[data-explorer-region="map"]')).toHaveCount(0);
  await expect(page.locator('[data-district-option]')).toHaveCount(25);
  const jongnoRow = page.locator('[data-district-option="jongno-gu"]');
  await expect(page.getByRole('combobox', { name: 'All 25 Seoul districts' })).toHaveValue('all');
  await expect(jongnoRow).toContainText('Jongno-gu');
  await expect(jongnoRow).toHaveAttribute('title', /종로구/);
  await expect(page.locator('[data-district-browser="seoul"]')).toBeVisible();

  await page.getByRole('combobox', { name: 'All 25 Seoul districts' }).selectOption('gangnam-gu');
  await expect(page).toHaveURL(/district=gangnam-gu/);
  await expect(page.getByText('Selected · Gangnam-gu')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'All 25 Seoul districts' })).toHaveValue('gangnam-gu');
  await expect(page.locator('[data-building-browser="gangnam-gu"]')).toBeVisible();
  await expectNoHorizontalOverflow(page);

  if (testInfo.project.name === 'desktop-chromium') {
    const htmlResponse = await page.request.get('/kr/seoul/explore/');
    expect(htmlResponse.status()).toBe(200);
    const html = await htmlResponse.text();
    expect((html.match(/data-district-option=/g) ?? [])).toHaveLength(25);
  }
  assertNoRuntimeFailures();
});

test('default list keeps rows compact, saveable, and free of map requests', async ({ page }) => {
  test.skip(releaseTarget.usesExternalServer, 'Synthetic media and row counts are local-release only.');
  const mapRequests: string[] = [];
  page.on('request', request => {
    if (/naver-district-map|maps\.googleapis|openapi\.map\.naver/i.test(request.url())) mapRequests.push(request.url());
  });
  await page.goto('/kr/seoul/explore/?district=jongno-gu');

  await expect(page.locator('[data-explorer-layout="list"]')).toBeVisible();
  const rowCount = await page.locator('[data-building-row]').count();
  expect(rowCount).toBeGreaterThan(0);
  expect(rowCount).toBeLessThanOrEqual(20);
  const firstRow = page.locator('[data-building-row]').first();
  await expect(firstRow.getByRole('link').first()).toHaveAttribute(
    'href',
    /\/kr\/seoul\/explore\/[^/?]+\/[^/?]+(?:\/|\?)/,
  );
  await expect(firstRow.getByRole('button', { name: /^Save / })).toBeVisible();
  await firstRow.getByRole('button', { name: /^Save / }).click();
  await expect(firstRow.getByRole('button', { name: /^Remove / })).toHaveAttribute('aria-pressed', 'true');
  expect(mapRequests).toEqual([]);
});

test('synthetic release fixture keeps withheld district selection money-free', async ({
  page,
}) => {
  test.skip(releaseTarget.usesExternalServer, 'Exact fixture values are local-release only.');
  await page.goto('/kr/seoul/explore/');

  await expect(page.getByText('Map legend', { exact: true })).toHaveCount(0);
  const withheldRow = page.locator(`[data-district-option="${PUBLIC_AREA_WITHHELD_SLUG}"]`);
  await expect(withheldRow).toHaveAttribute('title', /Not published/);
  await page.getByRole('combobox', { name: 'All 25 Seoul districts' }).selectOption(PUBLIC_AREA_WITHHELD_SLUG);
  const selectedSummary = page.locator('summary').filter({ hasText: 'Selected ·' });
  await expect(selectedSummary).toContainText('4 reported contracts');
  await expect(selectedSummary).not.toContainText('₩');
});

test('rail selection opens the map-owned drawer and full-detail CTA', async ({ page }, testInfo) => {
  test.skip(releaseTarget.usesExternalServer, 'Exact fixture values are local-release only.');
  await page.goto('/kr/seoul/explore/?district=jongno-gu&view=split');

  const trigger = page.locator(`[data-building-row="${PUBLIC_BUILDING_TEST_ID}"] [data-building-preview]`);
  const title = page.locator(`[data-building-row="${PUBLIC_BUILDING_TEST_ID}"] strong[title]`).first();
  await expect(title).toHaveCSS('white-space', 'normal');
  await expect(title).toHaveCSS('word-break', 'keep-all');
  await expect(title).toHaveAttribute('title', /.+/);
  await trigger.click();
  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/\?.*buildingId=/);
  const drawer = page.locator(`[data-building-drawer="${PUBLIC_BUILDING_TEST_ID}"]`);
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveAttribute('role', 'complementary');
  await expect(drawer).toHaveAttribute('data-selection-presentation', 'map-drawer');
  const panel = drawer.locator(`[data-building-panel="${PUBLIC_BUILDING_TEST_ID}"]`);
  await expect(panel).toBeVisible();
  await expect(drawer.getByRole('link', { name: 'Open full building evidence' }).first())
    .toHaveAttribute('href', `${PUBLIC_BUILDING_TEST_SELECTION_HREF}&view=split&transaction=sale`);
  const drawerBox = await drawer.boundingBox();
  expect(drawerBox).not.toBeNull();
  if (testInfo.project.name === 'desktop-chromium') {
    const mapBox = await page.locator('[data-explorer-region="map"]').boundingBox();
    expect(mapBox).not.toBeNull();
    expect(Math.abs(drawerBox!.width - 420)).toBeLessThanOrEqual(2);
    expect(drawerBox!.x + drawerBox!.width).toBeLessThanOrEqual(mapBox!.x + mapBox!.width + 2);
  } else if (testInfo.project.name === 'mobile-chromium') {
    const placement = await drawer.evaluate((element) => {
      const style = getComputedStyle(element);
      return { position: style.position, bottom: style.bottom };
    });
    expect(placement).toEqual({ position: 'fixed', bottom: '0px' });
    expect(Math.abs(drawerBox!.width - 390)).toBeLessThanOrEqual(1);
  }
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await expect(page).not.toHaveURL(/buildingId=/);
  await expect(trigger).toBeFocused();
});

test('restores a verified building selection after opening Detail and returning', async ({ page }) => {
  test.skip(releaseTarget.usesExternalServer, 'Exact fixture values are local-release only.');
  await page.goto(`/kr/seoul/explore/?district=jongno-gu&neighborhood=sajik-dong&buildingId=${PUBLIC_BUILDING_TEST_ID}`);

  const row = page.locator(`[data-building-row="${PUBLIC_BUILDING_TEST_ID}"]`).first();
  await expect(row.locator('[data-building-preview]')).toHaveAttribute('aria-pressed', 'true');
  const drawer = page.locator(`[data-building-drawer="${PUBLIC_BUILDING_TEST_ID}"]`);
  await expect(drawer).toBeVisible();

  await drawer.getByRole('link', { name: 'Open full building evidence' }).first().click();
  await expect(page.locator('[data-building-detail="ready"]')).toBeVisible();
  const back = page.getByRole('link', { name: 'Back to Jongno-gu Explore' }).first();
  await expect(back).toHaveAttribute('href', new RegExp(`buildingId=${PUBLIC_BUILDING_TEST_ID}`));
  await back.click();

  await expect(page).toHaveURL(new RegExp(`district=jongno-gu.*buildingId=${PUBLIC_BUILDING_TEST_ID}`));
  await expect(page.locator(`[data-building-drawer="${PUBLIC_BUILDING_TEST_ID}"]`)).toBeVisible();
  await expect(page.locator(`[data-building-row="${PUBLIC_BUILDING_TEST_ID}"]`).first().locator('[data-building-preview]'))
    .toHaveAttribute('aria-pressed', 'true');
});

test('district selection stays inside the Explore workspace', async ({ page }) => {
  await page.goto('/kr/seoul/explore/?district=jongno-gu');

  const districtDirectory = page.getByRole('combobox', { name: 'All 25 Seoul districts' });
  await expect(districtDirectory).toBeVisible();
  await districtDirectory.selectOption('gangnam-gu');

  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/\?.*district=gangnam-gu/);
  expect(new URL(page.url()).pathname).toBe('/kr/seoul/explore/');
  await expect(page.getByText('Selected · Gangnam-gu')).toBeVisible();
  await expect(page.locator('[data-explorer-layout="list"]')).toBeVisible();
});

test('published sale detail links to Contract Check and withheld district statistics stay money-free', async ({ page }) => {
  const assertNoRuntimeFailures = observeRuntimeFailures(page);
  await page.goto('/kr/seoul/explore/');
  await expect(page.getByRole('combobox', { name: 'All 25 Seoul districts' })).toBeVisible();

  const publishedSlug = await page.locator('[data-district-option][title*="₩"]')
    .first()
    .getAttribute('data-district-option');
  expect(publishedSlug).not.toBeNull();
  if (publishedSlug === null) throw new Error('A published district is required.');

  await page.goto(`/kr/seoul/explore/${publishedSlug}/`);
  await expect(page.locator('[data-district-detail="published"]')).toBeVisible();
  // Sale distributions must not expose the legacy refundable-deposit calculator.
  // Local quote editing is covered by public-quote.spec.ts on the current Check route.
  await expect(page.locator('input[name="quote"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Compare a contract', exact: true }))
    .toHaveAttribute('href', '/kr/seoul/check/');
  await expect(page.getByRole('link', { name: 'Back to Seoul map' }))
    .toHaveAttribute('href', `/kr/seoul/explore/?district=${publishedSlug}`);

  await page.goto('/kr/seoul/explore/');
  const withheldOptions = page.locator('[data-district-option][title*="Not published"]');
  const withheldSlug = await withheldOptions.count() > 0
    ? await withheldOptions.first().getAttribute('data-district-option') : null;
  if (withheldSlug !== null) {
    await page.goto(`/kr/seoul/explore/${withheldSlug}/`);
    await expect(page.locator('[data-district-detail="withheld"]')).toBeVisible();
    await expect(page.locator('input[name="quote"]')).toHaveCount(0);
    // Other named districts may show their own published comparisons.
    await expect(page.locator('#overview')).not.toContainText('₩');
    await expect(page.locator('#distribution')).not.toContainText('₩');
    const structuredData = await page.locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(structuredData.join('\n')).not.toMatch(/"(?:min|p25|med|p75|max|chg3m)"|₩/);
  }
  assertNoRuntimeFailures();
});

test('mobile controls keep 44px focus targets and natural document scrolling', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium');
  await page.goto('/kr/seoul/explore/');

  const workspace = page.locator('[data-explorer-layout="list"]');
  const discoveryRail = workspace.locator(':scope > [data-explorer-region="results"]');
  await expect(discoveryRail).toBeVisible();
  const railPlacement = await discoveryRail.evaluate((element) => {
    const style = getComputedStyle(element);
    return { position: style.position, maxHeight: style.maxHeight };
  });
  expect(railPlacement.position).toBe('static');
  expect(railPlacement.maxHeight).toBe('none');

  const navigation = await openPrimaryNavigation(page);
  const exploreTab = navigation.getByRole('link', { name: 'Explore' });
  const viewTabs = page.getByRole('navigation', { name: 'Explorer view' }).getByRole('link');
  const districtLink = page.getByRole('combobox', { name: 'All 25 Seoul districts' });
  await expectTouchTarget(exploreTab);
  await expectCobaltFocus(page, exploreTab);
  await exploreTab.press('Escape');
  await expect(page.locator('header.site-header details.site-header__mobile-menu')).not.toHaveAttribute('open', '');
  await expectTouchTarget(districtLink);
  await expectCobaltFocus(page, districtLink);
  await districtLink.selectOption('jongno-gu');
  await expect(page).toHaveURL(/district=jongno-gu/);
  const detailLink = page.locator('[data-building-row]').first().getByRole('link');
  await expectTouchTarget(detailLink);
  await expectCobaltFocus(page, detailLink);
  const firstResult = page.locator('[data-building-row]').first();
  const saveControl = firstResult.locator('[data-building-save]');
  const previewControl = firstResult.locator('[data-building-preview]');
  const saveSize = await saveControl.boundingBox();
  const previewSize = await previewControl.boundingBox();
  expect(saveSize).not.toBeNull();
  expect(previewSize).not.toBeNull();
  expect(Math.abs(saveSize!.width - previewSize!.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(saveSize!.height - previewSize!.height)).toBeLessThanOrEqual(1);
  expect(await saveControl.evaluate(element => getComputedStyle(element).fontSize))
    .toBe(await previewControl.evaluate(element => getComputedStyle(element).fontSize));
  await expect(viewTabs).toHaveCount(2);
  for (let index = 0; index < 2; index += 1) await expectTouchTarget(viewTabs.nth(index));
  await page.getByText('More views', { exact: true }).click();
  const additionalViews = page.getByRole('navigation', { name: 'Additional explorer views' }).getByRole('link');
  await expect(additionalViews).toHaveCount(2);
  for (let index = 0; index < 2; index += 1) await expectTouchTarget(additionalViews.nth(index));
  await page.getByText('More views', { exact: true }).click();
  await expectNoHorizontalOverflow(page);
  const scroll = await page.evaluate(() => {
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    const before = window.scrollY;
    window.scrollTo(0, document.documentElement.scrollHeight);
    const result = {
      before,
      after: window.scrollY,
      height: document.documentElement.scrollHeight,
      viewport: window.innerHeight,
    };
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
    return result;
  });
  expect(scroll.height).toBeGreaterThan(scroll.viewport);
  expect(scroll.after).toBeGreaterThan(scroll.before);
});

test('an unknown ready-fixture pair keeps Explore usable at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto('/kr/seoul/explore/?district=gangnam-gu&station=missing&stationDistance=250');
  expect(response?.status()).toBe(200);
  await page.locator('details > summary').filter({ hasText: /^Filters$/ }).click();
  await expect(page.locator('[data-proximity-selectors="enabled"]')).toBeVisible();
  await expect(page.locator('[data-building-browser="gangnam-gu"]')).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const htmlResponse = await page.request.get('/kr/seoul/explore/?district=gangnam-gu&station=missing&stationDistance=250');
  expect(htmlResponse.status()).toBe(200);
  const html = await htmlResponse.text();
  expect(html).toContain('data-proximity-selectors="enabled"');
});

test('ready injected proximity fixture keeps controls touch-sized and round-trips pairs', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/kr/seoul/explore/?district=jongno-gu');
  await page.locator('details > summary').filter({ hasText: /^Filters$/ }).click();
  const selectors = page.locator('[data-proximity-selectors="enabled"] select');
  await expect(selectors).toHaveCount(4);
  for (const index of [0, 1, 2, 3]) await expectTouchTarget(selectors.nth(index));
  await selectors.nth(0).selectOption('e2e-station');
  await expect(page).toHaveURL(/station=e2e-station.*stationDistance=500/);
  await selectors.nth(1).selectOption('750');
  await expect(page).toHaveURL(/station=e2e-station.*stationDistance=750/);
  await selectors.nth(2).selectOption('e2e-school');
  await expect(page).toHaveURL(/station=e2e-station.*stationDistance=750.*school=e2e-school.*schoolDistance=500/);
  await selectors.nth(3).selectOption('1000');
  await expect(page).toHaveURL(/school=e2e-school.*schoolDistance=1000/);
  await expect(page.locator('[data-building-browser="jongno-gu"]')).toContainText('E2E Station');
  await page.locator('[data-building-row="synthetic-test-building"] [data-building-preview]').click();
  const detail = page.getByRole('link', { name: 'Open full building evidence' }).first();
  await expect(detail).toHaveAttribute('href', /station=e2e-station.*stationDistance=750.*school=e2e-school.*schoolDistance=1000/);
  await detail.click();
  await expect(page.locator('[data-building-detail="ready"]')).toBeVisible();
  const back = page.getByRole('link', { name: 'Back to Jongno-gu Explore' });
  await expect(back)
    .toHaveAttribute('href', /station=e2e-station.*stationDistance=750.*school=e2e-school.*schoolDistance=1000/);
  await back.click();
  await expect(page).toHaveURL(/station=e2e-station.*stationDistance=750.*school=e2e-school.*schoolDistance=1000/);
  await selectors.nth(0).selectOption('');
  await expect(page).not.toHaveURL(/station=/);
  await expect(page).not.toHaveURL(/stationDistance=/);
  await expect(page).toHaveURL(/school=e2e-school.*schoolDistance=1000/);
  await selectors.nth(2).selectOption('');
  await expect(page).not.toHaveURL(/school=/);
  await expect(page).not.toHaveURL(/schoolDistance=/);
  await expectNoHorizontalOverflow(page);
});

test('wide workspace keeps map and district controls contained', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'wide-chromium');
  await page.goto('/kr/seoul/explore/');

  await expect(page.getByText('Map legend', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'All 25 Seoul districts' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('each view link renders only its supplied Explore surface', async ({ page }) => {
  await page.goto('/kr/seoul/explore/');

  const views = page.getByRole('navigation', { name: 'Explorer view' });
  await views.getByRole('link', { name: 'List' }).click();
  await expect(page.locator('[data-explorer-layout="list"]')).toBeVisible();
  await expect(page.locator('[data-explorer-region="results"]').first()).toBeVisible();
  await expect(page.locator('[data-explorer-region="map"]')).toHaveCount(0);

  await page.getByText('More views', { exact: true }).click();
  await page.getByRole('navigation', { name: 'Additional explorer views' }).getByRole('link', { name: 'Table' }).click();
  await expect(page.locator('[data-building-table="filtered"]')).toBeVisible();
  await expect(page.locator('[data-explorer-region="results"]')).toHaveCount(0);
  await expect(page.locator('[data-explorer-region="map"]')).toHaveCount(0);

  await views.getByRole('link', { name: 'Map' }).click();
  await expect(page.locator('[data-explorer-layout="map"]')).toBeVisible();
  await expect(page.locator('[data-explorer-region="map"]')).toBeVisible();
  await expect(page.locator('[data-explorer-region="results"]')).toHaveCount(0);

  await page.getByText('More views', { exact: true }).click();
  await page.getByRole('navigation', { name: 'Additional explorer views' }).getByRole('link', { name: 'Split' }).click();
  await expect(page.locator('[data-explorer-layout="split"]')).toBeVisible();
  await expect(page.locator('[data-explorer-region="results"]').first()).toBeVisible();
  await expect(page.locator('[data-explorer-region="map"]')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('unsupported intent pages never relabel district artifact money', async ({ page }) => {
  test.skip(releaseTarget.usesExternalServer, 'Sentinel assertions use the local fixture.');
  for (const path of ['/kr/seoul/rent/', '/kr/seoul/buy/', '/kr/seoul/invest/']) {
    await page.goto(path);
    await expect(page.locator('body')).not.toContainText('₩500,000,000');
    await expect(page.locator('body')).not.toContainText('₩700,000,000');
  }
});

test('journey: Explore selection survives Detail, Check, and the return link', async ({ page }) => {
  test.skip(releaseTarget.usesExternalServer, 'Synthetic journey evidence is local-release only.');
  await page.goto('/kr/seoul/explore/?transaction=monthly&propertyType=apartment&district=jongno-gu&view=split');

  const selectionRequests: string[] = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (request.headers()['rsc'] === '1' && url.pathname === '/kr/seoul/explore/' && url.searchParams.get('buildingId') === 'synthetic-test-building') selectionRequests.push(request.url());
  });
  const row = page.locator('[data-building-row="synthetic-test-building"]');
  await row.locator('[data-building-preview]').click();
  await expect(page.locator('[data-map-evidence="selected-building"]')).toBeAttached();
  expect(selectionRequests).toEqual([]);
  await expect(page).toHaveURL(/transaction=monthly.*propertyType=apartment.*district=jongno-gu.*buildingId=synthetic-test-building/);
  const selectedExploreUrl = new URL(page.url());
  const drawer = page.locator('[data-building-drawer="synthetic-test-building"]');
  await expect(drawer).toBeVisible();
  await drawer.getByRole('link', { name: 'Open full building evidence' }).click();
  await expect(page.locator('[data-building-detail="ready"], [data-building-detail="exact-evidence"]')).toBeVisible();
  const detailUrl = new URL(page.url());

  await page.getByRole('link', { name: 'Compare an asking price', exact: true }).click();
  await expect(page).toHaveURL(/market=kr-seoul.*entity=synthetic-test-building.*returnTo=/);
  const checkUrl = new URL(page.url());
  const returnTo = new URL(checkUrl.searchParams.get('returnTo')!, checkUrl.origin);
  expect(returnTo.pathname).toBe(detailUrl.pathname);
  for (const [key, value] of selectedExploreUrl.searchParams) {
    expect(returnTo.searchParams.get(key), `Check preserves ${key}`).toBe(value);
  }
  const returnLink = page.getByRole('link', { name: /Return to / }).first();
  await expect(returnLink).toHaveAttribute('href', `${returnTo.pathname}${returnTo.search}`);
  await returnLink.click();
  await expect(page.locator('[data-building-detail="ready"], [data-building-detail="exact-evidence"]')).toBeVisible();
  await page.getByRole('link', { name: /Back to .* Explore/ }).click();
  await expect(page).toHaveURL(selectedExploreUrl.href);
  await expect(drawer).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(selectedExploreUrl.href);
  await expect(drawer).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
