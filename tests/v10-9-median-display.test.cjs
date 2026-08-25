const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(rel) { return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8'); }

for (const file of ['explore/app.js','zh/explore/app.js']) {
  test(`${file} renders overall market medians from summary fields`, () => {
    const text = read(file);
    assert.match(text, /const rentValue\s*=\s*summary\.medianMonthlyRentWon/);
    assert.match(text, /const depositValue\s*=\s*summary\.medianDepositWon/);
    assert.doesNotMatch(text, /const band\s*=\s*representativeBand\(summary\)/);
  });
}
