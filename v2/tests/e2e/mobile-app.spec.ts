import { expect, test } from '@playwright/test';

for (const locale of [
  { path: '/saved/', manifest: 'en', title: 'Keep your places close', instructions: 'How to install' },
  { path: '/ko/saved/', manifest: 'ko', title: '관심 있는 곳을 더 가까이', instructions: '설치 방법' },
  { path: '/zh-cn/saved/', manifest: 'zh-CN', title: '更方便地查看收藏', instructions: '安装方法' },
]) {
  test(`Saved offers localized installation guidance at ${locale.path}`, async ({ page, request }) => {
    await page.goto(locale.path);
    const card = page.locator('[data-mobile-app-install]');
    await expect(card).toContainText(locale.title);
    await card.locator('summary').filter({ hasText: locale.instructions }).click();
    await expect(card).toContainText('Safari');
    await expect(page.locator('[data-mobile-app-navigation]')).toBeHidden();
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', `/app-manifest/${locale.manifest}/`);
    const response = await request.get(`/app-manifest/${locale.manifest}/`);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('application/manifest+json');
    const manifest = await response.json();
    expect(manifest.start_url).toBe(locale.path.replace('/saved/', '/prices/'));
    for (const icon of manifest.icons) {
      const image = await request.get(icon.src);
      expect(image.ok()).toBe(true);
      expect(image.headers()['content-type']).toContain('image/png');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

// Browser-owned prompts are represented by a fixture event. These cases verify
// our UI lifecycle, not Chrome install eligibility or an OS installation.
for (const outcome of ['accepted', 'dismissed', 'error'] as const) {
  test(`installation UI handles ${outcome} without reusing the prompt`, async ({ page }) => {
    await page.goto('/ko/saved/');
    const card = page.locator('[data-mobile-app-install]');
    await expect(card).toBeVisible();
    await expect.poll(async () => page.evaluate((result) => {
      const event = new Event('beforeinstallprompt', { cancelable: true });
      Object.assign(event, {
        prompt: async () => { if (result === 'error') throw new Error('Fixture prompt unavailable'); },
        userChoice: Promise.resolve({ outcome: result === 'accepted' ? 'accepted' : 'dismissed' }),
      });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    }, outcome)).toBe(true);
    const button = card.getByRole('button', { name: '홈 화면에 추가', exact: true });
    await button.click();
    await expect(card.getByRole('status')).toHaveText(outcome === 'accepted'
      ? '설치를 요청했어요. 브라우저 안내를 따라주세요.'
      : '브라우저 메뉴에서도 홈 화면에 추가할 수 있어요.');
    await expect(button).toHaveCount(0);
    await card.locator('summary').click();
    await expect(card).toContainText('Safari');
  });
}
