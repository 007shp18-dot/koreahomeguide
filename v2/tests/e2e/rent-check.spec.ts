import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import type {
  SeoulRentCheckEnvelope,
  SeoulRentCheckErrorEnvelope,
} from '@signedprice/korea-rent';
import { resolveReleaseTestTarget } from '../../release-test-target';
import {
  previousCompletedSeoulMonth,
  validateLiveRentCheckResponse,
  type CapturedRentCheckResponse,
} from './rent-check-live-contract';
import { hasComputedVisibleFocus, readComputedFocusPaint } from './focus-contract';

const RENT_CHECK_PATH = '/kr/seoul/tools/rent-check/';
const API_PATH = '/api/markets/kr-seoul/rent-check/';
const releaseTarget = resolveReleaseTestTarget();
const EXPLORER_HANDOFF =
  `${RENT_CHECK_PATH}?lawdCd=11590&type=officetel&dong=noryangjin-dong` +
  '&building=noryangjin-dream-square';

const limitations = [
  'Official reported contracts use contract dates and are not current asking listings.',
  'Records may later be corrected or cancelled; status coverage is incomplete.',
  'This result is a market reference, not an appraisal or legal advice.',
  '5.0%/year signedprice comparison assumption.',
  'Floor, condition, furnishings, maintenance fees, view, renovation, exact brokerage fees, and deposit-return risk require separate verification.',
] as const;

const monthlyInput = {
  lawdCd: '11590', housingType: 'officetel', areaSqm: '28', areaUnit: 'sqm',
  depositWon: '10000000', monthlyRentWon: '1100200',
} as const;

const jeonseInput = {
  lawdCd: '11680', housingType: 'villa', areaSqm: '60', areaUnit: 'sqm',
  depositWon: '250000000', monthlyRentWon: '0',
} as const;

const successEnvelope = {
  marketId: 'kr-seoul',
  status: 'success',
  requestedHousingType: 'officetel',
  sourceHousingType: 'officetel',
  typeMapping: { applied: false, explanation: null },
  source: {
    provider: 'MOLIT',
    dataset: 'Officetel rental contracts',
    endpointVersion: 'v1',
    parserVersion: 'kr-molit-rent-parser-v2',
    rightsPolicyId: 'kr-molit-rent-v1',
    attribution: ['Ministry of Land, Infrastructure and Transport (MOLIT)'],
  },
  coverage: {
    basis: 'contract_date',
    timezone: 'Asia/Seoul',
    coverageThroughMonth: '2026-07',
    latestContractMonth: '2026-07',
    sourceRetrievedAt: {
      earliest: '2026-06-01T00:00:00.000Z',
      latest: '2026-08-01T00:05:00.000Z',
    },
    responseGeneratedAt: '2026-08-01T00:06:00.000Z',
    monthsUsed: 3,
  },
  methodology: {
    policyId: 'kr-rent-check-quote-normalization',
    version: 1,
    annualDepositRate: 0.05,
    verdictBasis: 'typical-range',
    contractSelection: 'new_only',
    eligibleContractTypeCounts: { new: 5, renewal: 0, unknown: 0 },
    selectedContractTypeCounts: { new: 5, renewal: 0, unknown: 0 },
    sourceRecordStatusCounts: { active: 5, cancelled: 0, unknown: 0 },
  },
  result: {
    rating: 'above',
    comparisonMode: 'monthly-rent',
    comparisonBasis: 'deposit-adjusted-monthly-rent',
    askingValueWon: 1_100_200,
    medianValueWon: 1_000_000,
    minValueWon: 800_000,
    p25ValueWon: 900_000,
    p75ValueWon: 1_050_000,
    maxValueWon: 1_200_000,
    differencePct: 10,
    percentileRank: 80,
    verdictBasis: 'typical-range',
    confidence: 'medium',
    comparableCount: 5,
    monthsUsed: 3,
    tier: 1,
  },
  comparables: [
    {
      buildingLabel: 'Positive A', areaSqm: 28, depositWon: 10_000_000,
      monthlyRentWon: 1_000_000, contractDate: '2026-07-25', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'Positive B', areaSqm: 27, depositWon: 10_000_000,
      monthlyRentWon: 1_200_000, contractDate: '2026-07-11', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'Positive C', areaSqm: 29, depositWon: 10_000_000,
      monthlyRentWon: 900_000, contractDate: '2026-06-20', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'Positive D', areaSqm: 28.5, depositWon: 10_000_000,
      monthlyRentWon: 1_050_000, contractDate: '2026-06-04', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'Positive E', areaSqm: 27.5, depositWon: 10_000_000,
      monthlyRentWon: 800_000, contractDate: '2026-05-09', contractType: 'new',
      recordStatus: 'active',
    },
  ],
  limitations,
} satisfies SeoulRentCheckEnvelope;

const insufficientEnvelope = {
  marketId: 'kr-seoul',
  status: 'insufficient',
  requestedHousingType: 'villa',
  sourceHousingType: 'villa',
  typeMapping: { applied: false, explanation: null },
  source: {
    provider: 'MOLIT',
    dataset: 'Villa and row-house rental contracts',
    endpointVersion: 'v1',
    parserVersion: 'kr-molit-rent-parser-v2',
    rightsPolicyId: 'kr-molit-rent-v1',
    attribution: ['Ministry of Land, Infrastructure and Transport (MOLIT)'],
  },
  coverage: {
    basis: 'contract_date',
    timezone: 'Asia/Seoul',
    coverageThroughMonth: '2026-07',
    latestContractMonth: null,
    sourceRetrievedAt: {
      earliest: '2025-08-01T00:00:00.000Z',
      latest: '2026-08-01T00:05:00.000Z',
    },
    responseGeneratedAt: '2026-08-01T00:06:00.000Z',
    monthsUsed: 12,
  },
  methodology: {
    policyId: 'kr-rent-check-quote-normalization',
    version: 1,
    annualDepositRate: null,
    verdictBasis: null,
    contractSelection: null,
    eligibleContractTypeCounts: { new: 0, renewal: 0, unknown: 0 },
    selectedContractTypeCounts: { new: 0, renewal: 0, unknown: 0 },
    sourceRecordStatusCounts: { active: 0, cancelled: 0, unknown: 0 },
  },
  result: {
    rating: 'insufficient',
    comparisonMode: 'jeonse-deposit',
    comparisonBasis: 'jeonse-deposit',
    askingValueWon: 250_000_000,
    medianValueWon: null,
    minValueWon: null,
    p25ValueWon: null,
    p75ValueWon: null,
    maxValueWon: null,
    differencePct: null,
    percentileRank: null,
    verdictBasis: null,
    confidence: null,
    comparableCount: 0,
    monthsUsed: 12,
    tier: null,
  },
  comparables: [],
  limitations,
} satisfies SeoulRentCheckEnvelope;

const rateLimitedEnvelope = {
  status: 'error',
  error: {
    code: 'rate_limited',
    message: 'Too many checks. Please wait before trying again.',
    retryable: true,
    retryAfterSeconds: 1,
  },
} satisfies SeoulRentCheckErrorEnvelope;

const rightsBlockedEnvelope = {
  status: 'error',
  error: {
    code: 'rights_blocked',
    message: 'Official rental data use is not permitted.',
    retryable: false,
    retryAfterSeconds: null,
  },
} satisfies SeoulRentCheckErrorEnvelope;

type MockResponse = {
  readonly body: SeoulRentCheckEnvelope | SeoulRentCheckErrorEnvelope;
  readonly cacheStatus?: 'hit' | 'miss' | 'stale';
  readonly retryAfter?: string;
  readonly status: number;
};

async function interceptSameOriginApi(page: Page, response: MockResponse) {
  const expectedOrigin = new URL(page.url()).origin;
  await page.route(`**${API_PATH}**`, async (route) => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.origin !== expectedOrigin || requestUrl.pathname !== API_PATH) {
      await route.continue();
      return;
    }

    await route.fulfill({
      body: JSON.stringify(response.body),
      contentType: 'application/json; charset=utf-8',
      headers: {
        'Cache-Control': 'private, no-store',
        ...(response.cacheStatus
          ? { 'X-Signedprice-Cache': response.cacheStatus }
          : {}),
        ...(response.retryAfter ? { 'Retry-After': response.retryAfter } : {}),
      },
      status: response.status,
    });
  });
}

async function gotoRentCheck(page: Page) {
  const response = await page.goto(RENT_CHECK_PATH);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Check the quote against reported contracts.',
  })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /^noindex,\s*follow$/,
  );
}

async function fillMonthlyQuote(page: Page) {
  await page.getByRole('radio', { name: 'Officetel' }).check();
  await page.getByLabel('Size', { exact: true }).fill('28');
  await page.getByLabel('Deposit (KRW)').fill('10000000');
  await page.getByLabel('Monthly rent (KRW)').fill('1100200');
}

async function fillJeonseQuote(page: Page) {
  await page.getByRole('radio', { name: 'Villa' }).check();
  await page.getByLabel('Size', { exact: true }).fill('60');
  await page.getByLabel('Deposit (KRW)').fill('250000000');
  await page.getByLabel('Monthly rent (KRW)').fill('0');
}

async function expectNoHorizontalPageOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    bodyClient: document.body.clientWidth,
    bodyScroll: document.body.scrollWidth,
    documentClient: document.documentElement.clientWidth,
    documentScroll: document.documentElement.scrollWidth,
  }));

  expect(widths.bodyScroll).toBeLessThanOrEqual(widths.bodyClient);
  expect(widths.documentScroll).toBeLessThanOrEqual(widths.documentClient);
}

type Box = NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>;

async function box(locator: Locator): Promise<Box> {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeVisible();
  return locator.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return {
      x: bounds.x + window.scrollX,
      y: bounds.y + window.scrollY,
      width: bounds.width,
      height: bounds.height,
    };
  });
}

async function expectAtLeast44(locator: Locator) {
  const target = await box(locator);
  expect(target.width).toBeGreaterThanOrEqual(44);
  expect(target.height).toBeGreaterThanOrEqual(44);
}

async function tabTo(page: Page, target: Locator, maximumTabs = 40) {
  for (let count = 0; count < maximumTabs; count += 1) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  throw new Error(`Target was not keyboard reachable within ${maximumTabs} Tab presses`);
}

async function expectVisibleKeyboardFocus(focused: Locator, painted: Locator = focused) {
  await expect(focused).toBeFocused();
  expect(hasComputedVisibleFocus(await readComputedFocusPaint(painted))).toBe(true);
}

async function expectMethodNotAllowed(
  request: APIRequestContext,
  method: 'HEAD' | 'OPTIONS' | 'POST',
) {
  const response = await request.fetch(API_PATH, {
    data: method === 'POST' ? '{}' : undefined,
    failOnStatusCode: false,
    method,
  });

  expect(response.status()).toBe(405);
  expect(response.headers()['allow']).toBe('GET');
  expect(response.headers()['cache-control']).toBe('private, no-store');
  if (method === 'HEAD') {
    expect(await response.body()).toHaveLength(0);
  } else {
    expect(await response.json()).toEqual({
      status: 'error',
      error: {
        code: 'invalid_request',
        message: 'The rent quote is invalid.',
        retryable: false,
        retryAfterSeconds: null,
      },
    });
  }
}

function captured(
  body: SeoulRentCheckEnvelope,
  cacheStatus: 'hit' | 'miss' | 'stale' = 'hit',
): CapturedRentCheckResponse {
  return {
    body,
    headers: {
      'cache-control': 'private, no-store',
      'content-type': 'application/json; charset=utf-8',
      'x-signedprice-cache': cacheStatus,
    },
    status: 200,
  };
}

test.describe('live response validator', () => {
  test('accepts complete success and insufficient public envelopes', async () => {
    await expect(validateLiveRentCheckResponse(
      monthlyInput,
      captured(successEnvelope, 'miss'),
      { now: () => new Date('2026-08-15T00:00:00.000Z') },
    )).resolves.toMatchObject({
      cacheStatus: 'miss',
      envelope: { marketId: 'kr-seoul', status: 'success' },
    });
    await expect(validateLiveRentCheckResponse(
      jeonseInput,
      captured(insufficientEnvelope),
      { now: () => new Date('2026-08-15T00:00:00.000Z') },
    )).resolves.toMatchObject({
      cacheStatus: 'hit',
      envelope: { marketId: 'kr-seoul', status: 'insufficient' },
    });
  });

  test('requires a cold miss and the immediately previous Seoul month', async () => {
    const now = () => new Date('2026-08-15T00:00:00.000Z');

    await expect(validateLiveRentCheckResponse(
      monthlyInput,
      captured(successEnvelope, 'miss'),
      { now, requiredCacheStatus: 'miss' },
    )).resolves.toMatchObject({ cacheStatus: 'miss' });
    await expect(validateLiveRentCheckResponse(
      monthlyInput,
      captured(successEnvelope, 'hit'),
      { now, requiredCacheStatus: 'miss' },
    )).rejects.toThrow('cold live proof requires X-Signedprice-Cache: miss');
    await expect(validateLiveRentCheckResponse(
      monthlyInput,
      captured(successEnvelope, 'stale'),
      { now, requiredCacheStatus: 'miss' },
    )).rejects.toThrow('cold live proof requires X-Signedprice-Cache: miss');
    await expect(validateLiveRentCheckResponse(
      monthlyInput,
      captured(successEnvelope, 'miss'),
      { now: () => new Date('2026-09-15T00:00:00.000Z'), requiredCacheStatus: 'miss' },
    )).rejects.toThrow('immediately previous Seoul month');

    expect(previousCompletedSeoulMonth(new Date('2025-12-31T15:00:00.000Z')))
      .toBe('2025-12');
  });

  test('rejects incomplete schema and recursively hidden provider details', async () => {
    const missingMethodology = structuredClone(successEnvelope) as Record<string, unknown>;
    delete missingMethodology.methodology;
    await expect(validateLiveRentCheckResponse(monthlyInput, {
      ...captured(successEnvelope),
      body: missingMethodology,
    }, { now: () => new Date('2026-08-15T00:00:00.000Z') }))
      .rejects.toThrow('complete public rent-check schema');

    const providerHost = structuredClone(successEnvelope);
    providerHost.comparables[0]!.buildingLabel = 'https://apis.data.go.kr/provider';
    await expect(validateLiveRentCheckResponse(
      monthlyInput,
      captured(providerHost),
      { now: () => new Date('2026-08-15T00:00:00.000Z') },
    )).rejects.toThrow('public payload contains forbidden key or value');

    const nestedSecret = {
      ...structuredClone(successEnvelope),
      comparables: [{
        ...successEnvelope.comparables[0],
        metadata: { serviceKey: 'redacted-value' },
      }, ...successEnvelope.comparables.slice(1)],
    };
    await expect(validateLiveRentCheckResponse(monthlyInput, {
      ...captured(successEnvelope),
      body: nestedSecret,
    }, { now: () => new Date('2026-08-15T00:00:00.000Z') }))
      .rejects.toThrow('public payload contains forbidden key or value');
  });

  test('validates hit and stale provenance only as separate cache behavior', async () => {
    const now = () => new Date('2026-08-15T00:00:00.000Z');
    await expect(validateLiveRentCheckResponse(
      monthlyInput,
      captured(successEnvelope, 'hit'),
      { now },
    )).resolves.toMatchObject({ cacheStatus: 'hit' });
    await expect(validateLiveRentCheckResponse(
      monthlyInput,
      captured(successEnvelope, 'stale'),
      { now },
    )).resolves.toMatchObject({ cacheStatus: 'stale' });
  });
});

test('completes the quote in the real desktop and mobile form', async ({ page }, testInfo) => {
  await gotoRentCheck(page);
  await interceptSameOriginApi(page, {
    body: successEnvelope,
    cacheStatus: 'miss',
    status: 200,
  });
  await fillMonthlyQuote(page);

  if (testInfo.project.name === 'desktop-chromium') {
    await page.getByLabel('Monthly rent (KRW)').press('Enter');
  } else {
    await page.getByRole('button', { name: 'Check this quote' }).tap();
  }

  const resultHeading = page.getByRole('heading', {
    level: 2,
    name: 'Official evidence is ready.',
  });
  await expect(resultHeading).toBeFocused();
  await expect(page.getByText('Source completeness through 2026-07')).toBeVisible();
  await expect(page.getByText('3 completed months used')).toBeVisible();
  await expect(
    page.getByLabel('Market evidence').getByText('5 compatible contracts', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('MOLIT · Officetel rental contracts')).toBeVisible();
  await expect(page.getByText(
    'Ministry of Land, Infrastructure and Transport (MOLIT)',
  )).toBeVisible();
  await expect(page.getByText('2026-06-01T00:00:00.000Z')).toBeVisible();
  await expect(page.getByText('2026-08-01T00:05:00.000Z')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Method and limitations' })).toBeVisible();
  for (const limitation of limitations) {
    await expect(page.getByText(limitation, { exact: true })).toBeVisible();
  }
  await expect(page.getByText('Stale verified result')).toHaveCount(0);

  const newestDate = page.getByRole('cell', { name: '2026-07-25' });
  await newestDate.scrollIntoViewIfNeeded();
  await expect(newestDate).toBeVisible();
  await expectNoHorizontalPageOverflow(page);
});

test('completes a Tab-only keyboard flow with computed visible focus', async ({ page }) => {
  await gotoRentCheck(page);
  await interceptSameOriginApi(page, {
    body: successEnvelope,
    cacheStatus: 'miss',
    status: 200,
  });

  const area = page.getByLabel('Area', { exact: true });
  await tabTo(page, area);
  await expectVisibleKeyboardFocus(area);

  const officetel = page.getByRole('radio', { name: 'Officetel' });
  await tabTo(page, officetel);
  await expectVisibleKeyboardFocus(officetel, officetel.locator('..'));

  const size = page.getByLabel('Size', { exact: true });
  await tabTo(page, size);
  await expectVisibleKeyboardFocus(size);
  await page.keyboard.type('28');

  const deposit = page.getByLabel('Deposit (KRW)');
  await tabTo(page, deposit);
  await expectVisibleKeyboardFocus(deposit);
  await page.keyboard.type('10000000');

  const monthly = page.getByLabel('Monthly rent (KRW)');
  await tabTo(page, monthly);
  await expectVisibleKeyboardFocus(monthly);
  await page.keyboard.type('1100200');

  const submit = page.getByRole('button', { name: 'Check this quote' });
  await tabTo(page, submit);
  await expectVisibleKeyboardFocus(submit);
  await page.keyboard.press('Enter');

  const resultHeading = page.getByRole('heading', { name: 'Official evidence is ready.' });
  await expectVisibleKeyboardFocus(resultHeading);
  await expectNoHorizontalPageOverflow(page);
});

test('keeps desktop controls aligned at 52px', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await gotoRentCheck(page);

  const area = await box(page.getByLabel('Area', { exact: true }));
  const housing = await box(
    page.locator('fieldset').filter({ hasText: 'Housing type' }).locator(':scope > div'),
  );
  const size = await box(page.getByLabel('Size', { exact: true }));
  const deposit = await box(page.getByLabel('Deposit (KRW)'));
  const monthly = await box(page.getByLabel('Monthly rent (KRW)'));
  const submit = await box(page.getByRole('button', { name: 'Check this quote' }));

  for (const control of [area, size, deposit, monthly, submit]) {
    expect(control.height).toBe(52);
  }
  expect(housing.height).toBe(52);
  expect(Math.abs(area.y - housing.y)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(area.y - size.y)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(deposit.y - monthly.y)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(deposit.y - submit.y)).toBeLessThanOrEqual(0.5);
});

test('keeps the mobile form in one-column order with contained 44px targets', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium');
  await gotoRentCheck(page);

  const controls = [
    page.getByLabel('Area', { exact: true }),
    page.locator('fieldset').filter({ hasText: 'Housing type' }),
    page.getByLabel('Size', { exact: true }),
    page.getByLabel('Deposit (KRW)'),
    page.getByLabel('Monthly rent (KRW)'),
    page.getByRole('button', { name: 'Check this quote' }),
  ];
  const boxes: Box[] = [];
  for (const control of controls) boxes.push(await box(control));
  for (let index = 1; index < boxes.length; index += 1) {
    expect(boxes[index]!.y).toBeGreaterThanOrEqual(
      boxes[index - 1]!.y + boxes[index - 1]!.height,
    );
  }

  for (const radio of await page.getByRole('radio').all()) {
    await expectAtLeast44(radio.locator('..'));
  }
  for (const target of [
    page.getByLabel('Area', { exact: true }),
    page.getByLabel('Size', { exact: true }),
    page.getByLabel('Deposit (KRW)'),
    page.getByLabel('Monthly rent (KRW)'),
    page.getByRole('button', { name: '㎡', exact: true }),
    page.getByRole('button', { name: 'pyeong', exact: true }),
    page.getByRole('button', { name: 'Check this quote' }),
  ]) {
    await expectAtLeast44(target);
  }
  await expectNoHorizontalPageOverflow(page);
});

test('renders insufficient official evidence as a completed state', async ({ page }) => {
  await gotoRentCheck(page);
  await interceptSameOriginApi(page, {
    body: insufficientEnvelope,
    cacheStatus: 'hit',
    status: 200,
  });
  await fillJeonseQuote(page);
  await page.getByRole('button', { name: 'Check this quote' }).click();

  await expect(page.getByRole('heading', {
    name: 'Official evidence is insufficient.',
  })).toBeFocused();
  await expect(
    page.getByLabel('Market evidence').getByText('0 compatible contracts', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Latest contract month: Unavailable')).toBeVisible();
  await expect(page.getByText('No market estimate is shown.')).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.getByText('Stale verified result')).toHaveCount(0);
});

test('labels only a stale completed response as stale', async ({ page }) => {
  await gotoRentCheck(page);
  await interceptSameOriginApi(page, {
    body: successEnvelope,
    cacheStatus: 'stale',
    status: 200,
  });
  await fillMonthlyQuote(page);
  await page.getByRole('button', { name: 'Check this quote' }).click();

  await expect(page.getByText('Stale verified result')).toBeVisible();
});

test('renders retryable 429 and non-retry rights boundaries without a verdict', async ({
  page,
}) => {
  await gotoRentCheck(page);
  await interceptSameOriginApi(page, {
    body: rateLimitedEnvelope,
    retryAfter: '1',
    status: 429,
  });
  await fillMonthlyQuote(page);
  await page.getByRole('button', { name: 'Check this quote' }).click();

  await expect(page.getByRole('heading', { name: 'Official evidence unavailable' })).toBeVisible();
  await expect(page.getByText('Retry available in 1 seconds.')).toBeVisible();
  const retry = page.getByRole('button', { name: 'Retry' });
  await expectAtLeast44(retry);
  await expect(retry).toBeEnabled({ timeout: 2_500 });
  await page.unrouteAll({ behavior: 'wait' });

  await interceptSameOriginApi(page, { body: rightsBlockedEnvelope, status: 503 });
  await retry.click();
  await expect(page.getByRole('heading', { name: 'Official data rights boundary' })).toBeVisible();
  await expect(page.getByText('Official rental data use is not permitted.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toHaveCount(0);
  await expect(page.getByText(/Fair|Above|Below/)).toHaveCount(0);
});

test('accepts only the exact Explorer handoff and never prefills quote values', async ({ page }) => {
  await page.goto(EXPLORER_HANDOFF);
  await expect(page.getByText('Verified Explorer context')).toBeVisible();
  await expect(page.getByText(
    'Dongjak-gu (동작구) · Officetel · Noryangjin-dong (노량진동) · Noryangjin Dream Square Complex (노량진 드림스퀘어 복합빌딩)',
  )).toBeVisible();
  await expect(page.getByLabel('Area', { exact: true })).toHaveValue('11590');
  await expect(page.getByRole('radio', { name: 'Officetel' })).toBeChecked();
  await expect(page.getByLabel('Size', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Deposit (KRW)')).toHaveValue('');
  await expect(page.getByLabel('Monthly rent (KRW)')).toHaveValue('');
  expect(new URL(page.url()).searchParams.has('deposit')).toBe(false);
  expect(new URL(page.url()).searchParams.has('rent')).toBe(false);
  expect(new URL(page.url()).searchParams.has('area')).toBe(false);

  const rejectedQueries = [
    '?lawdCd=11680&type=officetel&dong=noryangjin-dong&building=noryangjin-dream-square',
    '?lawdCd=11590&lawdCd=11680&type=officetel&type=villa&dong=noryangjin-dong&dong=daechi-dong&building=noryangjin-dream-square&building=daechi-palace',
    '?type=officetel&dong=noryangjin-dong&building=noryangjin-dream-square',
    '?lawdCd=%3Cscript%3E&type=officetel&dong=noryangjin-dong&building=noryangjin-dream-square',
  ];
  for (const query of rejectedQueries) {
    await page.goto(`${RENT_CHECK_PATH}${query}`);
    await expect(page.getByText('Verified Explorer context')).toHaveCount(0);
    await expect(page.getByLabel('Size', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('Deposit (KRW)')).toHaveValue('');
    await expect(page.getByLabel('Monthly rent (KRW)')).toHaveValue('');
  }
});

test('GET-only API rejects HEAD, OPTIONS and POST before provider handling', async ({
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await expectMethodNotAllowed(request, 'HEAD');
  await expectMethodNotAllowed(request, 'OPTIONS');
  await expectMethodNotAllowed(request, 'POST');
});

test.describe('@live-preview non-intercepted exact-SHA rent checks', () => {
  test.skip(
    !releaseTarget.usesExternalServer,
    'Live Preview tests require PLAYWRIGHT_BASE_URL and exact deployment identity.',
  );

  async function expectPreviewIdentity(request: APIRequestContext) {
    const response = await request.get('/api/status');
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      commit: releaseTarget.expectedCommit,
      environment: releaseTarget.expectedEnvironment,
      indexing: 'blocked',
    });
  }

  async function submitAndValidateLiveQuote(
    page: Page,
    input: typeof monthlyInput | typeof jeonseInput,
    fill: (page: Page) => Promise<void>,
  ) {
    await gotoRentCheck(page);
    const responsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.origin === new URL(page.url()).origin && url.pathname === API_PATH;
    });
    await fill(page);
    await page.getByRole('button', { name: 'Check this quote' }).click();
    const response = await responsePromise;
    const validated = await validateLiveRentCheckResponse(input, {
      body: await response.json(),
      headers: response.headers(),
      status: response.status(),
    }, { requiredCacheStatus: 'hit' });

    await expect(page.locator('#rent-check-result')).toHaveAttribute(
      'data-result-state',
      validated.envelope.status,
    );
    await expect(page.getByRole('heading', {
      name: validated.envelope.status === 'success'
        ? 'Official evidence is ready.'
        : 'Official evidence is insufficient.',
    })).toBeFocused();
    await expect(page.getByText(validated.envelope.coverage.sourceRetrievedAt.earliest))
      .toBeVisible();
    await expect(page.getByText(validated.envelope.coverage.sourceRetrievedAt.latest))
      .toBeVisible();
    await expect(page.getByText('Stale verified result')).toHaveCount(
      validated.cacheStatus === 'stale' ? 1 : 0,
    );
    await expectNoHorizontalPageOverflow(page);
    return validated;
  }

  async function requestAndValidateLiveQuote(
    request: APIRequestContext,
    query: string,
    input: typeof monthlyInput | typeof jeonseInput,
    requiredCacheStatus: 'hit' | 'miss',
  ) {
    const response = await request.get(`${API_PATH}?${query}`);
    return validateLiveRentCheckResponse(input, {
      body: await response.json(),
      headers: response.headers(),
      status: response.status(),
    }, { requiredCacheStatus });
  }

  test('@live-preview-cold first monthly and jeonse requests prove cold live readiness', async ({
    request,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium');
    test.setTimeout(120_000);
    await expectPreviewIdentity(request);
    const monthly = await requestAndValidateLiveQuote(
      request,
      'lawdCd=11590&type=officetel&deposit=10000000&rent=1100200&area=28',
      monthlyInput,
      'miss',
    );
    const jeonse = await requestAndValidateLiveQuote(
      request,
      'lawdCd=11680&type=villa&deposit=250000000&rent=0&area=60',
      jeonseInput,
      'miss',
    );
    expect(monthly.envelope.result.comparisonMode).toBe('monthly-rent');
    expect(jeonse.envelope.result.comparisonMode).toBe('jeonse-deposit');
  });

  test('@live-preview-cache immediate repeats prove non-stale cache hits', async ({
    request,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium');
    test.setTimeout(120_000);
    await expectPreviewIdentity(request);
    await requestAndValidateLiveQuote(
      request,
      'lawdCd=11590&type=officetel&deposit=10000000&rent=1100200&area=28',
      monthlyInput,
      'hit',
    );
    await requestAndValidateLiveQuote(
      request,
      'lawdCd=11680&type=villa&deposit=250000000&rent=0&area=60',
      jeonseInput,
      'hit',
    );
  });

  test('@live-preview-ui monthly-rent browser flow reaches the real Preview API', async ({
    page,
    request,
  }) => {
    await expectPreviewIdentity(request);
    const validated = await submitAndValidateLiveQuote(page, monthlyInput, fillMonthlyQuote);
    await expect(page.getByText('MOLIT · Officetel rental contracts')).toBeVisible();
    await expect(page.getByText(
      'Ministry of Land, Infrastructure and Transport (MOLIT)',
    )).toBeVisible();
    for (const limitation of limitations) {
      await expect(page.getByText(limitation, { exact: true })).toBeVisible();
    }
    expect(validated.envelope.result.comparisonMode).toBe('monthly-rent');
  });

  test('@live-preview-ui jeonse browser flow reaches the real Preview API', async ({
    page,
    request,
  }) => {
    await expectPreviewIdentity(request);
    const validated = await submitAndValidateLiveQuote(page, jeonseInput, fillJeonseQuote);
    await expect(page.getByText('MOLIT · Villa and row-house rental contracts')).toBeVisible();
    await expect(page.getByText(
      'Ministry of Land, Infrastructure and Transport (MOLIT)',
    )).toBeVisible();
    for (const limitation of limitations) {
      await expect(page.getByText(limitation, { exact: true })).toBeVisible();
    }
    expect(validated.envelope.result.comparisonMode).toBe('jeonse-deposit');
  });
});
