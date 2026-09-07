import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PassportEntry } from '../components/passport/passport-entry';
import { PassportWorkspace } from '../components/passport/passport-workspace';
import { buildPassportModel, type PassportMarketEvidence } from '../lib/passport/model';

const evidence: readonly PassportMarketEvidence[] = [
  { id: 'kr-seoul', city: 'Seoul', currency: 'KRW', localBudget: 0, medianPsm: 10_000_000, sample: 120, period: '2026-01/2026-08', scopes: [] },
  { id: 'sg-singapore', city: 'Singapore', currency: 'SGD', localBudget: 0, medianPsm: 20_000, sample: 80, period: '2026-01..2026-08', scopes: [] },
  { id: 'ae-dubai', city: 'Dubai', currency: 'AED', localBudget: 0, medianPsm: 18_000, sample: 60, period: '2026-01-01..2026-08-31', scopes: [] },
];

describe('Passport UI', () => {
  it('puts one budget action before the home market browser', () => {
    const html = renderToStaticMarkup(<PassportEntry locale="en" />);
    expect(html).toContain('Where can your budget become a home?');
    expect(html).toContain('action="/passport/"');
    expect(html).toContain('name="budget"');
  });

  it('renders the three results in fixed, equivalent card slots', () => {
    const model = buildPassportModel({ budgetWon: 500_000_000, locale: 'en', evidence });
    const html = renderToStaticMarkup(<PassportWorkspace initialModel={model} />);
    expect((html.match(/data-passport-market=/g) ?? [])).toHaveLength(3);
    expect((html.match(/data-passport-row="local-budget"/g) ?? [])).toHaveLength(3);
    expect((html.match(/data-passport-row="area"/g) ?? [])).toHaveLength(3);
    expect(html).toContain('Purchase price only');
  });
});

it('distinguishes missing comparison data from a budget with no matches', () => {
  const model = buildPassportModel({ budgetWon: 500_000_000, locale: 'en', evidence: [
    { ...evidence[0]!, medianPsm: null, sample: 0, scopes: [] },
    { ...evidence[1]!, scopes: [{ name: 'Above budget', href: '/sg/singapore/explore/', medianPrice: 99_000_000 }] },
  ] });
  const html = renderToStaticMarkup(<PassportWorkspace initialModel={model} />);
  expect(html).toContain('Comparable price data is not available yet.');
  expect(html).toContain('None of the areas or projects covered has a median price within this budget.');
});
