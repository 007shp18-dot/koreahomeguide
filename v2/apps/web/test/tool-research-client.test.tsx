import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { ToolResearchDelete, ToolResearchShare } from '../components/tools/tool-research-share';
import {
  createDubaiResearchSnapshot,
  createPassportResearchSnapshot,
  createOfferCompareResearchSnapshot,
  createPropertyScenarioResearchSnapshot,
  createRentCheckResearchSnapshot,
  createSingaporeResearchSnapshot,
  createSingleQuoteResearchSnapshot,
  deleteToolResearch,
  submitToolResearch,
  toolResearchPanelKey,
  toolResearchPreview,
} from '../lib/tool-research/client';

const retryId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function response(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

describe('tool research client boundary', () => {
  it('renders a counter notice without a consent form or server-render request', () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const snapshot = createPropertyScenarioResearchSnapshot({
      currency: 'SGD', purchasePrice: 1_250_000, acquisitionCosts: 310_000,
      monthlyRent: 4_500, annualOperatingCosts: 12_000, yieldPct: 2.91,
      areaSqm: 91, housingType: 'condo',
    });

    const html = renderToStaticMarkup(<ToolResearchShare locale="en" resultRevision="result-1" snapshot={snapshot} />);

    expect(fetcher).not.toHaveBeenCalled();
    expect(html).not.toContain('checkbox');
    expect(html).toContain('We count tool usage by city');
    expect(html).not.toContain('SGD 1m–2m');
    expect(html).not.toContain('85–120');
    expect(html).not.toContain('1250000');
    vi.unstubAllGlobals();
  });

  it('changes the panel identity when an evaluated result changes inside the same bands', () => {
    const first = createPropertyScenarioResearchSnapshot({
      currency: 'SGD', purchasePrice: 1_250_000, acquisitionCosts: 310_000,
      monthlyRent: 4_500, annualOperatingCosts: 12_000, yieldPct: 2.91,
    });
    const second = createPropertyScenarioResearchSnapshot({
      currency: 'SGD', purchasePrice: 1_260_000, acquisitionCosts: 310_000,
      monthlyRent: 4_500, annualOperatingCosts: 12_000, yieldPct: 2.89,
    });

    expect(second).toEqual(first);
    expect(toolResearchPanelKey(first, 'evaluated-1'))
      .not.toBe(toolResearchPanelKey(second, 'evaluated-2'));
  });

  it('initializes browser ownership before posting only the versioned snapshot', async () => {
    const snapshot = createDubaiResearchSnapshot({
      askingPriceAed: 2_800_000, areaSqm: 35, annualRentAed: 190_000,
      yieldPct: 6.79, sample: 72, stage: 'off-plan', housingType: 'villa', verdict: 'above',
    });
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ input, init });
      return calls.length === 1
        ? response({ state: 'owner-ready' })
        : response({ state: 'stored', expiresAt: '2026-12-08T00:00:00.000Z' }, 201);
    });

    await expect(submitToolResearch(snapshot, retryId, fetcher)).resolves.toEqual({ state: 'stored' });
    expect(calls.map(({ init }) => init?.method)).toEqual(['PUT', 'POST']);
    expect(calls.every(({ input }) => input === '/api/tools/research/')).toBe(true);
    expect(calls.every(({ init }) => init?.credentials === 'same-origin')).toBe(true);
    expect(calls[0]?.init?.body).toBe('{}');
    expect(JSON.parse(String(calls[1]?.init?.body))).toEqual({
      consent: { granted: true, version: 'tool-research-consent-2026-09-09' },
      retryId,
      snapshot,
    });
  });

  it('reuses the caller retry ID and reports failures without claiming a save', async () => {
    const snapshot = createPropertyScenarioResearchSnapshot({
      currency: 'KRW', purchasePrice: 900_000_000, acquisitionCosts: 40_000_000,
      monthlyRent: 3_000_000, annualOperatingCosts: 4_000_000, yieldPct: 3.2,
      areaSqm: null, housingType: 'apartment',
    });
    const bodies: unknown[] = [];
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') bodies.push(JSON.parse(String(init.body)));
      return init?.method === 'PUT'
        ? response({ state: 'owner-ready' })
        : response({ state: 'unavailable', code: 'storage_unavailable' }, 503);
    });

    await expect(submitToolResearch(snapshot, retryId, fetcher)).rejects.toThrow('submission');
    await expect(submitToolResearch(snapshot, retryId, fetcher)).rejects.toThrow('submission');
    expect(bodies).toHaveLength(2);
    expect(bodies.map((body) => (body as { retryId: string }).retryId)).toEqual([retryId, retryId]);
  });

  it('serializes concurrent ownership initialization and submission pairs', async () => {
    const snapshot = createPropertyScenarioResearchSnapshot({
      currency: 'SGD', purchasePrice: 1_250_000, acquisitionCosts: 310_000,
      monthlyRent: 4_500, annualOperatingCosts: 12_000, yieldPct: 2.91,
    });
    const calls: string[] = [];
    let releaseFirstPost = () => {};
    const firstPost = new Promise<void>((resolve) => { releaseFirstPost = resolve; });
    let postCount = 0;
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(String(init?.method));
      if (init?.method === 'PUT') return response({ state: 'owner-ready' });
      postCount += 1;
      if (postCount === 1) await firstPost;
      return response({ state: 'stored', expiresAt: '2026-12-08T00:00:00.000Z' }, 201);
    });

    const first = submitToolResearch(snapshot, retryId, fetcher);
    const second = submitToolResearch(snapshot, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', fetcher);
    await vi.waitFor(() => expect(calls).toEqual(['PUT', 'POST']));
    releaseFirstPost();
    await Promise.all([first, second]);
    expect(calls).toEqual(['PUT', 'POST', 'PUT', 'POST']);
  });

  it('waits for an in-flight submission before deleting browser-owned rows', async () => {
    const snapshot = createPropertyScenarioResearchSnapshot({
      currency: 'AED', purchasePrice: 2_000_000, acquisitionCosts: 120_000,
      monthlyRent: 12_000, annualOperatingCosts: 20_000, yieldPct: 5.8,
    });
    const calls: string[] = [];
    let releasePost = () => {};
    const heldPost = new Promise<void>((resolve) => { releasePost = resolve; });
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(String(init?.method));
      if (init?.method === 'PUT') return response({ state: 'owner-ready' });
      if (init?.method === 'POST') {
        await heldPost;
        return response({ state: 'stored', expiresAt: '2026-12-08T00:00:00.000Z' }, 201);
      }
      return response({ state: 'deleted', deletedCount: 1 });
    });

    const submit = submitToolResearch(snapshot, retryId, fetcher);
    const deletion = deleteToolResearch(fetcher);
    await vi.waitFor(() => expect(calls).toEqual(['PUT', 'POST']));
    releasePost();
    await Promise.all([submit, deletion]);
    expect(calls).toEqual(['PUT', 'POST', 'DELETE']);
  });

  it('distinguishes no owned rows, deleted rows, and deletion failure', async () => {
    await expect(deleteToolResearch(vi.fn(async () => response({ state: 'deleted', deletedCount: 0 })))).resolves.toEqual({ deletedCount: 0 });
    await expect(deleteToolResearch(vi.fn(async () => response({ state: 'deleted', deletedCount: 3 })))).resolves.toEqual({ deletedCount: 3 });
    await expect(deleteToolResearch(vi.fn(async () => response({ state: 'unavailable', code: 'storage_unavailable' }, 503)))).rejects.toThrow('deletion');
  });

  it('explains browser ownership and expiry in every supported Tools locale', () => {
    const english = renderToStaticMarkup(<ToolResearchDelete locale="en" />);
    const korean = renderToStaticMarkup(<ToolResearchDelete locale="ko" />);
    const chinese = renderToStaticMarkup(<ToolResearchDelete locale="zh-CN" />);
    expect(english).toContain('pseudonymous ownership cookie');
    expect(english).toContain('90 days');
    expect(english).toContain('Clearing the cookie');
    expect(korean).toContain('이 브라우저에서 제공한 자료를 구분하는 쿠키');
    expect(korean).toContain('90일');
    expect(korean).toContain('쿠키를 지우면');
    expect(chinese).toContain('化名所有权 Cookie');
    expect(chinese).toContain('90 天');
    expect(chinese).toContain('清除该 Cookie');
  });
});

describe('tool research snapshot adapters', () => {
  it('uses the evaluated Passport budget, areas and samples and refuses missing city areas', () => {
    const snapshot = createPassportResearchSnapshot({
      budgetAmount: 500_000, budgetCurrency: 'USD', dubaiStage: 'ready',
      markets: [
        { id: 'kr-seoul', indicativeAreaSqm: 63, sample: 81 },
        { id: 'sg-singapore', indicativeAreaSqm: 42, sample: 22 },
        { id: 'ae-dubai', indicativeAreaSqm: 98, sample: 105 },
      ],
    });
    expect(snapshot).toEqual({
      schemaVersion: 1, tool: 'passport', market: 'global', currency: 'USD',
      bands: {
        budget: 'usd-500k-1m', seoulArea: 'sqm-60-85', singaporeArea: 'sqm-40-60', dubaiArea: 'sqm-85-120',
        seoulSample: 'sample-50-99', singaporeSample: 'sample-10-24', dubaiSample: 'sample-100-plus',
      },
      categories: { dubaiStage: 'ready' },
    });
    expect(createPassportResearchSnapshot({
      budgetAmount: 500_000, budgetCurrency: 'USD', dubaiStage: 'ready',
      markets: [
        { id: 'kr-seoul', indicativeAreaSqm: null, sample: 81 },
        { id: 'sg-singapore', indicativeAreaSqm: 42, sample: 22 },
        { id: 'ae-dubai', indicativeAreaSqm: 98, sample: 105 },
      ],
    })).toBeNull();
  });

  it('uses submitted single-quote result values without identifiers or free text', () => {
    const snapshot = createSingleQuoteResearchSnapshot({
      status: 'ready',
      input: { transaction: 'monthly', areaSqm: 84, housingType: 'apartment' },
      quote: { comparisonValueWon: 3_400_000 },
      sample: { count: 16 },
      verdict: 'typical',
      filters: { scope: 'building' },
    });
    expect(snapshot).toEqual({
      schemaVersion: 1, tool: 'single-quote', market: 'kr-seoul', currency: 'KRW',
      bands: { askingPrice: 'krw-1m-10m', area: 'sqm-60-85', sample: 'sample-10-24' },
      categories: { transaction: 'monthly', housingType: 'apartment', verdict: 'typical', scope: 'building' },
    });
    expect(JSON.stringify(snapshot)).not.toMatch(/district|buildingId|message|monthlyRentWon/);

    const neighborhood = createSingleQuoteResearchSnapshot({
      status: 'ready',
      input: { transaction: 'sale', areaSqm: 59, housingType: 'villa' },
      quote: { comparisonValueWon: 480_000_000 },
      sample: { count: 9 },
      verdict: 'below',
      filters: { scope: 'neighborhood' },
    });
    expect(neighborhood?.categories.scope).toBe('neighborhood');
    expect(toolResearchPreview(neighborhood!, 'ko')).toContainEqual({
      label: '비교 범위', value: '동',
    });
  });

  it('preserves comparison semantics and omits an unmodeled recurring amount', () => {
    const check = {
      status: 'ready' as const,
      input: { transaction: 'monthly' as const, areaSqm: 84, housingType: 'apartment' },
      quote: { comparisonValueWon: 3_400_000 }, sample: { count: 16 },
      verdict: 'typical' as const, filters: { scope: 'district' as const },
    };
    const snapshot = createOfferCompareResearchSnapshot({
      status: 'ready', basis: 'equivalent-monthly-cost', winner: 'a',
      offers: [
        { id: 'a', transaction: 'jeonse', upfrontCashWon: 450_000_000, recurringCashFlowWon: null, check },
        { id: 'b', transaction: 'monthly', upfrontCashWon: 70_000_000, recurringCashFlowWon: 2_400_000, check: { ...check, sample: { count: 51 } } },
      ],
    });
    expect(snapshot?.bands).toEqual({
      offerAUpfront: 'krw-100m-500m',
      offerBUpfront: 'krw-10m-100m', offerBRecurring: 'krw-1m-10m',
      sampleA: 'sample-10-24', sampleB: 'sample-50-99',
    });
    expect(snapshot?.categories).toEqual({ offerATransaction: 'jeonse', offerBTransaction: 'monthly', comparison: 'recurring-cost' });
    expect(toolResearchPreview(snapshot!, 'en')).toContainEqual({
      label: 'Offer A recurring band', value: 'Not included in calculation',
    });

    const marketPosition = createOfferCompareResearchSnapshot({
      status: 'ready', basis: 'market-position', winner: 'b',
      offers: [
        { id: 'a', transaction: 'sale', upfrontCashWon: 450_000_000, recurringCashFlowWon: null, check },
        { id: 'b', transaction: 'sale', upfrontCashWon: 700_000_000, recurringCashFlowWon: null, check },
      ],
    });
    expect(marketPosition?.categories.comparison).toBe('market-position');
    expect(marketPosition?.bands).not.toHaveProperty('offerARecurring');
    expect(marketPosition?.bands).not.toHaveProperty('offerBRecurring');
    expect(toolResearchPreview(marketPosition!, 'ko')).toContainEqual({
      label: '비교 기준', value: '실거래 근거로 조정한 시장 내 위치',
    });

    const modeledZero = createOfferCompareResearchSnapshot({
      status: 'ready', basis: 'equivalent-monthly-cost', winner: 'equal',
      offers: [
        { id: 'a', transaction: 'monthly', upfrontCashWon: 70_000_000, recurringCashFlowWon: 0, check },
        { id: 'b', transaction: 'monthly', upfrontCashWon: 70_000_000, recurringCashFlowWon: 0, check },
      ],
    });
    expect(modeledZero?.bands.offerARecurring).toBe('amount-none');
    expect(modeledZero?.bands.offerBRecurring).toBe('amount-none');
  });

  it('shares only successful rent checks and uses the checked input', () => {
    const checkedInput = { housingType: 'villa', areaSqm: '59', depositWon: '80000000', monthlyRentWon: '1700000' };
    const ready = createRentCheckResearchSnapshot({
      checkedInput,
      envelope: { status: 'success', result: { rating: 'fair', comparableCount: 11 } },
    });
    expect(ready).toEqual({
      schemaVersion: 1, tool: 'rent-check', market: 'kr-seoul', currency: 'KRW',
      bands: { deposit: 'krw-10m-100m', monthlyRent: 'krw-1m-10m', area: 'sqm-40-60', sample: 'sample-10-24' },
      categories: { housingType: 'villa', verdict: 'typical' },
    });
    expect(createRentCheckResearchSnapshot({
      checkedInput,
      envelope: { status: 'insufficient', result: { rating: 'insufficient', comparableCount: 2 } },
    })).toBeNull();
  });

  it('keeps Singapore ready offers separate and omits an unrepresentable HDB rent offer', () => {
    const ready = {
      status: 'ready' as const, market: 'ura-private-sale' as const, amountSgd: 1_700_000,
      distribution: { p25: 1_300_000, p75: 1_900_000 }, sampleCount: 37,
    };
    const snapshot = createSingaporeResearchSnapshot({
      draft: { market: 'ura-private-sale', amount: '1700000', 'area-min': '80', 'area-max': '100', 'property-type': 'Condominium', project: 'secret-project' },
      result: ready,
    });
    expect(snapshot).toEqual({
      schemaVersion: 1, tool: 'singapore-check', market: 'sg-singapore', currency: 'SGD',
      bands: { askingPrice: 'sgd-1m-2m', area: 'sqm-85-120', sample: 'sample-25-49' },
      categories: { segment: 'private-sale', housingType: 'condo', verdict: 'typical' },
    });
    expect(JSON.stringify(snapshot)).not.toContain('secret-project');
    expect(createSingaporeResearchSnapshot({
      draft: { market: 'hdb-rent', amount: '3500', town: 'QUEENSTOWN', block: 'secret-block' },
      result: { ...ready, market: 'hdb-rent', amountSgd: 3_500 },
    })).toBeNull();
  });

  it('presents localized, friendly category names and the exact submitted band values', () => {
    const snapshot = createDubaiResearchSnapshot({
      askingPriceAed: 2_800_000, areaSqm: 35, annualRentAed: 190_000,
      yieldPct: 6.79, sample: 72, stage: 'off-plan', housingType: 'villa', verdict: 'above',
    });
    expect(toolResearchPreview(snapshot, 'ko')).toEqual(expect.arrayContaining([
      { label: '매물 가격 구간', value: 'AED 1m–5m' },
      { label: '면적 구간', value: '40 ㎡ 미만' },
      { label: '단계', value: '분양·건설 중' },
      { label: '시장 범위', value: '중간 50%보다 높음' },
    ]));
    expect(toolResearchPreview(snapshot, 'zh-CN')).toEqual(expect.arrayContaining([
      { label: '阶段', value: '期房' },
      { label: '住宅类型', value: '别墅' },
    ]));
  });
});
