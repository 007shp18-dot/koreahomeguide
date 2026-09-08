import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { PassportWorkspace } from '../components/passport/passport-workspace';
import { buildPassportModel } from '../lib/passport/model';
import { PASSPORT_FX } from '../lib/passport/fx';

it('keeps the server-selected FX snapshot when the client workspace rebuilds the comparison', () => {
  const model = buildPassportModel({ budgetWon: 500_000, budgetCurrency: 'USD', locale: 'en',
    fx: { ...PASSPORT_FX, asOf: '2026-09-07', checkedAt: '2026-09-08T17:00:00.000Z',
      eurKrw: 1600, eurSgd: 1.5, eurUsd: 1.2, availability: 'reference' },
    evidence: [{ id: 'sg-singapore', city: 'Singapore', currency: 'SGD', localBudget: 0,
      medianPsm: 20_000, sample: 80, period: '2026-08', scopes: [] }],
  });
  const html = renderToStaticMarkup(<PassportWorkspace initialModel={model} />);
  expect(html).toContain('625,000');
  expect(html).toContain('2026-09-07');
  expect(html).toContain('2026-09-08T17:00:00.000Z');
  expect(html).not.toContain('Latest rates unavailable');
});

it.each(['en', 'ko', 'zh-CN'] as const)('discloses bundled fallback rates with no invented provider check: %s', locale => {
  const model = buildPassportModel({ budgetWon: 500_000_000, locale, evidence: [] });
  const html = renderToStaticMarkup(<PassportWorkspace initialModel={model} />);
  expect(html).toContain('data-fx-availability="fallback"');
  expect(html).toContain('2026-09-04');
  expect(html).not.toContain('data-fx-checked-at');
});
