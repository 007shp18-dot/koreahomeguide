const test = require('node:test');
const assert = require('node:assert/strict');

test('analytics remains disabled without affirmative consent', () => {
  const privacy = require('../privacy-consent.js');
  assert.equal(privacy.shouldLoadAnalytics(null), false);
  assert.equal(privacy.shouldLoadAnalytics('rejected'), false);
  assert.equal(privacy.shouldLoadAnalytics('accepted'), true);
  assert.equal(privacy.normalizeConsent('anything-else'), null);
});

test('accepted consent loads one GA script and is idempotent', () => {
  const privacy = require('../privacy-consent.js');
  const appended = [];
  const root = {};
  const doc = {
    querySelector:selector => selector === '[data-khg-analytics]' ? appended[0] || null : null,
    createElement:tag => ({ tagName:tag.toUpperCase(), dataset:{} }),
    head:{ appendChild:node => appended.push(node) }
  };

  const first = privacy.loadAnalytics({ root, doc });
  const second = privacy.loadAnalytics({ root, doc });

  assert.equal(first, true);
  assert.equal(second, true);
  assert.equal(appended.length, 1);
  assert.match(appended[0].src, /googletagmanager\.com\/gtag\/js\?id=G-6SXH5BREDP/);
  assert.equal(typeof root.gtag, 'function');
});

test('storage failure defaults to no analytics', () => {
  const privacy = require('../privacy-consent.js');
  const storage = { getItem(){ throw new Error('blocked'); }, setItem(){ throw new Error('blocked'); } };
  const controller = privacy.createController({ root:{}, doc:null, storage });
  assert.equal(controller.getConsent(), null);
  assert.equal(controller.setConsent('accepted'), false);
});

test('localized banner copy always offers accept and reject choices', () => {
  const privacy = require('../privacy-consent.js');
  assert.deepEqual(privacy.consentCopy('en'), {
    message:'We use optional analytics to understand which rental tools are useful. You can change this choice later.',
    accept:'Accept analytics', reject:'Reject', settings:'Privacy choices'
  });
  assert.equal(privacy.consentCopy('zh-CN').accept, '同意分析 Cookie');
  assert.equal(privacy.consentCopy('zh-CN').reject, '拒绝');
});

test('controller announces normalized consent after init and successful changes', () => {
  const privacy = require('../privacy-consent.js');
  const announcements = [];
  let stored = 'accepted';
  const root = {
    CustomEvent:function(type, init) { return { type, detail:init.detail }; },
    dispatchEvent(event) { announcements.push(event); }
  };
  const doc = {
    querySelector() { return null; },
    createElement(tag) { return { tagName:tag.toUpperCase(), dataset:{} }; },
    head:{ appendChild() {} },
    body:{ classList:{ remove() {} } }
  };
  const storage = { getItem(){ return stored; }, setItem(_, value){ stored = value; } };
  const controller = privacy.createController({ root, doc, storage });

  controller.init();
  controller.setConsent('rejected');
  controller.setConsent('accepted');

  assert.deepEqual(announcements.map(event => [event.type, event.detail.consent]), [
    ['khg:privacy-consent', 'accepted'],
    ['khg:privacy-consent', 'rejected'],
    ['khg:privacy-consent', 'accepted']
  ]);
});
