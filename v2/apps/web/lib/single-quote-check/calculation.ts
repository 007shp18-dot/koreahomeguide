export const SINGLE_QUOTE_PUBLICATION_MINIMUM = 5 as const;
export const SINGLE_QUOTE_ANNUAL_DEPOSIT_RATE = 0.05 as const;

export type SingleQuoteTransaction = 'sale' | 'jeonse' | 'monthly';
export type SingleQuoteHousingType = 'apartment' | 'officetel' | 'villa_multifamily' | 'detached';

export type SingleQuoteInput = Readonly<{
  transaction: SingleQuoteTransaction;
  districtSlug: string;
  buildingId: string | null;
  housingType: SingleQuoteHousingType;
  areaSqm: number;
  depositWon: number | null;
  quoteWon: number;
}>;

export type SingleQuoteComparable = Readonly<{
  transaction: SingleQuoteTransaction;
  districtSlug: string;
  neighborhoodId: string;
  buildingId: string;
  housingType: SingleQuoteHousingType;
  areaSqm: number;
  filedMonth: string;
  depositWon: number | null;
  valueWon: number;
}>;

export type SingleQuoteResult = Readonly<{
  status: 'ready';
  scope: 'building' | 'neighborhood' | 'district';
  comparisonBasis: 'reported-sale-price' | 'reported-jeonse-deposit' | 'deposit-adjusted-monthly-rent';
  verdict: 'below' | 'typical' | 'above';
  quoteWon: number;
  medianWon: number;
  middleHalfWon: readonly [number, number];
  differencePct: number;
  sampleCount: number;
  period: string;
  areaTolerancePct: number;
  comparables: readonly Readonly<SingleQuoteComparable & { adjustedValueWon: number }>[];
}> | Readonly<{
  status: 'insufficient';
  sampleCount: number;
  period: string;
}>;

function percentile(values: readonly number[], fraction: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const value = sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (position - lower);
  return Math.round(value);
}

function adjustedValue(record: SingleQuoteComparable, input: SingleQuoteInput): number {
  if (input.transaction !== 'monthly') return record.valueWon;
  const filedDeposit = record.depositWon ?? 0;
  const enteredDeposit = input.depositWon ?? 0;
  return Math.round(record.valueWon
    + (filedDeposit - enteredDeposit) * SINGLE_QUOTE_ANNUAL_DEPOSIT_RATE / 12);
}

function compatible(
  records: readonly SingleQuoteComparable[],
  input: SingleQuoteInput,
  areaTolerance: number,
): readonly SingleQuoteComparable[] {
  return records.filter((record) => record.transaction === input.transaction
    && record.districtSlug === input.districtSlug
    && record.housingType === input.housingType
    && Math.abs(record.areaSqm - input.areaSqm) <= input.areaSqm * areaTolerance
    && adjustedValue(record, input) > 0);
}

function comparisonBasis(input: SingleQuoteInput):
  'reported-sale-price' | 'reported-jeonse-deposit' | 'deposit-adjusted-monthly-rent' {
  if (input.transaction === 'sale') return 'reported-sale-price';
  return input.transaction === 'jeonse'
    ? 'reported-jeonse-deposit'
    : 'deposit-adjusted-monthly-rent';
}

export function evaluateSingleQuote(
  input: SingleQuoteInput,
  records: readonly SingleQuoteComparable[],
  period: string,
): SingleQuoteResult {
  const target = input.buildingId === null
    ? null
    : records.find((record) => record.districtSlug === input.districtSlug
      && record.buildingId === input.buildingId);
  let broadestCount = 0;

  const scopes = input.buildingId === null
    ? [{ scope: 'district' as const }]
    : [
        { scope: 'building' as const },
        { scope: 'neighborhood' as const },
        { scope: 'district' as const },
      ];
  for (const { scope } of scopes) {
    for (const areaTolerance of [0.15, 0.2, 0.25] as const) {
      const base = compatible(records, input, areaTolerance);
      const candidate = {
        scope,
        records: scope === 'building'
          ? base.filter(({ buildingId }) => buildingId === input.buildingId)
          : scope === 'neighborhood'
            ? target == null ? [] : base.filter(({ neighborhoodId }) => neighborhoodId === target.neighborhoodId)
            : base,
      };
      broadestCount = Math.max(broadestCount, candidate.records.length);
      if (candidate.records.length < SINGLE_QUOTE_PUBLICATION_MINIMUM) continue;
      const comparables = candidate.records
        .map((record) => Object.freeze({ ...record, adjustedValueWon: adjustedValue(record, input) }))
        .sort((left, right) => right.filedMonth.localeCompare(left.filedMonth));
      const values = comparables.map(({ adjustedValueWon }) => adjustedValueWon);
      const p25 = percentile(values, 0.25);
      const medianWon = percentile(values, 0.5);
      const p75 = percentile(values, 0.75);
      return Object.freeze({
        status: 'ready',
        scope: candidate.scope,
        comparisonBasis: comparisonBasis(input),
        verdict: input.quoteWon < p25 ? 'below' : input.quoteWon > p75 ? 'above' : 'typical',
        quoteWon: input.quoteWon,
        medianWon,
        middleHalfWon: Object.freeze([p25, p75]) as readonly [number, number],
        differencePct: Math.round(((input.quoteWon - medianWon) / medianWon) * 1_000) / 10,
        sampleCount: comparables.length,
        period,
        areaTolerancePct: Math.round(areaTolerance * 100),
        comparables: Object.freeze(comparables.slice(0, 10)),
      });
    }
  }
  return Object.freeze({ status: 'insufficient', sampleCount: broadestCount, period });
}
