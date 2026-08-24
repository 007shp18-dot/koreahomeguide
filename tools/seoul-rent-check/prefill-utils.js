(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGRentCheckPrefill = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const AREAS = new Set(['11680','11200','11440','11170','11560']);
  const TYPES = new Set(['apartment','officetel','villa','studio']);

  function nonNegativeNumber(value) {
    if (value == null || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function positiveNumber(value) {
    const number = nonNegativeNumber(value);
    return number != null && number > 0 ? number : null;
  }

  function readRentCheckPrefill(search) {
    const params = new URLSearchParams(String(search || ''));
    const result = {};
    const area = params.get('lawdCd');
    const type = params.get('type');
    const depositWon = nonNegativeNumber(params.get('deposit'));
    const rentWon = nonNegativeNumber(params.get('rent'));
    const areaSqm = positiveNumber(params.get('area'));
    if (AREAS.has(area)) result.lawdCd = area;
    if (TYPES.has(type)) result.type = type;
    if (depositWon != null) result.depositWon = depositWon;
    if (rentWon != null) result.rentWon = rentWon;
    if (areaSqm != null) result.areaSqm = areaSqm;
    return result;
  }

  return { readRentCheckPrefill };
});
