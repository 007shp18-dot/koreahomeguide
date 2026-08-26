(function(root, factory) {
  const acquisitionContext = typeof module === 'object' && module.exports
    ? require('../../acquisition-context.js')
    : root && root.KHGAcquisitionContext;
  const api = factory(acquisitionContext);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGRentCheckPrefill = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(acquisitionContext) {
  const AREAS = new Set([
    '11680','11200','11440','11170','11560',
    '11620','11230','11410','11290','11215'
  ]);
  const TYPES = new Set(['apartment','officetel','villa','detached','studio']);
  const validatedEntrySource = acquisitionContext && acquisitionContext.validatedEntrySource
    ? acquisitionContext.validatedEntrySource
    : () => '';

  function safeCampaign(value) {
    return String(value || '')
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .trim()
      .slice(0, 120);
  }

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
    const sourcePage = String(params.get('from') || '');
    if (AREAS.has(area)) result.lawdCd = area;
    if (TYPES.has(type)) result.type = type;
    if (depositWon != null) result.depositWon = depositWon;
    if (rentWon != null) result.rentWon = rentWon;
    if (areaSqm != null) result.areaSqm = areaSqm;
    const validSource = validatedEntrySource(sourcePage, result.lawdCd, result.type);
    if (validSource) result.sourcePage = validSource;
    for (const [queryName, resultName] of [
      ['origin_source','originSource'],
      ['origin_medium','originMedium'],
      ['origin_campaign','originCampaign']
    ]) {
      const value = safeCampaign(params.get(queryName));
      if (value) result[resultName] = value;
    }
    return result;
  }

  return { readRentCheckPrefill };
});
