import { PASSPORT_FX, type PassportFxSnapshot } from './fx';

export { PASSPORT_FX } from './fx';

export type PassportLocale = 'en' | 'ko' | 'zh-CN';
export type PassportMarketId = 'kr-seoul' | 'sg-singapore' | 'ae-dubai' | 'jp-tokyo';
export type PassportCurrency = 'KRW' | 'SGD' | 'AED' | 'JPY';
export type PassportBudgetCurrency = PassportCurrency | 'USD';
export const PASSPORT_BUDGET_CURRENCIES = ['USD', 'KRW', 'SGD', 'AED', 'JPY'] as const;
export function normalizePassportCurrency(value: unknown): PassportBudgetCurrency {
  return PASSPORT_BUDGET_CURRENCIES.includes(value as PassportBudgetCurrency) ? value as PassportBudgetCurrency : 'KRW';
}
export function defaultPassportBudget(locale: PassportLocale) {
  return locale === 'ko' ? { amount: 500_000_000, currency: 'KRW' as const } : { amount: 500_000, currency: 'USD' as const };
}

export const DEFAULT_PASSPORT_BUDGET_WON = 500_000_000;

export type PassportScope = Readonly<{
  name: string;
  href: string;
  medianPrice: number;
  kind?: 'building' | 'project' | 'ready-area' | 'off-plan-area' | 'neighbourhood';
  sample?: number;
  locationLabel?: string;
  neighborhoodName?: string;
  districtSlug?: string;
}>;

export type PassportMarketEvidence = Readonly<{
  id: PassportMarketId;
  city: string;
  currency: PassportCurrency;
  localBudget: number;
  medianPsm: number | null;
  sample: number;
  priceBasis?: 'transactions' | 'projects' | 'areas';
  priceSample?: number;
  period: string;
  yieldPct?: number | null;
  scopes: readonly PassportScope[];
  offPlan?: Readonly<{ medianPsm: number | null; sample: number; priceSample: number; scopes: readonly PassportScope[]; yieldPct: null }>;
}>;

export type PassportMarketResult = PassportMarketEvidence & Readonly<{
  localBudget: number;
  indicativeAreaSqm: number | null;
  matches: readonly PassportScope[];
}>;

export type PassportModel = Readonly<{
  dubaiStage: 'ready' | 'off-plan';
  budgetWon: number;
  budgetAmount: number;
  budgetCurrency: PassportBudgetCurrency;
  locale: PassportLocale;
  href: string;
  fx: PassportFxSnapshot;
  markets: readonly PassportMarketResult[];
}>;

export function normalizePassportBudget(value: string | readonly string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(String(raw ?? '').replace(/[^0-9]/gu, ''));
  return Number.isSafeInteger(parsed) && parsed >= 10_000_000 && parsed <= 100_000_000_000
    ? parsed
    : DEFAULT_PASSPORT_BUDGET_WON;
}

export function passportHref(locale: PassportLocale, budgetWon: number, currency: PassportBudgetCurrency = 'KRW', dubaiStage: 'ready' | 'off-plan' = 'ready'): string {
  const prefix = locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : '';
  return `${prefix}/passport/?budget=${budgetWon}${currency === 'KRW' ? '' : `&currency=${currency}`}${dubaiStage === 'off-plan' ? '&dubaiStage=off-plan' : ''}`;
}

export function convertPassportCurrency(amount: number, from: PassportBudgetCurrency, to: PassportBudgetCurrency, fx: PassportFxSnapshot = PASSPORT_FX): number {
  const rates = { KRW: fx.eurKrw, SGD: fx.eurSgd, USD: fx.eurUsd, AED: fx.eurUsd * fx.usdAed, JPY: fx.eurJpy };
  return amount / rates[from] * rates[to];
}

export function normalizePassportAmount(value: string | undefined, currency: PassportBudgetCurrency, fx: PassportFxSnapshot = PASSPORT_FX): number {
  const parsed = Number((value ?? '').replace(/,/gu, '').replace(/^[₩$\s]+/u, ''));
  const won = convertPassportCurrency(parsed, currency, 'KRW', fx);
  return Number.isFinite(parsed) && parsed > 0 && won >= 10_000_000 && won <= 100_000_000_000
    ? Math.round(parsed * 100) / 100 : Math.round(convertPassportCurrency(DEFAULT_PASSPORT_BUDGET_WON, 'KRW', currency, fx));
}

export function buildPassportModel(input: Readonly<{
  budgetWon: number;
  budgetAmount?: number;
  budgetCurrency?: PassportBudgetCurrency;
  dubaiStage?: 'ready' | 'off-plan';
  locale: PassportLocale;
  evidence: readonly PassportMarketEvidence[];
  fx?: PassportFxSnapshot;
}>): PassportModel {
  const fx = input.fx ?? PASSPORT_FX;
  const budgetCurrency = input.budgetCurrency ?? 'KRW';
  const budgetAmount = normalizePassportAmount(String(input.budgetAmount ?? input.budgetWon), budgetCurrency, fx);
  const budgetWon = convertPassportCurrency(budgetAmount, budgetCurrency, 'KRW', fx);
  const dubaiStage = input.dubaiStage ?? 'ready';
  const markets = input.evidence.map((base): PassportMarketResult => {
    const market = base.id === 'ae-dubai' && dubaiStage === 'off-plan' ? { ...base, ...(base.offPlan ?? { medianPsm: null, sample: 0, priceSample: 0, scopes: [], yieldPct: null }) } : base;
    const converted = convertPassportCurrency(budgetWon, 'KRW', market.currency, fx);
    const scopes = Object.freeze(market.scopes.filter(({ medianPrice }) => Number.isFinite(medianPrice) && medianPrice > 0));
    return Object.freeze({
      ...market,
      localBudget: converted,
      scopes,
      indicativeAreaSqm: market.medianPsm === null || !Number.isFinite(market.medianPsm) || market.medianPsm <= 0 ? null : Math.round(converted / market.medianPsm),
      matches: Object.freeze(scopes
        .filter(({ medianPrice }) => medianPrice <= converted)
        .sort((left, right) => right.medianPrice - left.medianPrice)),
    });
  });
  return Object.freeze({
    dubaiStage,
    budgetWon,
    budgetAmount,
    budgetCurrency,
    locale: input.locale,
    href: passportHref(input.locale, budgetAmount, budgetCurrency, dubaiStage),
    fx,
    markets: Object.freeze(markets),
  });
}
