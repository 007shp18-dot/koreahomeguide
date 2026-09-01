import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type {
  SeoulRentCheckEnvelope,
  SeoulRentCheckErrorEnvelope,
} from '@signedprice/korea-rent';
import { ComparableContracts } from '../components/rent-check/comparable-contracts';
import {
  RentCheckResult,
  retryCountdownModel,
  startRetryCountdown,
} from '../components/rent-check/rent-check-result';
import { SourceDisclosure } from '../components/rent-check/source-disclosure';
import {
  requestRentCheck,
  type RentCheckApiSuccess,
  type RentCheckInput,
} from '../lib/rent-check/client-state';

const distributionInput: RentCheckInput = {
  lawdCd: '11590', housingType: 'studio', areaSqm: '25', areaUnit: 'sqm',
  depositWon: '10000000', monthlyRentWon: '900000',
};

const limitedInput: RentCheckInput = {
  lawdCd: '11590', housingType: 'officetel', areaSqm: '28', areaUnit: 'sqm',
  depositWon: '10000000', monthlyRentWon: '1100200',
};

const jeonseInput: RentCheckInput = {
  lawdCd: '11680', housingType: 'villa', areaSqm: '60', areaUnit: 'sqm',
  depositWon: '250000000', monthlyRentWon: '0',
};

const positiveInput: RentCheckInput = {
  lawdCd: '11590', housingType: 'officetel', areaSqm: '28', areaUnit: 'sqm',
  depositWon: '10000000', monthlyRentWon: '1100200',
};

const insufficientInput: RentCheckInput = {
  lawdCd: '11680', housingType: 'villa', areaSqm: '60', areaUnit: 'sqm',
  depositWon: '250000000', monthlyRentWon: '0',
};

const distributionEnvelope = {
  marketId: 'kr-seoul',
  status: 'success',
  requestedHousingType: 'studio',
  sourceHousingType: 'detached',
  typeMapping: {
    applied: true,
    explanation: 'Studio is compared with detached/multi-unit source records.',
  },
  source: {
    provider: 'MOLIT',
    dataset: 'Detached and multi-unit rental contracts',
    endpointVersion: 'v1',
    parserVersion: 'kr-molit-rent-parser-v2',
    rightsPolicyId: 'kr-molit-rent-v1',
    attribution: ['Ministry of Land, Infrastructure and Transport (MOLIT)'],
  },
  coverage: {
    basis: 'contract_date',
    timezone: 'Asia/Seoul',
    coverageThroughMonth: '2026-07',
    latestContractMonth: '2026-07',
    sourceRetrievedAt: {
      earliest: '2026-08-01T00:00:00.000Z',
      latest: '2026-08-01T00:05:00.000Z',
    },
    responseGeneratedAt: '2026-08-01T00:06:00.000Z',
    monthsUsed: 3,
  },
  methodology: {
    policyId: 'kr-rent-check-quote-normalization',
    version: 1,
    annualDepositRate: 0.05,
    verdictBasis: 'typical-range',
    contractSelection: 'mixed',
    eligibleContractTypeCounts: { new: 8, renewal: 2, unknown: 2 },
    selectedContractTypeCounts: { new: 8, renewal: 2, unknown: 2 },
    sourceRecordStatusCounts: { active: 10, cancelled: 1, unknown: 2 },
  },
  result: {
    rating: 'fair',
    comparisonMode: 'monthly-rent',
    comparisonBasis: 'deposit-adjusted-monthly-rent',
    askingValueWon: 900_000,
    medianValueWon: 910_000,
    minValueWon: 780_000,
    p25ValueWon: 850_000,
    p75ValueWon: 950_000,
    maxValueWon: 1_080_000,
    differencePct: -1.1,
    percentileRank: 42,
    verdictBasis: 'typical-range',
    confidence: 'high',
    comparableCount: 12,
    monthsUsed: 3,
    tier: 1,
  },
  comparables: [
    {
      buildingLabel: 'July House A', areaSqm: 25, depositWon: 10_000_000,
      monthlyRentWon: 900_000, contractDate: '2026-07-28', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'July House B', areaSqm: 26, depositWon: 11_000_000,
      monthlyRentWon: 930_000, contractDate: '2026-07-22', contractType: 'unknown',
      recordStatus: 'unknown',
    },
    {
      buildingLabel: 'July House C', areaSqm: 25, depositWon: 10_000_000,
      monthlyRentWon: 950_000, contractDate: '2026-07-17', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'July House D', areaSqm: 26.2, depositWon: 12_000_000,
      monthlyRentWon: 1_080_000, contractDate: '2026-07-09', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'June House A', areaSqm: 25.5, depositWon: 10_000_000,
      monthlyRentWon: 910_000, contractDate: '2026-06-30', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'June House B', areaSqm: 24.5, depositWon: 9_000_000,
      monthlyRentWon: 850_000, contractDate: '2026-06-18', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'June House C', areaSqm: 23.8, depositWon: 8_000_000,
      monthlyRentWon: 820_000, contractDate: '2026-06-12', contractType: 'renewal',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'June House D', areaSqm: 25.1, depositWon: 10_000_000,
      monthlyRentWon: 920_000, contractDate: '2026-06-05', contractType: 'new',
      recordStatus: 'active',
    },
    {
      areaSqm: 24.9, depositWon: 10_000_000, monthlyRentWon: 890_000,
      contractDate: '2026-05-29', contractType: 'unknown', recordStatus: 'unknown',
    },
    {
      buildingLabel: 'Older House', areaSqm: 24, depositWon: 8_000_000,
      monthlyRentWon: 780_000, contractDate: '2026-05-04', contractType: 'renewal',
      recordStatus: 'active',
    },
  ],
  limitations: [
    'Official reported contracts use contract dates and are not current asking listings.',
    'Records may later be corrected or cancelled; status coverage is incomplete.',
    'This result is a market reference, not an appraisal or legal advice.',
    '5.0%/year signedprice comparison assumption.',
    'Floor, condition, furnishings, maintenance fees, view, renovation, exact brokerage fees, and deposit-return risk require separate verification.',
    'MOLIT classifies the studio alias under detached and multi-unit source records.',
  ],
} satisfies SeoulRentCheckEnvelope;

const limitedEnvelope = {
  marketId: 'kr-seoul',
  status: 'success',
  requestedHousingType: 'officetel',
  sourceHousingType: 'officetel',
  typeMapping: { applied: false, explanation: null },
  source: {
    provider: 'MOLIT',
    dataset: 'Officetel rental contracts',
    endpointVersion: 'v1',
    parserVersion: 'kr-molit-rent-parser-v2',
    rightsPolicyId: 'kr-molit-rent-v1',
    attribution: ['Ministry of Land, Infrastructure and Transport (MOLIT)'],
  },
  coverage: {
    basis: 'contract_date',
    timezone: 'Asia/Seoul',
    coverageThroughMonth: '2026-07',
    latestContractMonth: '2026-07',
    sourceRetrievedAt: {
      earliest: '2026-08-01T00:00:00.000Z',
      latest: '2026-08-01T00:05:00.000Z',
    },
    responseGeneratedAt: '2026-08-01T00:06:00.000Z',
    monthsUsed: 12,
  },
  methodology: {
    policyId: 'kr-rent-check-quote-normalization',
    version: 1,
    annualDepositRate: 0.05,
    verdictBasis: 'median-fallback',
    contractSelection: 'new_only',
    eligibleContractTypeCounts: { new: 4, renewal: 0, unknown: 0 },
    selectedContractTypeCounts: { new: 4, renewal: 0, unknown: 0 },
    sourceRecordStatusCounts: { active: 4, cancelled: 0, unknown: 0 },
  },
  result: {
    rating: 'above',
    comparisonMode: 'monthly-rent',
    comparisonBasis: 'deposit-adjusted-monthly-rent',
    askingValueWon: 1_100_200,
    medianValueWon: 1_000_000,
    minValueWon: null,
    p25ValueWon: null,
    p75ValueWon: null,
    maxValueWon: null,
    differencePct: 10,
    percentileRank: null,
    verdictBasis: 'median-fallback',
    confidence: 'low',
    comparableCount: 4,
    monthsUsed: 12,
    tier: 3,
  },
  comparables: [
    {
      buildingLabel: 'Limited A', areaSqm: 28, depositWon: 10_000_000,
      monthlyRentWon: 1_020_000, contractDate: '2026-07-24', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'Limited B', areaSqm: 27, depositWon: 10_000_000,
      monthlyRentWon: 1_000_000, contractDate: '2026-06-20', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'Limited C', areaSqm: 29, depositWon: 10_000_000,
      monthlyRentWon: 980_000, contractDate: '2026-05-12', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'Limited D', areaSqm: 28.5, depositWon: 10_000_000,
      monthlyRentWon: 1_040_000, contractDate: '2026-04-08', contractType: 'new',
      recordStatus: 'active',
    },
  ],
  limitations: [
    'Official reported contracts use contract dates and are not current asking listings.',
    'Records may later be corrected or cancelled; status coverage is incomplete.',
    'This result is a market reference, not an appraisal or legal advice.',
    '5.0%/year signedprice comparison assumption.',
    'Floor, condition, furnishings, maintenance fees, view, renovation, exact brokerage fees, and deposit-return risk require separate verification.',
  ],
} satisfies SeoulRentCheckEnvelope;

const jeonseEnvelope = {
  marketId: 'kr-seoul',
  status: 'success',
  requestedHousingType: 'villa',
  sourceHousingType: 'villa',
  typeMapping: { applied: false, explanation: null },
  source: {
    provider: 'MOLIT',
    dataset: 'Villa and row-house rental contracts',
    endpointVersion: 'v1',
    parserVersion: 'kr-molit-rent-parser-v2',
    rightsPolicyId: 'kr-molit-rent-v1',
    attribution: ['Ministry of Land, Infrastructure and Transport (MOLIT)'],
  },
  coverage: {
    basis: 'contract_date',
    timezone: 'Asia/Seoul',
    coverageThroughMonth: '2026-07',
    latestContractMonth: '2026-07',
    sourceRetrievedAt: {
      earliest: '2026-03-01T00:00:00.000Z',
      latest: '2026-08-01T00:05:00.000Z',
    },
    responseGeneratedAt: '2026-08-01T00:06:00.000Z',
    monthsUsed: 6,
  },
  methodology: {
    policyId: 'kr-rent-check-quote-normalization',
    version: 1,
    annualDepositRate: null,
    verdictBasis: 'typical-range',
    contractSelection: 'new_only',
    eligibleContractTypeCounts: { new: 5, renewal: 0, unknown: 0 },
    selectedContractTypeCounts: { new: 5, renewal: 0, unknown: 0 },
    sourceRecordStatusCounts: { active: 5, cancelled: 0, unknown: 0 },
  },
  result: {
    rating: 'fair',
    comparisonMode: 'jeonse-deposit',
    comparisonBasis: 'jeonse-deposit',
    askingValueWon: 250_000_000,
    medianValueWon: 250_000_000,
    minValueWon: 230_000_000,
    p25ValueWon: 240_000_000,
    p75ValueWon: 260_000_000,
    maxValueWon: 270_000_000,
    differencePct: 0,
    percentileRank: 60,
    verdictBasis: 'typical-range',
    confidence: 'medium',
    comparableCount: 5,
    monthsUsed: 6,
    tier: 2,
  },
  comparables: [
    {
      buildingLabel: 'Jeonse A', areaSqm: 60, depositWon: 250_000_000,
      monthlyRentWon: 0, contractDate: '2026-07-21', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'Jeonse B', areaSqm: 61, depositWon: 270_000_000,
      monthlyRentWon: 0, contractDate: '2026-06-18', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'Jeonse C', areaSqm: 59, depositWon: 240_000_000,
      monthlyRentWon: 0, contractDate: '2026-05-14', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'Jeonse D', areaSqm: 60.5, depositWon: 260_000_000,
      monthlyRentWon: 0, contractDate: '2026-04-09', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'Jeonse E', areaSqm: 58.5, depositWon: 230_000_000,
      monthlyRentWon: 0, contractDate: '2026-03-03', contractType: 'new',
      recordStatus: 'active',
    },
  ],
  limitations: [
    'Official reported contracts use contract dates and are not current asking listings.',
    'Records may later be corrected or cancelled; status coverage is incomplete.',
    'This result is a market reference, not an appraisal or legal advice.',
    '5.0%/year signedprice comparison assumption.',
    'Floor, condition, furnishings, maintenance fees, view, renovation, exact brokerage fees, and deposit-return risk require separate verification.',
  ],
} satisfies SeoulRentCheckEnvelope;

const positiveEnvelope = {
  marketId: 'kr-seoul',
  status: 'success',
  requestedHousingType: 'officetel',
  sourceHousingType: 'officetel',
  typeMapping: { applied: false, explanation: null },
  source: {
    provider: 'MOLIT',
    dataset: 'Officetel rental contracts',
    endpointVersion: 'v1',
    parserVersion: 'kr-molit-rent-parser-v2',
    rightsPolicyId: 'kr-molit-rent-v1',
    attribution: ['Ministry of Land, Infrastructure and Transport (MOLIT)'],
  },
  coverage: {
    basis: 'contract_date',
    timezone: 'Asia/Seoul',
    coverageThroughMonth: '2026-07',
    latestContractMonth: '2026-07',
    sourceRetrievedAt: {
      earliest: '2026-06-01T00:00:00.000Z',
      latest: '2026-08-01T00:05:00.000Z',
    },
    responseGeneratedAt: '2026-08-01T00:06:00.000Z',
    monthsUsed: 3,
  },
  methodology: {
    policyId: 'kr-rent-check-quote-normalization',
    version: 1,
    annualDepositRate: 0.05,
    verdictBasis: 'typical-range',
    contractSelection: 'new_only',
    eligibleContractTypeCounts: { new: 5, renewal: 0, unknown: 0 },
    selectedContractTypeCounts: { new: 5, renewal: 0, unknown: 0 },
    sourceRecordStatusCounts: { active: 5, cancelled: 0, unknown: 0 },
  },
  result: {
    rating: 'above',
    comparisonMode: 'monthly-rent',
    comparisonBasis: 'deposit-adjusted-monthly-rent',
    askingValueWon: 1_100_200,
    medianValueWon: 1_000_000,
    minValueWon: 800_000,
    p25ValueWon: 900_000,
    p75ValueWon: 1_050_000,
    maxValueWon: 1_200_000,
    differencePct: 10,
    percentileRank: 80,
    verdictBasis: 'typical-range',
    confidence: 'medium',
    comparableCount: 5,
    monthsUsed: 3,
    tier: 1,
  },
  comparables: [
    {
      buildingLabel: 'Positive A', areaSqm: 28, depositWon: 10_000_000,
      monthlyRentWon: 1_000_000, contractDate: '2026-07-25', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'Positive B', areaSqm: 27, depositWon: 10_000_000,
      monthlyRentWon: 1_200_000, contractDate: '2026-07-11', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'Positive C', areaSqm: 29, depositWon: 10_000_000,
      monthlyRentWon: 900_000, contractDate: '2026-06-20', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'Positive D', areaSqm: 28.5, depositWon: 10_000_000,
      monthlyRentWon: 1_050_000, contractDate: '2026-06-04', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'Positive E', areaSqm: 27.5, depositWon: 10_000_000,
      monthlyRentWon: 800_000, contractDate: '2026-05-09', contractType: 'new',
      recordStatus: 'active',
    },
  ],
  limitations: [
    'Official reported contracts use contract dates and are not current asking listings.',
    'Records may later be corrected or cancelled; status coverage is incomplete.',
    'This result is a market reference, not an appraisal or legal advice.',
    '5.0%/year signedprice comparison assumption.',
    'Floor, condition, furnishings, maintenance fees, view, renovation, exact brokerage fees, and deposit-return risk require separate verification.',
  ],
} satisfies SeoulRentCheckEnvelope;

const insufficientEnvelope = {
  marketId: 'kr-seoul',
  status: 'insufficient',
  requestedHousingType: 'villa',
  sourceHousingType: 'villa',
  typeMapping: { applied: false, explanation: null },
  source: {
    provider: 'MOLIT',
    dataset: 'Villa and row-house rental contracts',
    endpointVersion: 'v1',
    parserVersion: 'kr-molit-rent-parser-v2',
    rightsPolicyId: 'kr-molit-rent-v1',
    attribution: ['Ministry of Land, Infrastructure and Transport (MOLIT)'],
  },
  coverage: {
    basis: 'contract_date',
    timezone: 'Asia/Seoul',
    coverageThroughMonth: '2026-07',
    latestContractMonth: null,
    sourceRetrievedAt: {
      earliest: '2025-08-01T00:00:00.000Z',
      latest: '2026-08-01T00:05:00.000Z',
    },
    responseGeneratedAt: '2026-08-01T00:06:00.000Z',
    monthsUsed: 12,
  },
  methodology: {
    policyId: 'kr-rent-check-quote-normalization',
    version: 1,
    annualDepositRate: null,
    verdictBasis: null,
    contractSelection: null,
    eligibleContractTypeCounts: { new: 0, renewal: 0, unknown: 0 },
    selectedContractTypeCounts: { new: 0, renewal: 0, unknown: 0 },
    sourceRecordStatusCounts: { active: 0, cancelled: 0, unknown: 0 },
  },
  result: {
    rating: 'insufficient',
    comparisonMode: 'jeonse-deposit',
    comparisonBasis: 'jeonse-deposit',
    askingValueWon: 250_000_000,
    medianValueWon: null,
    minValueWon: null,
    p25ValueWon: null,
    p75ValueWon: null,
    maxValueWon: null,
    differencePct: null,
    percentileRank: null,
    verdictBasis: null,
    confidence: null,
    comparableCount: 0,
    monthsUsed: 12,
    tier: null,
  },
  comparables: [],
  limitations: [
    'Official reported contracts use contract dates and are not current asking listings.',
    'Records may later be corrected or cancelled; status coverage is incomplete.',
    'This result is a market reference, not an appraisal or legal advice.',
    '5.0%/year signedprice comparison assumption.',
    'Floor, condition, furnishings, maintenance fees, view, renovation, exact brokerage fees, and deposit-return risk require separate verification.',
  ],
} satisfies SeoulRentCheckEnvelope;

const rightsBlockedEnvelope = {
  status: 'error',
  error: {
    code: 'rights_blocked',
    message: 'Official rental data use is not permitted.',
    retryable: false,
    retryAfterSeconds: null,
  },
} satisfies SeoulRentCheckErrorEnvelope;

const retryableEnvelope = {
  status: 'error',
  error: {
    code: 'rate_limited',
    message: 'Too many checks. Please wait before trying again.',
    retryable: true,
    retryAfterSeconds: 60,
  },
} satisfies SeoulRentCheckErrorEnvelope;

const unavailableEnvelope = {
  status: 'error',
  error: {
    code: 'configuration_missing',
    message: 'Official rental evidence is not configured.',
    retryable: false,
    retryAfterSeconds: null,
  },
} satisfies SeoulRentCheckErrorEnvelope;

async function validatedResponse(
  input: RentCheckInput,
  envelope: SeoulRentCheckEnvelope,
  cacheStatus: RentCheckApiSuccess['cacheStatus'],
): Promise<RentCheckApiSuccess> {
  return requestRentCheck(input, {
    fetch: async () => Response.json(envelope, {
      status: 200,
      headers: { 'X-Signedprice-Cache': cacheStatus },
    }),
  });
}

async function completeMarkup(
  input: RentCheckInput,
  envelope: SeoulRentCheckEnvelope,
  cacheStatus: RentCheckApiSuccess['cacheStatus'] = 'hit',
): Promise<string> {
  const response = await validatedResponse(input, envelope, cacheStatus);
  return renderToStaticMarkup(createElement(Fragment, null,
    createElement(RentCheckResult, { response }),
    createElement(ComparableContracts, { envelope: response.envelope }),
    createElement(SourceDisclosure, { envelope: response.envelope }),
  ));
}

describe('Seoul Rent Check result evidence', () => {
  it('separates raw monthly evidence from the deposit-adjusted estimate and range', async () => {
    const markup = await completeMarkup(distributionInput, distributionEnvelope, 'miss');

    expect(markup).toContain('Asking quote');
    expect(markup).toContain('Official reported contracts');
    expect(markup).toContain('Raw reported contract evidence');
    expect(markup).toContain('signedprice deposit-adjusted estimate');
    expect(markup).toContain('Typical signedprice deposit-adjusted estimate range: P25 ₩850,000 to P75 ₩950,000. Asking quote: ₩900,000.');
    expect(markup).toContain('Fair — within the signedprice deposit-adjusted estimate range');
    expect(markup).toContain('Median signedprice deposit-adjusted estimate');
    expect(markup).toContain('Difference from signedprice deposit-adjusted median');
    expect(markup).not.toContain('Median reported value');
    expect(markup).not.toContain('typical reported range');
    expect(markup).toMatch(/aria-hidden="true"/);
  });

  it.each([
    {
      label: 'Below median',
      input: { ...limitedInput, monthlyRentWon: '899800' },
      envelope: {
        ...limitedEnvelope,
        result: {
          ...limitedEnvelope.result,
          rating: 'below',
          askingValueWon: 899_800,
          differencePct: -10,
        },
      } as SeoulRentCheckEnvelope,
    },
    {
      label: 'Around median',
      input: { ...limitedInput, monthlyRentWon: '1000000' },
      envelope: {
        ...limitedEnvelope,
        result: {
          ...limitedEnvelope.result,
          rating: 'fair',
          askingValueWon: 1_000_000,
          differencePct: 0,
        },
      } as SeoulRentCheckEnvelope,
    },
    { label: 'Above median', input: limitedInput, envelope: limitedEnvelope },
  ])('shows Limited plus the $label verdict for three or four contracts', async ({
    label,
    input,
    envelope: limitedCase,
  }) => {
    const markup = await completeMarkup(input, limitedCase);

    expect(markup).toContain('Limited');
    expect(markup).toContain(label);
    expect(markup).toContain('Median signedprice deposit-adjusted estimate');
    expect(markup).toContain('₩1,000,000');
    expect(markup).not.toContain('Typical range:');
    expect(markup).not.toContain('Confidence');
    expect(markup).not.toContain('Percentile');
  });

  it('keeps asking and official sample provenance but omits estimates when insufficient', async () => {
    const markup = await completeMarkup(insufficientInput, insufficientEnvelope);

    expect(markup).toContain('Official evidence is insufficient.');
    expect(markup).toContain('Asking quote');
    expect(markup).toContain('₩250,000,000');
    expect(markup).toContain('Official reported contracts');
    expect(markup).toContain('0 compatible contracts');
    expect(markup).toContain('Fewer than 3 compatible official reported contracts were found');
    expect(markup).toContain('No market estimate is shown.');
    expect(markup).not.toContain('signedprice estimate');
    expect(markup).not.toContain('signedprice deposit-adjusted estimate');
    expect(markup).not.toContain('Median');
    expect(markup).not.toContain('Typical');
    expect(markup).not.toContain('Difference from median');
    expect(markup).not.toContain('Confidence');
    expect(markup).not.toContain('<table');
  });

  it('keeps no more than ten newest complete comparable rows with contract dates', async () => {
    const markup = await completeMarkup(distributionInput, distributionEnvelope);
    const rows = markup.match(/<tr/g) ?? [];

    expect(rows).toHaveLength(11);
    expect(markup).toContain('<th scope="col">Contract date</th>');
    expect(markup).toContain('2026-07-28');
    expect(markup).toContain('2026-05-04');
    expect(markup.indexOf('2026-07-28')).toBeLessThan(markup.indexOf('2026-05-04'));
    expect(markup).toContain('aria-label="Comparable contracts, newest first"');
  });

  it('labels only stale cache provenance as stale', async () => {
    const stale = await completeMarkup(distributionInput, distributionEnvelope, 'stale');
    const hit = await completeMarkup(distributionInput, distributionEnvelope, 'hit');
    const miss = await completeMarkup(distributionInput, distributionEnvelope, 'miss');

    expect(stale).toContain('Stale verified result');
    expect(hit).not.toContain('Stale verified result');
    expect(miss).not.toContain('Stale verified result');
  });

  it('makes unknown source status and studio alias mapping warnings visible', async () => {
    const markup = await completeMarkup(distributionInput, distributionEnvelope);

    expect(markup).toContain('2 records had unknown status');
    expect(markup).toContain('Studio is compared with detached/multi-unit source records.');
  });
});

describe('Seoul Rent Check result boundaries and disclosure', () => {
  it('uses a named non-retry boundary for rights-blocked errors', () => {
    const markup = renderToStaticMarkup(createElement(RentCheckResult, {
      errorEnvelope: rightsBlockedEnvelope,
      onRetry: () => undefined,
    }));

    expect(markup).toContain('Official data rights boundary');
    expect(markup).toContain('Official rental data use is not permitted.');
    expect(markup).not.toContain('>Retry<');
  });

  it('keeps a contradictory retryable rights error behind the non-retry boundary', () => {
    const contradictoryRightsEnvelope = {
      status: 'error',
      error: {
        code: 'rights_blocked',
        message: 'Official rental data use is not permitted.',
        retryable: true,
        retryAfterSeconds: 30,
      },
    } satisfies SeoulRentCheckErrorEnvelope;
    const markup = renderToStaticMarkup(createElement(RentCheckResult, {
      errorEnvelope: contradictoryRightsEnvelope,
      onRetry: () => undefined,
    }));

    expect(markup).toContain('Official data rights boundary');
    expect(markup).not.toContain('Retry available');
    expect(markup).not.toContain('>Retry<');
  });

  it('gives retryable errors a Retry action and seconds countdown without a prior verdict', () => {
    const markup = renderToStaticMarkup(createElement(RentCheckResult, {
      errorEnvelope: retryableEnvelope,
      onRetry: () => undefined,
    }));

    expect(markup).toContain('Retry available in 60 seconds.');
    expect(markup).toContain('>Retry<');
    expect(markup).not.toMatch(/Fair|Above|Below|Median reported value|Typical range:/);
  });

  it('does not schedule countdown work when retry is already enabled', () => {
    let scheduled = 0;
    const cleanup = startRetryCountdown(0, () => undefined, {
      set: () => {
        scheduled += 1;
        return 1;
      },
      clear: () => undefined,
    });

    expect(scheduled).toBe(0);
    cleanup();
  });

  it('ticks to zero once, stops work, and keeps cleanup idempotent', () => {
    let tick: (() => void) | undefined;
    const cleared: number[] = [];
    const seconds: number[] = [];
    const cleanup = startRetryCountdown(2, (value) => seconds.push(value), {
      set: (callback) => {
        tick = callback;
        return 41;
      },
      clear: (handle) => cleared.push(handle),
    });

    tick?.();
    tick?.();
    tick?.();
    cleanup();

    expect(seconds).toEqual([1, 0]);
    expect(cleared).toEqual([41]);
  });

  it('cleans up on unmount and resets the model when the error envelope changes', () => {
    let tick: (() => void) | undefined;
    const cleared: number[] = [];
    const cleanup = startRetryCountdown(60, () => undefined, {
      set: (callback) => {
        tick = callback;
        return 73;
      },
      clear: (handle) => cleared.push(handle),
    });
    const first = retryCountdownModel(retryableEnvelope);
    const changedEnvelope = {
      status: 'error',
      error: {
        code: 'rate_limited',
        message: 'Try later.',
        retryable: true,
        retryAfterSeconds: 5,
      },
    } satisfies SeoulRentCheckErrorEnvelope;
    const changed = retryCountdownModel(changedEnvelope);

    cleanup();
    tick?.();

    expect(cleared).toEqual([73]);
    expect(changed.key).not.toBe(first.key);
    expect(changed.seconds).toBe(5);
  });

  it('gives non-retry configuration failures support guidance', () => {
    const markup = renderToStaticMarkup(createElement(RentCheckResult, {
      errorEnvelope: unavailableEnvelope,
      onRetry: () => undefined,
    }));

    expect(markup).toContain('Official evidence unavailable');
    expect(markup).toContain('Contact signedprice support if this continues.');
    expect(markup).not.toContain('>Retry<');
  });

  it('discloses tier-one source completeness, actual contract month and monthly method', async () => {
    const markup = await completeMarkup(distributionInput, distributionEnvelope);

    expect(markup).toContain('MOLIT');
    expect(markup).toContain('Detached and multi-unit rental contracts');
    expect(markup).toContain('Source completeness through 2026-07');
    expect(markup).toContain('3 completed months used');
    expect(markup).toContain('Latest contract month: 2026-07');
    expect(markup).toContain('Contract-date basis');
    expect(markup).toContain('2026-08-01T00:00:00.000Z');
    expect(markup).toContain('2026-08-01T00:05:00.000Z');
    expect(markup).toContain('12 compatible contracts');
    expect(markup).toContain('5.0%/year signedprice comparison assumption');
    expect(markup).toContain('records may later be corrected or cancelled');
    expect(markup).toContain('not current asking listings');
    expect(markup).toContain('not an appraisal or legal advice');
  });

  it('discloses new-only, mixed fallback, and no-compatible contract selection states', async () => {
    const newOnly = await completeMarkup(limitedInput, limitedEnvelope);
    const mixed = await completeMarkup(distributionInput, distributionEnvelope);
    const none = await completeMarkup(insufficientInput, insufficientEnvelope);

    expect(newOnly).toContain('Contract selection: new_only');
    expect(newOnly).toContain('Selected contract types: 4 new · 0 renewal · 0 unknown');
    expect(mixed).toContain(
      'Contract selection: mixed because the new-contract minimum was not met',
    );
    expect(mixed).toContain('Selected contract types: 8 new · 2 renewal · 2 unknown');
    expect(none).toContain('Contract selection: no compatible contracts');
    expect(none).toContain('Selected contract types: 0 new · 0 renewal · 0 unknown');
  });

  it('renders direct jeonse provenance, zero difference and a non-applied 5% disclosure', async () => {
    const markup = await completeMarkup(jeonseInput, jeonseEnvelope);

    expect(markup).toContain('Direct comparison of official reported jeonse deposits');
    expect(markup).toContain('Median reported jeonse deposit');
    expect(markup).toContain('Difference from reported jeonse median');
    expect(markup).toContain('Typical reported jeonse deposit range');
    expect(markup).toContain('equal to median');
    expect(markup).toContain('6 completed months used');
    expect(markup).toContain('Latest contract month: 2026-07');
    expect(markup).toContain('5.0%/year signedprice comparison assumption');
    expect(markup).not.toContain('Deposit-normalized');
    expect(markup).not.toContain('deposit-adjusted estimate');
    expect(markup).not.toContain('0% above');
  });

  it('formats negative, zero and positive differences without assigning zero above', async () => {
    const negative = await completeMarkup(distributionInput, distributionEnvelope);
    const zero = await completeMarkup(jeonseInput, jeonseEnvelope);
    const positive = await completeMarkup(positiveInput, positiveEnvelope);

    expect(negative).toContain('1.1% below');
    expect(zero).toContain('equal to median');
    expect(zero).not.toContain('0% above');
    expect(positive).toContain('10% above');
  });

  it('discloses tier-three and insufficient periods including unavailable contract month', async () => {
    const tierThree = await completeMarkup(limitedInput, limitedEnvelope);
    const insufficient = await completeMarkup(insufficientInput, insufficientEnvelope);

    expect(tierThree).toContain('12 completed months used');
    expect(tierThree).toContain('Latest contract month: 2026-07');
    expect(insufficient).toContain('12 completed months used');
    expect(insufficient).toContain('Latest contract month: Unavailable');
  });

  it('rejects a cross-field contradiction before result markup can render', async () => {
    await expect(validatedResponse(distributionInput, {
      ...distributionEnvelope,
      result: { ...distributionEnvelope.result, comparisonBasis: 'jeonse-deposit' },
    }, 'hit')).rejects.toMatchObject({
      code: 'source_unavailable',
      retryable: true,
    });
  });

  it('lists uncaptured housing and transaction facts as limitations, never zero values', async () => {
    const markup = await completeMarkup(distributionInput, distributionEnvelope);

    for (const missing of [
      'Floor', 'condition', 'furnishings', 'maintenance fees', 'view', 'renovation',
      'exact brokerage fees', 'deposit-return risk',
    ]) {
      expect(markup).toContain(missing);
    }
    expect(markup).not.toMatch(/(?:Floor|condition|furnishings|maintenance fees|view|renovation|exact brokerage fees|deposit-return risk)[^<]{0,20}(?:₩\s*)?0(?:\D|$)/i);
  });
});
