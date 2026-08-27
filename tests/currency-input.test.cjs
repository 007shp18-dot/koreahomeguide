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
  const controlListeners = new Map();
  const fetchUrls = [];
  const inputNode = (id, krwValue, krwStep) => ({
    id, value:'', dataset:{ krwValue, krwStep },
    addEventListener(type, handler) { inputListeners.set(`${id === 'rentCheckDeposit' ? 'deposit' : 'rent'}:${type}`, handler); },
    setAttribute(name, value) { this[name] = String(value); },
    removeAttribute(name) { delete this[name]; }
  });
  const deposit = inputNode('rentCheckDeposit', '10000000', '100000');
  const rent = inputNode('rentCheckRent', '1200000', '10000');
  const depositReference = { textContent:'' };
  const rentReference = { textContent:'' };
  const currencyCodes = [{ textContent:'' }, { textContent:'' }];
  const currencySelect = {
    value:'USD', disabled:false,
    addEventListener(type, handler) { controlListeners.set(type, handler); }
  };
  const form = { addEventListener(type, handler) { controlListeners.set(`form:${type}`, handler); } };
  const status = { textContent:'', className:'' };
  const domNode = () => ({
    hidden:false, open:false, textContent:'', innerHTML:'', dataset:{},
    style:{ left:'' }, classList:{ toggle() {}, remove() {} },
    appendChild() {}, insertAdjacentElement() {}, addEventListener() {},
    setAttribute() {}, querySelectorAll() { return []; },
    querySelector() { return domNode(); }
  });
  const elements = {
    '#currencySelect':currencySelect,
    '#rentCheckForm':form,
    '#rentCheckArea':{ value:'11680', options:[] },
    '#rentCheckType':{ value:'apartment', options:[], addEventListener() {} },
    '#rentCheckDeposit':deposit,
    '#rentCheckRent':rent,
    '#rentCheckAreaSqm':{ value:'25' },
    '#rentCheckButton':{ disabled:false },
    '#rentCheckStatus':status,
    '#rentCheckResult':{ hidden:true, querySelector() { return domNode(); } },
    '#rentCheckStudioNote':{ hidden:true }
  };
  const document = {
    documentElement:{ lang:file.startsWith('zh/') ? 'zh-CN' : 'en' },
    createElement() { return domNode(); },
    querySelector(selector) {
      if (selector === '[data-currency-reference-for="rentCheckDeposit"]') return depositReference;
      if (selector === '[data-currency-reference-for="rentCheckRent"]') return rentReference;
      return Object.prototype.hasOwnProperty.call(elements, selector) ? elements[selector] : null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-currency-input]') return [deposit, rent];
      if (selector === '[data-currency-symbol]') return [];
      if (selector === '[data-currency-code]') return currencyCodes;
      return [];
    }
  };
  const context = {
    window:{ addEventListener() {} },
    document,
    location:{ pathname:file.includes('/tools/') ? '/tools/seoul-rent-check/' : '/', search:'' },
    KHGCurrency:currency,
    KHGRentCheckUI:{ mapRentCheckType(value) { return { officialType:value }; } },
    fetch:async url => {
      fetchUrls.push(String(url));
      return { ok:true, json:async () => ({ rates:{ USD:0.00072, CNY:0.0052 } }) };
    }
  };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context, { filename:file });
  await new Promise(resolve => setImmediate(resolve));
  return {
    deposit,
    depositReference,
    currencyCodes,
    currencySelect,
    status,
    fetchUrls,
    changeCurrency:controlListeners.get('change'),
    input:inputListeners.get('deposit:input'),
    submit:controlListeners.get('form:submit')
  };
}

async function bootCalculatorRuntime(file) {
  const currency = require('../currency-utils.js');
  const brokerage = require('../brokerage-utils.js');
  const listeners = new Map();
  const values = {
    deposit:'10000000', rent:'1000000', maintenance:'100000',
    guaranteeInsurance:'0', movingCleaning:'0'
  };
  const inputs = Object.fromEntries(Object.entries(values).map(([id, krwValue]) => [id, {
    id, value:'', dataset:{ krwValue },
    addEventListener(type, handler) { listeners.set(`${id}:${type}`, handler); },
    setAttribute(name, value) { this[name] = String(value); },
    removeAttribute(name) { delete this[name]; }
  }]));
  const currencySelect = { value:'KRW', disabled:false, addEventListener(type, handler) { listeners.set(`currency:${type}`, handler); } };
  const property = { value:'housing', addEventListener(type, handler) { listeners.set(`property:${type}`, handler); } };
  const outputs = Object.fromEntries(['transactionValueResult','brokerageRateResult','brokerageFeeResult','calcResult','monthlyCostResult','transactionFormula'].map(id => [id, { innerHTML:'', textContent:'' }]));
  const references = Object.fromEntries(Object.keys(inputs).map(id => [id, { textContent:'' }]));
  const document = {
    documentElement:{ lang:file.startsWith('zh/') ? 'zh-CN' : 'en' },
    querySelector(selector) {
      if (selector === '#currencySelect') return currencySelect;
      if (selector === '#calcPropertyType') return property;
      if (selector === '#calcForm') return { addEventListener() {} };
      if (selector.startsWith('#')) return inputs[selector.slice(1)] || outputs[selector.slice(1)] || null;
      const reference = selector.match(/^\[data-currency-reference-for="([^"]+)"\]$/);
      return reference ? references[reference[1]] : null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-currency-input]') return Object.values(inputs);
      if (selector === '[data-currency-symbol]') return [];
      return [];
    }
  };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
    document,
    KHGCurrency:currency,
    KHGBrokerage:brokerage,
    fetch:async () => ({ ok:true, json:async () => ({ rates:{ USD:0.00072, CNY:0.0052 } }) })
  }, { filename:file });
  await new Promise(resolve => setImmediate(resolve));
  return { inputs, outputs, input:listeners.get('deposit:input') };
}

test('currency utilities convert user-entered USD/CNY back to KRW', () => {
  delete require.cache[require.resolve('../currency-utils.js')];
  const fx = require('../currency-utils.js');
  assert.equal(typeof fx.convertToKrw, 'function');
  assert.equal(Math.round(fx.convertToKrw(864, 'USD', { USD: 0.00072 })), 1_200_000);
  assert.equal(Math.round(fx.convertToKrw(4420, 'CNY', { CNY: 0.0052 })), 850_000);
  assert.equal(fx.convertToKrw(1_200_000, 'KRW', {}), 1_200_000);
});

test('official KRW stays primary while selected foreign currency remains visible as reference', () => {
  const fx = require('../currency-utils.js');
  const html = fx.formatMoneyHtml(1_200_000, 'USD', { USD: 0.00072 }, 'en-US');
  assert.match(html, /money-primary[^>]*>₩1,200,000/);
  assert.match(html, /fx-secondary[^>]*>≈ \$864/);
});

test('cold-start home keeps the Rent Check money inputs currency-aware on both locales', () => {
  for (const file of ['index.html', 'zh/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    for (const id of ['rentCheckDeposit','rentCheckRent']) {
      assert.match(html, new RegExp(`data-currency-input[^>]*id="${id}"|id="${id}"[^>]*data-currency-input`));
      assert.match(html, new RegExp(`id="${id}"[^>]*type="text"[^>]*inputmode="numeric"`));
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
    assert.equal(runtime.deposit.value, '10,000', file);
    assert.equal(runtime.deposit.dataset.krwValue, '13888889', file);
    assert.equal(runtime.depositReference.textContent, '≈ ₩13,888,889', file);
  }
});

test('invalid or negative Rent Check money never reuses a stale KRW value or calls the API', async () => {
  for (const file of rentCheckRuntimeFiles) {
    for (const invalid of ['abc', '-1']) {
      const runtime = await bootCurrencyRuntime(file);
      runtime.deposit.value = invalid;
      runtime.input();
      assert.equal(Object.hasOwn(runtime.deposit.dataset, 'krwValue'), false, `${file}: ${invalid}`);
      await runtime.submit({ preventDefault() {} });
      assert.match(runtime.status.className, /error/, `${file}: ${invalid}`);
      assert.equal(runtime.fetchUrls.some(url => url.startsWith('/api/rent-check?')), false, `${file}: ${invalid}`);
    }
  }
});

test('invalid calculator money clears stale computed results', async () => {
  for (const file of ['tools/brokerage-fee-calculator/app.js','zh/tools/brokerage-fee-calculator/app.js']) {
    const runtime = await bootCalculatorRuntime(file);
    runtime.inputs.deposit.value = 'abc';
    runtime.input();
    assert.equal(Object.hasOwn(runtime.inputs.deposit.dataset, 'krwValue'), false, file);
    assert.equal(runtime.outputs.calcResult.innerHTML, '—', file);
    assert.equal(runtime.outputs.monthlyCostResult.innerHTML, '—', file);
  }
});

test('Rent Check labels follow the selected display currency on every runtime', async () => {
  for (const file of rentCheckRuntimeFiles) {
    const runtime = await bootCurrencyRuntime(file);
    assert.deepEqual(runtime.currencyCodes.map(node => node.textContent), ['USD', 'USD'], file);

    runtime.currencySelect.value = 'CNY';
    runtime.changeCurrency();
    assert.deepEqual(runtime.currencyCodes.map(node => node.textContent), ['CNY', 'CNY'], file);
  }
});
