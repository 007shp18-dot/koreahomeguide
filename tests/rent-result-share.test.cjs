const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('shared result link prefills only non-sensitive district and property type', () => {
  const share = require('../lead-capture.js');
  const url = new URL(share.buildShareUrl({
    language:'en', districtCode:'11680', propertyType:'apartment',
    depositWon:10000000, monthlyRentWon:1200000, areaSqm:25
  }));

  assert.equal(url.pathname, '/tools/seoul-rent-check/');
  assert.equal(url.searchParams.get('lawdCd'), '11680');
  assert.equal(url.searchParams.get('type'), 'apartment');
  assert.equal(url.searchParams.get('utm_source'), 'result_share');
  for (const sensitive of ['deposit','rent','area','depositWon','monthlyRentWon','areaSqm']) {
    assert.equal(url.searchParams.has(sensitive), false);
  }
});

test('share summary communicates evidence without exposing the exact quote', () => {
  const share = require('../lead-capture.js');
  const context = {
    language:'en', districtCode:'11680', propertyType:'apartment', rating:'fair',
    comparableCount:13, depositWon:12345678, monthlyRentWon:987654, areaSqm:25
  };
  const payload = share.buildSharePayload(context);

  assert.match(payload.text, /Gangnam-gu apartment/i);
  assert.match(payload.text, /13 recent official signed contracts/i);
  assert.doesNotMatch(payload.text, /12345678|987654|25\s?(?:m|㎡)/i);
  assert.doesNotMatch(payload.url, /12345678|987654/);
});

test('share summary stays bound to the completed result context', () => {
  const share = require('../lead-capture.js');
  const payload = share.buildSharePayload({
    language:'en', districtCode:'11680', propertyType:'detached', rating:'fair', comparableCount:8
  });

  assert.match(payload.text, /Gangnam-gu detached & multi-unit house/i);
  assert.equal(new URL(payload.url).searchParams.get('type'), 'detached');
});

test('Chinese share summary uses localized labels without Korean parentheticals', () => {
  const share = require('../lead-capture.js');
  const payload = share.buildSharePayload({
    language:'zh-CN', districtCode:'11680', propertyType:'apartment', rating:'fair', comparableCount:13
  });

  assert.match(payload.text, /江南区公寓/);
  assert.doesNotMatch(payload.text, /[（）()]|강남구|아파트/);
});

test('share action uses Web Share and falls back to clipboard copy', async () => {
  const share = require('../lead-capture.js');
  const payload = { title:'KoreaHomeGuide Rent Check', text:'Fair result', url:'https://example.com/' };
  let shared = null;
  assert.equal(await share.deliverShare(payload, {
    share:async value => { shared = value; }
  }), 'native');
  assert.deepEqual(shared, payload);

  let copied = '';
  assert.equal(await share.deliverShare(payload, {
    clipboard:{ writeText:async value => { copied = value; } }
  }), 'clipboard');
  assert.equal(copied, 'Fair result\nhttps://example.com/');
});

test('the shared module exposes a localized result share action on all Rent Check surfaces', () => {
  const source = fs.readFileSync('lead-capture.js', 'utf8');
  assert.match(source, /data-result-share/);
  assert.match(source, /Share this result/);
  assert.match(source, /分享结果/);
  const surfaces = [
    ['index.html', 'en'],
    ['tools/seoul-rent-check/index.html', 'en'],
    ['zh/index.html', 'zh-CN'],
    ['zh/tools/seoul-rent-check/index.html', 'zh-CN']
  ];
  for (const [file, language] of surfaces) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /src="\/lead-capture\.js"/, file);
    assert.match(html, new RegExp(`<html lang="${language}"`), file);
  }
});

test('result share analytics excludes exact quote and personal data fields', () => {
  const source = fs.readFileSync('lead-capture.js', 'utf8');
  assert.match(source, /rent_check_result_share/);
  const analyticsBlock = source.match(/function shareAnalyticsParams[\s\S]*?\n  }/);
  assert.ok(analyticsBlock);
  for (const forbidden of ['depositWon','monthlyRentWon','areaSqm','email','helpMessage']) {
    assert.doesNotMatch(analyticsBlock[0], new RegExp(forbidden));
  }
});

test('acquisition operations include result sharing in the measured funnel', () => {
  for (const file of [
    'docs/operations/2026-08-26-acquisition-measurement.md',
    'docs/operations/2026-08-26-14-day-business-validation-sprint.md'
  ]) {
    assert.match(fs.readFileSync(file, 'utf8'), /rent_check_result_share/, file);
  }
});
