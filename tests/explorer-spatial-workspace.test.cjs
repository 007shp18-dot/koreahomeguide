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
    assert.match(source, /resultsShell\.dataset\.workspaceState\s*=\s*explorerLevel/);
  }
});

test('desktop Explorer keeps map and discovery results inside one bounded workspace', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  const spatial = css.slice(css.indexOf('/* v27 choropleth Explorer workspace */'));
  assert.match(spatial, /\.map-first-workspace\{[^}]*height:calc\(100dvh - 148px\)[^}]*overflow:hidden/);
  assert.match(spatial, /\.map-first-workspace \.explorer-discovery-rail\{[^}]*position:absolute[^}]*top:16px[^}]*bottom:16px[^}]*width:370px[^}]*overflow:hidden/);
  assert.match(spatial, /\.map-first-workspace \.explorer-discovery-rail \.explorer-results\{[^}]*height:100%[^}]*overflow-y:auto/);
  assert.doesNotMatch(spatial, /height:auto;[^}]*overflow:visible/);
});

test('mobile Explorer uses a bounded map bottom sheet instead of a long document list', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  const spatial = css.slice(css.indexOf('/* v27 choropleth Explorer workspace */'));
  assert.match(spatial, /@media\(max-width:760px\)\{[\s\S]*?\.map-first-workspace\{[^}]*height:calc\(100dvh - 64px\)[^}]*overflow:hidden/);
  assert.match(spatial, /@media\(max-width:760px\)\{[\s\S]*?\.map-first-workspace \.explorer-discovery-rail\{[^}]*position:absolute[^}]*bottom:0[^}]*max-height:58dvh/);
});

test('both Explorer locales expose district and price controls for the map', () => {
  for (const file of ['explore/index.html','zh/explore/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /data-map-housing="officetel"[^>]*aria-pressed="true"/);
    assert.match(html, /data-map-metric="adjusted-per-sqm"[^>]*aria-pressed="true"/);
    assert.match(html, /data-map-legend-title/);
    assert.match(html, /data-map-legend-method/);
    assert.match(html, /id="districtList"/);
    assert.match(html, /data-workspace-state="districts"/);
    assert.match(html, /src="\/explore\/district-map\.js\?v=30"/);
  }
});

test('both locale runtimes use explicit district neighborhood and building states', () => {
  for (const file of ['explore/app.js','zh/explore/app.js']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /let explorerLevel = 'districts'/);
    assert.match(source, /function setExplorerLevel\(level/);
    assert.match(source, /\['districts','neighborhoods','buildings'\]/);
    assert.match(source, /khg:explorer-districts/);
    assert.match(source, /khg:map-select-district/);
  }
});

test('Street View loading and ready states share one stable media frame', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  const finalLayer = css.slice(css.indexOf('/* v19 Street View stability'));
  assert.match(finalLayer, /\.building-window-media-frame\{[^}]*aspect-ratio:16\/9/);
  assert.match(finalLayer, /\.building-window-media-frame\{[^}]*min-height:0/);
  assert.match(finalLayer, /\.building-status-window \.explorer-street-view-canvas\{[^}]*position:absolute[^}]*inset:0[^}]*width:100%[^}]*height:100%/);
  assert.doesNotMatch(finalLayer, /explorer-street-view-canvas\{[^}]*height:(?:120|126|170|190)px/);
});

test('building detail is a centered bounded modal with internal scrolling', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  const finalLayer = css.slice(css.indexOf('/* v28 centered building modal */'));
  assert.match(finalLayer, /\.building-status-overlay\{[^}]*position:fixed[^}]*display:grid[^}]*place-items:center/);
  assert.match(finalLayer, /\.building-status-window\{[^}]*width:min\(1080px,calc\(100vw - 32px\)\)[^}]*max-height:88dvh/);
  assert.match(finalLayer, /\.building-status-body\{[^}]*overflow-y:auto/);
  assert.match(finalLayer, /\.building-window-media-frame\{[^}]*aspect-ratio:16\/9/);
  assert.match(finalLayer, /\.building-status-close\{[^}]*min-width:44px[^}]*min-height:44px/);
});

test('Street View initializes only after the inline detail requests a verified location', () => {
  const source = fs.readFileSync('explore/panorama.js', 'utf8');
  assert.match(source, /addEventListener\('khg:building-window-location'/);
  assert.doesNotMatch(source, /addEventListener\('khg:map-select-building'/);
});

test('both Explorer locales load the cache-busted Street View assets', () => {
  for (const file of ['explore/index.html','zh/explore/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /href="\/styles\.css\?v=30"/);
    assert.match(html, /src="\/explore\/building-window\.js\?v=30"/);
    assert.match(html, /src="\/explore\/panorama\.js\?v=30"/);
    assert.match(html, /src="\/explore\/explorer-utils\.js\?v=30"/);
  }
});
