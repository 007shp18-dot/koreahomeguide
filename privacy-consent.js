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
  const STORAGE_KEY = 'khg_privacy_choice_v1';
  const ANALYTICS = 'analytics';
  const ESSENTIAL = 'essential';

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
      ['deposit', 'rent', 'area', 'maxRent', 'maxDeposit'].forEach(name => page.searchParams.delete(name));
      return page.toString();
    } catch (_) { return null; }
  }

  function consentCommand(root, state) {
    if (!root) return;
    root.dataLayer = root.dataLayer || [];
    const command = function(){ root.dataLayer.push(arguments); };
    command('consent', state === ANALYTICS ? 'update' : 'default', {
      analytics_storage:state === ANALYTICS ? 'granted' : 'denied',
      ad_storage:'denied',
      ad_user_data:'denied',
      ad_personalization:'denied',
      wait_for_update:500
    });
  }

  function loadAnalytics({ root = globalThis, doc = root && root.document, measurementId = MEASUREMENT_ID } = {}) {
    if (!root || !doc || !doc.head || typeof doc.createElement !== 'function') return false;
    const existing = typeof doc.querySelector === 'function' && doc.querySelector('[data-khg-analytics]');
    root.dataLayer = root.dataLayer || [];
    root.gtag = root.gtag || function gtag(){ root.dataLayer.push(arguments); };
    root.gtag('consent', 'update', {
      analytics_storage:'granted', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'
    });
    if (!existing) {
      root.gtag('js', new Date());
      root.gtag('config', measurementId, { anonymize_ip:true, send_page_view:false });
    }
    const pageLocation = analyticsPageLocation(root);
    root.gtag('event', 'page_view', pageLocation ? { page_location:pageLocation } : {});

    if (existing) return true;

    const script = doc.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.dataset.khgAnalytics = 'true';
    doc.head.appendChild(script);
    return true;
  }

  function readChoice(storage) {
    try {
      const value = storage && storage.getItem(STORAGE_KEY);
      return value === ANALYTICS || value === ESSENTIAL ? value : null;
    } catch (_) { return null; }
  }

  function writeChoice(storage, value) {
    try {
      if (storage && typeof storage.setItem === 'function') storage.setItem(STORAGE_KEY, value);
    } catch (_) {}
  }

  function localizedCopy(language) {
    const zh = language === 'zh-CN';
    return zh ? {
      title:'你的隐私选择',
      body:'我们仅在你同意后使用 Google Analytics。保存房源时，必要数据只存于当前浏览器。',
      allow:'允许分析', essential:'仅必要功能', settings:'隐私设置',
      privacy:'隐私说明', terms:'使用条款', privacyHref:'/zh/privacy/', termsHref:'/zh/terms/'
    } : {
      title:'Your privacy choices',
      body:'We use Google Analytics only if you allow it. Essential data for saved homes stays in this browser.',
      allow:'Allow analytics', essential:'Essential only', settings:'Privacy choices',
      privacy:'Privacy', terms:'Terms', privacyHref:'/privacy/', termsHref:'/terms/'
    };
  }

  function createController({ root = globalThis, doc = root && root.document, storage = root && root.localStorage } = {}) {
    let choice = null;
    let banner = null;

    function language() {
      return doc && doc.documentElement && doc.documentElement.lang === 'zh-CN' ? 'zh-CN' : 'en';
    }

    function hideBanner() { if (banner) banner.hidden = true; }

    function applyChoice(value) {
      choice = value === ANALYTICS ? ANALYTICS : ESSENTIAL;
      writeChoice(storage, choice);
      root.KHGAnalyticsConsent = choice;
      if (choice === ANALYTICS) {
        if (loadAnalytics({ root, doc })) announceAnalyticsReady(root);
      } else {
        consentCommand(root, ESSENTIAL);
        if (typeof root.gtag === 'function') root.gtag('consent', 'update', { analytics_storage:'denied' });
        root.gtag = undefined;
        root.KHGAnalyticsReady = false;
      }
      hideBanner();
      return choice;
    }

    function ensureSettings(copy) {
      if (!doc || !doc.body || typeof doc.createElement !== 'function') return null;
      const existing = typeof doc.querySelector === 'function' && doc.querySelector('[data-khg-privacy-settings]');
      if (existing) return existing;
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'khg-privacy-settings';
      button.dataset.khgPrivacySettings = 'true';
      button.textContent = copy.settings;
      button.addEventListener('click', () => { if (banner) banner.hidden = false; });
      const footer = typeof doc.querySelector === 'function' && doc.querySelector('footer');
      (footer || doc.body).appendChild(button);
      return button;
    }

    function ensureBanner(copy) {
      if (!doc || !doc.body || typeof doc.createElement !== 'function') return null;
      const existing = typeof doc.querySelector === 'function' && doc.querySelector('[data-khg-consent-banner]');
      if (existing) { banner = existing; return banner; }
      banner = doc.createElement('section');
      banner.className = 'khg-consent-banner';
      banner.dataset.khgConsentBanner = 'true';
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-label', copy.title);
      banner.innerHTML = `<div class="khg-consent-copy"><strong>${copy.title}</strong><p>${copy.body} <a href="${copy.privacyHref}">${copy.privacy}</a> · <a href="${copy.termsHref}">${copy.terms}</a></p></div><div class="khg-consent-actions"><button type="button" data-consent-reject>${copy.essential}</button><button type="button" data-consent-accept>${copy.allow}</button></div>`;
      banner.querySelector('[data-consent-reject]').addEventListener('click', () => applyChoice(ESSENTIAL));
      banner.querySelector('[data-consent-accept]').addEventListener('click', () => applyChoice(ANALYTICS));
      doc.body.appendChild(banner);
      return banner;
    }

    function init() {
      consentCommand(root, ESSENTIAL);
      const copy = localizedCopy(language());
      ensureBanner(copy);
      ensureSettings(copy);
      choice = readChoice(storage);
      root.KHGAnalyticsConsent = choice;
      if (choice === ANALYTICS) applyChoice(ANALYTICS);
      else if (choice === ESSENTIAL) hideBanner();
      else if (banner) banner.hidden = false;
      return choice;
    }

    return { init, applyChoice, getChoice:() => choice };
  }

  return {
    MEASUREMENT_ID, STORAGE_KEY, ANALYTICS, ESSENTIAL,
    announceAnalyticsReady, analyticsPageLocation, consentCommand,
    loadAnalytics, readChoice, writeChoice, localizedCopy, createController
  };
});
