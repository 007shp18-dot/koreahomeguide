import type { KoreaConversionCurveProjection } from '@signedprice/korea-rent';
import { compareRentOffers } from '@signedprice/market-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import {
  ContractCheckResult,
  ContractCheckWorkspace,
} from '../components/contract-check/contract-check-workspace';
import type { ContractCheckRouteModel } from '../lib/contract-check/route-model.server';

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
  Object.freeze({
    housingType: 'officetel',
    period: '2026-03/2026-08',
    generatedAt: '2026-08-31T00:00:00.000Z',
    anchors: Object.freeze([
      Object.freeze({ deposit: 20_000_000, annualRate: 0.06, pairCount: 150 }),
      Object.freeze({ deposit: 80_000_000, annualRate: 0.05, pairCount: 170 }),
    ]),
  }),
]);

const navigation = Object.freeze([
  Object.freeze({ label: 'Check', href: '/kr/seoul/check/', available: true }),
  Object.freeze({ label: 'Explore', href: '/kr/seoul/explore/', available: true }),
  Object.freeze({ label: 'Guide', href: '/kr/seoul/guide/', available: true }),
] as const);

const readyModel: ContractCheckRouteModel = Object.freeze({
  status: 'ready',
  curves,
  disclosure: Object.freeze({
    source: 'MOLIT reported rental contracts',
    basis: 'Matched contracts in the same building and filed area',
    period: '2026-03/2026-08',
    boundary: 'Rates are interpolated only within verified anchors.',
  }),
  secondaryCheckHref: '/kr/seoul/tools/rent-check/',
  navigation,
});

function auditCells(html: string, row: string): readonly string[] {
  const rowMarkup = html.match(
    new RegExp(`<tr data-calculation-row="${row}">([\\s\\S]*?)<\\/tr>`),
  )?.[1] ?? '';
  return [...rowMarkup.matchAll(/<td>(.*?)<\/td>/g)].map((match) => match[1] ?? '');
}

describe('Contract Check workspace SSR contract', () => {
  test('renders the primary decision flow in A, B, result order', () => {
    const html = renderToStaticMarkup(<ContractCheckWorkspace model={readyModel} />);

    const offerA = html.indexOf('Offer A');
    const offerB = html.indexOf('Offer B');
    const result = html.indexOf('Result');
    expect(offerA).toBeGreaterThan(-1);
    expect(offerB).toBeGreaterThan(offerA);
    expect(result).toBeGreaterThan(offerB);
    expect((html.match(/inputMode="numeric"/g) ?? [])).toHaveLength(4);
    expect(html).toContain('data-contract-check-form="ready"');
    expect(html).toContain('data-result-focus-target="true"');
    expect(html).toContain('aria-live="polite"');
    expect(html).not.toMatch(/<button[^>]*type="submit"|Compare offers/);
    const wordmarkAnchor = html.match(/<a[^>]*class="[^"]*wordmark[^"]*"[^>]*>/)?.[0] ?? '';
    expect(wordmarkAnchor).toContain('href="/"');
    expect(wordmarkAnchor).toContain('aria-label="SignedPrice home"');
  });

  test('renders HTML curve labels, filed-deposit markers, and four audit rows', () => {
    const comparison = compareRentOffers({
      curve: curves[0]!,
      offers: [
        { id: 'a', housingType: 'apartment', deposit: 120_000_000, monthlyRent: 100_000 },
        { id: 'b', housingType: 'apartment', deposit: 30_000_000, monthlyRent: 300_000 },
      ],
    });
    const html = renderToStaticMarkup(
      <ContractCheckResult comparison={comparison} curve={curves[0]!} />,
    );
    const svg = html.match(/<svg[\s\S]*?<\/svg>/)?.[0] ?? '';

    expect(svg).not.toContain('<text');
    expect(html).toContain('data-curve-label="true"');
    expect(html).toContain('data-offer-marker="a"');
    expect(html).toContain('data-marker-deposit="120000000"');
    expect(html).toContain('data-offer-marker="b"');
    expect(html).toContain('data-marker-deposit="30000000"');
    expect(html).toContain('data-range-segment="held"');
    expect(html).toContain('Outside measured range — held, not extended.');
    expect((html.match(/data-calculation-row=/g) ?? [])).toHaveLength(4);
    expect(html.indexOf('Rate at filed deposit')).toBeLessThan(html.indexOf('Difference from reference deposit'));
    expect(html.indexOf('Difference from reference deposit')).toBeLessThan(html.indexOf('Difference × annual rate ÷ 12'));
    expect(html.indexOf('Difference × annual rate ÷ 12')).toBeLessThan(html.indexOf('Monthly rent + row 3'));
    expect(auditCells(html, 'rate')).toEqual([
      '4.00% · Outside measured range — held, not extended.',
      '5.00% · Within measured range',
    ]);
    expect(auditCells(html, 'difference')).toEqual(['₩90,000,000', '₩0']);
    expect(auditCells(html, 'conversion')).toEqual(['₩300,000', '₩0']);
    expect(auditCells(html, 'normalized')).toEqual(['₩400,000', '₩300,000']);
  });

  test('discloses evidence and keeps the single-offer tool secondary', () => {
    const html = renderToStaticMarkup(<ContractCheckWorkspace model={readyModel} />);

    expect(html).toContain('MOLIT reported rental contracts');
    expect(html).toContain('Matched contracts in the same building and filed area');
    expect(html).toContain('2026-03/2026-08');
    expect(html).toContain('Rates are interpolated only within verified anchors.');
    expect(html).toContain('href="/kr/seoul/tools/rent-check"');
    expect(html).toContain('Check one offer against its local distribution');
    expect(html).toContain('href="/kr/seoul/explore"');
    expect(html).toContain('href="/kr/seoul/guide"');
    expect(html).not.toMatch(/News|Planned/);
  });

  test('does not expose unreleased markets or unverified marketing claims', () => {
    const html = renderToStaticMarkup(<ContractCheckWorkspace model={readyModel} />);

    expect(html).not.toMatch(/Singapore|Dubai|72,291|29\.4%/i);
    expect(html).not.toMatch(/statutory|legal rate/i);
  });

  test('renders a claim-free unavailable boundary without interactive inputs', () => {
    const unavailable: ContractCheckRouteModel = Object.freeze({
      status: 'unavailable',
      message: 'Verified conversion evidence is unavailable.',
      navigation,
    });
    const html = renderToStaticMarkup(<ContractCheckWorkspace model={unavailable} />);

    expect(html).toContain('Verified conversion evidence is unavailable.');
    expect(html).toContain('data-evidence-state="unavailable"');
    expect(html).toContain('data-empty-title="true"');
    expect(html).toContain('data-empty-reason="true"');
    expect(html).toContain('data-empty-action="true"');
    expect(html).not.toContain('Comparison paused.');
    expect(html).not.toMatch(/<(?:input|select|button)\b/);
    expect(html).not.toMatch(/annualRate|pairCount|72,291|29\.4%/i);
  });
});
