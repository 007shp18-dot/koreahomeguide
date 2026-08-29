const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('annual rent impact occupies its own verdict row instead of creating an implicit grid column', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(
    css,
    /\.rent-check-verdict-primary\{[^}]*grid-template-areas:"icon label" "\. difference" "\. comparison" "\. annualized" "\. sample"/
  );
  assert.match(css, /\[data-rent-verdict-annualized\]\{[^}]*grid-area:annualized/);
});

test('Explorer rail cannot be widened by the building sort control', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /\.explorer-building-sort\{[^}]*min-width:0/);
  assert.match(css, /\.explorer-building-sort select\{[^}]*width:100%[^}]*min-width:0/);
});

test('Explorer key metric deliberately fills the final row', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /\.map-first-workspace \.explorer-metrics>div\.is-key\{[^}]*grid-column:1\/-1/);
});

test('selected-neighborhood flow presents buildings before nearby neighborhoods in both locales', () => {
  for (const file of ['explore/index.html', 'zh/explore/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    const buildingIndex = html.indexOf('<section class="building-section"');
    const neighborhoodIndex = html.indexOf('<section class="dong-section"');
    assert.notEqual(buildingIndex, -1, `${file} has a building section`);
    assert.notEqual(neighborhoodIndex, -1, `${file} has a neighborhood section`);
    assert.ok(buildingIndex < neighborhoodIndex, `${file} shows buildings before nearby neighborhoods`);
  }
});

test('all Rent Check forms keep size assistance outside primary fields', () => {
  for (const file of ['index.html','tools/seoul-rent-check/index.html','zh/index.html','zh/tools/seoul-rent-check/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    const form = html.match(/<form id="rentCheckForm"[\s\S]*?<\/form>/)?.[0] || '';
    assert.equal((form.match(/class="rent-check-assist-row"/g) || []).length, 1, file);
    const sizeField = form.match(/<label class="field rent-check-size-field">[\s\S]*?<\/label>/)?.[0] || '';
    assert.ok(sizeField, `${file} has size field`);
    assert.doesNotMatch(sizeField, /rent-size-presets|data-size-unit-toggle/, file);
    const assist = form.match(/<div class="rent-check-assist-row">[\s\S]*?<\/div><\/div>/)?.[0] || '';
    assert.match(assist, /data-property-type-guide/, file);
    assert.match(assist, /rent-size-presets/, file);
    assert.match(assist, /data-size-unit-toggle/, file);
  }
});
