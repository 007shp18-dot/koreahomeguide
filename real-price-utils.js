(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGRealPrices = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function previousCompletedMonth(date) {
    const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function mapHomeTypeToPriceType(homeType) {
    if (homeType === 'apartment' || homeType === 'officetel' || homeType === 'villa') return homeType;
    if (homeType === 'studio') return 'villa';
    return null;
  }

  function buildRealPriceSelection(neighborhood, homeType) {
    return {
      lawdCd: neighborhood.lawdCd,
      priceType: mapHomeTypeToPriceType(homeType) || 'apartment'
    };
  }

  function toWonFromManwon(value) {
    const n = Number(String(value || '0').replace(/,/g, '').trim());
    return Number.isFinite(n) ? n * 10000 : 0;
  }

  function filterTransactions(items, budgets) {
    const rentLimit = Number(budgets.rentBudgetWon || 0);
    const depositLimit = Number(budgets.depositBudgetWon || 0);
    return items.filter(item => {
      const rentWon = toWonFromManwon(item.monthlyRent);
      const depositWon = toWonFromManwon(item.deposit);
      const rentOk = !rentLimit || rentWon <= rentLimit;
      const depositOk = !depositLimit || depositWon <= depositLimit;
      return rentOk && depositOk;
    });
  }

  return {
    previousCompletedMonth,
    mapHomeTypeToPriceType,
    buildRealPriceSelection,
    toWonFromManwon,
    filterTransactions
  };
});
