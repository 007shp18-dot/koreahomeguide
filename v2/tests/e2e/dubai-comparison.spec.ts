import { expect, test } from '@playwright/test';

test.skip(process.env.SIGNEDPRICE_TEST_DUBAI_COMPARISON !== 'true', 'Runs in the dedicated Dubai evidence job; the general release fixture withholds Dubai prices.');

test('Dubai comparison saves and reopens without data or map requests', async ({ page }, testInfo) => {
  await page.goto('/ae/dubai/explore/');
  const add = page.getByRole('button', { name: /^Add to comparison:/ });
  await expect(add.first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Compare (0/3)', exact: true })).toHaveCount(0);
  const photo = page.locator('[data-dubai-area-photo="marsa-dubai"] img');
  await expect(photo).toHaveAttribute('loading', 'lazy');
  const photoUrl = new URL((await photo.getAttribute('src'))!, page.url());
  expect(photoUrl.origin).toBe(new URL(page.url()).origin);
  expect(photoUrl.pathname).toBe('/assets/dubai-areas/marsa-dubai-thumb.webp');
  await expect(photo).toBeVisible();
  await photo.scrollIntoViewIfNeeded();
  await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('dubai-photo-directory.png'), fullPage: true });
  // Complete hydration and initial assets before measuring the new actions.
  await page.waitForLoadState('networkidle');
  const requests: string[] = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/api/') || /maps\.(googleapis|gstatic)\.com/.test(url.hostname) || request.resourceType() === 'document') requests.push(request.url());
  });
  await add.nth(0).click();
  await add.nth(0).click();
  await page.getByRole('button', { name: 'Compare (2/3)', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Compare areas' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('row', { name: /^Median sale price AED/ })).toBeVisible();
  await expect(dialog.getByText('Ready · sale', { exact: false })).toBeVisible();
  await dialog.getByRole('button', { name: 'Save comparison', exact: true }).click();
  await expect(dialog.getByRole('status')).toHaveText('Comparison saved in this browser.');
  const shared = page.url();
  expect(new URL(shared).hash).toMatch(/^#compare=/);
  await testInfo.attach('dubai-comparison', { body: await page.screenshot(), contentType: 'image/png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await dialog.getByRole('button', { name: 'Back to Explore', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByText('Saved comparisons (1)', { exact: true }).click();
  await page.locator('details').filter({ hasText: 'Saved comparisons (1)' }).getByRole('button').first().click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  expect(requests).toEqual([]);
  await page.goto(shared);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('columnheader')).toHaveCount(3);
});

test('Dubai caps candidates at three and handles off-plan and old shared periods', async ({ page }) => {
  await page.goto('/ae/dubai/explore/');
  const add = page.getByRole('button', { name: /^Add to comparison:/ });
  for (let i = 0; i < 3; i++) await add.first().click();
  await expect(add.first()).toBeDisabled();
  await page.getByRole('button', { name: 'Compare (3/3)', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('columnheader')).toHaveCount(4);
  await page.keyboard.press('Escape');
  const hash = '#compare=' + encodeURIComponent(JSON.stringify({ areas: ['marsa-dubai', 'nonexistent-area'], housing: 'apartment', stage: 'off-plan', from: '2020-01-01', to: '2020-03-01' }));
  await page.goto('/ko/ae/dubai/explore/' + hash);
  const dialog = page.getByRole('dialog', { name: '지역 비교' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('분양 · 매매', { exact: false })).toBeVisible();
  await expect(dialog.getByText('연간 임대료 중앙값')).toHaveCount(0);
  await expect(dialog.getByText('현재 미공개 지역')).toBeVisible();
  await expect(dialog.getByText('저장·공유 당시와 공개 기간이 달라졌습니다. 아래에는 현재 공개 자료를 표시합니다.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Explore로 돌아가기', exact: true }).click();
  await expect(page.getByRole('tab', { name: '완공 주택', exact: true })).toHaveAttribute('aria-selected', 'true');
});
