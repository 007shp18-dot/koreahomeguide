import {
  createPublicMarketSummary,
  median,
  percentile,
  roundWon,
  type PublicMarketSummary,
} from '@signedprice/market-core';

import type { KoreaRentRecord } from './input';
import {
  assertMolitRights,
  type MolitRightsLookup,
} from './rights';
import {
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
} from './versions';

export type KoreaPublicSummarySource = Readonly<{
  marketId: 'kr-seoul';
  provider: 'MOLIT';
  endpointVersion: typeof MOLIT_ENDPOINT_VERSION;
  parserVersion: typeof MOLIT_PARSER_VERSION;
  rightsPolicyId: typeof MOLIT_RIGHTS_POLICY_ID;
}>;

export type KoreaPublicContractGroup = 'all' | 'new' | 'renewal';

export type KoreaPublicSummaryInput = Readonly<{
  area: string;
  parent: string;
  band: string;
  period: string;
  completedMonths: readonly string[];
  sourceComplete: boolean;
  source: KoreaPublicSummarySource;
  rightsLookup: MolitRightsLookup;
  records: readonly KoreaRentRecord[];
  contractGroup: KoreaPublicContractGroup;
}>;

const MONTH_PATTERN = /^\d{4}-(?:0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^(\d{4})-((?:0[1-9]|1[0-2]))-((?:0[1-9]|[12]\d|3[01]))$/;
const PUBLIC_BAND = '45-55sqm';
const REQUIRED_PUBLIC_MONTHS = 7;
const MIN_PUBLISHABLE_RECORDS = 5;

function invalidSummary(message: string): never {
  throw new TypeError(message);
}

function monthIndex(month: string): number {
  const [year, value] = month.split('-').map(Number);
  return year! * 12 + value! - 1;
}

function contractMonth(date: string): string | null {
  const match = DATE_PATTERN.exec(date);
  if (match === null) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > daysInMonth[month - 1]!) {
    invalidSummary('Record contractDate must be a real calendar date.');
  }
  return `${match[1]}-${match[2]}`;
}

function assertCompletedMonths(input: KoreaPublicSummaryInput): ReadonlySet<string> {
  if (!input.sourceComplete) {
    invalidSummary('Public summary requires a complete source period.');
  }
  if (input.completedMonths.length !== REQUIRED_PUBLIC_MONTHS) {
    invalidSummary('Public summary requires exactly seven completed source months.');
  }
  if (input.completedMonths.some(
    (month) => !MONTH_PATTERN.test(month),
  )) {
    invalidSummary('Completed source months are invalid.');
  }
  for (let index = 1; index < input.completedMonths.length; index += 1) {
    if (monthIndex(input.completedMonths[index]!) !== monthIndex(input.completedMonths[index - 1]!) + 1) {
      invalidSummary('Completed source months must be unique, ordered and contiguous.');
    }
  }
  const expectedPeriod = `${input.completedMonths[0]}/${input.completedMonths.at(-1)}`;
  if (input.period !== expectedPeriod) {
    invalidSummary('Public summary period must equal the completed source period.');
  }
  if (input.band !== PUBLIC_BAND) {
    invalidSummary(`Public summary band must be ${PUBLIC_BAND}.`);
  }
  return new Set(input.completedMonths);
}

function assertSource(input: KoreaPublicSummaryInput): void {
  const source = input.source;
  if (
    source.marketId !== 'kr-seoul' ||
    source.provider !== 'MOLIT' ||
    source.endpointVersion !== MOLIT_ENDPOINT_VERSION ||
    source.parserVersion !== MOLIT_PARSER_VERSION ||
    source.rightsPolicyId !== MOLIT_RIGHTS_POLICY_ID
  ) {
    invalidSummary('Public summary source provenance is invalid.');
  }

  assertMolitRights({
    lookup: input.rightsLookup,
    policyId: source.rightsPolicyId,
    operations: ['derive', 'display', 'commercial'],
  });

  if (!['all', 'new', 'renewal'].includes(input.contractGroup)) {
    invalidSummary('Public summary contract group is invalid.');
  }
}

function assertRecord(record: KoreaRentRecord, completedMonths: ReadonlySet<string>): void {
  const month = contractMonth(record.contractDate);
  if (month === null || !completedMonths.has(month)) {
    invalidSummary('Every record must belong to the completed source period.');
  }
  if (
    !Number.isSafeInteger(record.depositWon) ||
    record.depositWon < 0 ||
    !Number.isSafeInteger(record.monthlyRentWon) ||
    record.monthlyRentWon < 0 ||
    (record.depositWon === 0 && record.monthlyRentWon === 0)
  ) {
    invalidSummary('Record money must be non-negative safe-integer KRW with a positive total.');
  }
  if (!Number.isFinite(record.areaSqm) || record.areaSqm <= 0) {
    invalidSummary('Record area must be a positive finite value.');
  }
  if (!['apartment', 'officetel', 'villa', 'detached'].includes(record.sourceHousingType)) {
    invalidSummary('Record housing type is invalid.');
  }
  if (!['new', 'renewal', 'unknown'].includes(record.contractType)) {
    invalidSummary('Record contract type is invalid.');
  }
  if (!['active', 'cancelled', 'unknown'].includes(record.recordStatus)) {
    invalidSummary('Record status is invalid.');
  }
}

function isEligibleJeonse(record: KoreaRentRecord): boolean {
  return (
    record.recordStatus !== 'cancelled' &&
    record.depositWon > 0 &&
    record.monthlyRentWon === 0 &&
    record.areaSqm >= 45 &&
    record.areaSqm <= 55
  );
}

function belongsToContractGroup(
  record: KoreaRentRecord,
  contractGroup: KoreaPublicContractGroup,
): boolean {
  return contractGroup === 'all' || record.contractType === contractGroup;
}

function change3m(
  records: readonly KoreaRentRecord[],
  completedMonths: readonly string[],
): number | null {
  const precedingMonths = new Set(completedMonths.slice(-6, -3));
  const latestMonths = new Set(completedMonths.slice(-3));
  const preceding = records
    .filter((record) => precedingMonths.has(record.contractDate.slice(0, 7)))
    .map((record) => record.depositWon);
  const latest = records
    .filter((record) => latestMonths.has(record.contractDate.slice(0, 7)))
    .map((record) => record.depositWon);

  if (
    preceding.length < MIN_PUBLISHABLE_RECORDS ||
    latest.length < MIN_PUBLISHABLE_RECORDS
  ) {
    return null;
  }

  return Math.round(((median(latest) - median(preceding)) / median(preceding)) * 1_000) / 10;
}

export function buildKoreaPublicMarketSummary(
  input: KoreaPublicSummaryInput,
): PublicMarketSummary {
  assertSource(input);
  const completedMonths = assertCompletedMonths(input);
  input.records.forEach((record) => assertRecord(record, completedMonths));

  const eligibleRecords = input.records.filter((record) =>
    isEligibleJeonse(record) && belongsToContractGroup(record, input.contractGroup));
  const values = eligibleRecords.map((record) => record.depositWon);

  if (values.length < MIN_PUBLISHABLE_RECORDS) {
    return createPublicMarketSummary({
      marketId: 'kr-seoul',
      area: input.area,
      parent: input.parent,
      deal: 'jeonse',
      band: input.band,
      period: input.period,
      n: values.length,
    });
  }

  return createPublicMarketSummary({
    marketId: 'kr-seoul',
    area: input.area,
    parent: input.parent,
    deal: 'jeonse',
    band: input.band,
    period: input.period,
    n: values.length,
    min: roundWon(Math.min(...values)),
    p25: roundWon(percentile(values, 0.25)),
    med: roundWon(median(values)),
    p75: roundWon(percentile(values, 0.75)),
    max: roundWon(Math.max(...values)),
    chg3m: change3m(eligibleRecords, input.completedMonths),
  });
}
