(function(root, factory) {
  const locations = typeof module === 'object' && module.exports ? require('./map-locations.js') : root.KHGMapLocations;
  const labels = typeof module === 'object' && module.exports ? require('../location-catalog.js') : root.KHGLocations;
  const api = factory(locations, labels);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGMapController = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(locations, labels) {
  'use strict';

  function buildMarkerModels({ lawdCd, dongs, locale = 'en' } = {}) {
    return (Array.isArray(dongs) ? dongs : []).flatMap(item => {
      const dong = String(item && item.dong || '');
      const point = locations && locations.neighborhood(dong);
      if (!dong || !point) return [];
      const rawCount = Number(item && item.contractCount);
      const contractCount = Number.isFinite(rawCount) ? Math.max(0, Math.floor(rawCount)) : 0;
      return [Object.freeze({
        id:`dong:${dong}`,
        dong,
        label:labels.dongLabel(dong, locale),
        lat:point.lat,
        lng:point.lng,
        contractCount
      })];
    });
  }

  function selectDong(state, dong) {
    return Object.freeze({ ...(state || {}), selectedDong:String(dong || '') });
  }

  return Object.freeze({ buildMarkerModels, selectDong });
});
