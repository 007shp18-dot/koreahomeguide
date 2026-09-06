import { describe, expect, it } from 'vitest';

import {
  buildPassportModel,
  normalizePassportBudget,
  PASSPORT_FX,
  passportHref,
  type PassportMarketEvidence,
} from '../lib/passport/model';

const evidence: readonly PassportMarketEvidence[] = [
  { id: 'kr-seoul', city: 'Seoul', currency: 'KRW', localBudget: 0, medianPsm: 10_000_000, sample: 120, period: '2026-01/2026-08', scopes: [
    { name: 'Mapo-gu', href: '/kr/seoul/explore/mapo-gu/', medianPrice: 480_000_000 },
    { name: 'Gangnam-gu', href: '/kr/seoul/explore/gangnam-gu/', medianPrice: 1_500_000_000 },
  ] },
  { id: 'sg-singapore', city: 'Singapore', currency: 'SGD', localBudget: 0, medianPsm: 20_000, sample: 80, period: '2026-01..2026-08', scopes: [
    { name: 'Example Residence', href: '/sg/singapore/explore/ocr/example/', medianPrice: 400_000 },
  ] },
  { id: 'ae-dubai', city: 'Dubai', currency: 'AED', localBudget: 0, medianPsm: 18_000, sample: 60, period: '2026-01-01..2026-08-31', yieldPct: 6.2, scopes: [
    { name: 'Business Bay', href: '/ae/dubai/explore/business-bay/', medianPrice: 1_200_000 },
  ] },
];

describe('SignedPrice Passport model', () => {
  it('normalizes formatted budgets and rejects amounts outside the v1 boundary', () => {
    expect(normalizePassportBudget('₩ 500,000,000')).toBe(500_000_000);
    expect(normalizePassportBudget(['600000000'])).toBe(600_000_000);
    expect(normalizePassportBudget('100')).toBe(500_000_000);
  });

  it('uses the dated reference FX snapshot and keeps matching scopes ordered by price', () => {
    const model = buildPassportModel({ budgetWon: 500_000_000, locale: 'en', evidence });
    expect(model.fx).toBe(PASSPORT_FX);
    expect(model.markets.map(({ currency }) => currency)).toEqual(['KRW', 'SGD', 'AED']);
    expect(model.markets[0]?.indicativeAreaSqm).toBe(50);
    expect(model.markets[0]?.matches.map(({ name }) => name)).toEqual(['Mapo-gu']);
    expect(model.markets[2]?.yieldPct).toBe(6.2);
  });

  it('creates one complete, localized share URL', () => {
    expect(passportHref('ko', 500_000_000)).toBe('/ko/passport/?budget=500000000');
    expect(passportHref('zh-CN', 500_000_000)).toBe('/zh-cn/passport/?budget=500000000');
  });
});
