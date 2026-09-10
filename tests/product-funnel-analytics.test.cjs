const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const analytics = require('../product-analytics.js');

test('Explorer funnel events keep only bounded non-sensitive dimensions', () => {
  assert.deepEqual(analytics.buildEvent('explorer_search_result', {
    language:'zh-CN', districtCode:'11680', propertyType:'officetel',
    maxRent:1500000, maxDeposit:30000000, resultCount:18, contractCount:2177,
    buildingName:'Gangnam News Tel', lat:37.5, lng:127.0, note:'private',
    resultState:'success'
  }), {
    language:'zh-CN', district_code:'11680', property_type:'officetel',
    budget_filter_count:2, result_count_bucket:'10-24',
    contract_count_bucket:'1000+', result_state:'success'
  });
});

test('analytics rejects unsupported values and buckets counts consistently', () => {
  assert.equal(analytics.buildEvent('not_allowed', {}), null);
  assert.equal(analytics.countBucket(0), '0');
  assert.equal(analytics.countBucket(3), '1-9');
  assert.equal(analytics.countBucket(12), '10-24');
  assert.equal(analytics.countBucket(80), '50-199');
  assert.equal(analytics.countBucket(400), '200-999');
  assert.equal(analytics.countBucket(2177), '1000+');
  assert.deepEqual(analytics.buildEvent('explorer_street_view_result', {
    language:'ko', districtCode:'99999', propertyType:'castle', resultState:'ready',
    errorCategory:'sdk', buildingKey:'secret'
  }), {
    language:'en', district_code:'unknown', property_type:'unknown',
    result_state:'ready', error_category:'sdk'
  });
});

test('deferred tracker sends sanitized events after analytics consent becomes ready', () => {
  const listeners = new Map();
  const calls = [];
  const root = {
    addEventListener(type, listener) { listeners.set(type, listener); }
  };
  const tracker = analytics.createTracker(root);
  assert.equal(tracker.emit('explorer_search_start', {
    language:'en', districtCode:'11440', propertyType:'villa', maxRent:900000,
    exactRent:812345, note:'do not send'
  }), false);
  assert.equal(tracker.pendingCount(), 1);
  root.gtag = (...args) => calls.push(args);
  listeners.get('khg:analytics-ready')();
  assert.deepEqual(calls, [[
    'event', 'explorer_search_start', {
      language:'en', district_code:'11440', property_type:'villa', budget_filter_count:1
    }
  ]]);
  assert.equal(tracker.pendingCount(), 0);
});

test('Explorer, building detail, and NAVER street view runtimes emit the funnel contract', () => {
  for (const file of ['explore/index.html','zh/explore/index.html','explore/building/index.html','zh/explore/building/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /\/product-analytics\.js/, file);
  }
  for (const file of ['explore/app.js','zh/explore/app.js']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /explorer_search_start/, file);
    assert.match(source, /explorer_search_result/, file);
    assert.match(source, /explorer_search_error/, file);
  }
  assert.match(fs.readFileSync('explore/building/app.js', 'utf8'), /explorer_building_detail_view/);
  assert.match(fs.readFileSync('explore/panorama.js', 'utf8'), /explorer_street_view_result/);
});

test('the GA4 handoff documents one actionable funnel and key-event setup', () => {
  const doc = fs.readFileSync('docs/operations/ga4-product-funnel.md', 'utf8');
  for (const event of [
    'rent_check_cta_click', 'rent_check_start', 'rent_check_result', 'quote_saved',
    'saved_quotes_opened', 'saved_quotes_compared', 'saved_quotes_return_visit',
    'explorer_search_start', 'explorer_search_result', 'explorer_building_detail_view',
    'explorer_street_view_result'
  ]) assert.match(doc, new RegExp(`\\b${event}\\b`), event);
  assert.match(doc, /Key events/i);
  assert.match(doc, /saved_count_bucket/);
  assert.match(doc, /Do not register/i);
});
