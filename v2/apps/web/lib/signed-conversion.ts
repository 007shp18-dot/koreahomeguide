/**
 * Measured deposit <-> monthly-rent conversion, by asset type.
 *
 * This is not the statutory reference rate. It states what filed contracts
 * actually converted at, which is a different claim.
 *
 * How it was measured: pairs of MOLIT-filed contracts in the SAME building at
 * the SAME floor area but different deposits. Each pair implies a rate; the
 * anchors below are the medians of those implied rates within a deposit band.
 * The curve between two anchors is linear interpolation, not a fitted
 * function — do not read precision into interpolated values.
 *
 * Two findings sit behind this module:
 *   1. The rate is per ASSET TYPE, not per market. Applying the officetel
 *      curve to apartments pushed estimation error to 33.9%.
 *   2. The rate FALLS as the deposit rises. A single flat rate is wrong at
 *      both ends.
 *
 * Everything derived from this is an estimate, not a quote. Landlords convert
 * at their own rate.
 */

export const EOK = 100_000_000;
export const MAN = 10_000;

export type AssetType = 'apartment' | 'officetel';

export interface ConversionAnchor {
  readonly deposit: number;
  readonly rate: number;
}

export const conversionCurves = {
  apartment: [
    { deposit: 0.5 * EOK, rate: 0.0481 },
    { deposit: 5.0 * EOK, rate: 0.0447 },
  ],
  officetel: [
    { deposit: 0.3 * EOK, rate: 0.06 },
    { deposit: 2.0 * EOK, rate: 0.048 },
  ],
} as const satisfies Record<AssetType, readonly ConversionAnchor[]>;

export const conversionMeasurement = {
  source: 'MOLIT filed contracts, matched pairs (same building, same floor area)',
  asOf: '2026-08',
  note: 'Median of implied rates within a deposit band; linear between anchors.',
} as const;

/**
 * Annual conversion rate implied by a deposit.
 *
 * Outside the anchor range the nearest anchor's rate is held flat — the
 * measurement does not extend past it and extrapolating would invent data.
 */
export function conversionRateAt(depositWon: number, assetType: AssetType): number {
  // Each curve is exactly two measured anchors, so destructuring keeps the
  // types exact and avoids an index that could be undefined.
  const [low, high] = conversionCurves[assetType];

  if (!Number.isFinite(depositWon)) return low.rate;
  if (depositWon <= low.deposit) return low.rate;
  if (depositWon >= high.deposit) return high.rate;

  const progress = (depositWon - low.deposit) / (high.deposit - low.deposit);
  return low.rate + progress * (high.rate - low.rate);
}

export interface RestatedRent {
  /** Monthly rent the same home would carry at the target deposit. May be negative. */
  readonly monthlyWon: number;
  /** The annual rate used, read at the contract deposit. */
  readonly rate: number;
}

/**
 * Restate a monthly rent signed at `contractDepositWon` as the monthly rent
 * the same home would carry at `targetDepositWon`.
 *
 * The rate is taken at the CONTRACT deposit, because that is the deposit the
 * parties actually converted at. Using the target deposit's rate would apply a
 * rate to a trade that never happened.
 *
 * Raising the target above the contract deposit lowers the result and it can
 * go below zero. That is arithmetic, not a quote — callers showing it to a
 * person must clamp and say so.
 */
export function restateRent(
  monthlyRentWon: number,
  contractDepositWon: number,
  targetDepositWon: number,
  assetType: AssetType,
): RestatedRent {
  const rate = conversionRateAt(contractDepositWon, assetType);

  return {
    monthlyWon: monthlyRentWon + ((contractDepositWon - targetDepositWon) * rate) / 12,
    rate,
  };
}

export interface ComparedConditions {
  readonly aMonthlyWon: number;
  readonly bMonthlyWon: number;
  readonly aRate: number;
  readonly bRate: number;
  /** True when either side's restated rent fell below zero and was clamped. */
  readonly clamped: boolean;
  /** Which side is cheaper as advertised; null when the written rents are equal. */
  readonly cheaperAsWritten: 'a' | 'b' | null;
  /** Which side is cheaper once both are restated; null when equal. */
  readonly cheaperRestated: 'a' | 'b' | null;
  /** The finding this page exists for: the order reverses once the basis matches. */
  readonly orderReversed: boolean;
}

export interface RentalCondition {
  readonly depositWon: number;
  readonly monthlyRentWon: number;
}

export function compareAtSameDeposit(
  a: RentalCondition,
  b: RentalCondition,
  targetDepositWon: number,
  assetType: AssetType,
): ComparedConditions {
  const restatedA = restateRent(a.monthlyRentWon, a.depositWon, targetDepositWon, assetType);
  const restatedB = restateRent(b.monthlyRentWon, b.depositWon, targetDepositWon, assetType);

  const aMonthlyWon = Math.max(0, restatedA.monthlyWon);
  const bMonthlyWon = Math.max(0, restatedB.monthlyWon);

  const cheaperAsWritten =
    a.monthlyRentWon === b.monthlyRentWon ? null : a.monthlyRentWon < b.monthlyRentWon ? 'a' : 'b';
  const cheaperRestated =
    aMonthlyWon === bMonthlyWon ? null : aMonthlyWon < bMonthlyWon ? 'a' : 'b';

  return {
    aMonthlyWon,
    bMonthlyWon,
    aRate: restatedA.rate,
    bRate: restatedB.rate,
    clamped: restatedA.monthlyWon < 0 || restatedB.monthlyWon < 0,
    cheaperAsWritten,
    cheaperRestated,
    orderReversed:
      cheaperAsWritten !== null && cheaperRestated !== null && cheaperAsWritten !== cheaperRestated,
  };
}
