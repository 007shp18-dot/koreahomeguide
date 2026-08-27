const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const size = require('../rent-check-size.js');

test('pyeong and square-metre conversions preserve the comparison area', () => {
  assert.equal(size.displayedValue(20, 'sqm'), '20');
  assert.equal(size.displayedValue(20, 'pyeong'), '6.0');
  assert.ok(Math.abs(size.readSqm({ value:'6', dataset:{ sizeUnit:'pyeong' } }) - 19.8348) < 0.0001);
  assert.equal(size.readSqm({ value:'0', dataset:{ sizeUnit:'sqm' } }), null);
});

test('all Rent Check forms offer rough sizes, pyeong input and KRW by default', () => {
  for (const file of ['index.html','zh/index.html','tools/seoul-rent-check/index.html','zh/tools/seoul-rent-check/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /<option value="KRW" selected>/, file);
    assert.match(html, /data-rent-size-preset="20"/, file);
    assert.match(html, /data-rent-size-preset="26"/, file);
    assert.match(html, /data-rent-size-preset="40"/, file);
    assert.match(html, /data-size-unit-toggle/, file);
    assert.match(html, /src="\/rent-check-size\.js"/, file);
    assert.match(html, /id="rentCheckDeposit"[^>]*inputmode="numeric"/, file);
  }
});

test('all Rent Check runtimes read normalized square metres and label mobile evidence', () => {
  for (const file of ['app.js','zh/app.js','tools/seoul-rent-check/app.js','zh/tools/seoul-rent-check/app.js']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /KHGRentSize\.readSqm\(areaSqm\)/, file);
    assert.match(source, /data-label="\$\{labels\[0\]\}"/, file);
  }
});

test('homepage next checks include the brokerage-fee calculator in both languages', () => {
  assert.match(fs.readFileSync('index.html', 'utf8'), /href="\/tools\/brokerage-fee-calculator\/"/);
  assert.match(fs.readFileSync('zh/index.html', 'utf8'), /href="\/zh\/tools\/brokerage-fee-calculator\/"/);
});

test('mobile comparable contracts use cards without horizontal scrolling', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /\.rent-check-result>\.table-wrap tbody tr\{display:grid/);
  assert.match(css, /content:attr\(data-label\)/);
  assert.match(css, /#rentCheckComparableBody\.is-expanded tr\.rent-check-mobile-extra\{display:grid\}/);
});
