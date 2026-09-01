const DAY_MS = 24 * 60 * 60 * 1_000;
const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const PERIOD_PATTERN = /^(\d{4}-(?:0[1-9]|1[0-2]))\/(\d{4}-(?:0[1-9]|1[0-2]))$/;
const MONTH_LABELS = Object.freeze([
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const);

export type SpreadVerdict =
  | Readonly<{
      status: 'interpretable';
      bucket: 'narrow' | 'moderate' | 'wide';
      ratio: number;
      label: string;
      explanation: string;
    }>
  | Readonly<{
      status: 'unavailable';
      bucket: null;
      ratio: null;
      label: 'Spread not interpretable';
      explanation: 'A positive finite median is required to interpret the middle-half spread.';
    }>;

export type ChangeReliability =
  | Readonly<{
      status: 'reliable' | 'shaky';
      label: string;
      sampleLabel: string;
      reasons: readonly string[];
    }>
  | Readonly<{
      status: 'not_assessable';
      label: '3-month change not assessable';
      sampleLabel: null;
      reasons: readonly string[];
    }>;

export type MonthCompleteness = 'complete' | 'filing_in_progress';

export type EvidencePeriodMonth = Readonly<{
  month: string;
  label: string;
  state: MonthCompleteness;
}>;

export type EvidencePeriodModel = Readonly<{
  months: readonly EvidencePeriodMonth[];
  legend: readonly Readonly<{
    state: MonthCompleteness;
    label: 'Complete' | 'Filing in progress';
  }>[];
  caveat: string | null;
}>;

const evidencePeriodLegend = Object.freeze([
  Object.freeze({ state: 'complete', label: 'Complete' }),
  Object.freeze({ state: 'filing_in_progress', label: 'Filing in progress' }),
] as const satisfies EvidencePeriodModel['legend']);

const unavailableEvidencePeriod = Object.freeze({
  months: Object.freeze([]),
  legend: evidencePeriodLegend,
  caveat: 'Declared period classification unavailable.',
} as const satisfies EvidencePeriodModel);

const unavailableSpread = Object.freeze({
  status: 'unavailable',
  bucket: null,
  ratio: null,
  label: 'Spread not interpretable',
  explanation: 'A positive finite median is required to interpret the middle-half spread.',
} as const satisfies SpreadVerdict);

function capitalize(value: string): string {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

export function spreadVerdict(
  summary: Readonly<{ p25: number; med: number; p75: number }>,
): SpreadVerdict {
  if (
    !Number.isFinite(summary.p25)
    || !Number.isFinite(summary.med)
    || !Number.isFinite(summary.p75)
    || summary.med <= 0
    || summary.p75 < summary.p25
  ) {
    return unavailableSpread;
  }
  const ratio = (summary.p75 - summary.p25) / summary.med;
  const bucket = ratio < 0.28 ? 'narrow' : ratio < 0.55 ? 'moderate' : 'wide';
  return Object.freeze({
    status: 'interpretable',
    bucket,
    ratio,
    label: `${capitalize(bucket)} middle-half spread`,
    explanation: `The middle half spans ${(ratio * 100).toFixed(1)}% of the median.`,
  });
}

function notAssessableChange(reason: string): ChangeReliability {
  return Object.freeze({
    status: 'not_assessable',
    label: '3-month change not assessable',
    sampleLabel: null,
    reasons: Object.freeze([reason]),
  });
}

export function changeReliability(input: Readonly<{
  pct: number | null;
  nPrior: number | null;
  nLatest: number | null;
}>): ChangeReliability {
  if (input.nPrior === null || input.nLatest === null) {
    return notAssessableChange(
      'Prior/latest sample counts were not retained in this snapshot.',
    );
  }
  if (input.pct === null || !Number.isFinite(input.pct)) {
    return notAssessableChange('A three-month change was not retained in this snapshot.');
  }
  if (
    !Number.isSafeInteger(input.nPrior)
    || !Number.isSafeInteger(input.nLatest)
    || input.nPrior < 0
    || input.nLatest < 0
  ) {
    return notAssessableChange('Retained prior/latest sample counts were invalid.');
  }

  const reasons: string[] = [];
  if (Math.abs(input.pct) >= 10) reasons.push('The absolute change is at least 10%.');
  if (input.nPrior < 30) reasons.push('The prior three-month sample is below 30.');
  if (input.nLatest < 30) reasons.push('The latest three-month sample is below 30.');
  if (
    input.nPrior > 0
    && Math.abs(input.nLatest - input.nPrior) / input.nPrior >= 0.25
  ) {
    reasons.push('The sample size changed by at least 25%.');
  }
  const sampleLabel = `n ${input.nPrior} → ${input.nLatest}`;
  return Object.freeze({
    status: reasons.length === 0 ? 'reliable' : 'shaky',
    label: `${input.pct > 0 ? '+' : ''}${input.pct.toFixed(1)}% · ${sampleLabel}`,
    sampleLabel,
    reasons: Object.freeze(reasons),
  });
}

function parseMonth(month: string): Readonly<{ year: number; monthIndex: number }> {
  const match = MONTH_PATTERN.exec(month);
  if (match === null) throw new TypeError('Invalid calendar month.');
  return Object.freeze({
    year: Number(match[1]),
    monthIndex: Number(match[2]) - 1,
  });
}

function referenceTime(referenceInstant: string | Date): number {
  const value = referenceInstant instanceof Date
    ? referenceInstant.getTime()
    : new Date(referenceInstant).getTime();
  if (!Number.isFinite(value)) throw new TypeError('Invalid reference instant.');
  return value;
}

export function classifyCalendarMonth(
  month: string,
  referenceInstant: string | Date,
): MonthCompleteness {
  const parsed = parseMonth(month);
  const nextMonthStart = Date.UTC(parsed.year, parsed.monthIndex + 1, 1);
  const wholeDaysSinceMonthEnd = Math.floor(
    (referenceTime(referenceInstant) - nextMonthStart) / DAY_MS,
  );
  return wholeDaysSinceMonthEnd >= 60 ? 'complete' : 'filing_in_progress';
}

function monthOrdinal(month: Readonly<{ year: number; monthIndex: number }>): number {
  return month.year * 12 + month.monthIndex;
}

export function evidencePeriod(
  period: string,
  referenceInstant: string | Date,
): EvidencePeriodModel {
  const match = PERIOD_PATTERN.exec(period);
  if (match === null) return unavailableEvidencePeriod;
  const start = parseMonth(match[1]!);
  const end = parseMonth(match[2]!);
  const startOrdinal = monthOrdinal(start);
  const endOrdinal = monthOrdinal(end);
  if (startOrdinal > endOrdinal || endOrdinal - startOrdinal > 120) {
    return unavailableEvidencePeriod;
  }
  let months: readonly EvidencePeriodMonth[];
  try {
    months = Object.freeze(Array.from(
      { length: endOrdinal - startOrdinal + 1 },
      (_, offset): EvidencePeriodMonth => {
        const ordinal = startOrdinal + offset;
        const year = Math.floor(ordinal / 12);
        const monthIndex = ordinal % 12;
        const month = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
        return Object.freeze({
          month,
          label: `${MONTH_LABELS[monthIndex]} ${year}`,
          state: classifyCalendarMonth(month, referenceInstant),
        });
      },
    ));
  } catch {
    return unavailableEvidencePeriod;
  }
  const includesFiling = months.some(({ state }) => state === 'filing_in_progress');
  return Object.freeze({
    months,
    legend: evidencePeriodLegend,
    caveat: includesFiling
      ? 'The aggregate period distribution includes filing-in-progress months. It remains published, but no change comparison uses those months as anchors.'
      : null,
  });
}
