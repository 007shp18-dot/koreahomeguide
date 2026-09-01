const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { readRentCheckPrefill } = require('../tools/seoul-rent-check/prefill-utils.js');

function runtimeNode() {
  return {
    hidden:false, open:false, textContent:'', innerHTML:'', dataset:{}, style:{ left:'' },
    classList:{ toggle() {}, remove() {} }, appendChild() {}, insertAdjacentElement() {},
    addEventListener() {}, setAttribute() {}, querySelectorAll() { return []; },
    querySelector() { return runtimeNode(); }
  };
}

function bootRentCheckWithExplorerPrefill(file) {
  const area = { value:'11680', options:[{ value:'11680' }, { value:'11590' }] };
  const type = { value:'apartment', options:[{ value:'apartment' }, { value:'officetel' }], addEventListener() {} };
  const result = runtimeNode();
  const elements = {
    '#currencySelect':null,
    '#rentCheckForm':{ addEventListener() {} },
    '#rentCheckArea':area,
    '#rentCheckType':type,
    '#rentCheckDeposit':{ dataset:{} },
    '#rentCheckRent':{ dataset:{} },
    '#rentCheckAreaSqm':{ value:'60' },
    '#rentCheckButton':{ disabled:false },
    '#rentCheckStatus':{ textContent:'', className:'', dataset:{} },
    '#rentCheckResult':result,
    '#rentCheckStudioNote':{ hidden:true }
  };
  const document = {
    documentElement:{ lang:file.startsWith('zh/') ? 'zh-CN' : 'en' },
    createElement:runtimeNode,
    querySelector(selector) { return Object.prototype.hasOwnProperty.call(elements, selector) ? elements[selector] : null; },
    querySelectorAll() { return []; }
  };
  const window = { KHGRentCheckPrefill:{ readRentCheckPrefill }, addEventListener() {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
    window,
    document,
    location:{ pathname:file.startsWith('zh/') ? '/zh/tools/seoul-rent-check/' : '/tools/seoul-rent-check/', search:'?lawdCd=11590&type=officetel&area=24.13' },
    KHGRentCheckPrefill:window.KHGRentCheckPrefill,
    KHGCurrency:{},
    KHGRentCheckUI:{},
    fetch:async () => ({ ok:true, json:async () => ({}) })
  }, { filename:file });
  return { area, type };
}

test('Rent Check prefill accepts contextual explorer values in KRW and rejects invalid numbers', () => {
  assert.deepEqual(
    readRentCheckPrefill('?lawdCd=11680&type=officetel&deposit=10000000&rent=850000&area=25.4'),
    { lawdCd:'11680', type:'officetel', depositWon:10000000, rentWon:850000, areaSqm:25.4 }
  );
  assert.deepEqual(readRentCheckPrefill('?lawdCd=xxx&type=house&deposit=-1&rent=nope&area=0'), {});
});

test('prefill accepts supported districts and validated acquisition context', () => {
  assert.deepEqual(
    readRentCheckPrefill('?lawdCd=11230&type=apartment&from=%2Frent%2Fdongdaemun-gu%2Fapartment%2F&origin_source=reddit&origin_medium=community&origin_campaign=seoul_rent'),
    {
      lawdCd: '11230',
      type: 'apartment',
      sourcePage: '/rent/dongdaemun-gu/apartment/',
      originSource: 'reddit',
      originMedium: 'community',
      originCampaign: 'seoul_rent'
    }
  );
  assert.deepEqual(
    readRentCheckPrefill('?lawdCd=99999&from=https://evil.example/&origin_source=x%0Ay'),
    { originSource: 'xy' }
  );
});

test('prefill drops fake sources and market sources with a mismatched tuple', () => {
  assert.deepEqual(
    readRentCheckPrefill('?lawdCd=11440&type=villa&from=%2Frent%2Fgangnam-gu%2Fapartment%2F'),
    { lawdCd: '11440', type: 'villa' }
  );
  assert.deepEqual(
    readRentCheckPrefill('?from=%2Fguides%2Fnot-real%2F'),
    {}
  );
});

test('Explorer Dongjak handoff sets the actual district select in English and Chinese Rent Check', () => {
  for (const file of ['tools/seoul-rent-check/app.js']) {
    const runtime = bootRentCheckWithExplorerPrefill(file);
    assert.equal(runtime.area.value, '11590', `${file}: lawdCd=11590 must replace the default district`);
    assert.equal(runtime.type.value, 'officetel', `${file}: Explorer property type must persist`);
  }
});

test('standalone Rent Check page loads and applies explorer prefill before FX rendering', () => {
  const html = fs.readFileSync('tools/seoul-rent-check/index.html','utf8');
  const js = fs.readFileSync('tools/seoul-rent-check/app.js','utf8');
  assert.match(html, /acquisition-context\.js/);
  assert.match(html, /prefill-utils\.js/);
  assert.ok(html.indexOf('acquisition-context.js') < html.indexOf('prefill-utils.js'));
  assert.match(js, /readRentCheckPrefill/);
  assert.match(js, /dataset\.krwValue/);
});
