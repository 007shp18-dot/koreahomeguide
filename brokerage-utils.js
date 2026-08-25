(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.KHGBrokerage = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function toNonNegativeNumber(value) {
    const n = Number(value || 0);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function calculateRentalTransactionValue(depositWon, monthlyRentWon) {
    const deposit = toNonNegativeNumber(depositWon);
    const monthlyRent = toNonNegativeNumber(monthlyRentWon);
    const value100 = deposit + monthlyRent * 100;
    return value100 < 50_000_000 ? deposit + monthlyRent * 70 : value100;
  }

  function housingRentalRule(transactionValueWon) {
    if (transactionValueWon < 50_000_000) return { rate: 0.005, capWon: 200_000 };
    if (transactionValueWon < 100_000_000) return { rate: 0.004, capWon: 300_000 };
    if (transactionValueWon < 600_000_000) return { rate: 0.003, capWon: null };
    if (transactionValueWon < 1_200_000_000) return { rate: 0.004, capWon: null };
    if (transactionValueWon < 1_500_000_000) return { rate: 0.005, capWon: null };
    return { rate: 0.006, capWon: null };
  }

  function calculateBrokerageFee({ propertyType = 'housing', depositWon = 0, monthlyRentWon = 0 } = {}) {
    const transactionValueWon = calculateRentalTransactionValue(depositWon, monthlyRentWon);
    const rule = propertyType === 'officetel'
      ? { rate: 0.004, capWon: null }
      : propertyType === 'officetel-other'
        ? { rate: 0.009, capWon: null }
        : housingRentalRule(transactionValueWon);
    const ratePermille = Math.round(rule.rate * 1000);
    const rawFee = Math.floor((transactionValueWon * ratePermille) / 1000);
    const maxFeeWon = rule.capWon == null ? rawFee : Math.min(rawFee, rule.capWon);

    return {
      transactionValueWon,
      maxRate: rule.rate,
      capWon: rule.capWon,
      maxFeeWon,
    };
  }

  function calculateMoveInSummary({
    propertyType = 'housing',
    depositWon = 0,
    monthlyRentWon = 0,
    maintenanceWon = 0,
    guaranteeInsuranceWon = 0,
    movingCleaningWon = 0,
  } = {}) {
    const deposit = toNonNegativeNumber(depositWon);
    const monthlyRent = toNonNegativeNumber(monthlyRentWon);
    const maintenance = toNonNegativeNumber(maintenanceWon);
    const guaranteeInsurance = toNonNegativeNumber(guaranteeInsuranceWon);
    const movingCleaning = toNonNegativeNumber(movingCleaningWon);
    const brokerage = calculateBrokerageFee({ propertyType, depositWon: deposit, monthlyRentWon: monthlyRent });

    return {
      ...brokerage,
      brokerageMaxWon: brokerage.maxFeeWon,
      moveInCashWon: deposit + monthlyRent + brokerage.maxFeeWon + guaranteeInsurance + movingCleaning,
      monthlyRecurringWon: monthlyRent + maintenance,
    };
  }

  return {
    calculateRentalTransactionValue,
    calculateBrokerageFee,
    calculateMoveInSummary,
  };
});
