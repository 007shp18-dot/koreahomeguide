import { describe, expect, it } from 'vitest';
import { buildPassportModel, passportHref } from '../lib/passport/model';
import { passportCandidateHref, retainPassportContext } from '../lib/passport/journey';
import { passportReturn } from '../lib/tools/property-scenario-context';
import { parseDubaiExploreState } from '../lib/dubai/explore-model';

const passport = passportHref('ko', 500000, 'USD', 'off-plan');
describe('Passport journey', () => {
  it('keeps the original amount, currency and stage through Explore, evidence and Check', () => {
    const candidate = passportCandidateHref('/ae/dubai/explore/?area=business-bay&housing=apartment&stage=off-plan', passport);
    const detail = retainPassportContext('/ae/dubai/explore/business-bay/', candidate, true);
    const check = retainPassportContext('/ae/dubai/check/?area=business-bay&housing=apartment&completion=off-plan', detail);
    for (const href of [candidate, detail, check]) expect(new URL(href, 'https://example.test').searchParams.get('passport')).toBe(passport);
    expect(new URL(detail, 'https://example.test').searchParams.get('stage')).toBe('off-plan');
    expect(new URL(check, 'https://example.test').searchParams.has('price')).toBe(false);
    expect(passportReturn(passport)).toBe(passport);
  });
  it('retains context when replacing filter state without reviving an old stage or budget', () => {
    const old = passportCandidateHref('/ae/dubai/explore/?stage=off-plan&budgetMax=2000000', passport);
    const next = new URL(retainPassportContext('/ae/dubai/explore/', old), 'https://example.test');
    expect(next.searchParams.has('passport')).toBe(true);
    expect(next.searchParams.has('stage')).toBe(false);
    expect(next.searchParams.has('budgetMax')).toBe(false);
  });
  it('ignores invalid, external, duplicate and unrelated context', () => {
    for (const value of ['https://evil.test/', '//evil.test/', '/passport/?budget=5&currency=BAD', '/passport/?budget=5&dubaiStage=unknown']) {
      expect(passportCandidateHref('/kr/seoul/check/', value)).toBe('/kr/seoul/check/');
    }
    const source = `/?passport=${encodeURIComponent(passport)}&passport=${encodeURIComponent(passport)}`;
    expect(retainPassportContext('/kr/seoul/check/', source)).toBe('/kr/seoul/check/');
    expect(passportCandidateHref('https://example.test/', passport)).toBe('https://example.test/');
    expect(passportCandidateHref('/privacy/', passport)).toBe('/privacy/');
  });
  it('supports a reference budget below the minimum valid property price', () => {
    expect(parseDubaiExploreState({ budgetMax: '25000' }).budgetMaximumAed).toBe(25000);
  });
  it('switches only Dubai evidence and excludes Ready yields from Off-Plan', () => {
    const evidence = [{ id: 'ae-dubai' as const, city: 'Dubai', currency: 'AED' as const,
      localBudget: 0, medianPsm: 10000, sample: 40, period: '2026', yieldPct: 6,
      scopes: [{ name: 'Ready', href: '/ae/dubai/explore/', medianPrice: 1000000 }],
      offPlan: { medianPsm: 20000, sample: 60, priceSample: 1, yieldPct: null,
        scopes: [{ name: 'Off-Plan', href: '/ae/dubai/explore/?stage=off-plan', medianPrice: 1200000 }] },
    }];
    const model = buildPassportModel({ budgetWon: 500000, budgetCurrency: 'USD', locale: 'ko', dubaiStage: 'off-plan', evidence });
    expect(model.markets[0]).toMatchObject({ medianPsm: 20000, sample: 60, yieldPct: null });
    expect(model.markets[0]?.matches.map(item => item.name)).toEqual(['Off-Plan']);
    expect(model.href).toBe(passport);
  });
});
