(function(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KHGPrivacy = api;

  if (root && root.document) {
    const start = () => api.createController({ root, doc:root.document }).init();
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once:true });
    else start();
  }
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';

  const MEASUREMENT_ID = 'G-6SXH5BREDP';

  function announceAnalyticsReady(root) {
    try {
      if (!root) return;
      root.KHGAnalyticsReady = true;
      if (typeof root.CustomEvent !== 'function' || typeof root.dispatchEvent !== 'function') return;
      root.dispatchEvent(new root.CustomEvent('khg:analytics-ready', { detail:{ ready:true } }));
    } catch (_) {}
  }

  function analyticsPageLocation(root) {
    try {
      const href = root && root.location && root.location.href;
      if (!href) return null;
      const Url = root.URL || URL;
      const page = new Url(href);
      ['deposit', 'rent', 'area'].forEach(name => page.searchParams.delete(name));
      return page.toString();
    } catch (_) {
      return null;
    }
  }

  function loadAnalytics({ root = globalThis, doc = root && root.document, measurementId = MEASUREMENT_ID } = {}) {
    if (!root || !doc || !doc.head || typeof doc.createElement !== 'function') return false;
    if (typeof doc.querySelector === 'function' && doc.querySelector('[data-khg-analytics]')) return true;

    root.dataLayer = root.dataLayer || [];
    root.gtag = root.gtag || function gtag(){ root.dataLayer.push(arguments); };
    root.gtag('js', new Date());
    root.gtag('config', measurementId, { anonymize_ip:true, send_page_view:false });
    const pageLocation = analyticsPageLocation(root);
    root.gtag('event', 'page_view', pageLocation ? { page_location:pageLocation } : {});

    const script = doc.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.dataset.khgAnalytics = 'true';
    doc.head.appendChild(script);
    return true;
  }

  function createController({ root = globalThis, doc = root && root.document } = {}) {
    function init() {
      const loaded = loadAnalytics({ root, doc });
      if (loaded) announceAnalyticsReady(root);
      return loaded;
    }

    return { init };
  }

  return { MEASUREMENT_ID, announceAnalyticsReady, analyticsPageLocation, loadAnalytics, createController };
});
