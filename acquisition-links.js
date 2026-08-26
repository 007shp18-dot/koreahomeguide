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

  function buildRentCheckCtaEvent({
    sourcePage = '',
    lawdCd = '',
    propertyType = '',
    ctaId = '',
    locale = ''
  } = {}) {
    const source = safeSourcePage(sourcePage, lawdCd, propertyType);
    if (!source) return null;
    return {
      source_page: source,
      cta_id: safeCtaId(ctaId),
      locale: safeLocale(locale),
      district_code: String(lawdCd),
      property_type: String(propertyType)
    };
  }

  function buildRentCheckUrl({
    basePath = '/tools/seoul-rent-check/',
    sourcePage = '',
    lawdCd = '',
    propertyType = '',
    search = ''
  } = {}) {
    const current = new URLSearchParams(String(search || ''));
    const next = new URLSearchParams();
    const source = safeSourcePage(sourcePage, lawdCd, propertyType);
    const entry = source ? findEntryContext(source) : null;
    if (entry && entry.kind === 'market') {
      next.set('lawdCd', entry.lawdCd);
      next.set('type', entry.propertyType);
    }
    if (source) next.set('from', source);

    for (const [input, output] of [
      ['utm_source', 'origin_source'],
      ['utm_medium', 'origin_medium'],
      ['utm_campaign', 'origin_campaign']
    ]) {
      const value = safeCampaign(current.get(input) || current.get(output));
      if (value) next.set(output, value);
    }

    const query = next.toString();
    return query ? `${basePath}?${query}` : basePath;
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
      search: location.search || ''
    };
    let changed = 0;

    doc.querySelectorAll('a[href^="/tools/seoul-rent-check/"]').forEach(anchor => {
      const current = String(anchor.getAttribute('href') || '').split('?', 1)[0];
      if (current !== '/tools/seoul-rent-check/') return;
      anchor.setAttribute('href', buildRentCheckUrl({ ...values, basePath: current }));
      const cta = buildRentCheckCtaEvent({
        ...values,
        ctaId: anchor.dataset && anchor.dataset.rentCheckCta || anchor.id,
        locale: doc.documentElement && doc.documentElement.lang
      });
      if (cta && typeof track === 'function' && typeof anchor.addEventListener === 'function') {
        anchor.addEventListener('click', () => {
          try { track('rent_check_cta_click', cta); } catch (_) {}
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
    wireRentCheckLinks
  };
});
