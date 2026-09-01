import { median, percentile, roundWon } from '@signedprice/market-core';

import type { KoreaRentRecord } from './input';

export const KOREA_EVIDENCE_AREA_BANDS = Object.freeze([
  'all',
  'under-40',
  '40-60',
  '60-85',
  '85-plus',
] as const);

export type KoreaEvidenceTransaction = 'jeonse' | 'monthly';
export type KoreaEvidenceAreaBand = typeof KOREA_EVIDENCE_AREA_BANDS[number];
export type KoreaEvidenceContractGroup = 'all' | 'new' | 'renewal' | 'unknown';
export type KoreaEvidenceMetric = 'primary' | 'filed-deposit';

export type KoreaEvidenceDistribution =
  | Readonly<{ n: number; published: false }>
  | Readonly<{
      n: number;
      published: true;
      min: number;
      p25: number;
      med: number;
      p75: number;
      max: number;
      chg3m: number | null;
    }>;

export type SelectRentEvidenceRecordsInput = Readonly<{
  records: readonly KoreaRentRecord[];
  transaction: KoreaEvidenceTransaction;
  areaBand: KoreaEvidenceAreaBand;
  contractGroup: KoreaEvidenceContractGroup;
}>;

export type BuildRentEvidenceDistributionInput = SelectRentEvidenceRecordsInput & Readonly<{
  completedMonths: readonly string[];
  metric: KoreaEvidenceMetric;
}>;

const PUBLICATION_MINIMUM = 5;
const MONTH_PATTERN = /^\d{4}-(?:0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^(\d{4})-((?:0[1-9]|1[0-2]))-((?:0[1-9]|[12]\d|3[01]))$/;
const TRANSACTIONS = new Set<KoreaEvidenceTransaction>(['jeonse', 'monthly']);
const AREA_BANDS = new Set<KoreaEvidenceAreaBand>(KOREA_EVIDENCE_AREA_BANDS);
const CONTRACT_GROUPS = new Set<KoreaEvidenceContractGroup>([
  'all', 'new', 'renewal', 'unknown',
]);
const METRICS = new Set<KoreaEvidenceMetric>(['primary', 'filed-deposit']);

function invalid(message: string): never {
  throw new TypeError(message);
}

function monthIndex(month: string): number {
  const [year, value] = month.split('-').map(Number);
  return year! * 12 + value! - 1;
}

function assertRecord(record: KoreaRentRecord): void {
  if (!Number.isFinite(record.areaSqm) || record.areaSqm <= 0) {
    invalid('Evidence source area must be a positive finite value.');
  }
  if (
    !Number.isSafeInteger(record.depositWon)
    || record.depositWon < 0
    || !Number.isSafeInteger(record.monthlyRentWon)
    || record.monthlyRentWon < 0
    || (record.depositWon === 0 && record.monthlyRentWon === 0)
  ) {
    invalid('Evidence source money must be non-negative safe-integer KRW with a positive total.');
  }
  if (!['new', 'renewal', 'unknown'].includes(record.contractType)) {
    invalid('Evidence source contract group is invalid.');
  }
  if (!['active', 'cancelled', 'unknown'].includes(record.recordStatus)) {
    invalid('Evidence source record status is invalid.');
  }
}

function assertSelection(input: SelectRentEvidenceRecordsInput): void {
  if (!TRANSACTIONS.has(input.transaction)) invalid('Evidence transaction is invalid.');
  if (!AREA_BANDS.has(input.areaBand)) invalid('Evidence area band is invalid.');
  if (!CONTRACT_GROUPS.has(input.contractGroup)) invalid('Evidence contract group is invalid.');
  input.records.forEach(assertRecord);
}

function isRealDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (match === null) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const instant = new Date(Date.UTC(year, month - 1, day));
  return instant.getUTCFullYear() === year
    && instant.getUTCMonth() + 1 === month
    && instant.getUTCDate() === day;
}

function assertCompletedMonths(
  completedMonths: readonly string[],
  records: readonly KoreaRentRecord[],
): void {
  if (
    completedMonths.length !== 7
    || completedMonths.some((month) => !MONTH_PATTERN.test(month))
  ) {
    invalid('Evidence distribution requires seven valid completed source months.');
  }
  for (let index = 1; index < completedMonths.length; index += 1) {
    if (monthIndex(completedMonths[index]!) !== monthIndex(completedMonths[index - 1]!) + 1) {
      invalid('Evidence completed source months must be unique, ordered and contiguous.');
    }
  }
  const completed = new Set(completedMonths);
  if (records.some((record) => (
    !isRealDate(record.contractDate)
    || !completed.has(record.contractDate.slice(0, 7))
  ))) {
    invalid('Every evidence record must belong to the completed source period.');
  }
}

export function classifyAreaBand(areaSqm: number): Exclude<KoreaEvidenceAreaBand, 'all'> {
  if (!Number.isFinite(areaSqm) || areaSqm <= 0) {
    invalid('Area must be a positive finite value.');
  }
  if (areaSqm < 40) return 'under-40';
  if (areaSqm < 60) return '40-60';
  if (areaSqm < 85) return '60-85';
  return '85-plus';
}

function matchesTransaction(
  record: KoreaRentRecord,
  transaction: KoreaEvidenceTransaction,
): boolean {
  return transaction === 'jeonse'
    ? record.depositWon > 0 && record.monthlyRentWon === 0
    : record.monthlyRentWon > 0;
}

export function selectRentEvidenceRecords(
  input: SelectRentEvidenceRecordsInput,
): readonly KoreaRentRecord[] {
  assertSelection(input);
  return Object.freeze(input.records.filter((record) => (
    record.recordStatus !== 'cancelled'
    && matchesTransaction(record, input.transaction)
    && (input.areaBand === 'all' || classifyAreaBand(record.areaSqm) === input.areaBand)
    && (input.contractGroup === 'all' || record.contractType === input.contractGroup)
  )));
}

function evidenceValue(
  record: KoreaRentRecord,
  transaction: KoreaEvidenceTransaction,
  metric: KoreaEvidenceMetric,
): number {
  if (metric === 'filed-deposit' || transaction === 'jeonse') return record.depositWon;
  return record.monthlyRentWon;
}

function change3m(
  records: readonly KoreaRentRecord[],
  completedMonths: readonly string[],
  transaction: KoreaEvidenceTransaction,
  metric: KoreaEvidenceMetric,
): number | null {
  const precedingMonths = new Set(completedMonths.slice(-6, -3));
  const latestMonths = new Set(completedMonths.slice(-3));
  const valuesFor = (months: ReadonlySet<string>) => records
    .filter((record) => months.has(record.contractDate.slice(0, 7)))
    .map((record) => evidenceValue(record, transaction, metric));
  const preceding = valuesFor(precedingMonths);
  const latest = valuesFor(latestMonths);
  if (preceding.length < PUBLICATION_MINIMUM || latest.length < PUBLICATION_MINIMUM) {
    return null;
  }
  const before = median(preceding);
  if (before === 0) return null;
  return Math.round(((median(latest) - before) / before) * 1_000) / 10;
}

export function buildRentEvidenceDistribution(
  input: BuildRentEvidenceDistributionInput,
): KoreaEvidenceDistribution {
  if (!METRICS.has(input.metric)) invalid('Evidence metric is invalid.');
  assertCompletedMonths(input.completedMonths, input.records);
  const selected = selectRentEvidenceRecords(input);
  const values = selected.map((record) => evidenceValue(
    record,
    input.transaction,
    input.metric,
  ));
  if (values.length < PUBLICATION_MINIMUM) {
    return Object.freeze({ n: values.length, published: false });
  }
  return Object.freeze({
    n: values.length,
    published: true,
    min: roundWon(Math.min(...values)),
    p25: roundWon(percentile(values, 0.25)),
    med: roundWon(median(values)),
    p75: roundWon(percentile(values, 0.75)),
    max: roundWon(Math.max(...values)),
    chg3m: change3m(selected, input.completedMonths, input.transaction, input.metric),
  });
}
