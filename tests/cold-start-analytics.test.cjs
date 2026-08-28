const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const files = ['app.js'];

function bootRentCheckRuntime(file, { districtCode = '11680', propertyType = 'apartment' } = {}) {
  const listeners = new Map();
  const gtagCalls = [];
  const formListeners = new Map();
  const domNode = () => ({
    hidden:false, open:false, textContent:'', innerHTML:'', dataset:{},
    style:{ left:'' }, classList:{ toggle() {}, remove() {} },
    appendChild() {}, insertAdjacentElement() {}, addEventListener() {},
    setAttribute() {}, querySelectorAll() { return []; },
    querySelector() { return domNode(); }
  });
  const elements = {
    '#rentCheckForm': { addEventListener(type, handler) { formListeners.set(type, handler); } },
    '#rentCheckArea': { value:districtCode, options:[] },
    '#rentCheckType': { value:propertyType, options:[], addEventListener() {} },
    '#rentCheckDeposit': { value:'0', dataset:{ krwValue:'0' } },
    '#rentCheckRent': { value:'0', dataset:{ krwValue:'0' } },
    '#rentCheckAreaSqm': { value:'25' },
    '#rentCheckButton': { disabled:false },
    '#rentCheckStatus': { textContent:'', className:'' },
    '#rentCheckResult': { hidden:false, querySelector() { return domNode(); } },
    '#rentCheckStudioNote': { hidden:false }
  };
  const doc = {
    documentElement:{ lang:'en' },
    createElement() { return domNode(); },
    querySelector(selector) { return elements[selector] || null; },
    querySelectorAll() { return []; }
  };
  const window = {
    addEventListener(type, handler) { listeners.set(type, handler); }
  };
  const context = {
    window,
    document:doc,
    location:{ pathname:'/tools/seoul-rent-check/', search:'' },
    KHGCurrency:{
      parseInputAmount(value) { return Number(String(value).replace(/,/g, '')); },
      convertToKrw(value) { return value; }
    },
    KHGRentCheckUI:{
      mapRentCheckType(value) { return { officialType:value === 'studio' ? 'detached' : value }; },
      humanizeRentCheckError() { return 'Rent comparison failed.'; }
    },
    fetch:async () => ({ ok:false, json:async () => ({ error:'private failure detail' }) })
  };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context, { filename:file });
  return {
    async submit() { await formListeners.get('submit')({ preventDefault() {} }); },
    analyticsReady() {
      window.gtag = (...args) => gtagCalls.push(args);
      const listener = listeners.get('khg:analytics-ready');
      if (listener) listener({ detail:{ ready:true } });
    },
    gtagCalls,
    elements
  };
}

test('the shared Rent Check runtime dispatch the shared result event', () => {
  for (const file of files) {
    const source = fs.readFileSync(file,'utf8');
    assert.match(source, /khg:rent-check-result/, file);
    assert.match(source, /CustomEvent/, file);
    assert.match(source, /sourcePage/, file);
    assert.match(source, /districtCode/, file);
  }
});

test('the shared Rent Check runtime emit start and result analytics without PII', () => {
  for (const file of files) {
    const source = fs.readFileSync(file,'utf8');
    assert.match(source, /rent_check_start/, file);
    assert.match(source, /rent_check_result/, file);
    assert.doesNotMatch(source, /gtag\([^\n]*email/, file);
  }
});

test('the shared Rent Check runtime structurally preserve safe tool-view and failure analytics', () => {
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /rent_check_tool_view/, file);
    assert.match(source, /rent_check_error/, file);
    assert.match(source, /function errorCategory\(/, file);
    assert.match(source, /error_category:errorCategory\(err\)/, file);
    assert.doesNotMatch(source, /safeTrack\('rent_check_error',\{[^}]*?(?:err\.message|depositWon|rentWon|status:)/, file);
  }
});

test('Rent Check tool view emits once when automatic analytics becomes ready', () => {
  for (const file of files) {
    const runtime = bootRentCheckRuntime(file);
    assert.equal(runtime.gtagCalls.length, 0, file);
    runtime.analyticsReady();
    runtime.analyticsReady();
    assert.deepEqual(runtime.gtagCalls.map(call => call[1]), ['rent_check_tool_view'], file);
  }
});

test('Rent Check calculations keep running but suppress analytics for manipulated context', async () => {
  for (const file of files) {
    const runtime = bootRentCheckRuntime(file, { districtCode:'99999', propertyType:'castle' });
    runtime.analyticsReady();
    await runtime.submit();
    assert.equal(runtime.gtagCalls.length, 0, file);
    assert.equal(runtime.elements['#rentCheckResult'].hidden, true, file);
  }
});

test('Rent Check events distinguish the original source page from the tool page', () => {
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /source_page/, file);
    assert.match(source, /tool_page/, file);
    assert.match(source, /acquisitionContext/, file);
  }
});
