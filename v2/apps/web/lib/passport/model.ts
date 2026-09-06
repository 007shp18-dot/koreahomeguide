export type PassportLocale = 'en' | 'ko' | 'zh-CN';
export type PassportMarketId = 'kr-seoul' | 'sg-singapore' | 'ae-dubai';
export type PassportCurrency = 'KRW' | 'SGD' | 'AED';

export const DEFAULT_PASSPORT_BUDGET_WON = 500_000_000;
export const PASSPORT_FX = Object.freeze({
  asOf: '2026-09-04',
  eurKrw: 1569.38,
  eurSgd: 1.4724,
  eurUsd: 1.1622,
  usdAed: 3.6725,
  source: 'ECB and Central Bank of the UAE',
});

export type PassportScope = Readonly<{
  name: string;
  href: string;
  medianPrice: number;
}>;

export type PassportMarketEvidence = Readonly<{
  id: PassportMarketId;
  city: string;
  currency: PassportCurrency;
  localBudget: number;
  medianPsm: number | null;
  sample: number;
  period: string;
  yieldPct?: number | null;
  scopes: readonly PassportScope[];
}>;

export type PassportMarketResult = PassportMarketEvidence & Readonly<{
  localBudget: number;
  indicativeAreaSqm: number | null;
  matches: readonly PassportScope[];
}>;

export type PassportModel = Readonly<{
  budgetWon: number;
  locale: PassportLocale;
  href: string;
  fx: typeof PASSPORT_FX;
  markets: readonly PassportMarketResult[];
}>;

export function normalizePassportBudget(value: string | readonly string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(String(raw ?? '').replace(/[^0-9]/gu, ''));
  return Number.isSafeInteger(parsed) && parsed >= 10_000_000 && parsed <= 100_000_000_000
    ? parsed
    : DEFAULT_PASSPORT_BUDGET_WON;
}

export function passportHref(locale: PassportLocale, budgetWon: number): string {
  const prefix = locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : '';
  return `${prefix}/passport/?budget=${budgetWon}`;
}

function localBudget(currency: PassportCurrency, budgetWon: number): number {
  if (currency === 'KRW') return budgetWon;
  const eur = budgetWon / PASSPORT_FX.eurKrw;
  if (currency === 'SGD') return eur * PASSPORT_FX.eurSgd;
  return eur * PASSPORT_FX.eurUsd * PASSPORT_FX.usdAed;
}

export function buildPassportModel(input: Readonly<{
  budgetWon: number;
  locale: PassportLocale;
  evidence: readonly PassportMarketEvidence[];
}>): PassportModel {
  const budgetWon = normalizePassportBudget(String(input.budgetWon));
  const markets = input.evidence.map((market): PassportMarketResult => {
    const converted = localBudget(market.currency, budgetWon);
    return Object.freeze({
      ...market,
      localBudget: converted,
      indicativeAreaSqm: market.medianPsm === null ? null : Math.round(converted / market.medianPsm),
      matches: Object.freeze(market.scopes
        .filter(({ medianPrice }) => medianPrice <= converted)
        .sort((left, right) => right.medianPrice - left.medianPrice)),
    });
  });
  return Object.freeze({
    budgetWon,
    locale: input.locale,
    href: passportHref(input.locale, budgetWon),
    fx: PASSPORT_FX,
    markets: Object.freeze(markets),
  });
}
