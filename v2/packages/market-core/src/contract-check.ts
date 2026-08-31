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
  referenceDeposit: number;
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

  const referenceDeposit = Math.min(left.deposit, right.deposit);
  const normalized = input.offers.map((offer) => {
    const appliedRate = conversionRateAt(input.curve, offer.deposit);
    const normalizedMonthlyCost = offer.monthlyRent
      + ((offer.deposit - referenceDeposit) * appliedRate.annualRate / 12);
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
    referenceDeposit,
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
