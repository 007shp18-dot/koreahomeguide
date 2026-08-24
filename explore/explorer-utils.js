(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGExplorer = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function buildBuildingDetailUrl({ lawdCd, type, dong = '', buildingKey }) {
    const params = new URLSearchParams({
      lawdCd:String(lawdCd || ''),
      type:String(type || '')
    });
    if (dong) params.set('dong', String(dong));
    params.set('buildingKey', String(buildingKey || ''));
    return `/explore/building/?${params.toString()}`;
  }

  function filterDongsByBudget(items, { maxRent = 0, maxDeposit = 0 } = {}) {
    const rentLimit = Math.max(0, Number(maxRent) || 0);
    const depositLimit = Math.max(0, Number(maxDeposit) || 0);
    return (Array.isArray(items) ? items : []).filter(item => {
      if (rentLimit) {
        const rawRent = item && item.medianMonthlyRentWon;
        if (rawRent == null || rawRent === '') return false;
        const rent = Number(rawRent);
        if (!Number.isFinite(rent) || rent > rentLimit) return false;
      }
      if (depositLimit) {
        const rawDeposit = item && item.medianDepositWon;
        if (rawDeposit == null || rawDeposit === '') return false;
        const deposit = Number(rawDeposit);
        if (!Number.isFinite(deposit) || deposit > depositLimit) return false;
      }
      return true;
    });
  }

  function propertyTypeLabel(type) {
    return ({ apartment:'Apartment', officetel:'Officetel', villa:'Villa / Multi-family' })[type] || type;
  }

  return { buildBuildingDetailUrl, filterDongsByBudget, propertyTypeLabel };
});
