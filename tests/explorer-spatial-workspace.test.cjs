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

test('a neighborhood marker previews context and only the explicit action activates buildings', () => {
  const model = { kind:'neighborhood', dong:'역삼동', districtCode:'11680' };
  const preview = Explorer.neighborhoodSelectionTransition(null, { type:'select', model });
  assert.equal(preview.phase, 'preview');
  assert.equal(preview.model, model);

  const activate = Explorer.neighborhoodSelectionTransition(preview, { type:'activate' });
  assert.equal(activate.phase, 'activate');
  assert.equal(activate.model, model);

  const ignored = Explorer.neighborhoodSelectionTransition(null, { type:'activate' });
  assert.deepEqual(ignored, { phase:'idle', model:null });
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

test('Street View loading and ready states share one stable media frame', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  const finalLayer = css.slice(css.indexOf('/* v19 Street View stability'));
  assert.match(finalLayer, /\.building-window-media-frame\{[^}]*aspect-ratio:16\/9/);
  assert.match(finalLayer, /\.building-window-media-frame\{[^}]*min-height:0/);
  assert.match(finalLayer, /\.building-status-window \.explorer-street-view-canvas\{[^}]*position:absolute[^}]*inset:0[^}]*width:100%[^}]*height:100%/);
  assert.doesNotMatch(finalLayer, /explorer-street-view-canvas\{[^}]*height:(?:120|126|170|190)px/);
});

test('both Explorer locales load the cache-busted Street View assets', () => {
  for (const file of ['explore/index.html','zh/explore/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /href="\/styles\.css\?v=21"/);
    assert.match(html, /src="\/explore\/building-window\.js\?v=19"/);
    assert.match(html, /src="\/explore\/panorama\.js\?v=20"/);
  }
});
