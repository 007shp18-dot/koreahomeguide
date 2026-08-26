const test = require('node:test');
const assert = require('node:assert/strict');

function analyticsDocument(appended, created = []) {
  return {
    querySelector(selector) {
      if (selector === '[data-khg-analytics]') return appended[0] || null;
      if (selector === '[data-khg-consent-banner]' || selector === '[data-khg-privacy-settings]') return null;
      return null;
    },
    createElement(tag) {
      const node = { tagName:tag.toUpperCase(), dataset:{} };
      created.push(node);
      return node;
    },
    head:{ appendChild(node) { appended.push(node); } },
    body:{ appendChild(node) { created.push(node); }, classList:{ add() {}, remove() {} } },
    documentElement:{ lang:'en' }
  };
}

test('page initialization loads GA4 without waiting for a stored analytics choice', () => {
  const privacy = require('../privacy-consent.js');
  const appended = [];
  const created = [];
  const storage = {
    getItem() { throw new Error('analytics initialization must not read consent storage'); },
    setItem() { throw new Error('analytics initialization must not write consent storage'); }
  };
  const root = {};
  const controller = privacy.createController({ root, doc:analyticsDocument(appended, created), storage });

  controller.init();

  assert.equal(appended.length, 1);
  assert.match(appended[0].src, /googletagmanager\.com\/gtag\/js\?id=G-6SXH5BREDP/);
  assert.equal(typeof root.gtag, 'function');
  assert.equal(created.some(node => node.dataset && (node.dataset.khgConsentBanner || node.dataset.khgPrivacySettings)), false);
});

test('automatic analytics loading remains idempotent', () => {
  const privacy = require('../privacy-consent.js');
  const appended = [];
  const root = {};
  const doc = analyticsDocument(appended);

  assert.equal(privacy.loadAnalytics({ root, doc }), true);
  assert.equal(privacy.loadAnalytics({ root, doc }), true);
  assert.equal(appended.length, 1);
});

test('automatic pageview keeps campaign attribution but removes quote values from its URL', () => {
  const privacy = require('../privacy-consent.js');
  const root = {
    location:{ href:'https://koreahomeguide.com/tools/seoul-rent-check/?deposit=10000000&rent=1200000&area=25&utm_source=reddit&utm_medium=community' }
  };

  privacy.loadAnalytics({ root, doc:analyticsDocument([]) });

  const commands = root.dataLayer.map(args => Array.from(args));
  const config = commands.find(args => args[0] === 'config');
  const pageview = commands.find(args => args[0] === 'event' && args[1] === 'page_view');
  assert.equal(config[2].send_page_view, false);
  assert.equal(pageview[2].page_location, 'https://koreahomeguide.com/tools/seoul-rent-check/?utm_source=reddit&utm_medium=community');
  assert.doesNotMatch(JSON.stringify(commands), /10000000|1200000|[?&]area=25/);
});

test('controller announces analytics readiness after automatic initialization', () => {
  const privacy = require('../privacy-consent.js');
  const announcements = [];
  const root = {
    CustomEvent:function(type, init) { return { type, detail:init.detail }; },
    dispatchEvent(event) { announcements.push(event); }
  };
  const controller = privacy.createController({ root, doc:analyticsDocument([]), storage:null });

  controller.init();

  assert.deepEqual(announcements.map(event => event.type), ['khg:analytics-ready']);
  assert.equal(root.KHGAnalyticsReady, true);
});
