const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const rentCheckRuntimeFiles = [
  'app.js',
  'zh/app.js',
  'tools/seoul-rent-check/app.js',
  'zh/tools/seoul-rent-check/app.js'
];

async function bootCurrencyRuntime(file) {
  const currency = require('../currency-utils.js');
  const inputListeners = new Map();
  const deposit = {
    id:'rentCheckDeposit', value:'', dataset:{ krwValue:'10000000', krwStep:'100000' },
    addEventListener(type, handler) { inputListeners.set(`deposit:${type}`, handler); }
  };
  const rent = {
    id:'rentCheckRent', value:'', dataset:{ krwValue:'1200000', krwStep:'10000' },
    addEventListener(type, handler) { inputListeners.set(`rent:${type}`, handler); }
  };
  const depositReference = { textContent:'' };
  const rentReference = { textContent:'' };
  const currencySelect = { value:'USD', disabled:false, addEventListener() {} };
  const elements = {
    '#currencySelect':currencySelect,
    '#rentCheckForm':null,
    '#rentCheckArea':{ value:'11680', options:[] },
    '#rentCheckType':{ value:'apartment', options:[], addEventListener() {} },
    '#rentCheckDeposit':deposit,
    '#rentCheckRent':rent,
    '#rentCheckAreaSqm':{ value:'25' },
    '#rentCheckButton':{ disabled:false },
    '#rentCheckStatus':{ textContent:'', className:'' },
    '#rentCheckResult':{ hidden:true },
    '#rentCheckStudioNote':{ hidden:true }
  };
  const document = {
    documentElement:{ lang:file.startsWith('zh/') ? 'zh-CN' : 'en' },
    querySelector(selector) {
      if (selector === '[data-currency-reference-for="rentCheckDeposit"]') return depositReference;
      if (selector === '[data-currency-reference-for="rentCheckRent"]') return rentReference;
      return Object.prototype.hasOwnProperty.call(elements, selector) ? elements[selector] : null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-currency-input]') return [deposit, rent];
      if (selector === '[data-currency-symbol]') return [];
      return [];
    }
  };
  const context = {
    window:{ addEventListener() {} },
    document,
    location:{ pathname:file.includes('/tools/') ? '/tools/seoul-rent-check/' : '/', search:'' },
    KHGCurrency:currency,
    KHGRentCheckUI:{ mapRentCheckType(value) { return { officialType:value }; } },
    fetch:async () => ({ ok:true, json:async () => ({ rates:{ USD:0.00072 } }) })
  };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context, { filename:file });
  await new Promise(resolve => setImmediate(resolve));
  return { deposit, depositReference, input:inputListeners.get('deposit:input') };
}

test('currency utilities convert user-entered USD/CNY back to KRW', () => {
  delete require.cache[require.resolve('../currency-utils.js')];
  const fx = require('../currency-utils.js');
  assert.equal(typeof fx.convertToKrw, 'function');
  assert.equal(Math.round(fx.convertToKrw(864, 'USD', { USD: 0.00072 })), 1_200_000);
  assert.equal(Math.round(fx.convertToKrw(4420, 'CNY', { CNY: 0.0052 })), 850_000);
  assert.equal(fx.convertToKrw(1_200_000, 'KRW', {}), 1_200_000);
});

test('selected foreign currency is primary while KRW remains visible as reference', () => {
  const fx = require('../currency-utils.js');
  const html = fx.formatMoneyHtml(1_200_000, 'USD', { USD: 0.00072 }, 'en-US');
  assert.match(html, /money-primary[^>]*>\$864/);
  assert.match(html, /fx-secondary[^>]*>≈ ₩1,200,000/);
});

test('cold-start home keeps the Rent Check money inputs currency-aware on both locales', () => {
  for (const file of ['index.html', 'zh/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    for (const id of ['rentCheckDeposit','rentCheckRent']) {
      assert.match(html, new RegExp(`data-currency-input[^>]*id="${id}"|id="${id}"[^>]*data-currency-input`));
    }
    assert.match(html, /data-currency-symbol/);
    assert.doesNotMatch(html, /id="movingCleaning"/);
  }
});

test('home runtimes convert displayed Rent Check inputs into KRW', () => {
  for (const file of ['app.js', 'zh/app.js']) {
    const js = fs.readFileSync(file, 'utf8');
    assert.match(js, /KHGCurrency\.convertToKrw/);
    assert.match(js, /syncCurrencyInput/);
    assert.match(js, /renderCurrencyInputs/);
  }
});

test('editing a foreign-currency Rent Check amount refreshes its KRW reference immediately', async () => {
  for (const file of rentCheckRuntimeFiles) {
    const runtime = await bootCurrencyRuntime(file);
    runtime.deposit.value = '10000';
    runtime.input();
    assert.equal(runtime.deposit.dataset.krwValue, '13888889', file);
    assert.equal(runtime.depositReference.textContent, '≈ ₩13,888,889', file);
  }
});
