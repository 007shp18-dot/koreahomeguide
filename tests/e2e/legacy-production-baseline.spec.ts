import { expect, test } from '@playwright/test';

const {
  BROWSER_BASELINE_SCHEMA_VERSION,
  PRODUCTION_BASE_URL,
  resolveBrowserEvidencePath,
  writeBrowserEvidence
} = require('../../scripts/v2-migration/browser-baseline-schema.cjs');

const baseUrl = process.env.LEGACY_BASE_URL || PRODUCTION_BASE_URL;
const evidencePath = resolveBrowserEvidencePath(process.cwd(), {
  baseUrl,
  configuredPath:process.env.LEGACY_EVIDENCE_PATH
});

function cleanConsoleMessage(message: string) {
  return message
    .replace(/https?:\/\/[^\s)]+/g, '<url>')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '<ip>')
    .replace(/(cookie|authorization|token|secret)=\S+/gi, '$1=<redacted>');
}

function sameBox(left: { x: number; y: number; width: number; height: number } | null, right: { x: number; y: number; width: number; height: number } | null) {
  return left !== null && right !== null
    && left.x === right.x && left.y === right.y
    && left.width === right.width && left.height === right.height;
}

function expectUsableBox(box: { x: number; y: number; width: number; height: number } | null, viewport: { width: number; height: number }) {
  expect(box).not.toBeNull();
  if (!box) return;
  expect(box.width).toBeGreaterThan(0);
  expect(box.height).toBeGreaterThan(0);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
}

test('freezes the Dongjak Noryangjin production explorer and Rent Check contract', async ({ page }) => {
  const consoleErrors: Array<{ source: string; message: string }> = [];
  page.on('console', message => {
    if (message.type() === 'error') {
      consoleErrors.push({ source:'browser-console', message:cleanConsoleMessage(message.text()) });
    }
  });

  const explorerResponse = await page.goto('/explore/?lawdCd=11590&type=officetel');
  expect(explorerResponse?.status()).toBe(200);
  await expect(page.locator('#explorerMap')).toBeVisible();
  const viewport = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const mapBox = await page.locator('#explorerMap').boundingBox();
  expectUsableBox(mapBox, viewport);

  const noryangjin = page.getByRole('button', { name: /노량진동|Noryangjin-dong/ });
  await noryangjin.click();
  await expect.poll(() => new URL(page.url()).searchParams.get('dong')).toBe('노량진동');
  const urlBeforeIdle = page.url();
  const stabilityStartedAt = Date.now();
  await page.waitForTimeout(10_000);
  const stabilityDurationMs = Date.now() - stabilityStartedAt;
  const urlAfterIdle = page.url();
  await expect(page).toHaveURL(urlBeforeIdle);

  const buildingRows = page.locator('.building-row[data-building-key]');
  await expect(buildingRows).toHaveCount(7);
  const buildingCount = await buildingRows.count();
  const centralBuilding = page.getByRole('button', { name: /Open 노량진 드림스퀘어 복합빌딩 building status/ });
  await centralBuilding.click();

  const dialog = page.getByRole('dialog', { name: /노량진 드림스퀘어 복합빌딩/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Street view near this building')).toBeVisible();
  const closeButton = page.getByRole('button', { name: 'Close building details' });
  await expect(closeButton).toBeVisible();
  const dialogBox = await page.locator('.building-status-window').boundingBox();
  expectUsableBox(dialogBox, viewport);
  if (dialogBox) {
    expect(Math.abs(dialogBox.x + dialogBox.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(2);
    expect(Math.abs(dialogBox.y + dialogBox.height / 2 - viewport.height / 2)).toBeLessThanOrEqual(2);
  }
  const streetView = page.locator('#explorerStreetView');
  await expect(streetView).toBeVisible();
  await page.waitForTimeout(2_000);
  const streetViewStateAt2Seconds = await streetView.getAttribute('data-state') || 'unknown';
  const streetViewBoxAt2Seconds = await page.locator('#explorerStreetViewFrame').boundingBox();
  expectUsableBox(streetViewBoxAt2Seconds, viewport);
  await page.waitForTimeout(6_000);
  await expect(streetView).toHaveAttribute('data-state', 'ready');
  const streetViewStateAt8Seconds = await streetView.getAttribute('data-state') || 'unknown';
  const streetViewBoxAt8Seconds = await page.locator('#explorerStreetViewFrame').boundingBox();
  expect(sameBox(streetViewBoxAt2Seconds, streetViewBoxAt8Seconds)).toBe(true);

  await closeButton.press('Escape');
  await expect(page.locator('.building-status-overlay')).toHaveAttribute('hidden', '');
  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toContain('Open 노량진 드림스퀘어 복합빌딩 building status');
  const activeElementLabel = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') || '');

  await centralBuilding.click();
  const rentCheckLink = page.getByRole('link', { name: /Check my quote/ });
  const [rentCheckResponse] = await Promise.all([
    page.waitForResponse(response => response.request().isNavigationRequest()
      && new URL(response.url()).pathname === '/tools/seoul-rent-check/'),
    rentCheckLink.click()
  ]);
  expect(rentCheckResponse.status()).toBe(200);
  await expect(page).toHaveURL(/\/tools\/seoul-rent-check\//);
  expect(new URL(page.url()).searchParams.get('lawdCd')).toBe('11590');
  await expect(page.locator('#rentCheckArea')).toHaveValue('11590');
  await expect(page.locator('.district-combobox-input')).toHaveValue('Dongjak-gu (동작구)');
  await expect(page.locator('#rentCheckType')).toHaveValue('officetel');

  const rentCheck = await page.evaluate(() => {
    const box = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
    };
    const status = document.querySelector('#rentCheckStatus');
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      pageScrollWidth: document.documentElement.scrollWidth,
      formBox: box('#rentCheckForm'),
      fieldBoxes: {
        area: box('.rent-check-area-field'),
        type: box('.rent-check-property-field'),
        deposit: box('.rent-check-deposit-field'),
        rent: box('.rent-check-monthly-field'),
        size: box('.rent-check-size-field'),
        submit: box('#rentCheckButton')
      },
      selectedDistrictControl: (document.querySelector('#rentCheckArea') as HTMLSelectElement | null)?.value || '',
      selectedDistrictLabel: (document.querySelector('.district-combobox-input') as HTMLInputElement | null)?.value || '',
      selectedType: (document.querySelector('#rentCheckType') as HTMLSelectElement | null)?.value || '',
      status: {
        state: status?.getAttribute('data-state') || 'idle',
        text: status?.textContent?.trim() || ''
      },
      resultHidden: document.querySelector('#rentCheckResult')?.hasAttribute('hidden') ?? null,
      leadCaptureHidden: document.querySelector('[data-lead-capture]')?.hasAttribute('hidden') ?? null,
      disclosures: Array.from(document.querySelectorAll('.tool-hero p, .rent-check-disclaimer, .tool-explainer p'))
        .map(element => element.textContent?.trim()).filter(Boolean)
    };
  });
  expect(rentCheck.pageScrollWidth).toBeLessThanOrEqual(rentCheck.viewport.width);
  expect(rentCheck.status.state).toBe('idle');
  expect(rentCheck.status.text).toContain('Enter the quote you received');
  expect(rentCheck.resultHidden).toBe(true);
  expect(rentCheck.leadCaptureHidden).toBe(true);
  for (const disclosure of [
    'Compare your quote with recent official contracts. See the verdict and comparable contracts before any email prompt.',
    'Official MOLIT transaction data. Market reference only; not an appraisal or legal advice.',
    'KoreaHomeGuide checks similar contracts in the same district and property category, starting with the most recent completed months. It widens the size and deposit range only when there are too few comparable contracts.',
    'Floor, exact condition, furnishings, maintenance fee, view, renovation status, and neighborhood differences can still affect rent. Treat this as a price check before you ask better questions—not as a valuation.'
  ]) expect(rentCheck.disclosures).toContain(disclosure);
  for (const box of Object.values(rentCheck.fieldBoxes)) expectUsableBox(box, rentCheck.viewport);

  writeBrowserEvidence(evidencePath, {
    schemaVersion:BROWSER_BASELINE_SCHEMA_VERSION,
    capturedAt:new Date().toISOString(),
    sourceRevision:process.env.LEGACY_SOURCE_REVISION || '4acbcca6476eabd9033915578f8c532cb2f581c8',
    runner:'playwright-chromium',
    targetBaseUrl:new URL(baseUrl).origin,
    explorer: {
      url:urlAfterIdle,
      pageAvailable:explorerResponse?.status() === 200,
      selectedDong:'노량진동',
      viewport,
      mapBox,
      selectionStability:{
        durationMs:stabilityDurationMs,
        urlBeforeIdle,
        urlAfterIdle
      },
      buildingCount,
      dialogBox,
      streetView:{
        stateAt2Seconds:streetViewStateAt2Seconds,
        stateAt8Seconds:streetViewStateAt8Seconds,
        boxAt2Seconds:streetViewBoxAt2Seconds,
        boxAt8Seconds:streetViewBoxAt8Seconds
      }
    },
    buildingModal:{
      closeButtonVisible:true,
      closeEscapeFocus:{
        overlayHidden:true,
        activeElementLabel
      }
    },
    rentCheck:{
      url:page.url(),
      pageAvailable:rentCheckResponse.status() === 200,
      ...rentCheck
    },
    consoleErrors
  });
});
