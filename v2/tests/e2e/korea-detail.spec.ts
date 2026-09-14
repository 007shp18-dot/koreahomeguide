import { emptyQuestions } from './questions-fixture';
import { expect, test, type Page } from '@playwright/test';

import { resolveReleaseTestTarget } from '../../release-test-target';
import {
  PUBLIC_BUILDING_TEST_NAME,
} from './public-building-summary-fixture';

const releaseTarget = resolveReleaseTestTarget();

test.beforeEach(async ({page})=>{await emptyQuestions(page);});

function observeFailures(page: Page) {
  const failures: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') failures.push(message.text()); });
  page.on('response', (response) => { if (response.status() >= 500) failures.push(response.url()); });
  return () => expect(failures).toEqual([]);
}

async function expectContained(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test('legacy district URLs open the current explorer and retain selection after reload', async ({ page }) => {
  const noFailures = observeFailures(page);
  await page.goto('/kr/seoul/explore/seongdong-gu/');
  await expect(page).toHaveURL(url => url.pathname === '/kr/seoul/explore/' && url.searchParams.get('district') === 'seongdong-gu');
  await expect(page.getByRole('combobox', { name: 'All 25 Seoul districts' })).toHaveValue('seongdong-gu');
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'All 25 Seoul districts' })).toHaveValue('seongdong-gu');
  await expect(page.locator('[data-detail-hero="district"]')).toHaveCount(0);
  await expectContained(page);
  noFailures();
});

test('legacy villa URLs retain locale, district and transaction in the current explorer', async ({ page }) => {
  const noFailures = observeFailures(page);
  await page.goto('/ko/kr/seoul/explore/seongdong-gu/villa/?transaction=jeonse');
  await expect(page).toHaveURL(url => url.pathname === '/ko/kr/seoul/explore/'
    && url.searchParams.get('district') === 'seongdong-gu'
    && url.searchParams.get('propertyType') === 'villa_multifamily'
    && url.searchParams.get('transaction') === 'jeonse');
  await expect(page.locator('[data-market-selection="kr:jeonse"]')).toBeVisible();
  await expect(page.locator('[data-detail-rail="true"]')).toHaveCount(0);
  await expectContained(page);
  noFailures();
});

test('verified synthetic building detail is server rendered only in the local release fixture', async ({ page }) => {
  test.skip(releaseTarget.usesExternalServer, 'Synthetic building exists only in the local release fixture.');
  const noFailures = observeFailures(page);
  const response = await page.goto('/kr/seoul/explore/jongno-gu/synthetic-test-building/');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: PUBLIC_BUILDING_TEST_NAME })).toBeVisible();
  await expect(page.getByRole('link', { name: /Back to .* Explore/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Compare an asking price', exact: true }).first()).toBeVisible();
  const hero = page.locator('[data-market-summary="true"]').filter({ visible: true });
  await expect(hero.locator('[data-detail-order="identity"]')).toBeVisible();
  await expect(page.locator('[data-location-fallback="true"]')).toBeVisible();
  await expect(page.locator('main [data-building-media="curated-market-photo"]')).toHaveCount(0);
  // Let Next finish replacing its streamed boundary before measuring the final
  // page. During the replacement both copies can briefly share the DOM.
  await expect(page.locator('template[id^="B:"]')).toHaveCount(0);
  const readyDetail = page.locator('main[data-building-detail="ready"]');
  await expect(readyDetail).toHaveCount(1);
  const layout = await readyDetail.evaluate((main) => {
    const identity = main.querySelector('[data-detail-order="identity"]')!;
    const evidence = main.querySelector('[data-detail-order="current-evidence"]')!;
    const history = main.querySelector('[data-detail-order="history"]')!;
    const source = main.querySelector('[data-detail-order="sources"]')!;
    return {
      identityBeforeEvidence: Boolean(identity.compareDocumentPosition(evidence) & Node.DOCUMENT_POSITION_FOLLOWING),
      historyBeforeSource: Boolean(history.compareDocumentPosition(source) & Node.DOCUMENT_POSITION_FOLLOWING),
      identityOverflow: identity.scrollWidth > identity.clientWidth + 1,
    };
  });
  expect(layout).toEqual({ identityBeforeEvidence: true, historyBeforeSource: true, identityOverflow: false });
  const evidence = page.locator('[data-building-section="evidence"]').filter({ visible: true });
  await expect(evidence.getByRole('heading', { level: 2, name: 'Privacy-safe reported contracts' })).toBeVisible();
  const extra = evidence.locator('details').filter({ has: page.getByText('Floor and size analysis and methodology', { exact: true }) });
  await expect(extra).not.toHaveAttribute('open', '');
  await extra.locator(':scope > summary').click();
  await expect(extra.getByRole('heading', { name: 'Floor adjustment evidence' })).toBeVisible();
  await extra.locator(':scope > summary').click();
  await expect(extra.getByRole('heading', { name: 'Floor adjustment evidence' })).not.toBeVisible();
  const headingSizes = await readyDetail.locator('h2').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).fontSize));
  expect(new Set(headingSizes).size).toBe(1);
  const values = await readyDetail.locator('dl dd').evaluateAll(nodes => nodes.map(node => ({ size: parseFloat(getComputedStyle(node).fontSize), weight: parseInt(getComputedStyle(node).fontWeight) })));
  expect(values.every(value => value.size === 16 && value.weight <= 600)).toBe(true);
  const relatedContext = page.getByRole('region', { name: 'Building news and community' });
  await expect(relatedContext).toContainText('Latest verified News');
  await expect(relatedContext).not.toContainText('Community signal');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^noindex,\s*follow$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  await expectContained(page);
  noFailures();
});
