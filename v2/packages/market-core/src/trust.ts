export type EvidenceState =
  | 'ready'
  | 'insufficient'
  | 'incomplete'
  | 'not_loaded'
  | 'rights_blocked'
  | 'source_unavailable'
  | 'invalid';

export type EmptyReason =
  | Readonly<{ code: 'INSUFFICIENT'; count: number; threshold: number }>
  | Readonly<{ code: 'NOT_REPORTABLE'; note: string }>
  | Readonly<{ code: 'NOT_LOADED'; market: string }>
  | Readonly<{ code: 'RIGHTS_BLOCKED'; source: string }>
  | Readonly<{ code: 'SOURCE_UNAVAILABLE'; retryable: boolean }>;

export type EvidenceDescriptor = Readonly<{
  marketId: string;
  provider: string;
  dataset: string;
  period: string;
  generatedAt: string;
  state: EvidenceState;
  publicationMinimum: number | null;
  methodologyId: string;
  rightsPolicyId: string;
}>;

export type EvidenceEmptyState = Readonly<{
  title: string;
  reason: string;
  nextAction: string;
  detail: EmptyReason;
}>;

export type CorrectionStatus = 'FIXED' | 'UPHELD';

export type Correction = Readonly<{
  id: string;
  date: string;
  marketId: string;
  scope: string;
  status: CorrectionStatus;
  raisedBy: 'USER' | 'INTERNAL';
  summary: string;
}>;

const evidenceStates = new Set<EvidenceState>([
  'ready',
  'insufficient',
  'incomplete',
  'not_loaded',
  'rights_blocked',
  'source_unavailable',
  'invalid',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index]);
}

function isTrimmedText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value === value.trim();
}

function isIsoInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const instant = new Date(value);
  return !Number.isNaN(instant.getTime()) && instant.toISOString() === value;
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const instant = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(instant.getTime()) && instant.toISOString().slice(0, 10) === value;
}

function isSafeNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function createEvidenceDescriptor(input: unknown): EvidenceDescriptor {
  const keys = [
    'marketId',
    'provider',
    'dataset',
    'period',
    'generatedAt',
    'state',
    'publicationMinimum',
    'methodologyId',
    'rightsPolicyId',
  ] as const;
  if (
    !isRecord(input)
    || !hasExactKeys(input, keys)
    || !isTrimmedText(input.marketId)
    || !isTrimmedText(input.provider)
    || !isTrimmedText(input.dataset)
    || !isTrimmedText(input.period)
    || !isIsoInstant(input.generatedAt)
    || typeof input.state !== 'string'
    || !evidenceStates.has(input.state as EvidenceState)
    || !(input.publicationMinimum === null
      || isSafeNonNegativeInteger(input.publicationMinimum))
    || !isTrimmedText(input.methodologyId)
    || !isTrimmedText(input.rightsPolicyId)
  ) {
    throw new TypeError('Invalid evidence descriptor.');
  }

  return Object.freeze({
    marketId: input.marketId,
    provider: input.provider,
    dataset: input.dataset,
    period: input.period,
    generatedAt: input.generatedAt,
    state: input.state as EvidenceState,
    publicationMinimum: input.publicationMinimum as number | null,
    methodologyId: input.methodologyId,
    rightsPolicyId: input.rightsPolicyId,
  });
}

function freezeReason(reason: EmptyReason): EmptyReason {
  return Object.freeze({ ...reason });
}

export function createEvidenceEmptyState(input: unknown): EvidenceEmptyState {
  if (!isRecord(input) || typeof input.code !== 'string') {
    throw new TypeError('Invalid evidence empty state.');
  }

  let output: Omit<EvidenceEmptyState, 'detail'>;
  let detail: EmptyReason;
  switch (input.code) {
    case 'INSUFFICIENT': {
      if (
        !hasExactKeys(input, ['code', 'count', 'threshold'])
        || !isSafeNonNegativeInteger(input.count)
        || !Number.isSafeInteger(input.threshold)
        || (input.threshold as number) <= 0
        || input.count >= (input.threshold as number)
      ) {
        throw new TypeError('Invalid evidence empty state.');
      }
      detail = freezeReason({
        code: 'INSUFFICIENT',
        count: input.count,
        threshold: input.threshold as number,
      });
      output = {
        title: 'Evidence is not published',
        reason: `${input.count} records met the filter; at least ${input.threshold as number} are required.`,
        nextAction: 'Broaden the evidence scope or return after the next completed period.',
      };
      break;
    }
    case 'NOT_REPORTABLE': {
      if (!hasExactKeys(input, ['code', 'note']) || !isTrimmedText(input.note)) {
        throw new TypeError('Invalid evidence empty state.');
      }
      detail = freezeReason({ code: 'NOT_REPORTABLE', note: input.note });
      output = {
        title: 'Evidence cannot be reported',
        reason: input.note,
        nextAction: 'Use another evidence scope whose public fields can be reported.',
      };
      break;
    }
    case 'NOT_LOADED': {
      if (!hasExactKeys(input, ['code', 'market']) || !isTrimmedText(input.market)) {
        throw new TypeError('Invalid evidence empty state.');
      }
      detail = freezeReason({ code: 'NOT_LOADED', market: input.market });
      output = {
        title: 'Evidence is not loaded',
        reason: `Verified evidence for ${input.market} is not installed.`,
        nextAction: 'Return after a verified source snapshot is installed.',
      };
      break;
    }
    case 'RIGHTS_BLOCKED': {
      if (!hasExactKeys(input, ['code', 'source']) || !isTrimmedText(input.source)) {
        throw new TypeError('Invalid evidence empty state.');
      }
      detail = freezeReason({ code: 'RIGHTS_BLOCKED', source: input.source });
      output = {
        title: 'Evidence cannot be displayed',
        reason: `Display rights are not confirmed for ${input.source}.`,
        nextAction: 'Use an evidence source whose display rights are confirmed.',
      };
      break;
    }
    case 'SOURCE_UNAVAILABLE': {
      if (
        !hasExactKeys(input, ['code', 'retryable'])
        || typeof input.retryable !== 'boolean'
      ) {
        throw new TypeError('Invalid evidence empty state.');
      }
      detail = freezeReason({
        code: 'SOURCE_UNAVAILABLE',
        retryable: input.retryable,
      });
      output = {
        title: 'Evidence source is unavailable',
        reason: input.retryable
          ? 'The verified source could not be reached.'
          : 'The verified source cannot currently be used.',
        nextAction: input.retryable
          ? 'Try again after the source recovers.'
          : 'Use another verified evidence source.',
      };
      break;
    }
    default:
      throw new TypeError('Invalid evidence empty state.');
  }

  return Object.freeze({ ...output, detail });
}

function parseCorrection(input: unknown): Correction {
  const keys = [
    'id',
    'date',
    'marketId',
    'scope',
    'status',
    'raisedBy',
    'summary',
  ] as const;
  if (
    !isRecord(input)
    || !hasExactKeys(input, keys)
    || !isTrimmedText(input.id)
    || !isIsoDate(input.date)
    || !isTrimmedText(input.marketId)
    || !isTrimmedText(input.scope)
    || (input.status !== 'FIXED' && input.status !== 'UPHELD')
    || (input.raisedBy !== 'USER' && input.raisedBy !== 'INTERNAL')
    || !isTrimmedText(input.summary)
  ) {
    throw new TypeError('Invalid correction ledger.');
  }

  return Object.freeze({
    id: input.id,
    date: input.date,
    marketId: input.marketId,
    scope: input.scope,
    status: input.status,
    raisedBy: input.raisedBy,
    summary: input.summary,
  });
}

export function createCorrectionLedger(input: unknown): readonly Correction[] {
  if (!Array.isArray(input)) throw new TypeError('Invalid correction ledger.');
  const records = input.map(parseCorrection);
  if (new Set(records.map(({ id }) => id)).size !== records.length) {
    throw new TypeError('Invalid correction ledger.');
  }
  records.sort((left, right) => {
    const dateOrder = right.date.localeCompare(left.date);
    return dateOrder === 0 ? left.id.localeCompare(right.id) : dateOrder;
  });
  return Object.freeze(records);
}
