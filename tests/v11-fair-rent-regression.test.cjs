const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const core = require('../lib/rent-check-core.cjs');
const enUI = require('../rent-check-ui-utils.js');
const zhUI = require('../zh/rent-check-ui-utils.js');

test('existing comparable tier configuration is unchanged', () => {
  assert.deepEqual(core.TIERS, [
    { tier:1, months:3, areaPct:0.15, depositPct:0.25, minCount:5 },
    { tier:2, months:6, areaPct:0.20, depositPct:0.35, minCount:5 },
    { tier:3, months:12, areaPct:0.25, depositPct:0.50, minCount:3 }
  ]);
});

test('result labels describe the typical range and error copy remains available in both locales', () => {
  assert.equal(enUI.ratingLabel('above'), 'Above market');
  assert.equal(enUI.ratingLabel('fair'), 'Typical range');
  assert.equal(enUI.ratingLabel('below'), 'Below market');
  assert.equal(zhUI.ratingLabel('above'), '高于近期成交水平');
  assert.equal(zhUI.ratingLabel('fair'), '典型区间');
  assert.equal(zhUI.ratingLabel('below'), '低于近期成交水平');
  assert.match(enUI.humanizeRentCheckError('Public API returned HTTP 500.'), /temporarily unavailable/i);
  assert.match(zhUI.humanizeRentCheckError('Public API returned HTTP 500.'), /暂时无法使用/);
});

test('studio mapping remains detached and ordinary property types remain unchanged', () => {
  assert.deepEqual(enUI.mapRentCheckType('studio'), { officialType:'detached', isStudioMapped:true });
  assert.deepEqual(enUI.mapRentCheckType('villa'), { officialType:'villa', isStudioMapped:false });
  assert.deepEqual(zhUI.mapRentCheckType('studio'), { officialType:'detached', isStudioMapped:true });
});

test('Rent Check browser apps preserve API, FX, prefill, and evidence flows', () => {
  for (const path of ['tools/seoul-rent-check/app.js','zh/tools/seoul-rent-check/app.js']) {
    const source = fs.readFileSync(path,'utf8');
    assert.match(source, /\/api\/fx/);
    assert.match(source, /\/api\/rent-check\?/);
    assert.match(source, /KHGRentCheckPrefill\.readRentCheckPrefill/);
    assert.match(source, /renderRows\(data\.comparables\|\|\[\]\)/);
    assert.match(source, /mapRentCheckType\(type\.value\)/);
  }
});

test('new Fair Rent Intelligence does not add a provider, endpoint, affiliate, or safety score', () => {
  const files = [
    'lib/rent-check-core.cjs',
    'rent-check-ui-utils.js',
    'zh/rent-check-ui-utils.js',
    'tools/seoul-rent-check/app.js',
    'zh/tools/seoul-rent-check/app.js'
  ];
  const combined = files.map(path => fs.readFileSync(path,'utf8')).join('\n');
  assert.doesNotMatch(combined, /Wise|affiliate|referral/i);
  assert.doesNotMatch(combined, /Safety Score|Rent Safety/i);
  assert.doesNotMatch(combined, /fetch\(['\"]https?:\/\//i);
});
