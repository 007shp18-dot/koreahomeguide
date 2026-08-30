import {
  median,
  percentile,
  percentileRank,
  roundDifferencePct,
  roundWon,
} from '@signedprice/market-core';

import type {
  ComparableContract,
  ContractTypeCounts,
  KoreaContractType,
  KoreaRecordStatus,
  KoreaRentRecord,
  RentCheckMonths,
  RentCheckQuote,
  RentCheckTier,
  SeoulRentCheckResult,
  SourceRecordStatusCounts,
} from './input';
import {
  RENT_CHECK_ANNUAL_DEPOSIT_RATE,
  RENT_CHECK_METHODOLOGY_POLICY_ID,
  RENT_CHECK_METHODOLOGY_VERSION,
} from './versions';

const ANNUAL_DEPOSIT_RATE = RENT_CHECK_ANNUAL_DEPOSIT_RATE;
const POLICY_ID = RENT_CHECK_METHODOLOGY_POLICY_ID;
const POLICY_VERSION = RENT_CHECK_METHODOLOGY_VERSION;

const TIERS: readonly {
  readonly tier: RentCheckTier;
  readonly months: RentCheckMonths;
  readonly areaTolerance: number;
  readonly depositTolerance: number;
  readonly minimumEvidence: number;
}[] = [
  { tier: 1, months: 3, areaTolerance: 0.15, depositTolerance: 0.25, minimumEvidence: 5 },
  { tier: 2, months: 6, areaTolerance: 0.2, depositTolerance: 0.35, minimumEvidence: 5 },
  { tier: 3, months: 12, areaTolerance: 0.25, depositTolerance: 0.5, minimumEvidence: 3 },
];

type TierPolicy = (typeof TIERS)[number];
type ContractSelection = 'new_only' | 'mixed' | null;

type TierSelection = {
  readonly policy: TierPolicy;
  readonly selected: readonly KoreaRentRecord[];
  readonly contractSelection: ContractSelection;
  readonly eligibleContractTypeCounts: ContractTypeCounts;
  readonly selectedContractTypeCounts: ContractTypeCounts;
  readonly sourceRecordStatusCounts: SourceRecordStatusCounts;
};

export type KoreaRentCheckCalculationResult = SeoulRentCheckResult & {
  readonly policyId: typeof POLICY_ID;
  readonly policyVersion: typeof POLICY_VERSION;
  readonly annualDepositRate: typeof ANNUAL_DEPOSIT_RATE | null;
  readonly contractSelection: ContractSelection;
  readonly eligibleContractTypeCounts: ContractTypeCounts;
  readonly selectedContractTypeCounts: ContractTypeCounts;
  readonly sourceRecordStatusCounts: SourceRecordStatusCounts;
  /** Internal selected-evidence metadata; never serialized as a result field. */
  readonly selectedLatestContractMonth: string | null;
  readonly comparables: readonly ComparableContract[];
};

function invalidCalculation(message: string): never {
  throw new TypeError(message);
}

function assertSafeWon(value: number, label: string, maximum = Number.MAX_SAFE_INTEGER): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) {
    invalidCalculation(`${label} must be nonnegative safe-integer KRW.`);
  }
}

function assertQuote(quote: RentCheckQuote): void {
  assertSafeWon(quote.depositWon, 'Deposit', 20_000_000_000);
  assertSafeWon(quote.monthlyRentWon, 'Monthly rent', 100_000_000);
  if (quote.depositWon === 0 && quote.monthlyRentWon === 0) {
    invalidCalculation('Deposit and monthly rent cannot both be zero.');
  }
  if (
    !Number.isFinite(quote.areaSqm) ||
    quote.areaSqm <= 0 ||
    quote.areaSqm > 2_000 ||
    Math.round(quote.areaSqm * 100) / 100 !== quote.areaSqm
  ) {
    invalidCalculation('Area must be a positive value of at most 2,000 square metres and two decimals.');
  }

  const expectedSource = quote.requestedHousingType === 'studio'
    ? 'detached'
    : quote.requestedHousingType;
  if (quote.sourceHousingType !== expectedSource) {
    invalidCalculation('Requested and source housing types do not match the Korea mapping.');
  }
}

function assertRecord(record: KoreaRentRecord): void {
  assertSafeWon(record.depositWon, 'Record deposit');
  assertSafeWon(record.monthlyRentWon, 'Record monthly rent');
  if (!Number.isFinite(record.areaSqm) || record.areaSqm <= 0 || record.areaSqm > 2_000) {
    invalidCalculation('Record area must be positive and no more than 2,000 square metres.');
  }
  if (!['apartment', 'officetel', 'villa', 'detached'].includes(record.sourceHousingType)) {
    invalidCalculation('Record source housing type is invalid.');
  }
  if (!['new', 'renewal', 'unknown'].includes(record.contractType)) {
    invalidCalculation('Record contract type is invalid.');
  }
  if (!['active', 'cancelled', 'unknown'].includes(record.recordStatus)) {
    invalidCalculation('Record status is invalid.');
  }
}

function instantParts(referenceInstant: string | Date): { readonly year: number; readonly month: number } {
  const instant = referenceInstant instanceof Date
    ? new Date(referenceInstant.getTime())
    : new Date(referenceInstant);
  if (!Number.isFinite(instant.getTime())) invalidCalculation('Reference instant must be valid.');

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(instant);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    invalidCalculation('Reference instant could not be represented in Asia/Seoul.');
  }
  return { year, month };
}

export function completedSeoulMonthKeys(
  referenceInstant: string | Date,
  count: number,
): string[] {
  if (!Number.isSafeInteger(count) || count <= 0) {
    invalidCalculation('Completed month count must be a positive safe integer.');
  }

  const current = instantParts(referenceInstant);
  const currentMonthIndex = current.year * 12 + current.month - 1;
  return Array.from({ length: count }, (_unused, index) => {
    const monthIndex = currentMonthIndex - index - 1;
    const year = Math.floor(monthIndex / 12);
    const month = ((monthIndex % 12) + 12) % 12 + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  });
}

export function restateMonthlyRentAtDeposit(
  record: Pick<KoreaRentRecord, 'depositWon' | 'monthlyRentWon'>,
  userDepositWon: number,
): number {
  assertSafeWon(record.depositWon, 'Record deposit');
  assertSafeWon(record.monthlyRentWon, 'Record monthly rent');
  assertSafeWon(userDepositWon, 'User deposit');
  return record.monthlyRentWon + (record.depositWon - userDepositWon) * ANNUAL_DEPOSIT_RATE / 12;
}

function contractMonth(contractDate: string): string | null {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(contractDate);
  return match ? `${match[1]}-${match[2]}` : null;
}

function withinRelative(value: number, target: number, tolerance: number): boolean {
  return target === 0
    ? value === 0
    : Math.abs(value - target) <= Math.abs(target) * tolerance;
}

function emptyContractTypeCounts(): Record<KoreaContractType, number> {
  return { new: 0, renewal: 0, unknown: 0 };
}

function emptyStatusCounts(): Record<KoreaRecordStatus, number> {
  return { active: 0, cancelled: 0, unknown: 0 };
}

function contractTypeCounts(records: readonly KoreaRentRecord[]): ContractTypeCounts {
  const counts = emptyContractTypeCounts();
  for (const record of records) counts[record.contractType] += 1;
  return counts;
}

function statusCounts(records: readonly KoreaRentRecord[]): SourceRecordStatusCounts {
  const counts = emptyStatusCounts();
  for (const record of records) counts[record.recordStatus] += 1;
  return counts;
}

function selectForTier(
  records: readonly KoreaRentRecord[],
  quote: RentCheckQuote,
  referenceInstant: string | Date,
  policy: TierPolicy,
): TierSelection {
  const months = new Set(completedSeoulMonthKeys(referenceInstant, policy.months));
  const monthlyMode = quote.monthlyRentWon > 0;
  const compatibleBeforeStatus = records.filter((record) => {
    if (record.sourceHousingType !== quote.sourceHousingType) return false;
    const month = contractMonth(record.contractDate);
    if (month === null || !months.has(month)) return false;
    if (!withinRelative(record.areaSqm, quote.areaSqm, policy.areaTolerance)) return false;
    if (!withinRelative(record.depositWon, quote.depositWon, policy.depositTolerance)) return false;
    if (monthlyMode ? record.monthlyRentWon <= 0 : record.monthlyRentWon !== 0) return false;
    return !monthlyMode || restateMonthlyRentAtDeposit(record, quote.depositWon) > 0;
  });

  const eligible = compatibleBeforeStatus.filter((record) => record.recordStatus !== 'cancelled');
  const newContracts = eligible.filter((record) => record.contractType === 'new');
  const useNewOnly = newContracts.length >= policy.minimumEvidence;
  const selected = useNewOnly ? newContracts : eligible;

  return {
    policy,
    selected,
    contractSelection: selected.length === 0 ? null : useNewOnly ? 'new_only' : 'mixed',
    eligibleContractTypeCounts: contractTypeCounts(eligible),
    selectedContractTypeCounts: contractTypeCounts(selected),
    sourceRecordStatusCounts: statusCounts(compatibleBeforeStatus),
  };
}

function selectTier(
  records: readonly KoreaRentRecord[],
  quote: RentCheckQuote,
  referenceInstant: string | Date,
): { readonly selection: TierSelection; readonly sufficient: boolean } {
  let broadest: TierSelection | undefined;
  for (const policy of TIERS) {
    const selection = selectForTier(records, quote, referenceInstant, policy);
    broadest = selection;
    if (selection.selected.length >= policy.minimumEvidence) {
      return { selection, sufficient: true };
    }
  }
  return { selection: broadest!, sufficient: false };
}

function confidence(tier: RentCheckTier, count: number): SeoulRentCheckResult['confidence'] {
  if (tier === 1 && count >= 7) return 'high';
  if ((tier === 1 || tier === 2) && count >= 5) return 'medium';
  if (tier === 3 && count >= 3) return 'low';
  return null;
}

function publicComparable(record: KoreaRentRecord): ComparableContract {
  return {
    ...(record.buildingLabel === undefined ? {} : { buildingLabel: record.buildingLabel }),
    areaSqm: record.areaSqm,
    depositWon: record.depositWon,
    monthlyRentWon: record.monthlyRentWon,
    contractDate: record.contractDate,
    contractType: record.contractType,
    recordStatus: record.recordStatus as Exclude<KoreaRecordStatus, 'cancelled'>,
  };
}

function evidenceRows(records: readonly KoreaRentRecord[]): readonly ComparableContract[] {
  return [...records]
    .sort((left, right) => right.contractDate.localeCompare(left.contractDate))
    .slice(0, 10)
    .map(publicComparable);
}

function latestSelectedContractMonth(records: readonly KoreaRentRecord[]): string | null {
  return records
    .map((record) => contractMonth(record.contractDate))
    .filter((month): month is string => month !== null)
    .sort()
    .at(-1) ?? null;
}

function baseResult(
  selection: TierSelection,
  quote: RentCheckQuote,
): Pick<
  KoreaRentCheckCalculationResult,
  | 'askingValueWon'
  | 'comparisonBasis'
  | 'comparisonMode'
  | 'policyId'
  | 'policyVersion'
  | 'annualDepositRate'
  | 'contractSelection'
  | 'eligibleContractTypeCounts'
  | 'selectedContractTypeCounts'
  | 'sourceRecordStatusCounts'
> {
  const monthlyMode = quote.monthlyRentWon > 0;
  return {
    askingValueWon: monthlyMode ? quote.monthlyRentWon : quote.depositWon,
    comparisonMode: monthlyMode ? 'monthly-rent' : 'jeonse-deposit',
    comparisonBasis: monthlyMode ? 'deposit-adjusted-monthly-rent' : 'jeonse-deposit',
    policyId: POLICY_ID,
    policyVersion: POLICY_VERSION,
    annualDepositRate: monthlyMode ? ANNUAL_DEPOSIT_RATE : null,
    contractSelection: selection.contractSelection,
    eligibleContractTypeCounts: selection.eligibleContractTypeCounts,
    selectedContractTypeCounts: selection.selectedContractTypeCounts,
    sourceRecordStatusCounts: selection.sourceRecordStatusCounts,
  };
}

export function buildKoreaRentCheckResult(
  records: readonly KoreaRentRecord[],
  quote: RentCheckQuote,
  referenceInstant: string | Date,
): KoreaRentCheckCalculationResult {
  assertQuote(quote);
  records.forEach(assertRecord);
  instantParts(referenceInstant);

  const chosen = selectTier(records, quote, referenceInstant);
  const { selection } = chosen;
  const selected = selection.selected;
  const selectedLatestContractMonth = latestSelectedContractMonth(selected);
  const common = baseResult(selection, quote);

  if (!chosen.sufficient) {
    return {
      ...common,
      rating: 'insufficient',
      comparableCount: selected.length,
      medianValueWon: null,
      minValueWon: null,
      p25ValueWon: null,
      p75ValueWon: null,
      maxValueWon: null,
      differencePct: null,
      percentileRank: null,
      verdictBasis: null,
      confidence: null,
      monthsUsed: 12,
      tier: null,
      selectedLatestContractMonth,
      comparables: [],
    };
  }

  const monthlyMode = quote.monthlyRentWon > 0;
  const asking = monthlyMode ? quote.monthlyRentWon : quote.depositWon;
  const values = selected.map((record) =>
    monthlyMode ? restateMonthlyRentAtDeposit(record, quote.depositWon) : record.depositWon,
  );
  const rawMedian = median(values);
  const rawDifferencePct = ((asking - rawMedian) / rawMedian) * 100;
  const hasDistribution = selected.length >= 5;
  const rawP25 = hasDistribution ? percentile(values, 0.25) : null;
  const rawP75 = hasDistribution ? percentile(values, 0.75) : null;
  const rating = hasDistribution
    ? asking < rawP25!
      ? 'below'
      : asking > rawP75!
        ? 'above'
        : 'fair'
    : rawDifferencePct <= -10
      ? 'below'
      : rawDifferencePct >= 10
        ? 'above'
        : 'fair';

  return {
    ...common,
    rating,
    comparableCount: selected.length,
    medianValueWon: roundWon(rawMedian),
    minValueWon: hasDistribution ? roundWon(Math.min(...values)) : null,
    p25ValueWon: rawP25 === null ? null : roundWon(rawP25),
    p75ValueWon: rawP75 === null ? null : roundWon(rawP75),
    maxValueWon: hasDistribution ? roundWon(Math.max(...values)) : null,
    differencePct: roundDifferencePct(rawDifferencePct),
    percentileRank: hasDistribution ? percentileRank(values, asking) : null,
    verdictBasis: hasDistribution ? 'typical-range' : 'median-fallback',
    confidence: confidence(selection.policy.tier, selected.length),
    monthsUsed: selection.policy.months,
    tier: selection.policy.tier,
    selectedLatestContractMonth,
    comparables: evidenceRows(selected),
  };
}
