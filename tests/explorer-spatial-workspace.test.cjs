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

test('a neighborhood selection activates buildings on the first click', () => {
  const model = { kind:'neighborhood', dong:'역삼동', districtCode:'11680' };
  const activate = Explorer.neighborhoodSelectionTransition(null, { type:'select', model });
  assert.equal(activate.phase, 'activate');
  assert.equal(activate.model, model);

  const ignored = Explorer.neighborhoodSelectionTransition(null, { type:'select', model:{ kind:'building', dong:'역삼동' } });
  assert.deepEqual(ignored, { phase:'idle', model:null });
});

test('a newer neighborhood selection invalidates a delayed building response', async () => {
  const gate = Explorer.createRequestGate();
  const effects = [];
  let resolveFirst;
  const firstResponse = new Promise(resolve => { resolveFirst = resolve; });
  const activate = async (name, response) => {
    const request = gate.begin();
    await response;
    if (request.isCurrent()) effects.push(name);
  };

  const first = activate('A', firstResponse);
  gate.invalidate();
  resolveFirst();
  await first;
  assert.deepEqual(effects, []);

  await activate('B', Promise.resolve());
  assert.deepEqual(effects, ['B']);
});

test('both locale runtimes use one direct neighborhood activation path', () => {
  for (const file of ['explore/app.js','zh/explore/app.js']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /function activateNeighborhood\(model, \{ historyMode = 'push' \} = \{\}\)/, file);
    assert.match(source, /dongList\.addEventListener\('click',[\s\S]*?activateNeighborhood\(/, file);
    assert.match(source, /khg:map-select-dong[\s\S]*?activateNeighborhood\(model\)/, file);
    assert.doesNotMatch(source, /cancelDongLoad\(\{ restoreArea:true \}\)/, file);
    assert.match(source, /<button class="neighborhood-card"[^>]*data-dong=/, file);
    assert.match(source, /areaSelect\.value === 'all'[\s\S]*?areaSelect\.value = String\(selected\.districtCode\)/, file);
    assert.match(source, /const areaLoadGate = KHGExplorer\.createRequestGate\(\)/, file);
    assert.match(source, /async function loadArea[\s\S]*?const request = areaLoadGate\.begin\(\)[\s\S]*?if \(!request\.isCurrent\(\)\) return/, file);
    assert.match(source, /function handleSelectionChange\(\) \{\s*areaLoadGate\.invalidate\(\)/, file);
  }
});

test('map location publishing rejects stale building geocodes', () => {
  const source = fs.readFileSync('explore/map.js', 'utf8');
  assert.match(source, /let openBuildingKey = ''/);
  assert.match(source, /requestedKey !== openBuildingKey/);
  assert.match(source, /!point \|\| requestedKey !== openBuildingKey/);
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

test('desktop Explorer keeps the map sticky while results stay in document flow', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  const spatial = css.slice(css.indexOf('/* v22 P0 document-flow Explorer'));
  assert.match(spatial, /\.map-first-workspace\{[^}]*display:grid[^}]*grid-template-columns:minmax\(0,1\.8fr\) minmax\(340px,1fr\)[^}]*height:auto[^}]*overflow:visible/);
  assert.match(spatial, /\.map-first-workspace \.explorer-map-column\{[^}]*position:sticky[^}]*top:76px[^}]*align-self:start/);
  assert.match(spatial, /\.map-first-workspace \.explorer-discovery-rail\{[^}]*position:relative[^}]*width:auto[^}]*max-height:none[^}]*overflow:visible/);
  assert.match(spatial, /\.map-first-workspace \.explorer-discovery-rail \.explorer-results\{[^}]*height:auto[^}]*overflow:visible/);
  assert.doesNotMatch(spatial, /overflow-y:(?:auto|scroll)/);
  assert.doesNotMatch(spatial, /overscroll-behavior/);
});

test('mobile Explorer stacks map then results without a clipped bottom sheet', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  const spatial = css.slice(css.indexOf('/* v22 P0 document-flow Explorer'));
  assert.match(spatial, /@media\(max-width:760px\)\{[\s\S]*?\.map-first-workspace\{[^}]*grid-template-columns:1fr[^}]*height:auto[^}]*overflow:visible/);
  assert.match(spatial, /@media\(max-width:760px\)\{[\s\S]*?\.map-first-workspace \.explorer-discovery-rail\{[^}]*position:relative[^}]*max-height:none/);
});

test('Street View loading and ready states share one stable media frame', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  const finalLayer = css.slice(css.indexOf('/* v19 Street View stability'));
  assert.match(finalLayer, /\.building-window-media-frame\{[^}]*aspect-ratio:16\/9/);
  assert.match(finalLayer, /\.building-window-media-frame\{[^}]*min-height:0/);
  assert.match(finalLayer, /\.building-status-window \.explorer-street-view-canvas\{[^}]*position:absolute[^}]*inset:0[^}]*width:100%[^}]*height:100%/);
  assert.doesNotMatch(finalLayer, /explorer-street-view-canvas\{[^}]*height:(?:120|126|170|190)px/);
});

test('building detail is inline with a stable full-width Street View frame', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  const finalLayer = css.slice(css.indexOf('/* v25 final Explorer directory'));
  assert.match(finalLayer, /\.explorer-building-detail-mount \.building-status-overlay\{[^}]*position:relative/);
  assert.match(finalLayer, /\.explorer-building-detail-mount \.building-status-window\{[^}]*width:100%[^}]*max-height:none[^}]*overflow:visible/);
  assert.match(finalLayer, /\/\* v26 final inline-detail stability overrides \*\/[\s\S]*\.explorer-building-detail-mount \.building-window-media-frame\{[^}]*width:min\(100%,996px\)[^}]*aspect-ratio:16\/9[^}]*contain:layout paint/);
  assert.doesNotMatch(finalLayer, /overflow-y:(?:auto|scroll)/);
});

test('Street View initializes only after the inline detail requests a verified location', () => {
  const source = fs.readFileSync('explore/panorama.js', 'utf8');
  assert.match(source, /addEventListener\('khg:building-window-location'/);
  assert.doesNotMatch(source, /addEventListener\('khg:map-select-building'/);
});

test('both Explorer locales load the cache-busted Street View assets', () => {
  for (const file of ['explore/index.html','zh/explore/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /href="\/styles\.css\?v=25"/);
    assert.match(html, /src="\/explore\/building-window\.js\?v=25"/);
    assert.match(html, /src="\/explore\/panorama\.js\?v=25"/);
    assert.match(html, /src="\/explore\/explorer-utils\.js\?v=25"/);
  }
});
