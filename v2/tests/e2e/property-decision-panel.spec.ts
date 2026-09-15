import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { PropertyReview } from '../../apps/web/lib/research/property-review';
import { DECISION_BUILDING_ENTITY, DECISION_BUILDING_PATH } from './property-decision-fixture';

const namedPath = '/jp/tokyo/explore/properties/jp-park-tower-kachidoki/';
const seoulPath = DECISION_BUILDING_PATH;
const seoulEntity = DECISION_BUILDING_ENTITY;
const sidePanel = (page: Page) => page.locator('[data-decision-panel="side"]');
const modalPanel = (page: Page) => page.locator('dialog[data-decision-panel="modal"]');
const mainData = (page: Page) => page.locator('[data-decision-main="true"]');
const mainEvidence = (page: Page) => mainData(page).locator('h1, #property-facts, table, dl').allTextContents();

const seoulReviews = JSON.parse(readFileSync(new URL('../../apps/web/content/property-reviews/seoul.json', import.meta.url), 'utf8')) as PropertyReview[];
const helioReview = seoulReviews.find(review => review.id === 'kr-helio-city')!;
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
  await expect(panel.getByRole('heading', { name: 'Before signing', exact: true })).toBeAttached();
  await expect(panel.locator('[data-signing-checklist] li')).toHaveCount(3);
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
  await test.info().attach('property-decision-desktop', { body: await page.screenshot(), contentType: 'image/png' });

  const originalData = await mainEvidence(page);
  const originalUrl = page.url();
  const advice = new Set<string>();
  const fixedContent = new Set<string>();
  for (const perspective of ['With children', 'Couple / solo', 'Rental / investment']) {
    await selectPerspective(panel, perspective);
    advice.add((await panel.locator('[data-decision-fit]').innerText()).trim());
    fixedContent.add((await panel.locator('[data-signing-checklist]').innerText()).trim());
    await expect(panel.locator('[data-signing-checklist] li')).toHaveCount(3);
    expect(await mainEvidence(page)).toEqual(originalData);
    expect(page.url()).toBe(originalUrl);
  }
  expect(advice.size).toBe(3);
  expect(fixedContent.size).toBe(1);

  // Scrolling the report must not move the main data page.
  const documentScroll = await page.evaluate(() => window.scrollY);
  await panel.locator('[data-signing-checklist] li').last().scrollIntoViewIfNeeded();
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
  await test.info().attach('property-decision-mobile', { body: await page.screenshot(), contentType: 'image/png' });

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
  { prefix: '', open: 'View buying decision', group: 'Your perspective', personas: ['With children', 'Couple / solo', 'Rental / investment'], priorities: 'Before signing', compare: 'Compare alternatives' },
  { prefix: '/ko', open: '매수 판단 보기', group: '누구의 관점으로 볼까요', personas: ['자녀 있는 실거주', '신혼·1인', '임대·투자'], priorities: '계약 전에 물어볼 것', compare: '다른 단지와 비교' },
  { prefix: '/zh-cn', open: '查看购房判断', group: '您的购房目的', personas: ['有子女自住', '夫妻 · 单身', '出租 · 投资'], priorities: '签约前的问题', compare: '比较其他项目' },
] as const;

for (const locale of locales) {
  test(`${locale.prefix || '/en'} report controls and comparison links retain the selected language`, async ({ page, isMobile }) => {
    await page.goto(`${locale.prefix}${namedPath}`);
    if (isMobile) await page.getByRole('button', { name: locale.open, exact: true }).click();
    const panel = isMobile ? modalPanel(page) : sidePanel(page);
    await expect(panel.getByRole('group', { name: locale.group, exact: true })).toBeVisible();
    for (const name of locale.personas) await expect(panel.getByRole('radio', { name, exact: true })).toHaveCount(1);
    await expect(panel.getByRole('heading', { name: locale.priorities, exact: true })).toBeAttached();
    await expect(panel.locator('[data-signing-checklist] li')).toHaveCount(3);
    await selectPerspective(panel, locale.personas[1]);
    await expect(panel.getByRole('link', { name: locale.compare, exact: true })).toHaveAttribute('href', `${locale.prefix}/jp/tokyo/shortlist/`);
    await expectContained(page);
  });
}

test('static Seoul research stays available when its optional API is unavailable', async ({ page, isMobile }) => {
  test.skip(process.env.SIGNEDPRICE_TEST_DECISION_PANEL !== 'true',
    'The dedicated panel run installs the exact checked-in Helio City cohort.');

  let attempts = 0;
  await page.route('**/api/living-context/?**', async route => {
    if (new URL(route.request().url()).searchParams.get('entity') !== seoulEntity) return route.continue();
    attempts += 1;
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ status: 'unavailable' }) });
  });
  const query = '?transaction=jeonse&mode=rent&contract=renewal';
  await page.goto(`${seoulPath}${query}`);
  const workspace = page.locator('[data-decision-workspace="true"]');
  const main = mainData(page);
  // A streamed not-found page may return HTTP 200. Require the real data surface
  // and hydrated cohort controls before testing the independent research retry.
  // Suspense fallbacks must not mount a second interactive decision workspace.
  await expect(workspace).toHaveCount(1);
  await expect(main).toHaveCount(1);
  await expect(main.getByRole('heading', { level: 1 })).toContainText(helioReview.name.ko);
  const rentTab = main.locator('#building-mode-rent-tab');
  const renewal = main.locator('[role="group"][aria-label="Rent contract cohort"] a[role="button"]', { hasText: 'Renewal' });
  await expect(rentTab).toHaveAttribute('aria-selected', 'true');
  await expect(renewal).toHaveAttribute('aria-pressed', 'true');
  const mountedData = await main.elementHandle();
  const mountedMain = await main.locator('main[data-building-detail]').elementHandle();
  if (isMobile) await page.getByRole('button', { name: 'View buying decision', exact: true }).click();
  const panel = isMobile ? modalPanel(page) : sidePanel(page);
  await expect(panel.locator('[data-property-decision="kr-helio-city"]')).toBeVisible();
  await expect(panel.getByRole('status')).toHaveCount(0);
  await expect(main.locator('h1')).toBeAttached();
  const before = await mainEvidence(page);
  const selectedControls = main.locator('a[aria-selected="true"], a[aria-pressed="true"]');
  await expect(selectedControls).toHaveCount(2);
  const selectedLinks = await selectedControls.evaluateAll(links => links.map(link => link.getAttribute('href')));
  await expect(panel.locator('[data-property-decision="kr-helio-city"]')).toBeVisible();
  await expect(panel.locator('[data-signing-checklist] li')).toHaveCount(3);
  expect(attempts).toBe(0);
  await expect(workspace).toHaveCount(1);
  await expect(main).toHaveCount(1);
  await expect(page.locator('[data-decision-panel]')).toHaveCount(1);
  await selectPerspective(panel, 'Rental / investment');
  expect(await mountedData!.evaluate(element => element.isConnected)).toBe(true);
  expect(await mountedMain!.evaluate(element => element.isConnected)).toBe(true);
  expect(await mainEvidence(page)).toEqual(before);
  await expect(rentTab).toHaveAttribute('aria-selected', 'true');
  await expect(renewal).toHaveAttribute('aria-pressed', 'true');
  expect(await selectedControls.evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(selectedLinks);
  await expect(workspace).toHaveCount(1);
  await expect(panel.getByRole('radio', { name: 'Rental / investment', exact: true })).toBeChecked();
  expect(new URL(page.url()).search).toBe(query);
});
