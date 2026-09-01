const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

for (const [file, locale, expected] of [
  ['index.html', 'en', 'KRW'],
  ['zh/index.html', 'zh-CN', 'KRW'],
  ['tools/seoul-rent-check/index.html', 'en tool', 'KRW'],
  ['zh/tools/seoul-rent-check/index.html', 'zh-CN tool', 'KRW'],
]) {
  test(`${locale} page includes KRW/USD/CNY currency selector and currency runtime`, () => {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /id="currencySelect"/);
    assert.match(html, /<option value="KRW"[^>]*>KRW<\/option>/);
    assert.match(html, /<option value="USD"[^>]*>USD<\/option>/);
    assert.match(html, /<option value="CNY"[^>]*>CNY<\/option>/);
    assert.match(html, new RegExp(`<option value="${expected}"[^>]*selected`));
    assert.match(html, /src="\/currency-utils\.js"/);
  });
}

test('English and Chinese runtimes fetch FX rates and re-render money with selected currency', () => {
  for (const file of ['app.js', ]) {
    const js = fs.readFileSync(file, 'utf8');
    assert.match(js, /fetch\(['"]\/api\/fx['"]\)/);
    assert.match(js, /KHGCurrency\.formatMoneyHtml/);
    assert.match(js, /currencySelect\.addEventListener\(['"]change['"]/);
  }
});

test('currency selector and approximate converted values have dedicated styles and disclosure', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /\.currency-picker select/);
  assert.match(css, /\.fx-secondary/);
  const en = fs.readFileSync('index.html', 'utf8');
  const zh = fs.readFileSync('zh/index.html', 'utf8');
  assert.match(en, /Foreign-currency conversions use latest reference rates and are approximate\./);
  assert.match(zh, /外币换算使用最新参考汇率，仅供估算。/);
});
