import { expect, test, type Page } from '@playwright/test';

const guides = [
  ['compare-two-contracts', 'Compare two rental contracts on one basis'],
  ['read-district-evidence', 'Read Seoul district evidence without overclaiming'],
  ['understand-publication-limits', 'Understand publication limits and refusals'],
] as const;

async function expectContained(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
}

test('Guide index and documents remain complete, indexable, and keyboard reachable', async ({ page }) => {
  await page.goto('/kr/seoul/guide/');
  await expect(page).toHaveURL(/\/guides\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  for (const [slug] of guides) {
    await page.goto(`/kr/seoul/guide/${slug}/`);
    await expect(page).toHaveURL(/\/guides\/$/);
  }
  const guide = page.getByRole('link', { name: 'Read guide', exact: true }).first();
  const href = await guide.getAttribute('href');
  expect(href).toMatch(/^\/guides\/.+\/$/);
  await guide.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sources', exact: true })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index,\s*follow$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://www.signedprice.com${href}`);
  await expectContained(page);
});
