const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('styles.css', 'utf8');

test('rent-check fields align from the top so FX references do not lift money inputs', () => {
  assert.match(css, /\.rent-check-form\{[^}]*align-items:start/);
});

test('rent-check submit button aligns with input boxes on desktop', () => {
  assert.match(css, /\.rent-check-button\{[^}]*margin-top:20px/);
});

test('rent-check submit button removes desktop offset in the mobile layout', () => {
  const mobileStart = css.indexOf('@media (max-width:760px)');
  assert.notEqual(mobileStart, -1);
  const mobileCss = css.slice(mobileStart);
  assert.match(mobileCss, /\.rent-check-button\{[^}]*margin-top:0/);
});
