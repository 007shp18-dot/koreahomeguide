import { percentile, percentileRank, roundDifferencePct, roundWon } from './rent-check';

export type ConversionCurveAnchor = Readonly<{
  deposit: number;
  annualRate: number;
  pairCount: number;
}>;

export type ConversionCurve<THousingType extends string = string> = Readonly<{
  housingType: THousingType;
  period: string;
  anchors: readonly ConversionCurveAnchor[];
}>;

export type RentContractOffer<THousingType extends string = string> = Readonly<{
  id: 'a' | 'b';
  label?: string;
  housingType: THousingType;
  deposit: number;
  monthlyRent: number;
}>;

export type AppliedConversionRate = Readonly<{
  annualRate: number;
  rangeState: 'observed' | 'held-below' | 'held-above';
  evidencePairCount: number;
}>;

export type NormalizedRentContractOffer<THousingType extends string = string> = Readonly<{
  offer: RentContractOffer<THousingType>;
  normalizedMonthlyCost: number;
  roundedNormalizedMonthlyCost: number;
  appliedRate: AppliedConversionRate;
}>;

export type RentContractComparison<THousingType extends string = string> = Readonly<{
  housingType: THousingType;
  offers: readonly [
    NormalizedRentContractOffer<THousingType>,
    NormalizedRentContractOffer<THousingType>,
  ];
  winner: 'a' | 'b' | 'equal';
  monthlyDifference: number;
  roundedMonthlyDifference: number;
  effectivelyEqual: boolean;
  rankingFlipped: boolean;
}>;

export const SINGLE_QUOTE_CHECK_PUBLICATION_MINIMUM = 5 as const;
export const SINGLE_QUOTE_CHECK_MAX_COMPLETED_MONTHS = 12 as const;

export type CompletedMonthWindow = Readonly<{
  period: string;
  startMonth: string;
  endMonth: string;
  completedMonthCount: number;
  maximumMonthCount: typeof SINGLE_QUOTE_CHECK_MAX_COMPLETED_MONTHS;
}>;

export type CheckTransaction = 'sale' | 'jeonse' | 'monthly';

export type SingleQuoteCheckInput<THousingType extends string = string> = Readonly<{
  transaction: CheckTransaction;
  districtSlug: string;
  buildingId: string | null;
  neighborhoodId: string | null;
  housingType: THousingType;
  areaSqm: number | null;
  salePriceWon: number | null;
  depositWon: number | null;
  monthlyRentWon: number | null;
}>;

export type SingleQuoteComparable<THousingType extends string = string> = Readonly<{
  transaction: CheckTransaction;
  districtSlug: string;
  neighborhoodId: string;
  buildingId: string;
  housingType: THousingType;
  areaSqm: number;
  filedMonth: string;
  salePriceWon: number | null;
  depositWon: number | null;
  monthlyRentWon: number | null;
}>;

export type SingleQuoteCheckUnavailableReason =
  | 'missing-input'
  | 'evidence-unavailable'
  | 'conversion-unavailable'
  | 'conversion-out-of-range';

export type SingleQuoteCheckResult<THousingType extends string = string> =
  | Readonly<{
      status: 'ready';
      input: SingleQuoteCheckInput<THousingType>;
      comparisonBasis:
        | 'reported-sale-price'
        | 'reported-jeonse-deposit'
        | 'verified-deposit-adjusted-monthly-rent';
      verdict: 'below' | 'typical' | 'above';
      quote: Readonly<{
        salePriceWon: number | null;
        depositWon: number | null;
        monthlyRentWon: number | null;
        comparisonValueWon: number;
      }>;
      distribution: Readonly<{
        minWon: number;
        p25Won: number;
        medianWon: number;
        p75Won: number;
        maxWon: number;
        sampleCount: number;
      }>;
      difference: Readonly<{ won: number; pct: number }>;
      pricePercentile: number;
      sample: Readonly<{
        count: number;
        minimum: typeof SINGLE_QUOTE_CHECK_PUBLICATION_MINIMUM;
      }>;
      period: string;
      evidenceWindow: CompletedMonthWindow;
      filters: Readonly<{
        scope: 'building' | 'neighborhood' | 'district';
        districtSlug: string;
        housingType: THousingType;
        areaTolerancePct: 15 | 20 | 25;
      }>;
      fallbackDisclosure: string | null;
      appliedConversionRate: AppliedConversionRate | null;
      comparableRows: readonly Readonly<SingleQuoteComparable<THousingType> & {
        adjustedValueWon: number;
      }>[];
    }>
  | Readonly<{
      status: 'insufficient';
      sample: Readonly<{
        count: number;
        minimum: typeof SINGLE_QUOTE_CHECK_PUBLICATION_MINIMUM;
      }>;
      period: string;
      evidenceWindow: CompletedMonthWindow;
    }>
  | Readonly<{
      status: 'unavailable';
      reason: SingleQuoteCheckUnavailableReason;
      message: string;
      period: string;
    }>;

export type ContractOfferCheck<THousingType extends string = string> = Readonly<{
  id: 'a' | 'b';
  check: SingleQuoteCheckResult<THousingType>;
}>;

export type ContractOfferComparison<THousingType extends string = string> =
  | Readonly<{
      status: 'ready';
      basis: 'market-position' | 'equivalent-monthly-cost' | 'tradeoff';
      verdict: 'a' | 'b' | 'equal' | 'tradeoff';
      winner: 'a' | 'b' | 'equal' | null;
      offers: readonly Readonly<{
        id: 'a' | 'b';
        transaction: CheckTransaction;
        marketVerdict: 'below' | 'typical' | 'above';
        marketDifferencePct: number;
        pricePercentile: number;
        upfrontCashWon: number;
        recurringCashFlowWon: number | null;
        equivalentMonthlyCostWon: number | null;
        check: Extract<SingleQuoteCheckResult<THousingType>, { status: 'ready' }>;
      }>[];
      differenceWon: number | null;
    }>
  | Readonly<{
      status: 'unavailable';
      reason: 'offer-evidence-unavailable' | 'conversion-unavailable' | 'conversion-out-of-range';
      message: string;
    }>;

function invalid(message: string): never {
  throw new TypeError(message);
}

function assertMoney(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    invalid(`${label} must be a non-negative safe integer.`);
  }
}

function assertCurve<THousingType extends string>(
  curve: ConversionCurve<THousingType>,
): void {
  if (typeof curve.housingType !== 'string' || curve.housingType.trim().length === 0) {
    invalid('Curve housing type must be non-empty.');
  }
  if (typeof curve.period !== 'string' || curve.period.trim().length === 0) {
    invalid('Curve period must be non-empty.');
  }
  if (!Array.isArray(curve.anchors) || curve.anchors.length < 2) {
    invalid('Curve must contain at least two anchors.');
  }

  let previousDeposit = -1;
  for (const anchor of curve.anchors) {
    assertMoney(anchor.deposit, 'Anchor deposit');
    if (anchor.deposit <= previousDeposit) {
      invalid('Curve anchor deposits must be strictly increasing.');
    }
    if (!Number.isFinite(anchor.annualRate) || anchor.annualRate <= 0 || anchor.annualRate >= 1) {
      invalid('Curve annual rates must be between zero and one.');
    }
    if (!Number.isInteger(anchor.pairCount) || anchor.pairCount <= 0) {
      invalid('Curve pair counts must be a positive integer.');
    }
    previousDeposit = anchor.deposit;
  }
}

function freezeAppliedRate(input: AppliedConversionRate): AppliedConversionRate {
  return Object.freeze({ ...input });
}

export function conversionRateAt<THousingType extends string>(
  curve: ConversionCurve<THousingType>,
  deposit: number,
): AppliedConversionRate {
  assertCurve(curve);
  assertMoney(deposit, 'Deposit');

  const first = curve.anchors[0]!;
  const last = curve.anchors.at(-1)!;
  if (deposit < first.deposit) {
    return freezeAppliedRate({
      annualRate: first.annualRate,
      rangeState: 'held-below',
      evidencePairCount: first.pairCount,
    });
  }
  if (deposit > last.deposit) {
    return freezeAppliedRate({
      annualRate: last.annualRate,
      rangeState: 'held-above',
      evidencePairCount: last.pairCount,
    });
  }

  for (let index = 0; index < curve.anchors.length; index += 1) {
    const right = curve.anchors[index]!;
    if (deposit === right.deposit) {
      return freezeAppliedRate({
        annualRate: right.annualRate,
        rangeState: 'observed',
        evidencePairCount: right.pairCount,
      });
    }
    if (deposit < right.deposit) {
      const left = curve.anchors[index - 1]!;
      const fraction = (deposit - left.deposit) / (right.deposit - left.deposit);
      return freezeAppliedRate({
        annualRate: left.annualRate + (right.annualRate - left.annualRate) * fraction,
        rangeState: 'observed',
        evidencePairCount: Math.min(left.pairCount, right.pairCount),
      });
    }
  }

  invalid('Curve lookup failed.');
}

function assertOffer<THousingType extends string>(
  offer: RentContractOffer<THousingType>,
): void {
  if (offer.id !== 'a' && offer.id !== 'b') invalid('Offer ID must be a or b.');
  if (typeof offer.housingType !== 'string' || offer.housingType.trim().length === 0) {
    invalid('Offer housing type must be non-empty.');
  }
  assertMoney(offer.deposit, 'Deposit');
  assertMoney(offer.monthlyRent, 'Monthly rent');
  if (offer.deposit === 0 && offer.monthlyRent === 0) {
    invalid('Deposit and monthly rent cannot both be zero.');
  }
  if (offer.label !== undefined && (typeof offer.label !== 'string' || offer.label.trim().length === 0)) {
    invalid('Offer label must be non-empty when provided.');
  }
}

function freezeOffer<THousingType extends string>(
  offer: RentContractOffer<THousingType>,
): RentContractOffer<THousingType> {
  return Object.freeze({ ...offer });
}

export function compareRentOffers<THousingType extends string>(input: Readonly<{
  curve: ConversionCurve<THousingType>;
  offers: readonly [RentContractOffer<THousingType>, RentContractOffer<THousingType>];
}>): RentContractComparison<THousingType> {
  assertCurve(input.curve);
  const [left, right] = input.offers;
  assertOffer(left);
  assertOffer(right);
  if (left.id === right.id) invalid('Offers must use distinct IDs.');
  if (
    left.housingType !== right.housingType ||
    left.housingType !== input.curve.housingType
  ) {
    invalid('Both offers and the curve must use the same housing type.');
  }

  const appliedRates: readonly [AppliedConversionRate, AppliedConversionRate] = Object.freeze([
    conversionRateAt(input.curve, left.deposit),
    conversionRateAt(input.curve, right.deposit),
  ]);
  if (appliedRates.some(({ rangeState }) => rangeState !== 'observed')) {
    invalid('Offer deposit is outside the measured range.');
  }

  const normalized = input.offers.map((offer, index) => {
    const appliedRate = appliedRates[index]!;
    const normalizedMonthlyCost = offer.monthlyRent
      + (offer.deposit * appliedRate.annualRate / 12);
    return Object.freeze({
      offer: freezeOffer(offer),
      normalizedMonthlyCost,
      roundedNormalizedMonthlyCost: Math.round(normalizedMonthlyCost),
      appliedRate,
    });
  }) as unknown as readonly [
    NormalizedRentContractOffer<THousingType>,
    NormalizedRentContractOffer<THousingType>,
  ];

  const normalizedOrder = normalized[0].normalizedMonthlyCost
    - normalized[1].normalizedMonthlyCost;
  const monthlyDifference = Math.abs(normalizedOrder);
  const roundedMonthlyDifference = Math.round(monthlyDifference);
  const effectivelyEqual = roundedMonthlyDifference === 0;
  const winner = effectivelyEqual
    ? 'equal'
    : normalizedOrder < 0 ? normalized[0].offer.id : normalized[1].offer.id;
  const rawOrder = left.monthlyRent - right.monthlyRent;
  const rankingFlipped = !effectivelyEqual
    && Math.sign(rawOrder) !== 0
    && Math.sign(normalizedOrder) !== 0
    && Math.sign(rawOrder) !== Math.sign(normalizedOrder);

  return Object.freeze({
    housingType: input.curve.housingType,
    offers: Object.freeze([...normalized]) as unknown as readonly [
      NormalizedRentContractOffer<THousingType>,
      NormalizedRentContractOffer<THousingType>,
    ],
    winner,
    monthlyDifference,
    roundedMonthlyDifference,
    effectivelyEqual,
    rankingFlipped,
  });
}

function checkMoney(value: number | null, positive: boolean): value is number {
  return value !== null
    && Number.isSafeInteger(value)
    && (positive ? value > 0 : value >= 0);
}

function monthOrdinal(value: string): number | null {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  if (match === null) return null;
  return Number(match[1]) * 12 + Number(match[2]) - 1;
}

function monthFromOrdinal(value: number): string {
  const year = Math.floor(value / 12);
  const month = value % 12 + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function completedMonthWindow(period: string): CompletedMonthWindow | null {
  const [startMonth, endMonth, extra] = period.split('/');
  if (startMonth === undefined || endMonth === undefined || extra !== undefined) return null;
  const availableStart = monthOrdinal(startMonth);
  const availableEnd = monthOrdinal(endMonth);
  if (availableStart === null || availableEnd === null || availableStart > availableEnd) return null;
  const effectiveStart = Math.max(
    availableStart,
    availableEnd - SINGLE_QUOTE_CHECK_MAX_COMPLETED_MONTHS + 1,
  );
  const effectiveStartMonth = monthFromOrdinal(effectiveStart);
  return Object.freeze({
    period: `${effectiveStartMonth}/${endMonth}`,
    startMonth: effectiveStartMonth,
    endMonth,
    completedMonthCount: availableEnd - effectiveStart + 1,
    maximumMonthCount: SINGLE_QUOTE_CHECK_MAX_COMPLETED_MONTHS,
  });
}

function unavailableSingle<THousingType extends string>(
  reason: SingleQuoteCheckUnavailableReason,
  message: string,
  period: string,
): SingleQuoteCheckResult<THousingType> {
  return Object.freeze({ status: 'unavailable', reason, message, period });
}

function singleQuoteValue<THousingType extends string>(
  input: SingleQuoteCheckInput<THousingType>,
): number | null {
  if (input.transaction === 'sale') {
    return checkMoney(input.salePriceWon, true) ? input.salePriceWon : null;
  }
  if (input.transaction === 'jeonse') {
    return checkMoney(input.depositWon, true) ? input.depositWon : null;
  }
  return checkMoney(input.depositWon, false) && checkMoney(input.monthlyRentWon, true)
    ? input.monthlyRentWon
    : null;
}

function comparableValue<THousingType extends string>(
  record: SingleQuoteComparable<THousingType>,
  input: SingleQuoteCheckInput<THousingType>,
  conversionRate: AppliedConversionRate | null,
): number | null {
  if (input.transaction === 'sale') {
    return checkMoney(record.salePriceWon, true) ? record.salePriceWon : null;
  }
  if (input.transaction === 'jeonse') {
    return checkMoney(record.depositWon, true) ? record.depositWon : null;
  }
  if (
    conversionRate === null
    || !checkMoney(record.depositWon, false)
    || !checkMoney(record.monthlyRentWon, true)
    || input.depositWon === null
  ) return null;
  const adjusted = record.monthlyRentWon
    + (record.depositWon - input.depositWon) * conversionRate.annualRate / 12;
  return adjusted > 0 ? roundWon(adjusted) : null;
}

function singleComparisonBasis(transaction: CheckTransaction) {
  if (transaction === 'sale') return 'reported-sale-price' as const;
  if (transaction === 'jeonse') return 'reported-jeonse-deposit' as const;
  return 'verified-deposit-adjusted-monthly-rent' as const;
}

function fallbackDisclosure(scope: 'building' | 'neighborhood' | 'district', hasBuilding: boolean) {
  if (!hasBuilding || scope === 'building') return null;
  return scope === 'neighborhood'
    ? 'Same-building evidence was below five records; same-neighborhood evidence is shown.'
    : 'Same-building and same-neighborhood evidence were below five records; district evidence is shown.';
}

export function evaluateSingleQuoteCheck<THousingType extends string>(input: Readonly<{
  input: SingleQuoteCheckInput<THousingType>;
  records: readonly SingleQuoteComparable<THousingType>[];
  period: string;
  conversionCurve?: ConversionCurve<THousingType>;
}>): SingleQuoteCheckResult<THousingType> {
  const selection = input.input;
  const evidenceWindow = completedMonthWindow(input.period);
  if (evidenceWindow === null) {
    return unavailableSingle(
      'evidence-unavailable',
      'The verified transaction evidence period is unavailable.',
      input.period,
    );
  }
  const quoteValue = singleQuoteValue(selection);
  if (
    quoteValue === null
    || selection.areaSqm === null
    || !Number.isFinite(selection.areaSqm)
    || selection.areaSqm <= 0
    || selection.districtSlug.trim() === ''
    || selection.housingType.trim() === ''
  ) {
    return unavailableSingle(
      'missing-input',
      'Complete every required field for the selected transaction.',
      evidenceWindow.period,
    );
  }

  let appliedConversionRate: AppliedConversionRate | null = null;
  if (selection.transaction === 'monthly') {
    if (input.conversionCurve === undefined
      || input.conversionCurve.housingType !== selection.housingType) {
      return unavailableSingle(
        'conversion-unavailable',
        'Verified conversion evidence is unavailable for this property type.',
        evidenceWindow.period,
      );
    }
    try {
      appliedConversionRate = conversionRateAt(input.conversionCurve, selection.depositWon!);
    } catch {
      return unavailableSingle(
        'conversion-unavailable',
        'Verified conversion evidence is unavailable for this property type.',
        evidenceWindow.period,
      );
    }
    if (appliedConversionRate.rangeState !== 'observed') {
      return unavailableSingle(
        'conversion-out-of-range',
        'The filed deposit is outside the verified conversion range.',
        evidenceWindow.period,
      );
    }
  }

  const matching = input.records.filter((record) => (
    record.transaction === selection.transaction
    && record.districtSlug === selection.districtSlug
    && record.housingType === selection.housingType
    && record.filedMonth >= evidenceWindow.startMonth
    && record.filedMonth <= evidenceWindow.endMonth
  ));
  const target = selection.buildingId === null
    ? null
    : matching.find(({ buildingId }) => buildingId === selection.buildingId) ?? null;
  const targetNeighborhoodId = selection.neighborhoodId ?? target?.neighborhoodId ?? null;
  const scopes = selection.buildingId === null
    ? [{ scope: 'district' as const }]
    : [
        { scope: 'building' as const },
        { scope: 'neighborhood' as const },
        { scope: 'district' as const },
      ];
  let broadestCount = 0;

  for (const { scope } of scopes) {
    for (const tolerance of [0.15, 0.2, 0.25] as const) {
      const withinArea = matching.filter((record) => (
        Math.abs(record.areaSqm - selection.areaSqm!) <= selection.areaSqm! * tolerance
      ));
      const scoped = scope === 'building'
        ? withinArea.filter(({ buildingId }) => buildingId === selection.buildingId)
        : scope === 'neighborhood'
          ? targetNeighborhoodId === null
            ? []
            : withinArea.filter(({ neighborhoodId }) => neighborhoodId === targetNeighborhoodId)
          : withinArea;
      const valued = scoped.flatMap((record) => {
        const adjustedValueWon = comparableValue(record, selection, appliedConversionRate);
        return adjustedValueWon === null ? [] : [{ record, adjustedValueWon }];
      });
      broadestCount = Math.max(broadestCount, valued.length);
      if (valued.length < SINGLE_QUOTE_CHECK_PUBLICATION_MINIMUM) continue;

      const values = valued.map(({ adjustedValueWon }) => adjustedValueWon);
      const minWon = Math.min(...values);
      const p25Won = roundWon(percentile(values, 0.25));
      const medianWon = roundWon(percentile(values, 0.5));
      const p75Won = roundWon(percentile(values, 0.75));
      const maxWon = Math.max(...values);
      const comparableRows = valued
        .map(({ record, adjustedValueWon }) => Object.freeze({ ...record, adjustedValueWon }))
        .sort((left, right) => right.filedMonth.localeCompare(left.filedMonth))
        .slice(0, 10);
      return Object.freeze({
        status: 'ready',
        input: Object.freeze({ ...selection }),
        comparisonBasis: singleComparisonBasis(selection.transaction),
        verdict: quoteValue < p25Won ? 'below' : quoteValue > p75Won ? 'above' : 'typical',
        quote: Object.freeze({
          salePriceWon: selection.salePriceWon,
          depositWon: selection.depositWon,
          monthlyRentWon: selection.monthlyRentWon,
          comparisonValueWon: quoteValue,
        }),
        distribution: Object.freeze({
          minWon, p25Won, medianWon, p75Won, maxWon, sampleCount: valued.length,
        }),
        difference: Object.freeze({
          won: quoteValue - medianWon,
          pct: roundDifferencePct(((quoteValue - medianWon) / medianWon) * 100),
        }),
        pricePercentile: percentileRank(values, quoteValue),
        sample: Object.freeze({
          count: valued.length,
          minimum: SINGLE_QUOTE_CHECK_PUBLICATION_MINIMUM,
        }),
        period: evidenceWindow.period,
        evidenceWindow,
        filters: Object.freeze({
          scope,
          districtSlug: selection.districtSlug,
          housingType: selection.housingType,
          areaTolerancePct: Math.round(tolerance * 100) as 15 | 20 | 25,
        }),
        fallbackDisclosure: fallbackDisclosure(scope, selection.buildingId !== null),
        appliedConversionRate,
        comparableRows: Object.freeze(comparableRows),
      });
    }
  }

  return Object.freeze({
    status: 'insufficient',
    sample: Object.freeze({
      count: broadestCount,
      minimum: SINGLE_QUOTE_CHECK_PUBLICATION_MINIMUM,
    }),
    period: evidenceWindow.period,
    evidenceWindow,
  });
}

function equivalentMonthlyCost<THousingType extends string>(
  check: Extract<SingleQuoteCheckResult<THousingType>, { status: 'ready' }>,
  curve: ConversionCurve<THousingType>,
): number | null {
  if (check.input.transaction === 'sale' || check.input.depositWon === null) return null;
  let rate: AppliedConversionRate;
  try {
    rate = conversionRateAt(curve, check.input.depositWon);
  } catch {
    return null;
  }
  if (rate.rangeState !== 'observed') return null;
  return roundWon(
    (check.input.monthlyRentWon ?? 0) + check.input.depositWon * rate.annualRate / 12,
  );
}

export function compareContractOffers<THousingType extends string>(input: Readonly<{
  offers: readonly [ContractOfferCheck<THousingType>, ContractOfferCheck<THousingType>];
  conversionCurve?: ConversionCurve<THousingType>;
}>): ContractOfferComparison<THousingType> {
  const [left, right] = input.offers;
  if (left.id === right.id || left.check.status !== 'ready' || right.check.status !== 'ready') {
    return Object.freeze({
      status: 'unavailable',
      reason: 'offer-evidence-unavailable',
      message: 'Both offers need supported market evidence before they can be compared.',
    });
  }
  const leftType = left.check.input.transaction;
  const rightType = right.check.input.transaction;
  const saleTradeoff = (leftType === 'sale') !== (rightType === 'sale');
  const equivalentBasis = !saleTradeoff && leftType !== rightType;
  let equivalents: readonly [number | null, number | null] = [null, null];
  if (equivalentBasis) {
    if (input.conversionCurve === undefined
      || input.conversionCurve.housingType !== left.check.input.housingType
      || input.conversionCurve.housingType !== right.check.input.housingType) {
      return Object.freeze({
        status: 'unavailable',
        reason: 'conversion-unavailable',
        message: 'Verified conversion evidence is required for this comparison.',
      });
    }
    equivalents = [
      equivalentMonthlyCost(left.check, input.conversionCurve),
      equivalentMonthlyCost(right.check, input.conversionCurve),
    ];
    if (equivalents[0] === null || equivalents[1] === null) {
      return Object.freeze({
        status: 'unavailable',
        reason: 'conversion-out-of-range',
        message: 'One or both deposits are outside the verified conversion range.',
      });
    }
  }

  const basis = saleTradeoff
    ? 'tradeoff' as const
    : equivalentBasis
      ? 'equivalent-monthly-cost' as const
      : 'market-position' as const;
  const projections = input.offers.map(({ id, check }, index) => {
    if (check.status !== 'ready') throw new TypeError('Unreachable unavailable offer.');
    const transaction = check.input.transaction;
    const upfrontCashWon = transaction === 'sale'
      ? check.input.salePriceWon!
      : check.input.depositWon!;
    return Object.freeze({
      id,
      transaction,
      marketVerdict: check.verdict,
      marketDifferencePct: check.difference.pct,
      pricePercentile: check.pricePercentile,
      upfrontCashWon,
      recurringCashFlowWon: check.input.monthlyRentWon,
      equivalentMonthlyCostWon: equivalents[index] ?? null,
      check,
    });
  });

  if (saleTradeoff) {
    return Object.freeze({
      status: 'ready', basis, verdict: 'tradeoff', winner: null,
      offers: Object.freeze(projections), differenceWon: null,
    });
  }
  const rankingValues = equivalentBasis
    ? [equivalents[0]!, equivalents[1]!]
    : [left.check.difference.pct, right.check.difference.pct];
  const differenceWon = equivalentBasis
    ? Math.abs(rankingValues[0]! - rankingValues[1]!)
    : null;
  const rankingDifference = rankingValues[0]! - rankingValues[1]!;
  const winner = rankingDifference === 0 ? 'equal' : rankingDifference < 0 ? left.id : right.id;
  return Object.freeze({
    status: 'ready',
    basis,
    verdict: winner,
    winner,
    offers: Object.freeze(projections),
    differenceWon,
  });
}
