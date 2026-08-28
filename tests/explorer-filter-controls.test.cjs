const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = file => fs.readFileSync(file, 'utf8');

test('Explorer keeps area and housing type as the compact primary filter row', () => {
  const css = read('styles.css');

  for (const file of ['explore/index.html', 'zh/explore/index.html']) {
    const html = read(file);
    assert.match(html, /class="field explorer-area-field"[^>]*><span>[^<]+<\/span><select id="exploreArea"/);
    assert.match(html, /class="field explorer-type-field"[^>]*><span>[^<]+<\/span><select id="exploreType"/);
    assert.match(html, /class="field explorer-budget-field"/);
  }

  assert.match(css, /@media\(max-width:620px\)[^]*\.explorer-search-card\{grid-template-columns:minmax\(0,1\.1fr\) minmax\(0,\.9fr\)\}/);
  assert.match(css, /\.explorer-search-card \.explorer-area-field\{grid-column:1\}/);
  assert.match(css, /\.explorer-search-card \.explorer-type-field\{grid-column:2\}/);
  assert.match(css, /\.explorer-search-card \.explorer-budget-field[^}]*grid-column:1\/-1/);
});

test('Explorer filter labels preserve the Korean registered category', () => {
  const en = read('explore/index.html');
  const zh = read('zh/explore/index.html');

  assert.match(en, /value="villa">Villa \/ low-rise multifamily \(연립·다세대\)<\/option>/);
  assert.match(en, /value="detached">Detached \/ multi-unit housing \(단독·다가구\)<\/option>/);
  assert.match(zh, /value="villa">低层多户住宅 \(Villa \/ 연립·다세대\)<\/option>/);
  assert.match(zh, /value="detached">独栋及多户住宅 \(단독·다가구\)<\/option>/);
  assert.equal(require('../explore/explorer-utils.js').propertyTypeLabel('villa', 'en'), 'Villa / low-rise multifamily (연립·다세대)');
});

test('Explorer keeps its top navigation label concise', () => {
  const en = read('explore/index.html');
  assert.match(en, /<nav>[^]*?<a href="\/explore\/">Explore<\/a>/);
  assert.doesNotMatch(en, />Explore Rents<\/a>/);
});

test('Explorer results expose current filters and a direct way back to editing them', () => {
  for (const root of ['explore', 'zh/explore']) {
    const html = read(`${root}/index.html`);
    const script = read(`${root}/app.js`);

    assert.match(html, /id="explorerFilterSummary" class="explorer-filter-summary"/);
    assert.match(html, /id="explorerChangeFilters"/);
    assert.match(script, /function updateFilterSummary\(\)/);
    assert.match(script, /explorerChangeFilters\.addEventListener\('click'/);
    assert.match(script, /window\.scrollTo\(\{ top:Math\.max\(0, explorerSearchCard\.offsetTop - 16\), behavior:'smooth' \}\)/);
  }
});
