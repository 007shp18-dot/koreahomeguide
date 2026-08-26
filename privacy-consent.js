(function(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KHGPrivacy = api;

  if (root && root.document) {
    const start = () => api.createController({ root, doc:root.document, storage:root.localStorage }).init();
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once:true });
    else start();
  }
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';

  const STORAGE_KEY = 'khg_privacy_consent_v1';
  const MEASUREMENT_ID = 'G-6SXH5BREDP';

  function normalizeConsent(value) {
    return value === 'accepted' || value === 'rejected' ? value : null;
  }

  function shouldLoadAnalytics(value) {
    return normalizeConsent(value) === 'accepted';
  }

  function announceConsent(root, value) {
    const consent = normalizeConsent(value);
    try {
      if (!root) return;
      root.KHGPrivacyConsent = consent;
      if (typeof root.CustomEvent !== 'function' || typeof root.dispatchEvent !== 'function') return;
      root.dispatchEvent(new root.CustomEvent('khg:privacy-consent', { detail:{ consent } }));
    } catch (_) {}
  }

  function consentCopy(language) {
    const zh = String(language || '').toLowerCase().startsWith('zh');
    return zh ? {
      message:'我们使用可选的分析 Cookie 来了解哪些租房工具更有帮助。之后可以随时修改选择。',
      accept:'同意分析 Cookie',
      reject:'拒绝',
      settings:'隐私设置'
    } : {
      message:'We use optional analytics to understand which rental tools are useful. You can change this choice later.',
      accept:'Accept analytics',
      reject:'Reject',
      settings:'Privacy choices'
    };
  }

  function loadAnalytics({ root = globalThis, doc = root && root.document, measurementId = MEASUREMENT_ID } = {}) {
    if (!root || !doc || !doc.head || typeof doc.createElement !== 'function') return false;
    if (typeof doc.querySelector === 'function' && doc.querySelector('[data-khg-analytics]')) return true;

    root.dataLayer = root.dataLayer || [];
    root.gtag = root.gtag || function gtag(){ root.dataLayer.push(arguments); };
    root.gtag('js', new Date());
    root.gtag('config', measurementId, { anonymize_ip:true });

    const script = doc.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.dataset.khgAnalytics = 'true';
    doc.head.appendChild(script);
    return true;
  }

  function createController({ root = globalThis, doc = root && root.document, storage = root && root.localStorage } = {}) {
    function getConsent() {
      try { return normalizeConsent(storage && storage.getItem(STORAGE_KEY)); }
      catch (_) { return null; }
    }

    function setConsent(value) {
      const normalized = normalizeConsent(value);
      if (!normalized) return false;
      try {
        if (!storage) return false;
        storage.setItem(STORAGE_KEY, normalized);
      } catch (_) {
        return false;
      }
      if (normalized === 'accepted') loadAnalytics({ root, doc });
      else if (root && typeof root.gtag === 'function') {
        root.gtag('consent', 'update', { analytics_storage:'denied' });
      }
      announceConsent(root, normalized);
      return true;
    }

    function removeBanner() {
      const banner = doc && typeof doc.querySelector === 'function' && doc.querySelector('[data-khg-consent-banner]');
      if (banner && typeof banner.remove === 'function') banner.remove();
      if (doc && doc.body && doc.body.classList) doc.body.classList.remove('khg-consent-open');
    }

    function showBanner() {
      if (!doc || !doc.body || typeof doc.createElement !== 'function') return false;
      if (typeof doc.querySelector === 'function' && doc.querySelector('[data-khg-consent-banner]')) return true;
      const copy = consentCopy(doc.documentElement && doc.documentElement.lang);
      const banner = doc.createElement('section');
      banner.className = 'khg-consent-banner';
      banner.dataset.khgConsentBanner = 'true';
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-label', copy.settings);
      banner.innerHTML = `<p>${copy.message}</p><div><button type="button" data-khg-consent="accepted">${copy.accept}</button><button type="button" class="secondary" data-khg-consent="rejected">${copy.reject}</button></div>`;
      banner.querySelectorAll('[data-khg-consent]').forEach(button => button.addEventListener('click', () => {
        if (setConsent(button.dataset.khgConsent)) removeBanner();
      }));
      doc.body.appendChild(banner);
      if (doc.body.classList) doc.body.classList.add('khg-consent-open');
      return true;
    }

    function addSettingsControl() {
      if (!doc || typeof doc.querySelector !== 'function' || typeof doc.createElement !== 'function') return;
      const footer = doc.querySelector('footer');
      if (!footer || doc.querySelector('[data-khg-privacy-settings]')) return;
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'khg-privacy-settings';
      button.dataset.khgPrivacySettings = 'true';
      button.textContent = consentCopy(doc.documentElement && doc.documentElement.lang).settings;
      button.addEventListener('click', showBanner);
      footer.appendChild(button);
    }

    function init() {
      addSettingsControl();
      const consent = getConsent();
      if (shouldLoadAnalytics(consent)) loadAnalytics({ root, doc });
      else if (consent == null) showBanner();
      announceConsent(root, consent);
      return consent;
    }

    return { getConsent, setConsent, showBanner, init };
  }

  return { STORAGE_KEY, MEASUREMENT_ID, normalizeConsent, shouldLoadAnalytics, consentCopy, loadAnalytics, createController };
});
