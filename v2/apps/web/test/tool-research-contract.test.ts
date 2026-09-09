import { describe, expect, it } from 'vitest';

import {
  RESEARCH_CONSENT_VERSION,
  bucketResearchAmount,
  bucketResearchArea,
  bucketResearchSample,
  bucketResearchYield,
  describeToolResearchBands,
  parseToolResearchSubmission,
} from '../lib/tool-research/contract';

const retryId = '018f47a6-7e8d-7e79-9f1e-123456789abc';

function singleQuote(overrides: Readonly<Record<string, unknown>> = {}) {
  return {
    consent: { granted: true, version: RESEARCH_CONSENT_VERSION },
    retryId,
    snapshot: {
      schemaVersion: 1,
      tool: 'single-quote',
      market: 'kr-seoul',
      currency: 'KRW',
      bands: {
        askingPrice: 'krw-100m-500m',
        area: 'sqm-60-85',
        sample: 'sample-10-24',
      },
      categories: {
        transaction: 'sale',
        housingType: 'apartment',
        verdict: 'typical',
        scope: 'district',
      },
    },
    ...overrides,
  };
}

describe('tool research normalized contract', () => {
  it('uses deterministic, human-describable boundary bands', () => {
    expect(bucketResearchAmount(0, 'KRW')).toEqual({ id: 'amount-none', label: 'KRW 0' });
    expect(bucketResearchAmount(999_999, 'KRW')).toEqual({ id: 'krw-under-1m', label: 'under KRW 1m' });
    expect(bucketResearchAmount(100_000_000, 'KRW')).toEqual({ id: 'krw-100m-500m', label: 'KRW 100m–500m' });
    expect(bucketResearchAmount(1_000_000, 'USD')).toEqual({ id: 'usd-1m-2m', label: 'USD 1m–2m' });
    expect(bucketResearchArea(85)).toEqual({ id: 'sqm-85-120', label: '85–120 m²' });
    expect(bucketResearchYield(-0.01)).toEqual({ id: 'yield-negative', label: 'below 0%' });
    expect(bucketResearchYield(6)).toEqual({ id: 'yield-6-plus', label: '6% or more' });
    expect(bucketResearchSample(5)).toEqual({ id: 'sample-5-9', label: '5–9 observations' });
  });

  it('accepts the exact discriminated snapshot and freezes normalized data', () => {
    const parsed = parseToolResearchSubmission(singleQuote());
    expect(parsed.snapshot.tool).toBe('single-quote');
    expect(parsed.snapshot.bands).toEqual({
      askingPrice: 'krw-100m-500m', area: 'sqm-60-85', sample: 'sample-10-24',
    });
    expect(Object.isFrozen(parsed.snapshot)).toBe(true);
    expect(describeToolResearchBands(parsed.snapshot)).toEqual({
      askingPrice: 'KRW 100m–500m', area: '60–85 m²', sample: '10–24 observations',
    });
  });

  it('allowlists a neighborhood evidence scope without relabeling it as district', () => {
    const original = singleQuote().snapshot;
    const parsed = parseToolResearchSubmission(singleQuote({
      snapshot: {
        ...original,
        categories: { ...original.categories, scope: 'neighborhood' },
      },
    }));
    expect(parsed.snapshot.categories).toMatchObject({ scope: 'neighborhood' });
  });

  it.each([
    ['unknown top-level field', singleQuote({ exactAmount: 250_000_000 })],
    ['unknown band field', singleQuote({ snapshot: {
      ...singleQuote().snapshot,
      bands: { ...singleQuote().snapshot.bands, exactAmount: 250_000_000 },
    } })],
    ['numeric band value', singleQuote({ snapshot: {
      ...singleQuote().snapshot,
      bands: { ...singleQuote().snapshot.bands, askingPrice: 250_000_000 },
    } })],
    ['unknown category field', singleQuote({ snapshot: {
      ...singleQuote().snapshot,
      categories: { ...singleQuote().snapshot.categories, address: 'Gangnam' },
    } })],
  ])('rejects %s rather than stripping it', (_name, input) => {
    expect(() => parseToolResearchSubmission(input)).toThrow('Invalid tool research submission.');
  });

  it('requires explicit consent at the current version', () => {
    expect(() => parseToolResearchSubmission(singleQuote({ consent: {
      granted: false, version: RESEARCH_CONSENT_VERSION,
    } }))).toThrow('Invalid tool research submission.');
    expect(() => parseToolResearchSubmission(singleQuote({ consent: {
      granted: true, version: 'research-consent-v0',
    } }))).toThrow('Invalid tool research submission.');
  });

  it.each([
    ['single-quote', 'kr-seoul', 'USD'],
    ['passport', 'global', 'JPY'],
    ['singapore-check', 'sg-singapore', 'AED'],
    ['dubai-check', 'kr-seoul', 'AED'],
    ['property-scenario', 'global', 'KRW'],
  ])('rejects invalid %s market/currency combinations', (tool, market, currency) => {
    const original = singleQuote().snapshot;
    expect(() => parseToolResearchSubmission(singleQuote({ snapshot: {
      ...original, tool, market, currency,
    } }))).toThrow('Invalid tool research submission.');
  });

  it('allows market-position comparisons with optional unmodeled recurring bands', () => {
    const snapshot = {
      schemaVersion: 1,
      tool: 'offer-compare',
      market: 'kr-seoul',
      currency: 'KRW',
      bands: {
        offerAUpfront: 'krw-100m-500m',
        offerBUpfront: 'krw-500m-1b',
        sampleA: 'sample-10-24',
        sampleB: 'sample-25-49',
      },
      categories: {
        offerATransaction: 'sale',
        offerBTransaction: 'sale',
        comparison: 'market-position',
      },
    };
    expect(parseToolResearchSubmission(singleQuote({ snapshot })).snapshot).toMatchObject(snapshot);
    expect(() => parseToolResearchSubmission(singleQuote({
      snapshot: {
        ...snapshot,
        categories: { ...snapshot.categories, comparison: 'upfront-cash' },
      },
    }))).toThrow('Invalid tool research submission.');
  });

  it('supports every approved result-producing tool with only its allowlisted fields', () => {
    const snapshots = [
      { schemaVersion: 1, tool: 'passport', market: 'global', currency: 'USD',
        bands: { budget: 'usd-100k-500k', seoulArea: 'sqm-40-60', singaporeArea: 'sqm-under-40', dubaiArea: 'sqm-60-85', seoulSample: 'sample-100-plus', singaporeSample: 'sample-25-49', dubaiSample: 'sample-50-99' },
        categories: { dubaiStage: 'ready' } },
      { schemaVersion: 1, tool: 'property-scenario', market: 'sg-singapore', currency: 'SGD',
        bands: { purchasePrice: 'sgd-500k-1m', acquisitionCosts: 'sgd-10k-100k', monthlyRent: 'sgd-1k-10k', annualOperatingCosts: 'amount-none', area: 'sqm-85-120', yield: 'yield-2-4' },
        categories: { housingType: 'condo' } },
      { schemaVersion: 1, tool: 'offer-compare', market: 'kr-seoul', currency: 'KRW',
        bands: { offerAUpfront: 'krw-100m-500m', offerARecurring: 'krw-1m-10m', offerBUpfront: 'krw-100m-500m', sampleA: 'sample-10-24', sampleB: 'sample-25-49' },
        categories: { offerATransaction: 'monthly', offerBTransaction: 'sale', comparison: 'market-position' } },
      { schemaVersion: 1, tool: 'rent-check', market: 'kr-seoul', currency: 'KRW',
        bands: { deposit: 'krw-10m-100m', monthlyRent: 'krw-1m-10m', area: 'sqm-60-85', sample: 'sample-10-24' },
        categories: { housingType: 'officetel', verdict: 'above' } },
      { schemaVersion: 1, tool: 'singapore-check', market: 'sg-singapore', currency: 'SGD',
        bands: { askingPrice: 'sgd-500k-1m', area: 'sqm-85-120', sample: 'sample-25-49' },
        categories: { segment: 'private-sale', housingType: 'condo', verdict: 'below' } },
      { schemaVersion: 1, tool: 'dubai-check', market: 'ae-dubai', currency: 'AED',
        bands: { askingPrice: 'aed-1m-5m', annualRent: 'aed-50k-250k', area: 'sqm-85-120', yield: 'yield-4-6', sample: 'sample-50-99' },
        categories: { stage: 'off-plan', housingType: 'apartment', verdict: 'typical' } },
    ];
    for (const snapshot of snapshots) {
      expect(parseToolResearchSubmission(singleQuote({ snapshot })).snapshot.tool).toBe(snapshot.tool);
    }
  });
});
