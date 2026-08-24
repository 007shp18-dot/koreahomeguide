(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGExplorer = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function buildBuildingDetailUrl({ lawdCd, type, buildingKey }) {
    const params = new URLSearchParams({
      lawdCd:String(lawdCd || ''),
      type:String(type || ''),
      buildingKey:String(buildingKey || '')
    });
    return `/explore/building/?${params.toString()}`;
  }

  function propertyTypeLabel(type) {
    return ({ apartment:'Apartment', officetel:'Officetel', villa:'Villa / Multi-family' })[type] || type;
  }

  return { buildBuildingDetailUrl, propertyTypeLabel };
});
