(function(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KHGProductAnalytics = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';

  const EVENTS = new Set([
    'explorer_search_start',
    'explorer_search_result',
    'explorer_search_error',
    'explorer_building_detail_view',
    'explorer_street_view_result'
  ]);
  const DISTRICTS = new Set([
    'all','11110','11140','11170','11200','11215','11230','11260','11290','11305',
    '11320','11350','11380','11410','11440','11470','11500','11530','11545','11560',
    '11590','11620','11650','11680','11710','11740'
  ]);
  const PROPERTY_TYPES = new Set(['apartment','officetel','villa','detached','studio']);
  const RESULT_STATES = new Set(['success','empty','error','ready','unconfigured']);

  function countBucket(value) {
    const count = Math.max(0, Number(value) || 0);
    if (count === 0) return '0';
    if (count < 10) return '1-9';
    if (count < 25) return '10-24';
    if (count < 50) return '25-49';
    if (count < 200) return '50-199';
    if (count < 1000) return '200-999';
    return '1000+';
  }

  function language(value) {
    return String(value || '').toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
  }

  function district(value) {
    const candidate = String(value || '');
    return DISTRICTS.has(candidate) ? candidate : 'unknown';
  }

  function propertyType(value) {
    const candidate = String(value || '');
    return PROPERTY_TYPES.has(candidate) ? candidate : 'unknown';
  }

  function budgetFilterCount(input) {
    return [input && input.maxRent, input && input.maxDeposit].filter(value => Number(value) > 0).length;
  }

  function safeToken(value, fallback = 'unknown') {
    const candidate = String(value || '').trim().toLowerCase();
    return /^[a-z][a-z0-9_-]{0,31}$/.test(candidate) ? candidate : fallback;
  }

  function errorCategory(error) {
    const status = Number(error && error.status);
    if (status >= 500) return 'server';
    if (status >= 400) return 'request';
    if (error && error.name === 'TypeError') return 'network';
    return 'unknown';
  }

  function buildEvent(eventName, input = {}) {
    if (!EVENTS.has(eventName)) return null;
    const params = {
      language:language(input.language),
      district_code:district(input.districtCode),
      property_type:propertyType(input.propertyType)
    };
    if (eventName.startsWith('explorer_search_')) {
      params.budget_filter_count = budgetFilterCount(input);
    }
    if (eventName === 'explorer_search_result') {
      params.result_count_bucket = countBucket(input.resultCount);
      params.contract_count_bucket = countBucket(input.contractCount);
    }
    if (eventName === 'explorer_building_detail_view') {
      params.contract_count_bucket = countBucket(input.contractCount);
    }
    if (input.resultState && RESULT_STATES.has(String(input.resultState))) {
      params.result_state = String(input.resultState);
    }
    if (input.errorCategory) params.error_category = safeToken(input.errorCategory);
    return Object.freeze(params);
  }

  function send(root, eventName, params) {
    try {
      if (!root || typeof root.gtag !== 'function') return false;
      root.gtag('event', eventName, params);
      return true;
    } catch (_) {
      return false;
    }
  }

  function createTracker(root, { maxPending = 6 } = {}) {
    let pending = [];

    function flush() {
      if (!root || typeof root.gtag !== 'function') return false;
      const queued = pending;
      pending = [];
      queued.forEach(item => send(root, item.eventName, item.params));
      return queued.length > 0;
    }

    function emit(eventName, input) {
      const params = buildEvent(eventName, input);
      if (!params) return false;
      if (send(root, eventName, params)) return true;
      pending.push({ eventName, params });
      pending = pending.slice(-Math.max(1, Number(maxPending) || 6));
      return false;
    }

    if (root && typeof root.addEventListener === 'function') {
      root.addEventListener('khg:analytics-ready', flush);
    }
    return Object.freeze({ emit, flush, pendingCount:() => pending.length });
  }

  return Object.freeze({ EVENTS, countBucket, errorCategory, buildEvent, createTracker });
});
