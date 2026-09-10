(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KHGSavedExplorerBuildings = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const KEY = 'khg:saved-explorer-buildings:v1';
  const PUBLIC_FIELDS = ['buildingKey','buildingName','officialBuildingNameKo','districtCode','districtName','dong','propertyType','roadAddress','jibun'];

  function sanitize(value) {
    const clean = {};
    for (const field of PUBLIC_FIELDS) {
      if (value && value[field] != null && value[field] !== '') clean[field] = String(value[field]);
    }
    return clean;
  }

  function createStore(storage, { limit = 20 } = {}) {
    function read() {
      try {
        const payload = JSON.parse(storage && storage.getItem(KEY) || '[]');
        return Array.isArray(payload) ? payload.map(sanitize).filter(item => item.buildingKey) : [];
      } catch (_) { return []; }
    }
    function write(items) {
      try { if (storage) storage.setItem(KEY, JSON.stringify(items.slice(0, limit))); } catch (_) {}
    }
    return Object.freeze({
      all:read,
      has:buildingKey => read().some(item => item.buildingKey === String(buildingKey || '')),
      toggle(value) {
        const item = sanitize(value);
        if (!item.buildingKey) return { saved:false, items:read() };
        const items = read();
        const index = items.findIndex(existing => existing.buildingKey === item.buildingKey);
        if (index >= 0) {
          items.splice(index, 1); write(items); return { saved:false, items };
        }
        const next = [item, ...items].slice(0, limit);
        write(next); return { saved:true, items:next };
      }
    });
  }
  return Object.freeze({ KEY, createStore, sanitize });
});
