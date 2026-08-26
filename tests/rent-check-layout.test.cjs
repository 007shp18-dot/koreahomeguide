const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('styles.css', 'utf8');
const cold = fs.readFileSync('cold-start.css', 'utf8');

test('English Rent Check submit actions use the compact Check label', () => {
  for (const file of ['index.html', 'tools/seoul-rent-check/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /id="rentCheckButton"[^>]*>Check<\/button>/, file);
  }
});

test('rent-check fields align from the top so FX references do not lift money inputs', () => {
  assert.match(css, /\.rent-check-form\{[^}]*align-items:start/);
});

test('rent-check submit button aligns with input boxes on desktop', () => {
  assert.match(css, /\.rent-check-form \.field>span\{[^}]*min-height:18px/);
  assert.match(css, /\.rent-check-button\{[^}]*margin-top:25px/);
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

test('embedded Rent Check uses three columns instead of compressing all controls into one row', () => {
  assert.match(
    css,
    /\.rent-check-form\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/
  );
  assert.doesNotMatch(
    css,
    /\.rent-check-form\{[^}]*grid-template-columns:1\.15fr 1\.15fr 1\.1fr 1\.1fr \.8fr auto/
  );
});

test('standalone tool layout uses two columns inside its narrower product column', () => {
  assert.match(
    css,
    /\.tool-product-layout \.rent-check-form\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/
  );
});

test('Rent Check controls stay inside their assigned grid tracks', () => {
  assert.match(css, /\.rent-check-money,\.rent-check-size\{[^}]*min-width:0/);
  assert.match(css, /\.rent-check-button\{[^}]*min-width:0[^}]*width:100%/);
});

test('homepage gives long bilingual district names enough desktop width', () => {
  assert.match(
    cold,
    /\.funnel-rent-card \.rent-check-form\{[^}]*grid-template-columns:minmax\(260px,1\.35fr\) minmax\(250px,1\.25fr\)/
  );
  assert.match(cold, /@media\(max-width:1220px\)\{\.funnel-rent-card \.rent-check-form\{[^}]*repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(cold, /@media\(max-width:980px\)\{\.funnel-rent-card \.rent-check-form\{[^}]*repeat\(2,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(cold, /@media\(max-width:(?:1280|1200|960)px\)\{\.funnel-rent-card \.rent-check-form/);
});
