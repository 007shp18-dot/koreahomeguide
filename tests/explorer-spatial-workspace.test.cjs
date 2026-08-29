const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const Explorer = require('../explore/explorer-utils.js');

test('workspace state follows neighborhood then building selection', () => {
  assert.equal(Explorer.workspaceState({}), 'neighborhoods');
  assert.equal(Explorer.workspaceState({ dong:'역삼동' }), 'buildings');
  assert.equal(Explorer.workspaceState({ dong:'역삼동', buildingKey:'역삼동::테스트' }), 'building-detail');
  assert.equal(Explorer.workspaceState({ buildingKey:'orphan' }), 'neighborhoods');
});

test('both locales expose a switching discovery rail', () => {
  for (const file of ['explore/index.html','zh/explore/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /class="product-main explorer-map-main explorer-discovery-rail"/);
    assert.match(html, /class="product-main explorer-map-main explorer-discovery-rail"[^>]*aria-label=/);
    assert.match(html, /id="explorerRailBack"/);
  }
  for (const file of ['explore/app.js','zh/explore/app.js']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /resultsShell\.dataset\.workspaceState\s*=\s*KHGExplorer\.workspaceState/);
  }
});

test('full-canvas map layer stretches to the workspace height', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  const spatial = css.slice(css.indexOf('/* v17 Explorer spatial workspace'));
  assert.match(spatial, /\.map-first-workspace \.explorer-map-column\{[^}]*height:100%[^}]*align-self:stretch/);
});
