const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('lead module listens for rent-check result and posts only to /api/lead', () => {
  const source = fs.readFileSync('lead-capture.js','utf8');
  assert.match(source, /khg:rent-check-result/);
  assert.match(source, /fetch\(['"]\/api\/lead/);
  assert.doesNotMatch(source, /script\.google\.com/);
  assert.doesNotMatch(source, /LEAD_SHEET_SHARED_SECRET/);
});

test('lead module supports both current locales but deliberately no Japanese copy', () => {
  const source = fs.readFileSync('lead-capture.js','utf8');
  assert.match(source, /zh-CN/);
  assert.match(source, /en/);
  assert.doesNotMatch(source, /language:\s*['"]ja['"]/);
});

test('GA tracking source never adds email or helpMessage to analytics params', () => {
  const source = fs.readFileSync('lead-capture.js','utf8');
  assert.doesNotMatch(source, /gtag\([^\n]*(email|helpMessage)/);
  assert.doesNotMatch(source, /track\([^\n]*(email|helpMessage)/);
});

test('lead module exposes the three lead-funnel event names', () => {
  const source = fs.readFileSync('lead-capture.js','utf8');
  for (const event of ['lead_form_view','lead_submit','help_request']) assert.match(source, new RegExp(event));
});

test('lead payload preserves validated origin campaign values without analytics PII', () => {
  const modulePath = require.resolve('../lead-capture.js');
  const previous = {
    document: global.document,
    location: global.location,
    prefill: global.KHGRentCheckPrefill
  };

  try {
    global.document = { referrer: 'https://www.reddit.com/r/Living_in_Korea/' };
    global.location = { search: '?origin_source=reddit&origin_medium=community&origin_campaign=seoul_rent' };
    global.KHGRentCheckPrefill = {
      readRentCheckPrefill() {
        return {
          originSource: 'reddit',
          originMedium: 'community',
          originCampaign: 'seoul_rent'
        };
      }
    };
    delete require.cache[modulePath];
    const { buildPayload } = require(modulePath);
    const payload = buildPayload('lead_capture', 'renter@example.com', {
      language: 'en',
      sourcePage: '/rent/mapo-gu/villa/'
    }, '');

    assert.equal(payload.utmSource, 'reddit');
    assert.equal(payload.utmMedium, 'community');
    assert.equal(payload.utmCampaign, 'seoul_rent');
    assert.equal(payload.referrerHost, 'www.reddit.com');
  } finally {
    delete require.cache[modulePath];
    if (previous.document === undefined) delete global.document;
    else global.document = previous.document;
    if (previous.location === undefined) delete global.location;
    else global.location = previous.location;
    if (previous.prefill === undefined) delete global.KHGRentCheckPrefill;
    else global.KHGRentCheckPrefill = previous.prefill;
  }
});
