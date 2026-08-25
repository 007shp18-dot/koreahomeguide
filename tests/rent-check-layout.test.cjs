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

test('rent-check input values flex without clipping their currency or size units', () => {
  assert.match(
    css,
    /\.rent-check-money input,\.rent-check-size input\{[^}]*flex:1[^}]*min-width:0[^}]*width:auto/
  );
});

test('standalone tool layout uses a container-appropriate three-column form', () => {
  assert.match(
    css,
    /\.tool-product-layout \.rent-check-form\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/
  );
});

test('mid-width rent-check layouts switch before the six-column form compresses', () => {
  const mediumStart = css.indexOf('@media (max-width:1120px)');
  assert.notEqual(mediumStart, -1);
  const mediumCss = css.slice(mediumStart, css.indexOf('@media (max-width:1050px)'));
  assert.match(mediumCss, /\.rent-check-form\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});
