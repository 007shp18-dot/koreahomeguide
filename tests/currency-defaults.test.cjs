const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function htmlFiles(root = '.') {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes:true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(file));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(file);
  }
  return files;
}

test('every currency-enabled page renders KRW first and loads persistent preference support', () => {
  const pages = htmlFiles().filter(file => fs.readFileSync(file, 'utf8').includes('id="currencySelect"'));
  assert.equal(pages.length, 57);
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /<option value="KRW" selected>KRW<\/option>/, file);
    assert.doesNotMatch(html, /<option value="(?:USD|CNY)" selected>/, file);
    assert.match(html, /src="\/currency-utils\.js"/, file);
  }
});

test('all money-entry tools use grouped text inputs and the shared parser', () => {
  for (const file of ['index.html','zh/index.html','tools/seoul-rent-check/index.html','zh/tools/seoul-rent-check/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    for (const id of ['rentCheckDeposit','rentCheckRent']) {
      assert.match(html, new RegExp(`id="${id}"[^>]*type="text"[^>]*inputmode="numeric"`), file);
    }
  }
  for (const file of ['tools/brokerage-fee-calculator/index.html','zh/tools/brokerage-fee-calculator/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.equal((html.match(/data-currency-input/g) || []).length, 5, file);
    assert.equal((html.match(/data-currency-input[^>]*type="text"[^>]*inputmode="numeric"/g) || []).length, 5, file);
  }
  for (const file of ['app.js','tools/seoul-rent-check/app.js','tools/brokerage-fee-calculator/app.js']) {
    assert.match(fs.readFileSync(file, 'utf8'), /KHGCurrency\.parseInputAmount/, file);
  }
});

test('Chinese brokerage calculator static symbols match its KRW default before JavaScript runs', () => {
  const html = fs.readFileSync('zh/tools/brokerage-fee-calculator/index.html', 'utf8');
  assert.equal((html.match(/<b data-currency-symbol>₩<\/b>/g) || []).length, 5);
  assert.equal((html.match(/<b data-currency-symbol>¥<\/b>/g) || []).length, 0);
});
