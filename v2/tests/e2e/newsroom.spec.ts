import { expect, test, type Page } from '@playwright/test';
import type { NewsWorkspaceModel } from '../../apps/web/lib/news/news-workspace-model';
import { openPrimaryNavigation } from './navigation-helpers';

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
    overflowing: [...document.querySelectorAll('body *')].flatMap((element) => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.right > document.documentElement.clientWidth + 1
        ? [{ tag: element.tagName, className: element.className, right: Math.round(box.right) }] : [];
    }).slice(0, 8),
  }));
  expect(dimensions.scroll, JSON.stringify(dimensions.overflowing)).toBeLessThanOrEqual(dimensions.client);
}

test('News & Insights opens the unified hub and preserves the filter journey', async ({ page }) => {
  await page.goto('/prices/');
  await (await openPrimaryNavigation(page)).getByRole('link', { name: 'Insights', exact: true }).click();
  await expect(page).toHaveURL(/\/news\/$/);
  await expect(page.locator('header.site-header:visible details.site-header__mobile-menu')).not.toHaveAttribute('open', '');
  await expect(page.getByRole('heading', { level: 1, name: 'News & Insights', exact: true })).toBeVisible();
  const types = page.getByRole('navigation', { name: 'News and insight types' });
  await expect(types.getByRole('link', { name: 'Insights', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('navigation', { name: 'Insight types' }).getByRole('link', { name: 'Market Insight', exact: true }).click();
  await expect(page).toHaveURL(/\/news\/\?type=market$/);
  await expect(types.getByRole('link', { name: 'Insights', exact: true })).toHaveAttribute('aria-current', 'page');
  await types.getByRole('link', { name: 'News', exact: true }).click();
  await expect(page).toHaveURL(/\/news\/\?type=news$/);
  await expect(page.getByRole('heading', { level: 2, name: 'Latest news', exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('Newsroom filters reviewed SignedPrice records and opens the policy lifecycle', async ({ page }) => {
  await page.goto('/news/');

  await expect(page).toHaveTitle(/Property news, policy and market insights/);
  await expect(page.getByRole('heading', { level: 1, name: 'News & Insights', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'News and insight types' }).getByRole('link')).toHaveCount(3);
  await expect(page.getByRole('navigation', { name: 'News markets' }).getByRole('link')).toHaveText(['All', 'Seoul', 'Singapore', 'Dubai', 'Tokyo']);
  await expect(page.locator('[data-newsroom-lead]')).toHaveCount(1);
  await expect(page.locator('body')).not.toContainText(/provider|credential|ingestion|Naver News API/i);

  await page.getByRole('link', { name: 'Open the Policy Tracker', exact: true }).click();
  await expect(page).toHaveURL(/\/news\/policy\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Follow the date a housing rule actually changes.' })).toBeVisible();
  await expect(page.getByText('Announced', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Effective', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Last checked', { exact: true })).toHaveCount(0);

  await page.getByRole('link', { name: 'Singapore ABSD: current buyer-profile check' }).click();
  await expect(page).toHaveURL(/\/news\/policy\/singapore-absd-policy-status\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Singapore ABSD: the tax that can change your home budget' })).toBeVisible();
  await expect(page.getByRole('table').filter({ hasText: 'S$900,000' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Sources' })).toBeVisible();
  await expect(page.locator('section[aria-labelledby="article-sources-title"] a').first()).toHaveAttribute('href', /^https:\/\//);
  await expectNoHorizontalOverflow(page);
});

test('archived English Insights article redirects once to the reviewed News index', async ({ request }) => {
  const response = await request.get('/insights/median-is-a-boundary-not-a-home-valuation/', {
    maxRedirects: 0,
  });

  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe('/news/');
});

test('Newsroom mobile filters remain touch-sized and contained', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium');
  await page.goto('/news/');
  await expect(page.locator('[data-newsroom-layout="research"]')).toBeVisible();

  const filters = page.locator('nav[aria-label="News and insight types"] a, nav[aria-label="News markets"] a');
  for (const filter of await filters.all()) {
    const box = await filter.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await expectNoHorizontalOverflow(page);
});

test('News uses the shared readable type and restrained frame', async ({ page }, testInfo) => {
  await page.goto('/news/');
  await expect(page.locator('[data-newsroom-layout="research"]')).toBeVisible();

  const values = await page.locator('[data-newsroom-layout="research"]').evaluate((main) => {
    const root = getComputedStyle(document.documentElement);
    const heading = main.querySelector('h1');
    const summary = main.querySelector('[data-research-page-heading] > p');
    const typeFilter = main.querySelector('nav[aria-label="News and insight types"] a');
    const marketFilter = main.querySelector('nav[aria-label="News markets"] a');
    if (heading === null || summary === null || typeFilter === null || marketFilter === null) {
      throw new Error('News hierarchy is incomplete');
    }
    return {
      bodySize: root.getPropertyValue('--body-size').trim(),
      uiSize: root.getPropertyValue('--ui-size').trim(),
      readingFrame: root.getPropertyValue('--research-reading-frame').trim(),
      headingSize: Number.parseFloat(getComputedStyle(heading).fontSize),
      summarySize: Number.parseFloat(getComputedStyle(summary).fontSize),
      typeFilterSize: Number.parseFloat(getComputedStyle(typeFilter).fontSize),
      marketFilterSize: Number.parseFloat(getComputedStyle(marketFilter).fontSize),
      typeFilterHeight: typeFilter.getBoundingClientRect().height,
      marketFilterHeight: marketFilter.getBoundingClientRect().height,
    };
  });

  expect(values.bodySize).toBe('1rem');
  expect(Number.parseFloat(values.uiSize)).toBe(0.875);
  expect(values.readingFrame).toBe('720px');
  if (testInfo.project.name === 'desktop-chromium' || testInfo.project.name === 'wide-chromium') {
    // The September polish deliberately reduces oversized page headings.
    expect(values.headingSize).toBe(40);
  } else {
    expect(values.headingSize).toBeGreaterThanOrEqual(30);
    expect(values.headingSize).toBeLessThanOrEqual(40);
  }
  expect(values.summarySize).toBeGreaterThanOrEqual(16);
  expect(values.typeFilterSize).toBeGreaterThanOrEqual(14);
  expect(values.marketFilterSize).toBeGreaterThanOrEqual(14);
  expect(values.typeFilterHeight).toBeGreaterThanOrEqual(44);
  expect(values.marketFilterHeight).toBeGreaterThanOrEqual(44);
});

test('external headlines survive market filtering and open the original publisher', async ({ page }) => {
  const reviewedHeadlines = {
    naverState: 'ready', items: [
      { id: 'external-sg', market: 'singapore', marketLabel: 'Singapore', title: 'Singapore housing release', publisher: 'URA', publishedAt: '2026-09-06T00:00:00Z', sourceKind: 'google-news-rss', url: 'https://www.ura.gov.sg/news/media/pr26-57/', summary: 'Reviewed housing release.', internalHref: null, category: 'news-brief', evidence: 'checking', evidenceLine: 'External source reviewed for published content' },
      { id: 'external-kr', market: 'seoul', marketLabel: 'Seoul', title: 'Seoul housing update', publisher: 'MOLIT', publishedAt: '2026-09-05T00:00:00Z', sourceKind: 'naver-search', url: 'https://www.molit.go.kr/', summary: 'Reviewed housing update.', internalHref: null, category: 'news-brief', evidence: 'checking', evidenceLine: 'External source reviewed for published content' },
    ],
  } satisfies NewsWorkspaceModel;
  await page.route('**/api/news/', (route) => route.fulfill({ json: reviewedHeadlines }));
  await page.goto('/news/');
  await expect(page.getByRole('heading', { name: 'Latest news', exact: true })).toBeVisible();
  await page.getByRole('navigation', { name: 'News and insight types' }).getByRole('link', { name: 'News', exact: true }).click();
  await expect(page).toHaveURL(/type=news/);
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Singapore housing release' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Seoul housing update' })).toBeVisible();
  await page.getByRole('navigation', { name: 'News markets' }).getByRole('link', { name: 'Singapore', exact: true }).click();
  await expect(page).toHaveURL(/type=news&market=singapore/);
  await expect(page.getByRole('link', { name: 'Singapore housing release' })).toHaveAttribute('href', 'https://www.ura.gov.sg/news/media/pr26-57/');
  await expect(page.getByRole('link', { name: 'Seoul housing update' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Singapore housing release' })).toHaveAttribute('target', '_blank');
  await page.context().route('https://www.ura.gov.sg/news/media/pr26-57/', (route) => route.fulfill({
    contentType: 'text/html', body: '<h1>Original publisher release</h1>',
  }));
  const [publisher] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('link', { name: 'Singapore housing release' }).click(),
  ]);
  await expect(publisher).toHaveURL('https://www.ura.gov.sg/news/media/pr26-57/');
  await publisher.close();
  await expectNoHorizontalOverflow(page);
});

test('News & Insights and Guides keep the same global header and the guide highlights Guides', async ({ page }) => {
  await page.goto('/news/');
  let navigation = await openPrimaryNavigation(page);
  const newsLabels = await navigation.innerText();
  await navigation.getByRole('link', { name: 'Guides', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Buying & renting guides', exact: true, level: 1 })).toBeVisible();
  navigation = await openPrimaryNavigation(page);
  await expect(navigation).toHaveText(newsLabels, { useInnerText: true });
  const mobileMenu = page.locator('header.site-header details.site-header__mobile-menu[open]');
  if (await mobileMenu.isVisible()) {
    await mobileMenu.locator('summary').press('Escape');
    await expect(page.locator('header.site-header details.site-header__mobile-menu')).not.toHaveAttribute('open', '');
  }
  await page.getByRole('link', { name: /Buying property in Korea as a foreigner/ }).click();
  navigation = await openPrimaryNavigation(page);
  await expect(navigation.getByRole('link', { name: 'Guides', exact: true })).toHaveAttribute('aria-current', 'page');
  const openedMenu = page.locator('header.site-header details.site-header__mobile-menu[open]');
  if (await openedMenu.isVisible()) await openedMenu.locator('summary').press('Escape');
  const contents = page.locator('details[data-article-contents]');
  await expect(contents).not.toHaveAttribute('open', '');
  await contents.locator('summary').click();
  await expect(contents.getByRole('navigation', { name: 'Contents', exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('Tokyo city journey opens its own article, chapters and Korean translation', async ({ page }) => {
  await page.goto('/news/?market=tokyo');
  const lead = page.locator('[data-newsroom-lead]');
  await expect(lead).toContainText("A Tokyo neighbourhood you will want to come home to");
  await page.getByRole('tab', { name: /Where\?/ }).click();
  await expect(page.getByRole('tabpanel')).toContainText("Compare Nakameguro, Kiyosumi Shirakawa and Kagurazaka through the journeys you actually make, then check the street and building.");
  await page.getByRole('tabpanel').getByRole('link', { name: /Read this article/ }).click();
  await expect(page).toHaveURL(/\/news\/city-stories\/tokyo\/where\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText("Choose the railway, then the street");
  await expect.poll(() => page.locator('main img').first().evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expectNoHorizontalOverflow(page);
  await page.goto('/ko/news/city-stories/seoul/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('성수가 좋아서 시작한, 서울 내 집 찾기');
  await expect(page.locator('main img').first()).toBeVisible();
  await expect(page.locator('main')).not.toContainText('직접 방문해 작성한 취재기는 아닙니다');
  await page.getByRole('link', { name: /Explore에서 지역과 가격 비교하기/ }).click();
  await expect(page).toHaveURL(/\/ko\/kr\/seoul\/explore\/$/);
  await expectNoHorizontalOverflow(page);
});

test('mobile menu and Explore fit the screen before and after opening navigation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium');
  for (const path of ['/news/', '/kr/seoul/explore/', '/sg/singapore/explore/']) {
    await page.goto(path);
    const menu = page.locator('header.site-header details.site-header__mobile-menu');
    const summary = menu.locator('summary');
    const box = await summary.boundingBox();
    const width = page.viewportSize()!.width;
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    await summary.click();
    await expect(menu).toHaveAttribute('open', '');
    const panel = menu.locator('.site-header__mobile-panel');
    await expect(panel).toBeVisible();
    const bounds = await panel.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await testInfo.attach(`mobile-menu-${path.replaceAll('/', '-')}`, { body: await page.screenshot({fullPage:false}), contentType: 'image/png' });
    await summary.press('Escape');
    await expect(menu).not.toHaveAttribute('open', '');
    await expectNoHorizontalOverflow(page);
    await testInfo.attach(`mobile-page-${path.replaceAll('/', '-')}`, { body: await page.screenshot({fullPage:true}), contentType: 'image/png' });
  }
});
