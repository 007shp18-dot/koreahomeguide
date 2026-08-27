(function(root, factory) {
  const locations = typeof module === 'object' && module.exports ? require('./map-locations.js') : root.KHGMapLocations;
  const labels = typeof module === 'object' && module.exports ? require('../location-catalog.js') : root.KHGLocations;
  const explorer = typeof module === 'object' && module.exports ? require('./explorer-utils.js') : root.KHGExplorer;
  const api = factory(locations, labels, explorer);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGMapController = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(locations, labels, explorer) {
  'use strict';

  const MAP_EVENTS = new Set(['explorer_map_view', 'explorer_map_select']);

  function finiteMoney(value) {
    if (value == null || String(value).trim() === '') return null;
    const amount = Number(value);
    return Number.isFinite(amount) && amount >= 0 ? amount : null;
  }

  function normalizedCount(value) {
    const count = Number(value);
    return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  }

  function sanitizedPageLocation(value) {
    try {
      const url = new URL(String(value || ''));
      if (!['http:', 'https:'].includes(url.protocol)) return '';
      return `${url.origin}${url.pathname}`;
    } catch (_) {
      return '';
    }
  }

  function markerScale(evidenceCount) {
    if (evidenceCount >= 25) return 14;
    if (evidenceCount >= 10) return 12;
    return 10;
  }

  function buildMapsSdkUrl({ apiKey = '', callback = '', locale = 'en' } = {}) {
    const language = String(locale || '').toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
    const params = new URLSearchParams({
      key:String(apiKey),
      v:'weekly',
      loading:'async',
      libraries:'marker',
      callback:String(callback),
      language,
      region:'KR'
    });
    return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
  }

  function buildMarkerModels({ lawdCd, propertyType = '', dongs, locale = 'en', limits = {} } = {}) {
    const hasBudget = Boolean(Math.max(0, Number(limits.maxRent) || 0) || Math.max(0, Number(limits.maxDeposit) || 0));
    return (Array.isArray(dongs) ? dongs : []).flatMap(item => {
      const dong = String(item && item.dong || '');
      const point = locations && locations.neighborhood(dong);
      if (!dong || !point) return [];
      const contractCount = normalizedCount(item && item.contractCount);
      const fit = explorer && typeof explorer.budgetFitForDong === 'function'
        ? explorer.budgetFitForDong(item, limits)
        : { fits:true, matchingContractCount:contractCount, representativeBand:null };
      const band = fit.representativeBand;
      const evidenceCount = hasBudget ? normalizedCount(fit.matchingContractCount) : contractCount;
      const evidenceLevel = evidenceCount >= 10 ? 'strong' : 'limited';
      const budgetStatus = hasBudget ? (fit.fits ? 'fit' : 'outside') : 'unfiltered';
      return [Object.freeze({
        id:`dong:${dong}`,
        dong,
        label:labels.dongLabel(dong, locale),
        lat:point.lat,
        lng:point.lng,
        districtCode:String(item && item.districtCode || lawdCd || ''),
        propertyType:String(propertyType || ''),
        contractCount,
        evidenceCount,
        rentWon:finiteMoney(band ? band.medianMonthlyRentWon : (item.contextualMedianMonthlyRentWon ?? item.medianMonthlyRentWon)),
        depositWon:finiteMoney(band ? band.medianDepositWon : (item.contextualMedianDepositWon ?? item.medianDepositWon)),
        evidenceLevel,
        budgetStatus,
        tone:budgetStatus === 'outside' ? 'outside' : evidenceLevel,
        scale:markerScale(evidenceCount)
      })];
    });
  }

  function buildMapAnalyticsEvent(name, context = {}) {
    if (!MAP_EVENTS.has(String(name || ''))) return null;
    const locale = String(context.locale || '').toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
    const district = /^(?:all|\d{5})$/.test(String(context.lawdCd || '')) ? String(context.lawdCd) : '';
    const propertyType = ['apartment','officetel','villa','detached','studio'].includes(String(context.propertyType || ''))
      ? String(context.propertyType)
      : '';
    const common = {
      locale,
      district_code:district,
      property_type:propertyType,
      budget_filter:context.hasBudget ? 'active' : 'none'
    };
    const pageLocation = sanitizedPageLocation(context.pageLocation);
    if (pageLocation) common.page_location = pageLocation;
    if (name === 'explorer_map_view') {
      return Object.freeze({
        ...common,
        marker_count:Math.min(999, normalizedCount(context.markerCount)),
        fitting_count:Math.min(999, normalizedCount(context.fittingCount))
      });
    }
    return Object.freeze({
      ...common,
      budget_status:['fit','outside','unfiltered'].includes(context.budgetStatus) ? context.budgetStatus : 'unfiltered',
      evidence_level:context.evidenceLevel === 'strong' ? 'strong' : 'limited'
    });
  }

  function markerVisual(model = {}, selected = false) {
    const colors = {
      strong:'#15803d',
      limited:'#b45309',
      outside:'#64748b'
    };
    const tone = ['strong','limited','outside'].includes(model.tone) ? model.tone : 'limited';
    return Object.freeze({
      fillColor:selected ? '#2563eb' : colors[tone],
      strokeColor:'#ffffff',
      fillOpacity:tone === 'outside' && !selected ? 0.86 : 0.94,
      strokeWeight:2,
      scale:Math.min(16, Math.max(9, Number(model.scale) || 10))
    });
  }

  function advancedPinVisual(model = {}, selected = false) {
    const visual = markerVisual(model, selected);
    const count = normalizedCount(model.contractCount);
    const glyphFontSize = count > 999 ? '9px' : count >= 100 ? '10px' : '11px';
    return Object.freeze({
      background:visual.fillColor,
      borderColor:visual.strokeColor,
      glyphColor:'#ffffff',
      glyphText:count > 999 ? '999+' : count ? String(count) : '',
      glyphFontSize,
      scale:Math.round(Math.min(1.34, Math.max(0.75, visual.scale / 12)) * 100) / 100
    });
  }

  function applyAdvancedMarkerBadge(element, model = {}, selected = false) {
    if (!element || !element.style) return null;
    const visual = advancedPinVisual(model, selected);
    element.textContent = visual.glyphText;
    element.style.backgroundColor = visual.background;
    element.style.borderColor = visual.borderColor;
    element.style.color = visual.glyphColor;
    element.style.fontSize = visual.glyphFontSize;
    element.style.transform = `scale(${visual.scale})`;
    return element;
  }

  function advancedMarkersAvailable(map, mapId) {
    const configuredMapId = String(mapId || '').trim();
    if (!configuredMapId || configuredMapId === 'DEMO_MAP_ID' || !map || typeof map.getMapCapabilities !== 'function') return false;
    try {
      const capabilities = map.getMapCapabilities();
      return Boolean(capabilities && capabilities.isAdvancedMarkersAvailable);
    } catch (_) {
      return false;
    }
  }

  function selectDong(state, dong) {
    return Object.freeze({ ...(state || {}), selectedDong:String(dong || '') });
  }

  return Object.freeze({ buildMapsSdkUrl, buildMarkerModels, buildMapAnalyticsEvent, markerVisual, advancedPinVisual, applyAdvancedMarkerBadge, advancedMarkersAvailable, selectDong });
});
