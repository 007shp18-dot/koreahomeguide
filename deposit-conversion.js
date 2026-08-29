// Deposit ↔ monthly-rent conversion, defined once for both sides.
//
// Korean leases trade deposit against rent: put more cash down and the monthly
// payment falls. Comparing two listings therefore means restating them at the
// same deposit first, and the rate that does that is a number this site must
// state identically everywhere it appears — in the rent check, in the salary
// tool, and anywhere else that comes later.
//
// It previously lived only in lib/rent-check-core.cjs, which the browser cannot
// load, so a browser tool had no way to reach it without copying the number.
// This module is the single definition; rent-check-core requires it.

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGDepositConversion = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // The statutory reference rate, not a market quote. Actual landlords convert
  // at their own rate, and any figure derived from this is an estimate.
  const DEPOSIT_CONVERSION_REFERENCE = Object.freeze({
    annualRate: 0.05,
    asOf: '2026-08-27',
    basis: 'Korean statutory conversion reference'
  });

  // Restate `monthlyRentWon` — signed at `contractDepositWon` — as the monthly
  // rent the same home would carry at `targetDepositWon`.
  //
  // Raising the deposit lowers the rent, so a target above the contract deposit
  // returns a smaller number. The result can go negative when the target is far
  // above the contract deposit; that is arithmetic, not a quote, and callers
  // that show it to a person should clamp it.
  function monthlyRentAtDeposit(
    monthlyRentWon,
    contractDepositWon,
    targetDepositWon,
    annualRate = DEPOSIT_CONVERSION_REFERENCE.annualRate
  ) {
    return Number(monthlyRentWon)
      + ((Number(contractDepositWon) - Number(targetDepositWon)) * Number(annualRate) / 12);
  }

  return { DEPOSIT_CONVERSION_REFERENCE, monthlyRentAtDeposit };
});
