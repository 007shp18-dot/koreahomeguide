(function(root, factory) {
  'use strict';

  const acquisitionContext = typeof module === 'object' && module.exports
    ? require('./acquisition-context.js')
    : root && root.KHGAcquisitionContext;
  const api = factory(acquisitionContext);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KHGAcquisitionLinks = api;
  if (root && root.document) {
    const track = (eventName, params) => {
      try {
        if (typeof root.gtag === 'function') root.gtag('event', eventName, params);
      } catch (_) {
        // Optional analytics must never interrupt navigation.
      }
    };
    const start = () => api.wireRentCheckLinks({ doc: root.document, location: root.location, track });
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis, function(acquisitionContext) {
  'use strict';

  const findEntryContext = acquisitionContext && acquisitionContext.findEntryContext
    ? acquisitionContext.findEntryContext
    : () => null;
  const validatedEntrySource = acquisitionContext && acquisitionContext.validatedEntrySource
    ? acquisitionContext.validatedEntrySource
    : () => '';
  const DISTRICT_CODES = new Set(['11680','11440','11170','11200','11560','11620','11230','11410','11290','11215']);
  const PROPERTY_TYPES = new Set(['apartment','officetel','villa','detached','studio']);

  function safeCampaign(value) {
    return String(value || '')
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .trim()
      .slice(0, 120);
  }

  function safeSourcePage(value, lawdCd, propertyType) {
    return validatedEntrySource(value, lawdCd, propertyType);
  }

  function safeCtaId(value) {
    const candidate = String(value || '').trim();
    return /^[a-z0-9][a-z0-9_-]{0,63}$/i.test(candidate) ? candidate : 'rent_check_link';
  }

  function safeLocale(value) {
    return String(value || '').toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
  }

  function safeDistrictCode(value) {
    const candidate = String(value || '');
    return DISTRICT_CODES.has(candidate) ? candidate : '';
  }

  function safePropertyType(value) {
    const candidate = String(value || '');
    return PROPERTY_TYPES.has(candidate) ? candidate : '';
  }

  function safePageLocation(value) {
    try {
      const page = new URL(String(value || ''));
      if (!['http:', 'https:'].includes(page.protocol)) return '';
      return `${page.origin}${page.pathname}`;
    } catch (_) {
      return '';
    }
  }

  function buildRentCheckCtaEvent({
    sourcePage = '',
    lawdCd = '',
    propertyType = '',
    ctaId = '',
    locale = '',
    pageLocation = ''
  } = {}) {
    const source = safeSourcePage(sourcePage, lawdCd, propertyType);
    if (!source) return null;
    const event = {
      source_page: source,
      cta_id: safeCtaId(ctaId),
      locale: safeLocale(locale),
      district_code: String(lawdCd),
      property_type: String(propertyType)
    };
    const safeLocation = safePageLocation(pageLocation);
    if (safeLocation) event.page_location = safeLocation;
    return event;
  }

  function buildRentCheckUrl({
    basePath = '/tools/seoul-rent-check/',
    sourcePage = '',
    lawdCd = '',
    propertyType = '',
    search = '',
    linkSearch = ''
  } = {}) {
    const current = new URLSearchParams(String(search || ''));
    const linked = new URLSearchParams(String(linkSearch || ''));
    const next = new URLSearchParams();
    const effectiveLawdCd = safeDistrictCode(lawdCd) || safeDistrictCode(linked.get('lawdCd'));
    const effectivePropertyType = safePropertyType(propertyType) || safePropertyType(linked.get('type'));
    const source = safeSourcePage(sourcePage, effectiveLawdCd, effectivePropertyType);
    const entry = source ? findEntryContext(source) : null;
    if (entry && (entry.kind === 'market' || entry.kind === 'dong')) {
      next.set('lawdCd', entry.lawdCd);
      next.set('type', entry.propertyType);
    } else if (entry) {
      if (effectiveLawdCd) next.set('lawdCd', effectiveLawdCd);
      if (effectivePropertyType) next.set('type', effectivePropertyType);
      if (entry && entry.kind === 'guide' && entry.slug === 'seoul-officetel-rent') {
        next.set('type', 'officetel');
      }
    }
    if (source) next.set('from', source);

    for (const [input, output] of [
      ['utm_source', 'origin_source'],
      ['utm_medium', 'origin_medium'],
      ['utm_campaign', 'origin_campaign']
    ]) {
      const value = safeCampaign(current.get(input) || current.get(output) || linked.get(output));
      if (value) next.set(output, value);
    }

    const query = next.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  function updateRentCheckLinksForSelection({ doc, location, lawdCd = '', propertyType = '' } = {}) {
    if (!doc || !location || typeof doc.querySelectorAll !== 'function') return 0;
    let changed = 0;
    doc.querySelectorAll('[data-explorer-rent-check]').forEach(anchor => {
      let current;
      try {
        current = new URL(String(anchor.getAttribute('href') || ''), 'https://koreahomeguide.com');
      } catch (_) {
        return;
      }
      if (!['/tools/seoul-rent-check/', '/zh/tools/seoul-rent-check/'].includes(current.pathname)) return;
      anchor.setAttribute('href', buildRentCheckUrl({
        basePath: current.pathname,
        sourcePage: location.pathname,
        lawdCd,
        propertyType,
        search: location.search || '',
        linkSearch: current.search
      }));
      changed += 1;
    });
    return changed;
  }

  function wireRentCheckLinks({ doc, location, track } = {}) {
    if (!doc || !location || typeof doc.querySelectorAll !== 'function') return 0;

    const market = typeof doc.querySelector === 'function'
      ? doc.querySelector('#rentMarketPage')
      : null;
    const values = {
      sourcePage: location.pathname,
      lawdCd: market && market.dataset ? market.dataset.lawdCd : '',
      propertyType: market && market.dataset ? market.dataset.propertyType : '',
      search: location.search || '',
      pageLocation: location.href || ''
    };
    let changed = 0;

    doc.querySelectorAll('a[href^="/tools/seoul-rent-check/"],a[href^="/zh/tools/seoul-rent-check/"]').forEach(anchor => {
      let current;
      try {
        current = new URL(String(anchor.getAttribute('href') || ''), 'https://koreahomeguide.com');
      } catch (_) {
        return;
      }
      if (!['/tools/seoul-rent-check/', '/zh/tools/seoul-rent-check/'].includes(current.pathname)) return;
      const linked = new URLSearchParams(current.search);
      const effectiveValues = {
        ...values,
        lawdCd: values.lawdCd || safeDistrictCode(linked.get('lawdCd')),
        propertyType: values.propertyType || safePropertyType(linked.get('type'))
      };
      anchor.setAttribute('href', buildRentCheckUrl({
        ...effectiveValues,
        basePath: current.pathname,
        linkSearch: current.search
      }));
      const cta = buildRentCheckCtaEvent({
        ...effectiveValues,
        ctaId: anchor.dataset && anchor.dataset.rentCheckCta || anchor.id,
        locale: doc.documentElement && doc.documentElement.lang
      });
      if (cta && typeof track === 'function' && typeof anchor.addEventListener === 'function') {
        anchor.addEventListener('click', () => {
          try {
            const clicked = new URL(String(anchor.getAttribute('href') || ''), 'https://koreahomeguide.com');
            const clickedValues = {
              ...values,
              lawdCd: values.lawdCd || safeDistrictCode(clicked.searchParams.get('lawdCd')),
              propertyType: values.propertyType || safePropertyType(clicked.searchParams.get('type'))
            };
            const clickedCta = buildRentCheckCtaEvent({
              ...clickedValues,
              ctaId: anchor.dataset && anchor.dataset.rentCheckCta || anchor.id,
              locale: doc.documentElement && doc.documentElement.lang
            });
            if (clickedCta) track('rent_check_cta_click', clickedCta);
          } catch (_) {}
        });
      }
      changed += 1;
    });

    return changed;
  }

  return {
    safeCampaign,
    safeSourcePage,
    buildRentCheckCtaEvent,
    buildRentCheckUrl,
    updateRentCheckLinksForSelection,
    wireRentCheckLinks
  };
});
