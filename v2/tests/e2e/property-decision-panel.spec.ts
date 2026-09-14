import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { PropertyReview } from '../../apps/web/lib/research/property-review';

const namedPath = '/jp/tokyo/explore/properties/jp-park-tower-kachidoki/';
const seoulPath = '/kr/seoul/explore/songpa-gu/songpa-gu-1j88w6f/';
const seoulEntity = 'kr-seoul:estate:songpa-gu-1j88w6f';
const sidePanel = (page: Page) => page.locator('[data-decision-panel="side"]');
const modalPanel = (page: Page) => page.locator('dialog[data-decision-panel="modal"]');
const mainData = (page: Page) => page.locator('[data-decision-main="true"]');
const mainEvidence = (page: Page) => mainData(page).locator('h1, #property-facts, table, dl').allTextContents();

const seoulReviews = JSON.parse(readFileSync(new URL('../../apps/web/content/property-reviews/seoul.json', import.meta.url), 'utf8')) as PropertyReview[];
const helioReview = seoulReviews.find(review => review.id === 'kr-helio-city')!;
const helioResponse = {
  status: 'ready',
  profiles: [{
    id: helioReview.id,
    market_id: helioReview.marketId,
    name_ko: helioReview.name.ko,
    canonical_name: helioReview.name.en,
    area: helioReview.area.en,
    headline: helioReview.verdict.en,
    checked_on: helioReview.checkedOn,
    identity_note: 'Named property research; the linked entity identifies Helio City.',
    publication_status: 'published',
    linked_entity_ids: [seoulEntity],
    facts: [],
    analysis: [],
    field_checks: [],
    sources: Object.fromEntries(helioReview.sources.map(source => [source.id, {
      title: source.title, url: source.url, scope: source.note.en, checked_on: source.checkedOn,
    }])),
    review: helioReview,
  }],
};

async function expectContained(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}

async function selectPerspective(panel: Locator, label: string) {
  await panel.getByText(label, { exact: true }).click();
  await expect(panel.getByRole('radio', { name: label, exact: true })).toBeChecked();
}

test('desktop report opens beside the property data and all three perspectives change its advice', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop layout is exercised at 1366px.');
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto(`${namedPath}?year=2025&quarter=4&minArea=50`);
  const panel = sidePanel(page);
  const main = mainData(page);
  await expect(panel).toBeVisible();
  await expect(main.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(panel.getByRole('heading', { name: '5 priorities for this property', exact: true })).toBeAttached();
  await expect(panel.locator('ol > li')).toHaveCount(5);
  await expect(panel.getByRole('radio')).toHaveCount(3);
  await expect(main).toContainText('MLIT publishes transactions without building names.');

  const geometry = await main.evaluate(element => {
    const data = element.getBoundingClientRect();
    const report = document.querySelector('[data-decision-panel="side"]')!.getBoundingClientRect();
    return { dataWidth: data.width, dataRight: data.right, panelLeft: report.left, panelRight: report.right, dataTop: data.top, panelTop: report.top };
  });
  expect(geometry.dataWidth).toBeGreaterThan(550);
  expect(geometry.dataRight).toBeLessThanOrEqual(geometry.panelLeft);
  expect(geometry.panelRight).toBeLessThanOrEqual(1366);
  expect(Math.abs(geometry.dataTop - geometry.panelTop)).toBeLessThan(40);

  const originalData = await mainEvidence(page);
  const originalUrl = page.url();
  const advice = new Set<string>();
  const priorities = new Set<string>();
  for (const perspective of ['With children', 'Couple / solo', 'Rental / investment']) {
    await selectPerspective(panel, perspective);
    advice.add((await panel.locator('section[aria-live="polite"]').innerText()).trim());
    priorities.add((await panel.locator('ol').innerText()).trim());
    await expect(panel.locator('ol > li')).toHaveCount(5);
    expect(await mainEvidence(page)).toEqual(originalData);
    expect(page.url()).toBe(originalUrl);
  }
  expect(advice.size).toBe(3);
  expect(priorities.size).toBeGreaterThan(1);

  // Scrolling the report must not move the main data page.
  const documentScroll = await page.evaluate(() => window.scrollY);
  await panel.locator('ol > li').last().scrollIntoViewIfNeeded();
  expect(Math.abs(await page.evaluate(() => window.scrollY) - documentScroll)).toBeLessThanOrEqual(2);
  await expectContained(page);
});

test('desktop close, legacy links and expanded report keep the data mounted and restore focus', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Expanded desktop report has a separate control.');
  await page.goto(`${namedPath}?year=2025&quarter=4#property-review`);
  const panel = sidePanel(page);
  const main = mainData(page);
  await expect(panel.locator('[data-property-decision]')).toBeVisible();
  const mountedData = await main.elementHandle();
  const alreadyOpenLink = main.locator('a[href="#property-review"]').first();
  await alreadyOpenLink.focus();
  await alreadyOpenLink.press('Enter');
  await expect(panel.getByRole('heading', { level: 2 })).toBeFocused();
  await selectPerspective(panel, 'Rental / investment');
  await panel.getByRole('button', { name: 'Close decision panel', exact: true }).click();
  await expect(panel).toHaveCount(0);
  const trigger = page.getByRole('button', { name: 'View buying decision', exact: true });
  await expect(trigger).toBeFocused();
  expect(new URL(page.url()).hash).toBe('');

  const legacy = main.locator('a[href="#property-review"]').first();
  await legacy.scrollIntoViewIfNeeded();
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await legacy.click();
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('radio', { name: 'Rental / investment', exact: true })).toBeChecked();
  expect(new URL(page.url()).hash).toBe('#property-review');
  expect(new URL(page.url()).search).toBe('?year=2025&quarter=4');
  expect(Math.abs(await page.evaluate(() => window.scrollY) - scrollBefore)).toBeLessThanOrEqual(2);

  await panel.getByRole('button', { name: 'Expand report', exact: true }).click();
  const dialog = modalPanel(page);
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(element => element.matches(':modal'))).toBe(true);
  await expect(sidePanel(page)).toHaveCount(0);
  await expect(dialog.getByRole('radio', { name: 'Rental / investment', exact: true })).toBeChecked();
  expect(await mountedData!.evaluate(element => element.isConnected)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(main.getByRole('heading', { level: 1 })).toBeAttached();
  expect(new URL(page.url()).search).toBe('?year=2025&quarter=4');
});

test('mobile report opens on demand, traps focus, locks the background and retains perspective across resize', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile dialog is exercised at 390px.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(namedPath);
  const trigger = page.getByRole('button', { name: 'View buying decision', exact: true });
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('[data-decision-panel]')).toHaveCount(0);
  const mountedData = await mainData(page).elementHandle();
  const originalData = await mainEvidence(page);
  await trigger.click();
  const dialog = modalPanel(page);
  await expect(dialog.locator('[data-property-decision]')).toBeVisible();
  expect(await dialog.evaluate(element => element.matches(':modal'))).toBe(true);
  const bounds = await dialog.boundingBox();
  expect(bounds!.width).toBe(390);
  expect(bounds!.height).toBe(844);
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');

  const close = dialog.getByRole('button', { name: 'Close decision panel', exact: true });
  const last = dialog.getByRole('link', { name: 'Compare alternatives', exact: true });
  await last.focus();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(last).toBeFocused();
  await selectPerspective(dialog, 'Rental / investment');

  await page.setViewportSize({ width: 1366, height: 900 });
  await expect(dialog).toHaveCount(0);
  await expect(sidePanel(page)).toBeVisible();
  await expect(sidePanel(page).getByRole('radio', { name: 'Rental / investment', exact: true })).toBeChecked();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('radio', { name: 'Rental / investment', exact: true })).toBeChecked();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await mountedData!.evaluate(element => element.isConnected)).toBe(true);
  expect(await mainEvidence(page)).toEqual(originalData);
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
  await expectContained(page);
});

const locales = [
  { prefix: '', open: 'View buying decision', group: 'Your perspective', personas: ['With children', 'Couple / solo', 'Rental / investment'], priorities: '5 priorities for this property', compare: 'Compare alternatives' },
  { prefix: '/ko', open: '매수 판단 보기', group: '누구의 관점으로 볼까요', personas: ['자녀 있는 실거주', '신혼·1인', '임대·투자'], priorities: '먼저 볼 5가지', compare: '다른 단지와 비교' },
  { prefix: '/zh-cn', open: '查看购房判断', group: '您的购房目的', personas: ['有子女自住', '夫妻 · 单身', '出租 · 投资'], priorities: '优先考虑的 5 个问题', compare: '比较其他项目' },
] as const;

for (const locale of locales) {
  test(`${locale.prefix || '/en'} report controls and comparison links retain the selected language`, async ({ page, isMobile }) => {
    await page.goto(`${locale.prefix}${namedPath}`);
    if (isMobile) await page.getByRole('button', { name: locale.open, exact: true }).click();
    const panel = isMobile ? modalPanel(page) : sidePanel(page);
    await expect(panel.getByRole('group', { name: locale.group, exact: true })).toBeVisible();
    for (const name of locale.personas) await expect(panel.getByRole('radio', { name, exact: true })).toHaveCount(1);
    await expect(panel.getByRole('heading', { name: locale.priorities, exact: true })).toBeAttached();
    await expect(panel.locator('ol > li')).toHaveCount(5);
    await selectPerspective(panel, locale.personas[1]);
    await expect(panel.getByRole('link', { name: locale.compare, exact: true })).toHaveAttribute('href', `${locale.prefix}/jp/tokyo/shortlist/`);
    await expectContained(page);
  });
}

test('a failed research request can be retried while Seoul data and its selected conditions stay available', async ({ page, isMobile }) => {
  // The standard release fixture intentionally contains only a synthetic Seoul
  // building. This case also runs against checked-in-data/preview servers where
  // the real review-linked Helio City identity is available.
  const routeResponse = await page.request.get(seoulPath);
  test.skip(routeResponse.status() === 404, 'This fixture has no review-linked Seoul building.');
  expect(routeResponse.status()).toBe(200);

  let releaseFailure!: () => void;
  const pending = new Promise<void>(resolve => { releaseFailure = resolve; });
  let recovered = false;
  let attempts = 0;
  await page.route('**/api/living-context/?**', async route => {
    if (new URL(route.request().url()).searchParams.get('entity') !== seoulEntity) return route.continue();
    attempts += 1;
    if (!recovered) {
      await pending;
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ status: 'unavailable' }) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(helioResponse) });
    }
  });
  await page.goto(`${seoulPath}?transaction=sale&area=60-85`);
  if (isMobile) await page.getByRole('button', { name: 'View buying decision', exact: true }).click();
  const panel = isMobile ? modalPanel(page) : sidePanel(page);
  await expect(panel.getByRole('status')).toContainText('Loading the property analysis.');
  releaseFailure();
  await expect(panel.getByRole('status')).toContainText('The analysis could not be loaded');
  const main = mainData(page);
  await expect(main.getByRole('heading', { level: 1 })).toBeAttached();
  const before = await mainEvidence(page);
  const selectedLinks = await main.locator('a[aria-current="true"]').evaluateAll(links => links.map(link => link.getAttribute('href')));
  recovered = true;
  await panel.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(panel.locator('[data-property-decision="kr-helio-city"]')).toBeVisible();
  await expect(panel.locator('ol > li')).toHaveCount(5);
  expect(attempts).toBeGreaterThanOrEqual(2);
  await selectPerspective(panel, 'Rental / investment');
  expect(await mainEvidence(page)).toEqual(before);
  expect(await main.locator('a[aria-current="true"]').evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(selectedLinks);
  expect(new URL(page.url()).search).toBe('?transaction=sale&area=60-85');
});
