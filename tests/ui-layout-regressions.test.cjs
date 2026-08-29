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
