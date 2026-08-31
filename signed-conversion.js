// Measured deposit ↔ monthly-rent conversion, by asset type.
//
// This is NOT the statutory reference in deposit-conversion.js. That module
// states the legal 5.0% figure and stays where it is; the rent check and the
// salary tool keep using it. This module states what filed contracts actually
// converted at, which is a different claim and belongs in a different place.
//
// How it was measured: pairs of contracts in the SAME building at the SAME
// floor area but different deposits. Each pair implies a rate; the anchors
// below are the medians of those implied rates within a deposit band. The
// curve between two anchors is linear interpolation, not a fitted function —
// do not read precision into the interpolated values.
//
// Two findings sit behind this file:
//   1. The rate is per ASSET TYPE, not per market. Applying the officetel
//      curve to apartments pushed estimation error to 33.9%.
//   2. The rate FALLS as the deposit rises. A single flat rate is wrong at
//      both ends.
//
// Every number derived from this is an estimate, not a quote. Landlords
// convert at their own rate.

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SignedConversion = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const EOK = 100000000; // 1억

  // depositWon → annual rate. Anchors are measured; between them, linear.
  const CURVES = Object.freeze({
    apartment: Object.freeze([
      { deposit: 0.5 * EOK, rate: 0.0481 },
      { deposit: 5.0 * EOK, rate: 0.0447 }
    ]),
    officetel: Object.freeze([
      { deposit: 0.3 * EOK, rate: 0.0600 },
      { deposit: 2.0 * EOK, rate: 0.0480 }
    ])
  });

  const MEASUREMENT = Object.freeze({
    source: 'MOLIT filed contracts, matched pairs (same building, same area)',
    asOf: '2026-08',
    note: 'Median of implied rates within deposit band; linear between anchors.'
  });

  const STATUTORY_REFERENCE_RATE = 0.05; // what deposit-conversion.js uses

  function assetTypeKey(assetType) {
    return assetType === 'officetel' ? 'officetel' : 'apartment';
  }

  // Annual conversion rate implied by a deposit of `depositWon`.
  // Outside the anchor range the nearest anchor's rate is held flat — the
  // measurement does not extend past it and extrapolating would invent data.
  function conversionRateAt(depositWon, assetType) {
    const curve = CURVES[assetTypeKey(assetType)];
    const d = Number(depositWon);
    if (!Number.isFinite(d)) return curve[0].rate;

    const lo = curve[0];
    const hi = curve[curve.length - 1];
    if (d <= lo.deposit) return lo.rate;
    if (d >= hi.deposit) return hi.rate;

    const t = (d - lo.deposit) / (hi.deposit - lo.deposit);
    return lo.rate + t * (hi.rate - lo.rate);
  }

  // Restate `monthlyRentWon` — signed at `contractDepositWon` — as the monthly
  // rent the same home would carry at `targetDepositWon`.
  //
  // The rate is taken at the CONTRACT deposit, because that is the deposit the
  // parties actually converted at. Using the target deposit's rate would apply
  // a rate to a trade that never happened.
  //
  // Raising the target above the contract deposit lowers the result, and it
  // can go below zero. That is arithmetic, not a quote — callers showing it to
  // a person should clamp and say so.
  function signedRent(monthlyRentWon, contractDepositWon, targetDepositWon, assetType) {
    const rate = conversionRateAt(contractDepositWon, assetType);
    return {
      monthlyWon: Number(monthlyRentWon)
        + ((Number(contractDepositWon) - Number(targetDepositWon)) * rate / 12),
      rate
    };
  }

  return {
    CURVES,
    MEASUREMENT,
    STATUTORY_REFERENCE_RATE,
    conversionRateAt,
    signedRent
  };
});
