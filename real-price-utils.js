(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGRealPrices = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function previousCompletedMonth(date) {
    const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function recentCompletedMonths(date, count = 60) {
    const total = Math.max(1, Number(count) || 60);
    const values = [];
    for (let offset = 1; offset <= total; offset += 1) {
      const d = new Date(date.getFullYear(), date.getMonth() - offset, 1);
      values.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return values;
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
    recentCompletedMonths,
    mapHomeTypeToPriceType,
    buildRealPriceSelection,
    toWonFromManwon,
    filterTransactions
  };
});
