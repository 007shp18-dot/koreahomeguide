const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('both Explorer locales contain an accessible map with a visible fallback', () => {
  for (const file of ['explore/index.html','zh/explore/index.html']) {
    const html = fs.readFileSync(file,'utf8');
    assert.match(html, /id="explorerMap"/);
    assert.match(html, /id="explorerMapStatus"[^>]*aria-live="polite"/);
    assert.match(html, /class="explorer-map-layout"/);
  }
});

test('map layout is right-hand sticky on desktop and first on mobile', () => {
  const css = fs.readFileSync('styles.css','utf8');
  assert.match(css, /grid-template-areas:"main map"/);
  assert.match(css, /\.explorer-map-column\{[^}]*grid-area:map/);
  assert.match(css, /@media\(max-width:980px\)[^]*grid-template-areas:"map" "main"/);
});
