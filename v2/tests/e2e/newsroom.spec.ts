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
  await expect(page.getByRole('heading', { level: 1, name: 'Property change, checked against evidence.' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'News types' }).getByRole('link')).toHaveCount(4);
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
