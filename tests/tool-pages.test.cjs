const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const pages = [
  ['tools/seoul-rent-check/index.html','https://koreahomeguide.com/tools/seoul-rent-check/'],
  ['tools/brokerage-fee-calculator/index.html','https://koreahomeguide.com/tools/brokerage-fee-calculator/'],
  ['zh/tools/seoul-rent-check/index.html','https://koreahomeguide.com/zh/tools/seoul-rent-check/'],
  ['zh/tools/brokerage-fee-calculator/index.html','https://koreahomeguide.com/zh/tools/brokerage-fee-calculator/']
];

test('standalone tool pages expose canonical URLs and currency utilities', () => {
  for (const [file, canonical] of pages) {
    assert.equal(fs.existsSync(file), true, file);
    const html = fs.readFileSync(file,'utf8');
    assert.match(html, new RegExp(canonical.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    assert.match(html, /currency-utils\.js/);
    assert.match(html, /currencySelect/);
  }
});

test('rent check tools call the existing API and calculators load brokerage rules', () => {
  assert.match(fs.readFileSync('tools/seoul-rent-check/app.js','utf8'), /\/api\/rent-check/);
  assert.match(fs.readFileSync('zh/tools/seoul-rent-check/app.js','utf8'), /\/api\/rent-check/);
  assert.match(fs.readFileSync('tools/brokerage-fee-calculator/index.html','utf8'), /brokerage-utils\.js/);
  assert.match(fs.readFileSync('zh/tools/brokerage-fee-calculator/index.html','utf8'), /brokerage-utils\.js/);
});

test('English and Chinese tool pages link to each other with hreflang', () => {
  const en = fs.readFileSync('tools/seoul-rent-check/index.html','utf8');
  const zh = fs.readFileSync('zh/tools/seoul-rent-check/index.html','utf8');
  assert.match(en, /hreflang="zh-CN"[^>]+\/zh\/tools\/seoul-rent-check\//);
  assert.match(zh, /hreflang="en"[^>]+\/tools\/seoul-rent-check\//);
});
