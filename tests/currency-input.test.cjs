const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('currency utilities convert user-entered USD/CNY back to KRW', () => {
  delete require.cache[require.resolve('../currency-utils.js')];
  const fx = require('../currency-utils.js');
  assert.equal(typeof fx.convertToKrw, 'function');
  assert.equal(Math.round(fx.convertToKrw(864, 'USD', { USD: 0.00072 })), 1_200_000);
  assert.equal(Math.round(fx.convertToKrw(4420, 'CNY', { CNY: 0.0052 })), 850_000);
  assert.equal(fx.convertToKrw(1_200_000, 'KRW', {}), 1_200_000);
});

test('selected foreign currency is primary while KRW remains visible as reference', () => {
  delete require.cache[require.resolve('../currency-utils.js')];
  const fx = require('../currency-utils.js');
  const html = fx.formatMoneyHtml(1_200_000, 'USD', { USD: 0.00072 }, 'en-US');
  assert.match(html, /money-primary[^>]*>\$864/);
  assert.match(html, /fx-secondary[^>]*>≈ ₩1,200,000/);
});

test('rent check and calculator money inputs are currency-aware on both locales', () => {
  for (const file of ['index.html', 'zh/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    for (const id of ['rentCheckDeposit','rentCheckRent','deposit','rent','maintenance','guaranteeInsurance','movingCleaning']) {
      assert.match(html, new RegExp(`data-currency-input[^>]*id="${id}"|id="${id}"[^>]*data-currency-input`));
    }
    assert.match(html, /data-currency-symbol/);
  }
});

test('runtimes convert displayed inputs into KRW before calculator and rent-check logic', () => {
  for (const file of ['app.js', 'zh/app.js']) {
    const js = fs.readFileSync(file, 'utf8');
    assert.match(js, /KHGCurrency\.convertToKrw/);
    assert.match(js, /syncCurrencyInputs/);
    assert.match(js, /renderCurrencyInputs/);
  }
});
