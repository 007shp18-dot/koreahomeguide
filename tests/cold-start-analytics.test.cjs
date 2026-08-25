const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const files = ['app.js','zh/app.js','tools/seoul-rent-check/app.js','zh/tools/seoul-rent-check/app.js'];

test('all four Rent Check runtimes dispatch the shared result event', () => {
  for (const file of files) {
    const source = fs.readFileSync(file,'utf8');
    assert.match(source, /khg:rent-check-result/, file);
    assert.match(source, /CustomEvent/, file);
    assert.match(source, /sourcePage/, file);
    assert.match(source, /districtCode/, file);
  }
});

test('all four runtimes emit start and result analytics without PII', () => {
  for (const file of files) {
    const source = fs.readFileSync(file,'utf8');
    assert.match(source, /rent_check_start/, file);
    assert.match(source, /rent_check_result/, file);
    assert.doesNotMatch(source, /gtag\([^\n]*email/, file);
  }
});
