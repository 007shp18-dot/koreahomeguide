import { expect, test } from '@playwright/test';

test('four Explore markets share heading geometry and contained controls', async ({ page }, testInfo) => {
  const measurements: { size: string; weight: string; left: number }[] = [];
  for (const city of ['kr/seoul', 'sg/singapore', 'ae/dubai', 'jp/tokyo']) {
    await page.goto(`/${city}/explore/`);
    const heading = page.locator('.explore-page-heading h1');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText(city === 'jp/tokyo' ? 'Find a property' : 'Explore');
    measurements.push(await heading.evaluate(node => ({ size: getComputedStyle(node).fontSize, weight: getComputedStyle(node).fontWeight, left: node.getBoundingClientRect().left })));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await testInfo.attach(city.replace('/', '-') + '-explore', { body: await page.screenshot(), contentType: 'image/png' });
  }
  expect(new Set(measurements.map(item => item.size)).size).toBe(1);
  expect(new Set(measurements.map(item => item.weight)).size).toBe(1);
  expect(Math.max(...measurements.map(item => item.left)) - Math.min(...measurements.map(item => item.left))).toBeLessThanOrEqual(4);
});

test('Tokyo ward searches use the latest period unless the reader chooses an exact quarter', async ({ page }) => {
  await page.goto('/jp/tokyo/explore/?view=prices');
  const filters = page.getByRole('form', { name: 'Tokyo transaction filters' });
  for (const control of await filters.locator('input:not([type="checkbox"]):visible, select:visible, button:visible').all()) {
    const box = await control.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await filters.getByLabel('Neighbourhood, layout or built year').fill('2LDK');
  await filters.getByRole('combobox', { name: 'Ward', exact: true }).selectOption('13113');
  await filters.getByRole('button', { name: 'Explore transactions' }).click();
  await expect(page).toHaveURL(url => url.searchParams.get('city') === '13113'
    && url.searchParams.get('q') === '2LDK' && !url.searchParams.has('year') && !url.searchParams.has('quarter'));
  await expect(filters.getByLabel('Neighbourhood, layout or built year')).toHaveValue('2LDK');
  const latest = filters.getByRole('checkbox', { name: 'Latest available period for this ward' });
  if (!await latest.isVisible()) await filters.locator('summary').click();
  await expect(latest).toBeChecked();
  await expect(filters.getByRole('combobox', { name: 'Year', exact: true })).toBeDisabled();
  await latest.uncheck();
  await filters.getByRole('combobox', { name: 'Year', exact: true }).selectOption('2024');
  await filters.getByRole('combobox', { name: 'Quarter', exact: true }).selectOption('2');
  await filters.getByRole('button', { name: 'Explore transactions' }).click();
  await expect(page).toHaveURL(/city=13113.*year=2024.*quarter=2/);
  await expect(latest).not.toBeChecked();
  await expect(filters.getByRole('combobox', { name: 'Year', exact: true })).toHaveValue('2024');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});


test('recent places stay inside the Explore frame and preserve market history', async ({ page }) => {
  const paths = { seoul: '/kr/seoul/explore/', singapore: '/sg/singapore/explore/', dubai: '/ae/dubai/explore/', tokyo: '/jp/tokyo/explore/' };
  await page.addInitScript((paths) => {
    if (localStorage.getItem('signedprice_discovery_journal_v1')) return;
    localStorage.setItem('signedprice_discovery_journal_v1', JSON.stringify({ version: 1, notes: [], recent: Object.entries(paths).map(([market, href]) => ({ market, key: market, name: `${market} recent selection`, href, viewedAt: '2026-09-14T00:00:00.000Z' })) }));
  }, paths);
  for (const [market, path] of Object.entries(paths)) {
    await page.goto(`/ko${path}`);
    const recent = page.locator(`[data-recent-places="${market}"]`);
    await expect(recent).toBeVisible();
    const bounds = await recent.boundingBox();
    const heading = await page.locator('.explore-page-heading h1').boundingBox();
    expect(Math.abs(bounds!.x - heading!.x)).toBeLessThanOrEqual(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(recent.getByRole('link')).toHaveAttribute('href', `/ko${path}`);
    await recent.getByRole('button', { name: '기록 지우기' }).click();
    await expect(recent).toHaveCount(0);
  }
});

test('Tokyo properties can be found and opened directly, with readable compact property guidance', async ({ page }) => {
  await page.goto('/jp/tokyo/explore/');
  const directory = page.locator('[data-tokyo-property-directory]');
  await expect(directory.getByRole('link', { name: /View property/ })).toHaveCount(31);
  const filters = page.getByRole('form', { name: 'Find Tokyo properties' });
  await filters.getByRole('searchbox').fill('Park Tower Kachidoki');
  await filters.getByRole('button', { name: 'Find properties', exact: true }).click();
  const property = directory.getByRole('link', { name: /View property/ });
  await expect(property).toHaveCount(1);
  await property.click();
  await expect(page).toHaveURL(/\/jp\/tokyo\/explore\/properties\/jp-park-tower-kachidoki\//);
  const overview = page.locator('[data-property-overview="jp-park-tower-kachidoki"]').first();
  await expect(overview).toBeVisible();
  const paragraphs = overview.locator('[data-property-editorial] p');
  await expect(paragraphs).toHaveCount(3);
  await expect(paragraphs.first()).toContainText('Mid or South');
  await expect(paragraphs.last()).toContainText('have not established');
  const dimensions = await paragraphs.evaluateAll(nodes => nodes.map(node => ({
    width: node.scrollWidth, available: node.clientWidth,
  })));
  for (const dimension of dimensions) expect(dimension.width).toBeLessThanOrEqual(dimension.available + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
