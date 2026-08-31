import { expect, test, type Page } from '@playwright/test';

import { hasComputedVisibleFocus, readComputedFocusPaint } from './focus-contract';

async function expectNoOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    bodyClient: document.body.clientWidth,
    bodyScroll: document.body.scrollWidth,
    rootClient: document.documentElement.clientWidth,
    rootScroll: document.documentElement.scrollWidth,
  }));
  expect(widths.bodyScroll).toBeLessThanOrEqual(widths.bodyClient);
  expect(widths.rootScroll).toBeLessThanOrEqual(widths.rootClient);
}

for (const route of [
  { path: '/trust/', heading: 'How SignedPrice publishes evidence' },
  { path: '/kr/seoul/corrections/', heading: 'Seoul evidence corrections' },
] as const) {
  test(`${route.path} exposes complete Trust HTML without runtime failure`, async ({
    page,
    request,
  }) => {
    const runtimeErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') runtimeErrors.push(message.text());
    });
    page.on('pageerror', (error) => runtimeErrors.push(error.message));

    const raw = await request.get(route.path);
    expect(raw.status()).toBe(200);
    const html = await raw.text();
    expect(html).toContain(route.heading);
    expect(html).not.toMatch(/191,067|8\.2%|most accurate|guaranteed/i);

    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /^noindex,\s*follow$/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
    await expectNoOverflow(page);
    expect(runtimeErrors).toEqual([]);
  });
}

test('Trust and correction actions remain keyboard-visible and touch sized', async ({ page }) => {
  await page.goto('/kr/seoul/corrections/');
  const actions = page.getByRole('navigation', { name: 'Related Seoul evidence' }).getByRole('link');
  await expect(actions).toHaveCount(2);

  for (const action of await actions.all()) {
    const box = await action.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await action.focus();
    expect(hasComputedVisibleFocus(await readComputedFocusPaint(action))).toBe(true);
  }
});
