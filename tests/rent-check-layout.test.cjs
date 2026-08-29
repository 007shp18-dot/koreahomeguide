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
  assert.match(css, /\.rent-check-size>b\{[^}]*flex:0 0 auto[^}]*min-width:20px/);
  assert.match(css, /\.rent-check-size input::-webkit-inner-spin-button[^}]*appearance:none/);
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

test('homepage balances bilingual selects with a no-wrap monthly-rent label', () => {
  assert.match(
    cold,
    /\.funnel-rent-card \.rent-check-form\{[^}]*grid-template-columns:minmax\(220px,1\.1fr\) minmax\(220px,1\.1fr\) minmax\(170px,\.9fr\) minmax\(170px,\.9fr\)/
  );
  assert.match(cold, /@media\(min-width:1221px\)[^]*\.funnel-rent-card \.rent-check-size-field\{[^}]*grid-column:1\/-1[^}]*grid-row:2[^}]*display:grid[^}]*grid-template-columns:minmax\(180px,\.8fr\) minmax\(0,2\.2fr\)/);
  assert.match(cold, /@media\(min-width:1221px\)[^]*\.funnel-rent-card \.rent-size-controls\{[^}]*grid-column:2[^}]*grid-row:2\/4/);
  assert.match(css, /\.rent-check-form \.field>span\{[^}]*gap:6px[^}]*white-space:nowrap/);
  assert.match(css, /\.core-ui \.field-unit\{[^}]*flex:0 0 auto[^}]*white-space:nowrap/);
  assert.match(cold, /@media\(max-width:1220px\)\{\.funnel-rent-card \.rent-check-form\{[^}]*repeat\(2,minmax\(0,1fr\)\)[^}]*\}\.funnel-rent-card \.rent-check-size-field\{grid-column:auto\}/);
  assert.match(cold, /@media\(max-width:980px\)\{\.funnel-rent-card \.rent-check-form\{[^}]*repeat\(2,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(cold, /@media\(max-width:(?:1280|1200|960)px\)\{\.funnel-rent-card \.rent-check-form/);
});

test('desktop homepage keeps Check beside the price inputs and size shortcuts below', () => {
  assert.match(cold, /@media\(min-width:1221px\)[^]*\.funnel-rent-card \.rent-check-form\{[^}]*grid-template-columns:[^}]*repeat\(2,minmax\(155px,\.8fr\)\)[^}]*minmax\(140px,\.65fr\)/);
  assert.match(cold, /@media\(min-width:1221px\)[^]*\.funnel-rent-card \.rent-check-size-field\{[^}]*grid-column:1\/-1[^}]*grid-row:2/);
  assert.match(cold, /@media\(min-width:1221px\)[^]*\.funnel-rent-card \.rent-check-button\{[^}]*grid-column:5[^}]*grid-row:1[^}]*margin-top:25px/);
});

test('desktop homepage hero keeps the short promise on one line and releases it on narrower screens', () => {
  assert.match(cold, /\.funnel-hero\{[^}]*max-width:1240px/);
  assert.match(cold, /@media\(min-width:981px\)[^]*\.funnel-hero h1\{[^}]*max-width:none[^}]*white-space:nowrap/);
  assert.match(cold, /@media\(max-width:980px\)[^]*\.funnel-hero h1\{[^}]*white-space:normal/);
});

test('mobile Explorer panel cannot overflow horizontally or keep a dragged desktop width', () => {
  const mobile = css.slice(css.indexOf('@media(max-width:760px)'));
  assert.match(mobile, /\.explorer-map-selection\{[^}]*max-width:100%[^}]*overflow-x:hidden/);
  assert.match(mobile, /\.explorer-map-selection-head>div\{[^}]*min-width:0/);
  assert.match(mobile, /\.explorer-map-selection-head h3\{[^}]*overflow-wrap:anywhere/);
});

test('final Rent Check geometry uses two equal three-column rows and one compact assist row', () => {
  const finalLayer = css.slice(css.indexOf('/* v29 aligned Rent Check controls */'));
  assert.match(finalLayer, /\.rent-check-form\{[^}]*grid-template-columns:repeat\(6,minmax\(0,1fr\)\)[^}]*grid-template-areas:"area area type type size size" "deposit deposit rent rent submit submit" "assist assist assist assist assist assist"/);
  assert.match(finalLayer, /\.rent-check-form>\.rent-check-area-field\{grid-area:area\}/);
  assert.match(finalLayer, /\.rent-check-form>\.rent-check-property-field\{grid-area:type\}/);
  assert.match(finalLayer, /\.rent-check-form>\.rent-check-size-field\{grid-area:size/);
  assert.match(finalLayer, /\.rent-check-form>\.rent-check-deposit-field\{grid-area:deposit\}/);
  assert.match(finalLayer, /\.rent-check-form>\.rent-check-monthly-field\{grid-area:rent\}/);
  assert.match(finalLayer, /\.rent-check-form>\.rent-check-button\{[^}]*grid-area:submit[^}]*height:52px[^}]*margin-top:25px/);
  assert.match(finalLayer, /\.rent-check-form>\.rent-check-assist-row\{[^}]*grid-area:assist[^}]*min-height:0/);
  assert.match(finalLayer, /@media\(max-width:760px\)\{[\s\S]*?\.rent-check-form\{[^}]*grid-template-columns:1fr[^}]*grid-template-areas:"area" "type" "size" "assist" "deposit" "rent" "submit"/);
});
