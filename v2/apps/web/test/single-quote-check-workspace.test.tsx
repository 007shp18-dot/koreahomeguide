import { evaluateSingleQuoteCheck, type SingleQuoteComparable } from '@signedprice/market-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { SingleQuoteCheckWorkspace } from '../components/contract-check/single-quote-check';
import type { SingleQuoteCheckRouteModel } from '../lib/single-quote-check/route-model.server';

const baseModel: SingleQuoteCheckRouteModel = Object.freeze({
  availability: Object.freeze({ sale: true, jeonse: true, monthly: true }),
  districts: Object.freeze([
    Object.freeze({ slug: 'gangnam-gu', nameEn: 'Gangnam-gu', nameKo: '강남구' }),
  ]),
  selection: Object.freeze({
    transaction: 'sale', districtSlug: 'gangnam-gu', buildingId: null,
    neighborhoodId: null,
    housingType: 'apartment', areaSqm: 84,
    salePriceWon: 1_200_000_000, depositWon: null, monthlyRentWon: null,
  }),
  submitted: false,
  result: null,
  buildingName: null,
});

const saleRecords: readonly SingleQuoteComparable[] = Object.freeze(
  [0, 1, 2, 3, 4, 5].map((index) => Object.freeze({
    transaction: 'sale' as const, districtSlug: 'gangnam-gu', neighborhoodId: 'yeoksam',
    buildingId: 'gangnam-gu-stable-building', housingType: 'apartment',
    areaSqm: 84 + index / 10, filedMonth: '2026-0' + (index + 2),
    salePriceWon: 1_000_000_000 + index * 100_000_000,
    depositWon: null, monthlyRentWon: null,
  })),
);

describe('primary single quote Check workspace', () => {
  test('offers sale, jeonse and monthly while retaining all-type A/B compare as secondary', () => {
    const html = renderToStaticMarkup(<SingleQuoteCheckWorkspace model={baseModel} />);

    expect(html).toContain('data-primary-check="single-quote"');
    expect(html).toContain('value="sale"');
    expect(html).toContain('value="jeonse"');
    expect(html).toContain('value="monthly"');
    expect(html).toContain('name="price"');
    expect(html).not.toContain('name="deposit"');
    expect(html).not.toContain('name="monthly-rent"');
    expect(html).toContain('href="/kr/seoul/check/compare"');
    expect(html).toContain('Compare two offers');
  });

  test('renders the shared evidence order with exact scope, sample, percentile, and fallback disclosure', () => {
    const result = evaluateSingleQuoteCheck({
      input: {
        ...baseModel.selection,
        buildingId: 'gangnam-gu-stable-building',
      },
      records: saleRecords,
      period: '2026-02/2026-08',
    });
    const model: SingleQuoteCheckRouteModel = Object.freeze({
      ...baseModel, submitted: true, buildingName: 'Stable Apartments', result,
    });
    const html = renderToStaticMarkup(<SingleQuoteCheckWorkspace model={model} />);

    expect(html).toContain('Typical range');
    expect(html).toContain('Stable Apartments');
    expect(html).toContain('6 reported contracts');
    expect(html).toContain('±15% area');
    expect(html).toContain('2026-02–2026-08');
    expect(html).toContain('7 completed months');
    expect(html).toContain('Price percentile');
    expect(html).toContain('data-result-order="single-offer"');
    expect(html.indexOf('data-result-order="single-offer"')).toBeLessThan(html.indexOf('data-result-order="verdict"'));
    expect(html.indexOf('data-result-order="verdict"')).toBeLessThan(html.indexOf('data-result-order="key-figures"'));
  });

  test('does not invent a verdict when the public sample is insufficient', () => {
    const model: SingleQuoteCheckRouteModel = Object.freeze({
      ...baseModel,
      submitted: true,
      result: Object.freeze({
        status: 'insufficient', sample: Object.freeze({ count: 2, minimum: 5 }),
        period: '2026-02/2026-08',
        evidenceWindow: Object.freeze({
          period: '2026-02/2026-08',
          startMonth: '2026-02',
          endMonth: '2026-08',
          completedMonthCount: 7,
          maximumMonthCount: 12,
        }),
      }),
    });
    const html = renderToStaticMarkup(<SingleQuoteCheckWorkspace model={model} />);

    expect(html).toContain('Not enough compatible contracts');
    expect(html).toContain('five are required');
    expect(html).not.toContain('Typical range');
  });
});
