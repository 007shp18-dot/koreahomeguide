const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('both Explorer locales contain an accessible map with a visible fallback', () => {
  for (const file of ['explore/index.html','zh/explore/index.html']) {
    const html = fs.readFileSync(file,'utf8');
    assert.match(html, /id="explorerMap"/);
    assert.match(html, /id="explorerMapStatus"[^>]*aria-live="polite"/);
    assert.match(html, /class="explorer-map-layout"/);
    assert.match(html, /class="explorer-map-legend"[^>]*aria-label=/);
    assert.match(html, /id="explorerMapSelection"[^>]*aria-live="polite"[^>]*hidden/);
    assert.match(html, /id="explorerMapSelectionRent"/);
    assert.match(html, /id="explorerMapSelectionDeposit"/);
    assert.match(html, /id="explorerMapSelectionEvidence"/);
    assert.match(html, /id="explorerMapSelectionClose"/);
    assert.match(html, /id="explorerMapSelectionDetail"/);
    assert.match(html, /data-explorer-view="map"/);
    assert.match(html, /data-explorer-view="list"/);
    assert.match(html, /data-rent-check-cta="explorer_map_handoff"/);
  }
});

test('map decision copy is localized and describes evidence instead of listings', () => {
  const en = fs.readFileSync('explore/index.html','utf8');
  const zh = fs.readFileSync('zh/explore/index.html','utf8');
  assert.match(en, /Strong evidence/);
  assert.match(en, /Limited evidence/);
  assert.match(en, /Outside budget/);
  assert.match(zh, /较强依据/);
  assert.match(zh, /有限依据/);
  assert.match(zh, /超出预算/);
  assert.doesNotMatch(en, /Available listings/i);
  assert.doesNotMatch(zh, /在租房源/);
});

test('map layout is full-width first with a large desktop and mobile canvas', () => {
  const css = fs.readFileSync('styles.css','utf8');
  assert.match(css, /grid-template-areas:"map map" "main support"/);
  assert.match(css, /\.explorer-map-column\{[^}]*grid-area:map/);
  assert.match(css, /\.explorer-support-column\{[^}]*grid-area:support/);
  assert.match(css, /@media\(max-width:980px\)[^]*grid-template-areas:"map" "main" "support"/);
  assert.match(css, /\.explorer-map-surface\{[^}]*min-height:640px/);
  assert.match(css, /\.explorer-map-canvas\{[^}]*height:640px/);
  assert.match(css, /@media\(max-width:760px\)[^]*height:clamp\(470px,68dvh,620px\)/);
});

test('map legend and decision card have selected, evidence, and narrow-screen states', () => {
  const css = fs.readFileSync('styles.css','utf8');
  assert.match(css, /\.explorer-map-legend\{/);
  assert.match(css, /\.explorer-map-legend i\.is-strong\{[^}]*#15803d/);
  assert.match(css, /\.explorer-map-legend i\.is-limited\{[^}]*#b45309/);
  assert.match(css, /\.explorer-map-legend i\.is-outside\{[^}]*#64748b/);
  assert.match(css, /\.explorer-map-selection\[hidden\]\{display:none!important\}/);
  assert.match(css, /\.explorer-map-selection-status\.is-strong/);
  assert.match(css, /\.explorer-map-selection-status\.is-limited/);
  assert.match(css, /\.explorer-map-selection-status\.is-outside/);
  assert.match(css, /\.explorer-map-selection\{[^}]*position:absolute/);
  assert.match(css, /@media\(max-width:760px\)[^]*\.explorer-map-layout\.is-map-view \.explorer-map-main/);
  assert.match(css, /@media\(max-width:760px\)[^]*\.explorer-map-layout\.is-list-view \.explorer-map-legend,\.explorer-map-layout\.is-list-view \.explorer-map-surface/);
  assert.match(css, /@media\(max-width:760px\)[^]*border-radius:20px 20px 0 0/);
});
