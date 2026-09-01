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
  const navigation = page.getByRole('navigation', { name: 'Guide evidence links' });
  await expect(navigation.getByRole('link')).toHaveCount(3);
  await expect(navigation.getByRole('link', { name: 'Open Contract Check' }))
    .toHaveAttribute('href', '/kr/seoul/check/');
  await expect(navigation.getByRole('link', { name: 'Open District Explorer' }))
    .toHaveAttribute('href', '/kr/seoul/explore/');
  await expect(navigation.getByRole('link', { name: 'Read SignedPrice Trust' }))
    .toHaveAttribute('href', '/trust/');
  for (const [slug, title] of guides) {
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await page.goto(`/kr/seoul/guide/${slug}/`);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.getByText('Evidence boundary', { exact: true })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index,\s*follow$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://www.signedprice.com/kr/seoul/guide/${slug}/`,
    );
    await expectContained(page);
    await page.goto('/kr/seoul/guide/');
  }
});
