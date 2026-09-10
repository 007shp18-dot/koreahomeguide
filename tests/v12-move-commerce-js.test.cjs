const test = require('node:test');
const assert = require('node:assert/strict');

const mod = require('../move-commerce.js');

test('buildServiceEvent creates exact GA4 payload', () => {
  assert.deepEqual(
    mod.buildServiceEvent({ city: 'seoul', language: 'en', service: 'internet' }),
    {
      eventName: 'move_service_interest',
      params: {
        city: 'seoul',
        service: 'internet',
        language: 'en',
        source: 'homepage_services'
      }
    }
  );
});

test('buildJourneyEvent creates exact GA4 payload', () => {
  assert.deepEqual(
    mod.buildJourneyEvent({ city: 'seoul', language: 'zh', stage: 'prepare' }),
    {
      eventName: 'move_journey_click',
      params: {
        city: 'seoul',
        stage: 'prepare',
        language: 'zh'
      }
    }
  );
});

test('safeTrack never throws when analytics is unavailable', () => {
  assert.doesNotThrow(() => mod.safeTrack(null, 'event', { a: 1 }));
  assert.doesNotThrow(() => mod.safeTrack(() => { throw new Error('down'); }, 'event', { a: 1 }));
});

test('service interest is acknowledged and deduplicated', () => {
  const calls = [];
  const seen = new Set();
  const attrs = {
    'data-move-service': 'moving',
    'data-label-done': 'Interest noted'
  };
  const button = {
    textContent: "I'm interested",
    disabled: false,
    getAttribute(name) { return attrs[name] || null; },
    setAttribute(name, value) { attrs[name] = value; }
  };

  mod.markServiceInterest(
    button,
    seen,
    payload => calls.push(payload),
    { city: 'seoul', language: 'en' }
  );
  mod.markServiceInterest(
    button,
    seen,
    payload => calls.push(payload),
    { city: 'seoul', language: 'en' }
  );

  assert.equal(button.textContent, 'Interest noted');
  assert.equal(button.disabled, true);
  assert.equal(attrs['aria-pressed'], 'true');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].eventName, 'move_service_interest');
  assert.equal(calls[0].params.service, 'moving');
});

test('invalid service and stage values are rejected from analytics', () => {
  assert.equal(mod.buildServiceEvent({ city: 'seoul', language: 'en', service: 'unknown' }), null);
  assert.equal(mod.buildJourneyEvent({ city: 'seoul', language: 'en', stage: 'unknown' }), null);
});

test('sponsor inventory is approved, post-result only, non-broker and capped at three', () => {
  const inventory = [
    { id:'a', status:'approved', category:'internet', name:'Fiber' },
    { id:'b', status:'approved', category:'moving', name:'Move' },
    { id:'c', status:'approved', category:'cleaning', name:'Clean' },
    { id:'d', status:'approved', category:'insurance', name:'Cover' },
    { id:'e', status:'approved', category:'brokerage', name:'Broker' },
    { id:'f', status:'draft', category:'internet', name:'Draft' }
  ];
  assert.deepEqual(mod.approvedSponsorInventory(inventory, 'post-result').map(item => item.id), ['a','b','c']);
  assert.deepEqual(mod.approvedSponsorInventory(inventory, 'homepage'), []);
  assert.deepEqual(mod.approvedSponsorInventory([], 'post-result'), []);
});

test('init binds service and journey controls without depending on a backend', () => {
  function element(attrs) {
    const listeners = {};
    return {
      textContent: 'click',
      disabled: false,
      getAttribute(name) { return attrs[name] || null; },
      setAttribute(name, value) { attrs[name] = value; },
      addEventListener(type, fn) { listeners[type] = fn; },
      fire(type) { listeners[type](); }
    };
  }

  const service = element({
    'data-move-service': 'internet',
    'data-label-done': 'Interest noted'
  });
  const journey = element({ 'data-move-stage': 'settle' });
  const bodyAttrs = {
    'data-commerce-city': 'seoul',
    'data-commerce-language': 'en'
  };
  const doc = {
    body: { getAttribute(name) { return bodyAttrs[name] || null; } },
    querySelectorAll(selector) {
      if (selector === '[data-move-service]') return [service];
      if (selector === '[data-move-stage]') return [journey];
      return [];
    }
  };
  const calls = [];
  mod.init(doc, (...args) => calls.push(args));
  service.fire('click');
  journey.fire('click');

  assert.equal(calls.length, 2);
  assert.equal(calls[0][0], 'event');
  assert.equal(calls[0][1], 'move_service_interest');
  assert.equal(calls[1][1], 'move_journey_click');
  assert.equal(calls[1][2].stage, 'settle');
});
