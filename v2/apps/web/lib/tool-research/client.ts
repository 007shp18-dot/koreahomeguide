import type { CheckTransaction } from '@signedprice/market-core';

import {
  bucketResearchAmount,
  bucketResearchArea,
  bucketResearchSample,
  bucketResearchYield,
  canonicalToolResearchSnapshot,
  describeToolResearchBands,
  RESEARCH_CONSENT_VERSION,
  RESEARCH_SCHEMA_VERSION,
  type NormalizedToolResearchSnapshot,
  type ResearchCurrency,
  type ResearchHousingType,
  type ResearchVerdict,
} from './contract';

export type ToolResearchLocale = 'en' | 'ko' | 'zh-CN';
export type ToolResearchFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

type Snapshot<Tool extends NormalizedToolResearchSnapshot['tool']> = Extract<
  NormalizedToolResearchSnapshot,
  { tool: Tool }
>;

const API_PATH = '/api/tools/research/';
const OPERATION_LOCK = 'signedprice-tool-research-owner-v1';
const JSON_REQUEST = Object.freeze({
  credentials: 'same-origin' as const,
  headers: Object.freeze({ 'Content-Type': 'application/json' }),
});
let operationQueue: Promise<void> = Promise.resolve();

async function withBrowserOperationLock<T>(operation: () => Promise<T>): Promise<T> {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks;
  return locks === undefined
    ? operation()
    : locks.request(OPERATION_LOCK, { mode: 'exclusive' }, operation);
}

function enqueueResearchOperation<T>(operation: () => Promise<T>): Promise<T> {
  const result = operationQueue.then(
    () => withBrowserOperationLock(operation),
    () => withBrowserOperationLock(operation),
  );
  operationQueue = result.then(() => undefined, () => undefined);
  return result;
}

function amount(value: number, currency: ResearchCurrency) {
  return bucketResearchAmount(value, currency).id;
}

function area(value: number) {
  return bucketResearchArea(value).id;
}

function sample(value: number) {
  return bucketResearchSample(value).id;
}

function yieldBand(value: number) {
  return bucketResearchYield(value).id;
}

function finitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function housingType(value: string | null | undefined): ResearchHousingType | null {
  if (value === null || value === undefined) return null;
  const normalized = value.toLocaleLowerCase('en-US').replaceAll('_', '-');
  if (normalized.includes('officetel')) return 'officetel';
  if (normalized.includes('condominium') || normalized === 'condo') return 'condo';
  if (normalized.includes('apartment') || normalized === 'apt') return 'apartment';
  if (normalized.includes('villa') || normalized.includes('multifamily')) return 'villa';
  if (normalized.includes('detached')) return 'detached';
  if (normalized.includes('hdb')) return 'hdb';
  if (normalized.includes('landed') || normalized.includes('bungalow') || normalized.includes('terrace')) return 'landed';
  if (normalized.includes('townhouse')) return 'townhouse';
  return null;
}

export function createPassportResearchSnapshot(input: Readonly<{
  budgetAmount: number;
  budgetCurrency: ResearchCurrency;
  dubaiStage: 'ready' | 'off-plan';
  markets: readonly Readonly<{
    id: 'kr-seoul' | 'sg-singapore' | 'ae-dubai';
    indicativeAreaSqm: number | null;
    sample: number;
  }>[];
}>): Snapshot<'passport'> | null {
  if (!finitePositive(input.budgetAmount)) return null;
  const cities = Object.fromEntries(input.markets.map((market) => [market.id, market]));
  const seoul = cities['kr-seoul'];
  const singapore = cities['sg-singapore'];
  const dubai = cities['ae-dubai'];
  if (seoul === undefined || singapore === undefined || dubai === undefined
    || !finitePositive(seoul.indicativeAreaSqm)
    || !finitePositive(singapore.indicativeAreaSqm)
    || !finitePositive(dubai.indicativeAreaSqm)) return null;
  if (![seoul.sample, singapore.sample, dubai.sample].every(Number.isSafeInteger)
    || [seoul.sample, singapore.sample, dubai.sample].some((value) => value < 0)) return null;
  return Object.freeze({
    schemaVersion: RESEARCH_SCHEMA_VERSION,
    tool: 'passport',
    market: 'global',
    currency: input.budgetCurrency,
    bands: Object.freeze({
      budget: amount(input.budgetAmount, input.budgetCurrency),
      seoulArea: area(seoul.indicativeAreaSqm),
      singaporeArea: area(singapore.indicativeAreaSqm),
      dubaiArea: area(dubai.indicativeAreaSqm),
      seoulSample: sample(seoul.sample),
      singaporeSample: sample(singapore.sample),
      dubaiSample: sample(dubai.sample),
    }),
    categories: Object.freeze({ dubaiStage: input.dubaiStage }),
  });
}

export function createPropertyScenarioResearchSnapshot(input: Readonly<{
  currency: Exclude<ResearchCurrency, 'USD'>;
  purchasePrice: number;
  acquisitionCosts: number;
  monthlyRent: number;
  annualOperatingCosts: number;
  yieldPct: number;
  areaSqm?: number | null;
  housingType?: string | null;
}>): Snapshot<'property-scenario'> {
  const market = ({ KRW: 'kr-seoul', SGD: 'sg-singapore', AED: 'ae-dubai' } as const)[input.currency];
  const normalizedHousing = housingType(input.housingType);
  return Object.freeze({
    schemaVersion: RESEARCH_SCHEMA_VERSION,
    tool: 'property-scenario',
    market,
    currency: input.currency,
    bands: Object.freeze({
      purchasePrice: amount(input.purchasePrice, input.currency),
      acquisitionCosts: amount(input.acquisitionCosts, input.currency),
      monthlyRent: amount(input.monthlyRent, input.currency),
      annualOperatingCosts: amount(input.annualOperatingCosts, input.currency),
      yield: yieldBand(input.yieldPct),
      ...(finitePositive(input.areaSqm) ? { area: area(input.areaSqm) } : {}),
    }),
    categories: Object.freeze(normalizedHousing === null ? {} : { housingType: normalizedHousing }),
  });
}

type ReadySingleQuote = Readonly<{
  status: 'ready';
  input: Readonly<{
    transaction: CheckTransaction;
    areaSqm: number | null;
    housingType: string;
  }>;
  quote: Readonly<{ comparisonValueWon: number }>;
  sample: Readonly<{ count: number }>;
  verdict: ResearchVerdict;
  filters: Readonly<{ scope: 'building' | 'neighborhood' | 'district' }>;
}>;

export function createSingleQuoteResearchSnapshot(
  result: ReadySingleQuote,
): Snapshot<'single-quote'> | null {
  const normalizedHousing = housingType(result.input.housingType);
  if (normalizedHousing === null || !finitePositive(result.input.areaSqm)
    || !finitePositive(result.quote.comparisonValueWon)
    || !Number.isSafeInteger(result.sample.count) || result.sample.count < 0) return null;
  return Object.freeze({
    schemaVersion: RESEARCH_SCHEMA_VERSION,
    tool: 'single-quote',
    market: 'kr-seoul',
    currency: 'KRW',
    bands: Object.freeze({
      askingPrice: amount(result.quote.comparisonValueWon, 'KRW'),
      area: area(result.input.areaSqm),
      sample: sample(result.sample.count),
    }),
    categories: Object.freeze({
      transaction: result.input.transaction,
      housingType: normalizedHousing,
      verdict: result.verdict,
      scope: result.filters.scope,
    }),
  });
}

type ReadyOfferComparison = Readonly<{
  status: 'ready';
  basis: 'market-position' | 'equivalent-monthly-cost' | 'tradeoff';
  winner: 'a' | 'b' | 'equal' | null;
  offers: readonly Readonly<{
    id: 'a' | 'b';
    transaction: CheckTransaction;
    upfrontCashWon: number;
    recurringCashFlowWon: number | null;
    check: ReadySingleQuote;
  }>[];
}>;

export function createOfferCompareResearchSnapshot(
  comparison: ReadyOfferComparison,
): Snapshot<'offer-compare'> | null {
  const offerA = comparison.offers.find(({ id }) => id === 'a');
  const offerB = comparison.offers.find(({ id }) => id === 'b');
  if (offerA === undefined || offerB === undefined) return null;
  const comparisonCategory = comparison.winner === 'equal' ? 'equal'
    : comparison.basis === 'equivalent-monthly-cost' ? 'recurring-cost'
      : comparison.basis === 'market-position' ? 'market-position' : 'tradeoff';
  return Object.freeze({
    schemaVersion: RESEARCH_SCHEMA_VERSION,
    tool: 'offer-compare',
    market: 'kr-seoul',
    currency: 'KRW',
    bands: Object.freeze({
      offerAUpfront: amount(offerA.upfrontCashWon, 'KRW'),
      ...(offerA.recurringCashFlowWon === null ? {} : {
        offerARecurring: amount(offerA.recurringCashFlowWon, 'KRW'),
      }),
      offerBUpfront: amount(offerB.upfrontCashWon, 'KRW'),
      ...(offerB.recurringCashFlowWon === null ? {} : {
        offerBRecurring: amount(offerB.recurringCashFlowWon, 'KRW'),
      }),
      sampleA: sample(offerA.check.sample.count),
      sampleB: sample(offerB.check.sample.count),
    }),
    categories: Object.freeze({
      offerATransaction: offerA.transaction,
      offerBTransaction: offerB.transaction,
      comparison: comparisonCategory,
    }),
  });
}

export function createRentCheckResearchSnapshot(input: Readonly<{
  checkedInput: Readonly<{
    housingType: string;
    areaSqm: string;
    depositWon: string;
    monthlyRentWon: string;
  }>;
  envelope: Readonly<{
    status: 'success' | 'insufficient';
    result: Readonly<{ rating: 'below' | 'fair' | 'above' | 'insufficient'; comparableCount: number }>;
  }>;
}>): Snapshot<'rent-check'> | null {
  const normalizedHousing = housingType(input.checkedInput.housingType);
  const areaSqm = Number(input.checkedInput.areaSqm);
  const depositWon = Number(input.checkedInput.depositWon);
  const monthlyRentWon = Number(input.checkedInput.monthlyRentWon);
  if (input.envelope.status !== 'success' || input.envelope.result.rating === 'insufficient'
    || normalizedHousing === null || !finitePositive(areaSqm)
    || !Number.isFinite(depositWon) || depositWon < 0
    || !Number.isFinite(monthlyRentWon) || monthlyRentWon < 0
    || !Number.isSafeInteger(input.envelope.result.comparableCount)
    || input.envelope.result.comparableCount < 0) return null;
  return Object.freeze({
    schemaVersion: RESEARCH_SCHEMA_VERSION,
    tool: 'rent-check',
    market: 'kr-seoul',
    currency: 'KRW',
    bands: Object.freeze({
      deposit: amount(depositWon, 'KRW'),
      monthlyRent: amount(monthlyRentWon, 'KRW'),
      area: area(areaSqm),
      sample: sample(input.envelope.result.comparableCount),
    }),
    categories: Object.freeze({
      housingType: normalizedHousing,
      verdict: input.envelope.result.rating === 'fair' ? 'typical' : input.envelope.result.rating,
    }),
  });
}

type ReadySingaporeResult = Readonly<{
  status: 'ready';
  market: 'ura-private-sale' | 'hdb-resale' | 'hdb-rent';
  amountSgd: number;
  distribution: Readonly<{ p25: number; p75: number }>;
  sampleCount: number;
}>;

export function createSingaporeResearchSnapshot(input: Readonly<{
  draft: Readonly<Record<string, string> & { market: ReadySingaporeResult['market'] }>;
  result: ReadySingaporeResult;
}>): Snapshot<'singapore-check'> | null {
  if (input.draft.market !== input.result.market || input.result.market === 'hdb-rent') return null;
  const minimum = Number(input.draft['area-min']);
  const maximum = Number(input.draft['area-max']);
  if (!finitePositive(minimum) || !finitePositive(maximum) || minimum > maximum
    || !finitePositive(input.result.amountSgd)
    || !Number.isSafeInteger(input.result.sampleCount) || input.result.sampleCount < 0) return null;
  const segment = input.result.market === 'ura-private-sale' ? 'private-sale' : 'hdb-resale';
  const normalizedHousing = input.result.market === 'hdb-resale'
    ? 'hdb' as const
    : housingType(input.draft['property-type']);
  if (normalizedHousing === null) return null;
  const verdict: ResearchVerdict = input.result.amountSgd < input.result.distribution.p25 ? 'below'
    : input.result.amountSgd > input.result.distribution.p75 ? 'above' : 'typical';
  return Object.freeze({
    schemaVersion: RESEARCH_SCHEMA_VERSION,
    tool: 'singapore-check',
    market: 'sg-singapore',
    currency: 'SGD',
    bands: Object.freeze({
      askingPrice: amount(input.result.amountSgd, 'SGD'),
      area: area((minimum + maximum) / 2),
      sample: sample(input.result.sampleCount),
    }),
    categories: Object.freeze({ segment, housingType: normalizedHousing, verdict }),
  });
}

export function createDubaiResearchSnapshot(input: Readonly<{
  askingPriceAed: number;
  areaSqm: number;
  annualRentAed: number;
  yieldPct: number;
  sample: number;
  stage: 'ready' | 'off-plan';
  housingType: 'apartment' | 'villa';
  verdict: ResearchVerdict;
}>): Snapshot<'dubai-check'> {
  return Object.freeze({
    schemaVersion: RESEARCH_SCHEMA_VERSION,
    tool: 'dubai-check',
    market: 'ae-dubai',
    currency: 'AED',
    bands: Object.freeze({
      askingPrice: amount(input.askingPriceAed, 'AED'),
      area: area(input.areaSqm),
      sample: sample(input.sample),
      annualRent: amount(input.annualRentAed, 'AED'),
      yield: yieldBand(input.yieldPct),
    }),
    categories: Object.freeze({
      stage: input.stage,
      housingType: input.housingType,
      verdict: input.verdict,
    }),
  });
}

const FIELD_LABELS = {
  en: {
    budget: 'Budget band', seoulArea: 'Seoul area band', singaporeArea: 'Singapore area band', dubaiArea: 'Dubai area band',
    seoulSample: 'Seoul sample band', singaporeSample: 'Singapore sample band', dubaiSample: 'Dubai sample band',
    purchasePrice: 'Purchase price band', acquisitionCosts: 'Acquisition-cost band', monthlyRent: 'Monthly rent band', annualOperatingCosts: 'Annual operating-cost band',
    yield: 'Yield band', area: 'Area band', askingPrice: 'Asking price band', sample: 'Sample band', deposit: 'Deposit band',
    offerAUpfront: 'Offer A upfront band', offerARecurring: 'Offer A recurring band', offerBUpfront: 'Offer B upfront band', offerBRecurring: 'Offer B recurring band', sampleA: 'Offer A sample band', sampleB: 'Offer B sample band', annualRent: 'Annual rent band',
    dubaiStage: 'Dubai stage', housingType: 'Home type', transaction: 'Transaction', verdict: 'Market range', scope: 'Comparison scope',
    offerATransaction: 'Offer A transaction', offerBTransaction: 'Offer B transaction', comparison: 'Comparison basis', segment: 'Market segment', stage: 'Stage',
  },
  ko: {
    budget: '예산 구간', seoulArea: '서울 면적 구간', singaporeArea: '싱가포르 면적 구간', dubaiArea: '두바이 면적 구간',
    seoulSample: '서울 표본 구간', singaporeSample: '싱가포르 표본 구간', dubaiSample: '두바이 표본 구간',
    purchasePrice: '매입 가격 구간', acquisitionCosts: '취득 비용 구간', monthlyRent: '월 임대료 구간', annualOperatingCosts: '연 운영 비용 구간',
    yield: '수익률 구간', area: '면적 구간', askingPrice: '매물 가격 구간', sample: '표본 구간', deposit: '보증금 구간',
    offerAUpfront: 'A 선지급액 구간', offerARecurring: 'A 반복 비용 구간', offerBUpfront: 'B 선지급액 구간', offerBRecurring: 'B 반복 비용 구간', sampleA: 'A 표본 구간', sampleB: 'B 표본 구간', annualRent: '연 임대료 구간',
    dubaiStage: '두바이 단계', housingType: '주택 유형', transaction: '거래 유형', verdict: '시장 범위', scope: '비교 범위',
    offerATransaction: 'A 거래 유형', offerBTransaction: 'B 거래 유형', comparison: '비교 기준', segment: '시장 구분', stage: '단계',
  },
  'zh-CN': {
    budget: '预算区间', seoulArea: '首尔面积区间', singaporeArea: '新加坡面积区间', dubaiArea: '迪拜面积区间',
    seoulSample: '首尔样本区间', singaporeSample: '新加坡样本区间', dubaiSample: '迪拜样本区间',
    purchasePrice: '购买价格区间', acquisitionCosts: '购置成本区间', monthlyRent: '月租区间', annualOperatingCosts: '年度运营成本区间',
    yield: '收益率区间', area: '面积区间', askingPrice: '报价区间', sample: '样本区间', deposit: '押金区间',
    offerAUpfront: '报价 A 首付款区间', offerARecurring: '报价 A 经常性费用区间', offerBUpfront: '报价 B 首付款区间', offerBRecurring: '报价 B 经常性费用区间', sampleA: '报价 A 样本区间', sampleB: '报价 B 样本区间', annualRent: '年租金区间',
    dubaiStage: '迪拜阶段', housingType: '住宅类型', transaction: '交易类型', verdict: '市场区间', scope: '比较范围',
    offerATransaction: '报价 A 交易类型', offerBTransaction: '报价 B 交易类型', comparison: '比较依据', segment: '市场类别', stage: '阶段',
  },
} as const;

const CATEGORY_VALUES: Readonly<Record<ToolResearchLocale, Readonly<Record<string, string>>>> = {
  en: { ready: 'Ready', 'off-plan': 'Off-Plan', apartment: 'Apartment', villa: 'Villa', officetel: 'Officetel', detached: 'Detached home', condo: 'Condominium', hdb: 'HDB', landed: 'Landed home', townhouse: 'Townhouse', 'other-residential': 'Other residential', sale: 'Sale', jeonse: 'Jeonse', monthly: 'Monthly rent', below: 'Below the middle 50%', typical: 'Within the middle 50%', above: 'Above the middle 50%', district: 'District', neighborhood: 'Neighborhood', building: 'Building', 'market-position': 'Evidence-adjusted market position', 'recurring-cost': 'Recurring cost', tradeoff: 'Trade-off', equal: 'Equal', 'private-sale': 'Private sale', 'hdb-resale': 'HDB resale', 'hdb-rent': 'HDB rent' },
  ko: { ready: '준공', 'off-plan': '분양·건설 중', apartment: '아파트', villa: '빌라', officetel: '오피스텔', detached: '단독주택', condo: '콘도미니엄', hdb: 'HDB', landed: '랜드 주택', townhouse: '타운하우스', 'other-residential': '기타 주거', sale: '매매', jeonse: '전세', monthly: '월세', below: '중간 50%보다 낮음', typical: '중간 50% 안', above: '중간 50%보다 높음', district: '구', neighborhood: '동', building: '단지', 'market-position': '실거래 근거로 조정한 시장 내 위치', 'recurring-cost': '반복 비용', tradeoff: '상충 관계', equal: '동일', 'private-sale': '민간 매매', 'hdb-resale': 'HDB 재판매', 'hdb-rent': 'HDB 임대' },
  'zh-CN': { ready: '现房', 'off-plan': '期房', apartment: '公寓', villa: '别墅', officetel: '办公住宅', detached: '独立住宅', condo: '共管公寓', hdb: 'HDB', landed: '有地住宅', townhouse: '联排住宅', 'other-residential': '其他住宅', sale: '买卖', jeonse: '全租', monthly: '月租', below: '低于中间 50%', typical: '位于中间 50%', above: '高于中间 50%', district: '区', neighborhood: '街区', building: '楼盘', 'market-position': '经证据调整的市场位置', 'recurring-cost': '经常性费用', tradeoff: '各有取舍', equal: '相同', 'private-sale': '私人住宅买卖', 'hdb-resale': 'HDB 转售', 'hdb-rent': 'HDB 租赁' },
};

const NOT_MODELED: Readonly<Record<ToolResearchLocale, string>> = {
  en: 'Not included in calculation',
  ko: '계산에 포함하지 않음',
  'zh-CN': '未计入计算',
};

function localizedBand(value: string, locale: ToolResearchLocale): string {
  if (locale === 'en') return value;
  if (locale === 'ko') return value
    .replace(/^under (.+)$/u, '$1 미만')
    .replace(/ or more$/u, ' 이상')
    .replace(/^below (.+)$/u, '$1 미만')
    .replace(/ observations$/u, '건')
    .replace(/ observation$/u, '건')
    .replace(/m²/gu, '㎡');
  return value
    .replace(/^under /u, '低于 ')
    .replace(/ or more$/u, ' 以上')
    .replace(/^below /u, '低于 ')
    .replace(/ observations$/u, ' 条记录')
    .replace(/ observation$/u, ' 条记录');
}

export type ToolResearchPreviewRow = Readonly<{ label: string; value: string }>;

export function toolResearchPreview(
  snapshot: NormalizedToolResearchSnapshot,
  locale: ToolResearchLocale,
): readonly ToolResearchPreviewRow[] {
  const labels = FIELD_LABELS[locale] as Readonly<Record<string, string>>;
  const bands = describeToolResearchBands(snapshot);
  const omittedBands = snapshot.tool === 'offer-compare'
    ? (['offerARecurring', 'offerBRecurring'] as const)
      .filter((field) => !(field in snapshot.bands))
      .map((field) => Object.freeze({ label: labels[field] ?? field, value: NOT_MODELED[locale] }))
    : [];
  return Object.freeze([
    ...Object.entries(bands).map(([field, value]) => Object.freeze({
      label: labels[field] ?? field,
      value: localizedBand(value, locale),
    })),
    ...omittedBands,
    ...Object.entries(snapshot.categories).map(([field, value]) => Object.freeze({
      label: labels[field] ?? field,
      value: CATEGORY_VALUES[locale][value] ?? value,
    })),
  ]);
}

export function toolResearchPanelKey(
  snapshot: NormalizedToolResearchSnapshot,
  resultRevision: string | number,
): string {
  return JSON.stringify([String(resultRevision), canonicalToolResearchSnapshot(snapshot)]);
}

async function json(response: Response): Promise<Record<string, unknown>> {
  try {
    const value = await response.json() as unknown;
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? value as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

async function performToolResearchSubmission(
  snapshot: NormalizedToolResearchSnapshot,
  retryId: string,
  fetcher: ToolResearchFetcher,
): Promise<Readonly<{ state: 'stored' | 'duplicate' }>> {
  const ownerResponse = await fetcher(API_PATH, {
    ...JSON_REQUEST,
    method: 'PUT',
    body: '{}',
  });
  const owner = await json(ownerResponse);
  if (!ownerResponse.ok || owner.state !== 'owner-ready') {
    throw new Error('Tool research ownership initialization failed.');
  }
  const saveResponse = await fetcher(API_PATH, {
    ...JSON_REQUEST,
    method: 'POST',
    body: JSON.stringify({
      consent: { granted: true, version: RESEARCH_CONSENT_VERSION },
      retryId,
      snapshot,
    }),
  });
  const saved = await json(saveResponse);
  if (!saveResponse.ok || (saved.state !== 'stored' && saved.state !== 'duplicate')) {
    throw new Error('Tool research submission failed.');
  }
  return Object.freeze({ state: saved.state });
}

export function submitToolResearch(
  snapshot: NormalizedToolResearchSnapshot,
  retryId: string,
  fetcher: ToolResearchFetcher = globalThis.fetch,
): Promise<Readonly<{ state: 'stored' | 'duplicate' }>> {
  return enqueueResearchOperation(() => performToolResearchSubmission(snapshot, retryId, fetcher));
}

async function performToolResearchDeletion(
  fetcher: ToolResearchFetcher,
): Promise<Readonly<{ deletedCount: number }>> {
  const deleteResponse = await fetcher(API_PATH, {
    ...JSON_REQUEST,
    method: 'DELETE',
  });
  const deleted = await json(deleteResponse);
  if (!deleteResponse.ok || deleted.state !== 'deleted'
    || !Number.isSafeInteger(deleted.deletedCount) || Number(deleted.deletedCount) < 0) {
    throw new Error('Tool research deletion failed.');
  }
  return Object.freeze({ deletedCount: Number(deleted.deletedCount) });
}

export function deleteToolResearch(
  fetcher: ToolResearchFetcher = globalThis.fetch,
): Promise<Readonly<{ deletedCount: number }>> {
  return enqueueResearchOperation(() => performToolResearchDeletion(fetcher));
}
