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
  {
    path: '/trust/',
    heading: 'How SignedPrice publishes evidence',
    robots: /^index,\s*follow$/,
    canonical: 'https://www.signedprice.com/trust/',
  },
  {
    path: '/kr/seoul/corrections/',
    heading: 'Seoul evidence corrections',
    robots: /^noindex,\s*follow$/,
    canonical: null,
  },
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
      route.robots,
    );
    if (route.canonical === null) {
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    } else {
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        route.canonical,
      );
    }
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

test('Seoul market hub is a terminal self-canonical page', async ({ request }) => {
  const response = await request.get('/kr/seoul/', { maxRedirects: 0 });
  const html = await response.text();

  expect(response.status()).toBe(200);
  expect(html).toMatch(/<h1[^>]*>Seoul<\/h1>/);
  expect(html).toContain(
    '<link rel="canonical" href="https://www.signedprice.com/kr/seoul/"',
  );
});

test('legacy Seoul check permanently redirects to the working Rent Check', async ({ request }) => {
  const response = await request.get('/kr/check/seoul/', { maxRedirects: 0 });

  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe('/kr/seoul/tools/rent-check/');
});

test('English and Korean routes emit the correct root document language', async ({ request }) => {
  for (const path of ['/ko/kr/seoul/', '/ko/kr/seoul/explore/', '/ko/kr/seoul/rankings/']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('<html lang="ko">');
  }

  const english = await request.get('/kr/seoul/');
  expect(english.status()).toBe(200);
  expect(await english.text()).toContain('<html lang="en">');
});

test('social metadata and image endpoints match each route language', async ({ request }) => {
  for (const [path, locale, imagePath] of [
    ['/kr/seoul/', 'en_US', '/og/en/'],
    ['/ko/kr/seoul/', 'ko_KR', '/og/ko/'],
  ] as const) {
    const page = await request.get(path);
    const html = await page.text();
    expect(page.status()).toBe(200);
    expect(html).toContain(`property="og:locale" content="${locale}"`);
    expect(html).toContain(`property="og:image" content="https://www.signedprice.com${imagePath}"`);
    expect(html).toContain('name="twitter:card" content="summary_large_image"');

    const image = await request.get(imagePath);
    expect(image.status()).toBe(200);
    expect(image.headers()['content-type']).toContain('image/png');
    expect(image.headers()['cache-control']).toContain('stale-while-revalidate=604800');
  }
});
