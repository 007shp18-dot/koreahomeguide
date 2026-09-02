import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { SingleQuoteCheckWorkspace } from '../components/single-quote-check/single-quote-check-workspace';
import type { SingleQuoteCheckRouteModel } from '../lib/single-quote-check/route-model.server';

const baseModel: SingleQuoteCheckRouteModel = Object.freeze({
  availability: Object.freeze({ sale: true, jeonse: true, monthly: true }),
  districts: Object.freeze([
    Object.freeze({ slug: 'gangnam-gu', nameEn: 'Gangnam-gu', nameKo: '강남구' }),
  ]),
  selection: Object.freeze({
    transaction: 'sale',
    districtSlug: 'gangnam-gu',
    buildingId: null,
    housingType: 'apartment',
    areaSqm: 84,
    depositWon: null,
    quoteWon: 1_200_000_000,
  }),
  submitted: false,
  result: null,
  buildingName: null,
});

describe('primary single quote Check workspace', () => {
  test('offers sale, jeonse and monthly rent while retaining A/B compare as secondary', () => {
    const html = renderToStaticMarkup(<SingleQuoteCheckWorkspace model={baseModel} />);

    expect(html).toContain('data-primary-check="single-quote"');
    expect(html).toContain('value="sale"');
    expect(html).toContain('value="jeonse"');
    expect(html).toContain('value="monthly"');
    expect(html).toContain('name="area"');
    expect(html).toContain('name="price"');
    expect(html).toContain('href="/kr/seoul/check/compare"');
    expect(html).toContain('Compare two rental offers');
  });

  test('renders an evidence-bounded verdict with its exact scope and cohort', () => {
    const model: SingleQuoteCheckRouteModel = Object.freeze({
      ...baseModel,
      submitted: true,
      buildingName: 'Alpha Apartments',
      result: Object.freeze({
        status: 'ready',
        scope: 'building',
        comparisonBasis: 'reported-sale-price',
        verdict: 'typical',
        quoteWon: 1_200_000_000,
        medianWon: 1_150_000_000,
        middleHalfWon: Object.freeze([1_000_000_000, 1_300_000_000] as const),
        differencePct: 4.3,
        sampleCount: 8,
        period: '2026-02/2026-08',
        areaTolerancePct: 15,
        comparables: Object.freeze([]),
      }),
    });
    const html = renderToStaticMarkup(<SingleQuoteCheckWorkspace model={model} />);

    expect(html).toContain('Typical range');
    expect(html).toContain('Alpha Apartments');
    expect(html).toContain('Same building');
    expect(html).toContain('8 reported contracts');
    expect(html).toContain('±15% area');
    expect(html).toContain('2026-02/2026-08');
    expect(html).toContain('Market reference only');
  });

  test('does not invent a verdict when the public sample is insufficient', () => {
    const model: SingleQuoteCheckRouteModel = Object.freeze({
      ...baseModel,
      submitted: true,
      result: Object.freeze({ status: 'insufficient', sampleCount: 2, period: '2026-02/2026-08' }),
    });
    const html = renderToStaticMarkup(<SingleQuoteCheckWorkspace model={model} />);

    expect(html).toContain('Not enough compatible contracts');
    expect(html).toContain('No price verdict is published');
    expect(html).not.toContain('Typical range');
  });
});
