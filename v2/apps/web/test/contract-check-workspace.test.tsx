import { readFileSync } from 'node:fs';
import type { KoreaConversionCurveProjection } from '@signedprice/korea-rent';
import {
  compareContractOffers,
  evaluateSingleQuoteCheck,
  type CheckTransaction,
  type SingleQuoteCheckInput,
  type SingleQuoteComparable,
} from '@signedprice/market-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { ContractCheckWorkspace } from '../components/contract-check/contract-check-workspace';
import type {
  ContractCheckReadyRouteModel,
  ContractCheckRouteModel,
} from '../lib/contract-check/route-model.server';

const curves: readonly KoreaConversionCurveProjection[] = Object.freeze([
  Object.freeze({
    housingType: 'apartment',
    period: '2026-03/2026-08',
    generatedAt: '2026-08-31T00:00:00.000Z',
    anchors: Object.freeze([
      Object.freeze({ deposit: 30_000_000, annualRate: 0.05, pairCount: 140 }),
      Object.freeze({ deposit: 100_000_000, annualRate: 0.04, pairCount: 160 }),
    ]),
  }),
]);

const navigation = Object.freeze([
  Object.freeze({ label: 'Check', href: '/kr/seoul/check/', available: true }),
  Object.freeze({ label: 'Explore', href: '/kr/seoul/explore/', available: true }),
  Object.freeze({ label: 'Guide', href: '/kr/seoul/guide/', available: true }),
] as const);

const records: readonly SingleQuoteComparable[] = Object.freeze(
  (['sale', 'jeonse', 'monthly'] as const).flatMap((transaction) =>
    [0, 1, 2, 3, 4, 5].map((index) => Object.freeze({
      transaction,
      districtSlug: 'gangnam-gu', neighborhoodId: 'yeoksam',
      buildingId: 'gangnam-gu-stable-building', housingType: 'apartment',
      areaSqm: 84 + index / 10, filedMonth: `2026-0${index + 2}`,
      salePriceWon: transaction === 'sale' ? 1_000_000_000 + index * 100_000_000 : null,
      depositWon: transaction === 'sale' ? null : 50_000_000 + index * 5_000_000,
      monthlyRentWon: transaction === 'monthly' ? 2_000_000 - index * 30_000 : null,
    }))),
);

function input(transaction: CheckTransaction): SingleQuoteCheckInput {
  return {
    transaction, districtSlug: 'gangnam-gu', buildingId: 'gangnam-gu-stable-building',
    neighborhoodId: null,
    housingType: 'apartment', areaSqm: 84,
    salePriceWon: transaction === 'sale' ? 1_200_000_000 : null,
    depositWon: transaction === 'sale' ? null : 50_000_000,
    monthlyRentWon: transaction === 'monthly' ? 2_000_000 : null,
  };
}

function check(transaction: CheckTransaction) {
  const result = evaluateSingleQuoteCheck({
    input: input(transaction), records, period: '2026-02/2026-08',
    ...(transaction === 'monthly' ? { conversionCurve: curves[0]! } : {}),
  });
  if (result.status !== 'ready') throw new Error('Expected ready check fixture.');
  return result;
}

function readyModel(
  left: CheckTransaction = 'sale',
  right: CheckTransaction = 'monthly',
  submitted = false,
): ContractCheckReadyRouteModel {
  const selection = Object.freeze({
    districtSlug: 'gangnam-gu', buildingId: 'gangnam-gu-stable-building',
    housingType: 'apartment' as const, areaSqm: 84,
    offers: Object.freeze({
      a: Object.freeze({
        transaction: left,
        salePriceWon: left === 'sale' ? 1_200_000_000 : null,
        depositWon: left === 'sale' ? null : 50_000_000,
        monthlyRentWon: left === 'monthly' ? 2_000_000 : null,
      }),
      b: Object.freeze({
        transaction: right,
        salePriceWon: right === 'sale' ? 1_200_000_000 : null,
        depositWon: right === 'sale' ? null : 50_000_000,
        monthlyRentWon: right === 'monthly' ? 2_000_000 : null,
      }),
    }),
  });
  const offerChecks = submitted
    ? Object.freeze({ a: check(left), b: check(right) })
    : null;
  return Object.freeze({
    status: 'ready', curves,
    availability: Object.freeze({ sale: true, jeonse: true, monthly: true, conversion: true }),
    districts: Object.freeze([{ slug: 'gangnam-gu', nameEn: 'Gangnam-gu', nameKo: '강남구' }]),
    selection, submitted, offerChecks,
    comparison: offerChecks === null ? null : compareContractOffers({
      offers: [{ id: 'a', check: offerChecks.a }, { id: 'b', check: offerChecks.b }],
      conversionCurve: curves[0],
    }),
    buildingName: 'Stable Apartments',
    disclosure: Object.freeze({
      source: 'MOLIT reported rental contracts',
      basis: 'Matched contracts in the same building and filed area',
      periods: Object.freeze({
        sale: Object.freeze({
          period: '2026-01/2026-07', startMonth: '2026-01', endMonth: '2026-07',
          completedMonthCount: 7, maximumMonthCount: 12,
        }),
        rent: Object.freeze({
          period: '2026-02/2026-08', startMonth: '2026-02', endMonth: '2026-08',
          completedMonthCount: 7, maximumMonthCount: 12,
        }),
        conversion: '2026-03/2026-08',
      }),
      boundary: 'Rates are interpolated only within verified anchors.',
    }),
    secondaryCheckHref: '/kr/seoul/tools/rent-check/', navigation,
  });
}

describe('all-type Contract Check workspace', () => {
  test('renders conditions, Offer A, Offer B, result, evidence, and disclosure in fixed order', () => {
    const html = renderToStaticMarkup(<ContractCheckWorkspace model={readyModel()} />);
    const order = [
      'data-check-section="conditions"', 'Offer A', 'Offer B',
      'data-check-section="verdict"', 'data-check-section="evidence"',
      'data-check-section="disclosure"',
    ].map((needle) => html.indexOf(needle));

    expect(order.every((value) => value >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((left, right) => left - right));
    expect(html).toContain('data-contract-check-form="ready"');
    expect(html).toContain('Compare two offers');
    expect(html).toContain('href="/kr/seoul/check"');
  });

  test.each([
    ['sale', 'monthly', ['a-price', 'b-deposit', 'b-monthly-rent'], ['a-deposit', 'a-monthly-rent', 'b-price']],
    ['jeonse', 'sale', ['a-deposit', 'b-price'], ['a-price', 'a-monthly-rent', 'b-deposit', 'b-monthly-rent']],
    ['monthly', 'jeonse', ['a-deposit', 'a-monthly-rent', 'b-deposit'], ['a-price', 'b-price', 'b-monthly-rent']],
  ] as const)('independently renders %s and %s fields without stale hidden values', (
    left, right, visible, hidden,
  ) => {
    const html = renderToStaticMarkup(<ContractCheckWorkspace model={readyModel(left, right)} />);
    for (const name of visible) expect(html).toContain(`name="${name}"`);
    for (const name of hidden) expect(html).not.toContain(`name="${name}"`);
    expect(html).toContain('name="a-transaction"');
    expect(html).toContain('name="b-transaction"');
  });

  test('renders sale versus rent as a neutral trade-off with filed cash flows and no winner copy', () => {
    const html = renderToStaticMarkup(<ContractCheckWorkspace model={readyModel('sale', 'monthly', true)} />);

    expect(html).toContain('data-comparison-basis="tradeoff"');
    expect(html).toContain('Trade-off — no winner declared');
    expect(html).toContain('Upfront cash');
    expect(html).toContain('Recurring cash flow');
    expect(html).toContain('Sale price as filed');
    expect(html).toContain('Deposit as filed');
    expect(html).toContain('Monthly rent as filed');
    expect(html).toContain('Not modeled');
    expect(html).not.toMatch(/₩0\s*\/\s*month/);
    expect(html).not.toMatch(/Offer [AB] (?:has the lower|wins)/i);
  });

  test('marks jeonse recurring cash flow as not applicable instead of zero', () => {
    const html = renderToStaticMarkup(<ContractCheckWorkspace model={readyModel('jeonse', 'monthly', true)} />);

    expect(html).toContain('Not applicable');
    expect(html).not.toMatch(/₩0\s*\/\s*month/);
  });

  test('labels sale, rental, and conversion periods separately', () => {
    const html = renderToStaticMarkup(<ContractCheckWorkspace model={readyModel('sale', 'monthly', true)} />);

    expect(html).toContain('Sale evidence window · 7 completed months · 2026-01–2026-07');
    expect(html).toContain('Rental evidence window · 7 completed months · 2026-02–2026-08');
    expect(html).toContain('Conversion period · 2026-03/2026-08');
  });

  test('uses shared responsive tokens, 44px controls, and non-overlapping graph grammar', () => {
    const css = readFileSync(
      new URL('../components/contract-check/contract-check.module.css', import.meta.url),
      'utf8',
    );

    expect(css).toMatch(/\.main\s*\{[\s\S]*?width:\s*min\(calc\(100% - \(2 \* var\(--page-gutter\)\)\),\s*1040px\)/);
    expect(css).toMatch(/(?:input|select|button)[^{]*\{[\s\S]*?min-height:\s*(?:44|4[5-9]|[5-9]\d)px/);
    expect(css).not.toMatch(/\.distributionLabel\s*\{[^}]*position:\s*absolute/);
    expect(css).toMatch(/@media\s*\(max-width:\s*560px\)/);
  });

  test('renders a claim-free unavailable boundary without interactive inputs', () => {
    const unavailable: ContractCheckRouteModel = Object.freeze({
      status: 'unavailable', message: 'Verified transaction evidence is unavailable.', navigation,
    });
    const html = renderToStaticMarkup(<ContractCheckWorkspace model={unavailable} />);

    expect(html).toContain('data-evidence-state="unavailable"');
    expect(html).not.toMatch(/<(?:input|select|button)\b/);
    expect(html).not.toMatch(/annualRate|pairCount|72,291|29\.4%/i);
  });
});
