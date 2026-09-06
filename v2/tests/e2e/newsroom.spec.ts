import { expect, test, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client);
}

test('Newsroom filters reviewed SignedPrice records and opens the policy lifecycle', async ({ page }) => {
  await page.goto('/news/');

  await expect(page).toHaveTitle(/Property policy, market news and data stories/);
  await expect(page.getByRole('heading', { level: 1, name: 'News' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'News types' }).getByRole('link')).toHaveCount(5);
  await expect(page.getByRole('navigation', { name: 'News markets' }).getByRole('link')).toHaveCount(3);
  await expect(page.locator('[data-newsroom-lead]')).toHaveCount(1);
  await expect(page.locator('body')).not.toContainText(/provider|credential|ingestion|Naver News API/i);

  await page.getByRole('link', { name: 'Open the Policy Tracker' }).click();
  await expect(page).toHaveURL(/\/news\/policy\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Follow the date a housing rule actually changes.' })).toBeVisible();
  await expect(page.getByText('Announced', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Effective', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Last checked', { exact: true }).first()).toBeVisible();

  await page.getByRole('link', { name: 'Singapore ABSD: current buyer-profile check' }).click();
  await expect(page).toHaveURL(/\/news\/policy\/singapore-absd-policy-status\/$/);
  await expect(page.getByRole('heading', { level: 2, name: 'What changed, in date order' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Open official record/ })).toHaveAttribute('href', /^https:\/\//);
  await expect(page.getByText(/not legal advice/)).toBeVisible();
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

  const filters = page.locator('nav[aria-label="News types"] a, nav[aria-label="News markets"] a');
  for (const filter of await filters.all()) {
    const box = await filter.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await expectNoHorizontalOverflow(page);
});

test('News uses the shared readable type and restrained frame', async ({ page }, testInfo) => {
  await page.goto('/news/');

  const values = await page.locator('[data-newsroom-layout="research"]').evaluate((main) => {
    const root = getComputedStyle(document.documentElement);
    const heading = main.querySelector('h1');
    const summary = main.querySelector('header > span');
    const typeFilter = main.querySelector('nav[aria-label="News types"] a');
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
    expect(values.headingSize).toBe(48);
  } else {
    expect(values.headingSize).toBeGreaterThanOrEqual(32);
  }
  expect(values.summarySize).toBeGreaterThanOrEqual(16);
  expect(values.typeFilterSize).toBeGreaterThanOrEqual(14);
  expect(values.marketFilterSize).toBeGreaterThanOrEqual(14);
  expect(values.typeFilterHeight).toBeGreaterThanOrEqual(44);
  expect(values.marketFilterHeight).toBeGreaterThanOrEqual(44);
});

test('external headlines survive market filtering and open the original publisher', async ({ page }) => {
  await page.route('**/api/news/', (route) => route.fulfill({ json: {
    naverState: 'ready', items: [
      { id: 'external-sg', market: 'singapore', marketLabel: 'Singapore', title: 'Singapore housing release', publisher: 'URA', publishedAt: '2026-09-06T00:00:00Z', sourceKind: 'google-news-rss', url: 'https://www.ura.gov.sg/news/media/pr26-57/' },
      { id: 'external-kr', market: 'seoul', marketLabel: 'Seoul', title: 'Seoul housing update', publisher: 'MOLIT', publishedAt: '2026-09-05T00:00:00Z', sourceKind: 'naver-search', url: 'https://www.molit.go.kr/' },
    ],
  } })));
  await page.goto('/news/');
  await expect(page.getByRole('link', { name: 'Singapore housing release' })).toBeVisible();
  await page.getByRole('navigation', { name: 'News types' }).getByRole('link', { name: 'External headlines' }).click();
  await page.getByRole('navigation', { name: 'News markets' }).getByRole('link', { name: 'Singapore', exact: true }).click();
  await expect(page).toHaveURL(/type=headlines&market=singapore/);
  await expect(page.getByRole('link', { name: 'Singapore housing release' })).toHaveAttribute('href', 'https://www.ura.gov.sg/news/media/pr26-57/');
  await expect(page.getByRole('link', { name: 'Seoul housing update' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Singapore housing release' })).toHaveAttribute('target', '_blank');
  await expectNoHorizontalOverflow(page);
});

test('News and Guides keep the same global header and the guide highlights Guides', async ({ page }) => {
  await page.goto('/news/');
  const nav = page.locator('[data-navigation-tier="global"]');
  const newsLabels = await nav.getByRole('navigation', { name: 'Primary navigation', exact: true }).innerText();
  await nav.getByRole('link', { name: 'Guides', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Guides', exact: true, level: 1 })).toBeVisible();
  await expect(nav.getByRole('navigation', { name: 'Primary navigation', exact: true })).toHaveText(newsLabels);
  await page.getByRole('link', { name: 'Read guide', exact: true }).first().click();
  await expect(nav.getByRole('link', { name: 'Guides', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('navigation', { name: 'In this article', exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
