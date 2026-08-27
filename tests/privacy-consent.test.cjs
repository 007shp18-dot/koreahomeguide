const test = require('node:test');
const assert = require('node:assert/strict');

function fakeDocument(language = 'en') {
  const scripts = [];
  const bodyNodes = [];
  const listeners = new Map();
  function node(tag) {
    const controls = {};
    return {
      tagName:tag.toUpperCase(), dataset:{}, hidden:false, textContent:'', innerHTML:'',
      setAttribute() {},
      addEventListener(type, handler) { listeners.set(`${tag}:${type}`, handler); },
      querySelector(selector) {
        if (!controls[selector]) controls[selector] = { addEventListener(type, handler) { listeners.set(`${selector}:${type}`, handler); } };
        return controls[selector];
      }
    };
  }
  return {
    documentElement:{ lang:language },
    createElement:node,
    querySelector(selector) {
      if (selector === '[data-khg-analytics]') return scripts.find(item => item.dataset.khgAnalytics) || null;
      if (selector === '[data-khg-vercel-analytics]') return scripts.find(item => item.dataset.khgVercelAnalytics) || null;
      return null;
    },
    head:{ appendChild(item) { scripts.push(item); } },
    body:{ appendChild(item) { bodyNodes.push(item); } },
    scripts, bodyNodes, listeners
  };
}

function memoryStorage(initial = null) {
  const values = new Map();
  if (initial != null) values.set('khg_privacy_choice_v1', initial);
  return { getItem:key => values.get(key) || null, setItem:(key, value) => values.set(key, value), values };
}

test('a first visit defaults analytics to denied and does not load Google Analytics', () => {
  const privacy = require('../privacy-consent.js');
  const doc = fakeDocument();
  const root = {};
  const controller = privacy.createController({ root, doc, storage:memoryStorage() });

  assert.equal(controller.init(), null);
  assert.equal(doc.scripts.filter(item => item.dataset.khgAnalytics).length, 0);
  assert.equal(doc.scripts.filter(item => item.dataset.khgVercelAnalytics).length, 1);
  assert.equal(doc.scripts.find(item => item.dataset.khgVercelAnalytics).src, '/_vercel/insights/script.js');
  assert.equal(root.gtag, undefined);
  assert.equal(root.KHGAnalyticsConsent, null);
  assert.equal(doc.bodyNodes.some(item => item.dataset.khgConsentBanner), true);
  assert.match(JSON.stringify(root.dataLayer), /analytics_storage/);
  assert.match(JSON.stringify(root.dataLayer), /denied/);
});

test('essential-only choice persists without loading analytics', () => {
  const privacy = require('../privacy-consent.js');
  const doc = fakeDocument('zh-CN');
  const storage = memoryStorage();
  const controller = privacy.createController({ root:{}, doc, storage });

  controller.init();
  assert.equal(controller.applyChoice(privacy.ESSENTIAL), privacy.ESSENTIAL);
  assert.equal(storage.values.get(privacy.STORAGE_KEY), privacy.ESSENTIAL);
  assert.equal(doc.scripts.filter(item => item.dataset.khgAnalytics).length, 0);
  assert.equal(doc.scripts.filter(item => item.dataset.khgVercelAnalytics).length, 1);
});

test('stored analytics choice loads GA once and announces readiness', () => {
  const privacy = require('../privacy-consent.js');
  const doc = fakeDocument();
  const announcements = [];
  const root = {
    location:{ href:'https://koreahomeguide.com/tools/seoul-rent-check/?deposit=10000000&rent=1200000&area=25&utm_source=reddit' },
    CustomEvent:function(type, init) { return { type, detail:init.detail }; },
    dispatchEvent:event => announcements.push(event)
  };
  const controller = privacy.createController({ root, doc, storage:memoryStorage(privacy.ANALYTICS) });

  assert.equal(controller.init(), privacy.ANALYTICS);
  assert.equal(doc.scripts.filter(item => item.dataset.khgAnalytics).length, 1);
  assert.match(doc.scripts.find(item => item.dataset.khgAnalytics).src, /googletagmanager\.com\/gtag\/js\?id=G-6SXH5BREDP/);
  assert.equal(privacy.loadAnalytics({ root, doc }), true);
  assert.equal(doc.scripts.filter(item => item.dataset.khgAnalytics).length, 1);
  assert.equal(root.KHGAnalyticsReady, true);
  assert.deepEqual(announcements.map(item => item.type), ['khg:analytics-ready']);

  const commands = root.dataLayer.map(args => Array.from(args));
  const pageview = commands.find(args => args[0] === 'event' && args[1] === 'page_view');
  assert.equal(pageview[2].page_location, 'https://koreahomeguide.com/tools/seoul-rent-check/?utm_source=reddit');
  assert.doesNotMatch(JSON.stringify(commands), /10000000|1200000|[?&]area=25/);
});

test('changing back to essential-only disables future app tracking without removing core storage', () => {
  const privacy = require('../privacy-consent.js');
  const doc = fakeDocument();
  const root = {};
  const controller = privacy.createController({ root, doc, storage:memoryStorage(privacy.ANALYTICS) });
  controller.init();
  assert.equal(typeof root.gtag, 'function');
  controller.applyChoice(privacy.ESSENTIAL);
  assert.equal(root.gtag, undefined);
  assert.equal(root.KHGAnalyticsReady, false);
  assert.equal(controller.getChoice(), privacy.ESSENTIAL);
  assert.equal(doc.scripts.filter(item => item.dataset.khgAnalytics).length, 1);
});

test('localized consent copy links to matching privacy and terms pages', () => {
  const privacy = require('../privacy-consent.js');
  assert.equal(privacy.localizedCopy('en').termsHref, '/terms/');
  assert.equal(privacy.localizedCopy('zh-CN').privacyHref, '/zh/privacy/');
  assert.match(privacy.localizedCopy('zh-CN').body, /Google Analytics/);
});
