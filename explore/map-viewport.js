(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGMapViewport = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const STORAGE_KEY = 'khg:explorer-map-points:v1';
  const MAX_POINTS = 180;

  function normalizedBounds(bounds = {}) {
    const value = {
      north:Number(bounds.north), south:Number(bounds.south),
      east:Number(bounds.east), west:Number(bounds.west)
    };
    return Object.values(value).every(Number.isFinite) ? value : null;
  }

  function pointWithinBounds(model, bounds) {
    const box = normalizedBounds(bounds);
    const lat = Number(model && model.lat);
    const lng = Number(model && model.lng);
    if (!box || !Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    const latitudeFits = lat <= box.north && lat >= box.south;
    const longitudeFits = box.west <= box.east
      ? lng >= box.west && lng <= box.east
      : lng >= box.west || lng <= box.east;
    return latitudeFits && longitudeFits;
  }

  function filterModelsByBounds(models, bounds) {
    return (Array.isArray(models) ? models : []).filter(model => pointWithinBounds(model, bounds));
  }

  function selectModelsForViewport(models, bounds, limit = 60) {
    const source = normalizedBounds(bounds) ? filterModelsByBounds(models, bounds) : (Array.isArray(models) ? models : []);
    const maximum = Math.min(60, Math.max(0, Math.floor(Number(limit) || 0)));
    return source.slice(0, maximum);
  }

  function hasCompleteViewportCoverage({ markerScope, locatedCount, totalCount } = {}) {
    if (markerScope !== 'building') return true;
    return Number(locatedCount || 0) >= Number(totalCount || 0);
  }

  function workspacePadding({ viewportWidth = 0, mobile = false, drawerOpen = false } = {}) {
    if (mobile) return { top:56, right:32, bottom:drawerOpen ? 300 : 220, left:32 };
    const wide = Number(viewportWidth) >= 1440;
    return {
      top:72,
      right:drawerOpen ? (wide ? 552 : 492) : 32,
      bottom:72,
      left:wide ? 392 : 352
    };
  }

  function readPoint(storage, key) {
    if (!storage || !key) return null;
    try {
      const rows = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
      const match = Array.isArray(rows) && rows.find(row => row && row.key === key);
      return match && Number.isFinite(Number(match.lat)) && Number.isFinite(Number(match.lng))
        ? { lat:Number(match.lat), lng:Number(match.lng) }
        : null;
    } catch (_) { return null; }
  }

  function writePoint(storage, key, point) {
    const lat = Number(point && point.lat);
    const lng = Number(point && point.lng);
    if (!storage || !key || !Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    try {
      const current = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
      const rows = (Array.isArray(current) ? current : []).filter(row => row && row.key !== key);
      rows.unshift({ key, lat, lng });
      storage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, MAX_POINTS)));
      return true;
    } catch (_) { return false; }
  }

  return Object.freeze({ normalizedBounds, pointWithinBounds, filterModelsByBounds, selectModelsForViewport, hasCompleteViewportCoverage, workspacePadding, readPoint, writePoint });
});
