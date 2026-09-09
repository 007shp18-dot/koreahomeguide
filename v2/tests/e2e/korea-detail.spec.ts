import { expect, test, type Page } from '@playwright/test';

import { resolveReleaseTestTarget } from '../../release-test-target';
import {
  PUBLIC_BUILDING_TEST_NAME,
} from './public-building-summary-fixture';

const releaseTarget = resolveReleaseTestTarget();

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

async function expectTouchTarget(page: Page, selector: string) {
  const target = page.locator(selector).first();
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
}

test('Explore selection opens a reload-safe district detail from the explicit evidence link', async ({ page }) => {
  const noFailures = observeFailures(page);
  await page.goto('/kr/seoul/explore/');
  await page.getByRole('combobox', { name: 'All 25 Seoul districts' }).selectOption('jongno-gu');
  await expect(page).toHaveURL(/district=jongno-gu/);
  await page.locator('summary').filter({ hasText: 'Selected · Jongno-gu' }).click();
  const detailLink = page.getByRole('link', { name: 'Open evidence · Jongno-gu' });
  await expect(detailLink).toHaveAttribute('href', /^\/kr\/seoul\/explore\/jongno-gu/);
  await detailLink.click();
  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/jongno-gu\/?(?:\?.*)?$/);
  await expect(page.locator('[data-detail-main="true"]')).toBeVisible();
  await expect(page.locator('[data-section="district-buildings"]')).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/kr\/seoul\/explore\/jongno-gu\/?(?:\?.*)?$/);
  await expect(page.locator('[data-detail-main="true"]')).toBeVisible();
  await expect(page.locator('[data-section="district-buildings"]')).toBeVisible();
  await expectContained(page);
  noFailures();
});

test('district detail composes official evidence before verified context', async ({
  page,
}, testInfo) => {
  const noFailures = observeFailures(page);
  const response = await page.goto('/kr/seoul/explore/jongno-gu/');
  expect(response?.status()).toBe(200);

  const detailMain = page.locator('[data-detail-main="true"]');
  const detailRail = page.locator('[data-detail-rail="true"]');
  await expect(detailMain).toBeVisible();
  await expect(detailRail).toBeVisible();
  await expect(detailRail.getByRole('heading', { name: 'Latest verified News' })).toBeVisible();
  await expect(detailRail.getByRole('heading', { name: 'Community signal' })).toBeVisible();
  await expect(detailRail.getByRole('link', { name: 'Back to Seoul map' }))
    .toHaveAttribute('href', '/kr/seoul/explore/?district=jongno-gu');
  await expectTouchTarget(page, '[data-detail-rail="true"] a[href^="/kr/seoul/news/"]');

  const layout = await page.locator('[data-detail-main="true"]').evaluate((main) => {
    const rail = main.parentElement?.querySelector('[data-detail-rail="true"]');
    const parent = main.parentElement;
    if (rail === null || parent === null) throw new Error('Detail layout is incomplete.');
    const hero = main.querySelector('[data-detail-hero="district"]');
    const heading = hero?.querySelector('h1');
    return {
      mainBeforeRail: Boolean(main.compareDocumentPosition(rail) & Node.DOCUMENT_POSITION_FOLLOWING),
      columns: getComputedStyle(parent).gridTemplateColumns.split(' ').filter(Boolean).length,
      railWidth: rail.getBoundingClientRect().width,
      heroColumns: hero === null
        ? 0
        : getComputedStyle(hero).gridTemplateColumns.split(' ').filter(Boolean).length,
      headingSize: heading === null ? 0 : Number.parseFloat(getComputedStyle(heading).fontSize),
    };
  });
  expect(layout.mainBeforeRail).toBe(true);
  if (testInfo.project.name === 'desktop-chromium' || testInfo.project.name === 'wide-chromium') {
    expect(layout.columns).toBe(2);
    expect(Math.abs(layout.railWidth - 300)).toBeLessThanOrEqual(2);
    expect(layout.heroColumns).toBe(2);
  } else {
    expect(layout.columns).toBe(1);
    expect(layout.heroColumns).toBe(1);
  }
  expect(layout.headingSize).toBeGreaterThanOrEqual(32);
  expect(layout.headingSize).toBeLessThanOrEqual(64);

  const htmlResponse = await page.request.get('/kr/seoul/explore/jongno-gu/');
  const html = await htmlResponse.text();
  expect(html).toContain('data-detail-main="true"');
  expect(html).toContain('data-detail-rail="true"');
  expect(html).toContain('Latest verified News');
  expect(html).toContain('Community signal');
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
