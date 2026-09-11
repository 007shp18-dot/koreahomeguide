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

test('Insights keeps discovery simple and city selection works', async ({ page }) => {
  await page.goto('/prices/');
  await (await openPrimaryNavigation(page)).getByRole('link', { name: 'Insights', exact: true }).click();
  await expect(page).toHaveURL(/\/news\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Insights', exact: true })).toBeVisible();
  const cities = page.getByRole('navigation', { name: 'Insight cities' });
  await expect(cities.getByRole('link')).toHaveText(['All', 'Seoul', 'Singapore', 'Dubai', 'Tokyo']);
  await expect(page.locator('main article:visible')).toHaveCount(7);
  await page.locator('summary').filter({ hasText: 'More stories' }).click();
  expect(await page.locator('main article:visible').count()).toBeGreaterThan(7);
  await cities.getByRole('link', { name: 'Tokyo', exact: true }).click();
  await expect(page).toHaveURL(/market=tokyo/);
  await expect(page.locator('main article[data-editorial-market]:not([data-editorial-market="jp-tokyo"])')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test('Newsroom filters reviewed SignedPrice records and opens the policy lifecycle', async ({ page }) => {
  await page.goto('/news/');

  await expect(page).toHaveTitle(/Insights/);
  await expect(page.getByRole('heading', { level: 1, name: 'Insights', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Insight cities' }).getByRole('link')).toHaveCount(5);
  await expect(page.getByRole('navigation', { name: 'Insight cities' }).getByRole('link')).toHaveText(['All', 'Seoul', 'Singapore', 'Dubai', 'Tokyo']);
  await expect(page.locator('[data-newsroom-lead]')).toHaveCount(1);
  await expect(page.locator('body')).not.toContainText(/provider|credential|ingestion|Naver News API/i);

  await page.goto('/news/?type=policy');
  await expect(page).toHaveURL(/\/news\/\?type=policy$/);
  await page.getByRole('link', { name: 'Policy tracker', exact: true }).click();
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
  await expect(page.locator('[data-newsroom-layout="insights"]')).toBeVisible();

  const filters = page.locator('nav[aria-label="Insight cities"] a');
  for (const filter of await filters.all()) {
    const box = await filter.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await expectNoHorizontalOverflow(page);
});

test('Insights type and image layout stays readable across viewports', async ({ page }) => {
  await page.goto('/news/');
  const main = page.locator('[data-newsroom-layout="insights"]');
  await expect(main).toBeVisible();
  const values = await main.evaluate(main => {
    const heading = main.querySelector('h1')!;
    const deck = main.querySelector('header > p')!;
    const filter = main.querySelector('nav a')!;
    return { heading: parseFloat(getComputedStyle(heading).fontSize), deck: parseFloat(getComputedStyle(deck).fontSize), filter: parseFloat(getComputedStyle(filter).fontSize), height: filter.getBoundingClientRect().height };
  });
  expect(values.heading).toBeGreaterThanOrEqual(40);
  expect(values.heading).toBeLessThanOrEqual(60);
  expect(values.deck).toBeGreaterThanOrEqual(15);
  expect(values.filter).toBeGreaterThanOrEqual(14);
  expect(values.height).toBeGreaterThanOrEqual(44);
  await expectNoHorizontalOverflow(page);
});

test('external headlines survive market filtering and open the original publisher', async ({ page }) => {
  const reviewedHeadlines = {
    naverState: 'ready', items: [
      { id: 'external-sg', market: 'singapore', marketLabel: 'Singapore', title: 'Singapore housing release', publisher: 'URA', publishedAt: '2026-09-06T00:00:00Z', sourceKind: 'google-news-rss', url: 'https://www.ura.gov.sg/news/media/pr26-57/', summary: 'Reviewed housing release.', internalHref: null, category: 'news-brief', evidence: 'checking', evidenceLine: 'External source reviewed for published content' },
      { id: 'external-kr', market: 'seoul', marketLabel: 'Seoul', title: 'Seoul housing update', publisher: 'MOLIT', publishedAt: '2026-09-05T00:00:00Z', sourceKind: 'naver-search', url: 'https://www.molit.go.kr/', summary: 'Reviewed housing update.', internalHref: null, category: 'news-brief', evidence: 'checking', evidenceLine: 'External source reviewed for published content' },
    ],
  } satisfies NewsWorkspaceModel;
  await page.route('**/api/news/', (route) => route.fulfill({ json: reviewedHeadlines }));
  await page.goto('/news/?type=news');
  await expect(page.getByRole('heading', { name: 'News', exact: true, level: 1 })).toBeVisible();
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
  await expect(page.getByRole('heading', { name: 'Guides', exact: true, level: 1 })).toBeVisible();
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
  await expect(lead).toHaveAttribute('data-editorial-market', 'jp-tokyo');
  await expect(lead.getByRole('link', { name: /Read the story/ })).toHaveAttribute('href', /\/news\/(neighbourhoods|city-stories)\//);
  await expect(page.getByText('View the buying steps', { exact: true })).toHaveCount(0);
  await page.goto('/news/city-stories/tokyo/where/');
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
    await expect(summary).toBeVisible();
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
