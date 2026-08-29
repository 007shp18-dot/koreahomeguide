const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const explorer = require('../explore/explorer-utils.js');

test('building sort keeps evidence default and offers adjusted square-metre and recent order', () => {
  const buildings = [
    { buildingKey:'a', contractCount:8, adjustedPerSqmWon:31_000, latestContractDate:'2026-05-01' },
    { buildingKey:'b', contractCount:3, adjustedPerSqmWon:24_000, latestContractDate:'2026-07-01' },
    { buildingKey:'c', contractCount:12, adjustedPerSqmWon:null, latestContractDate:'2026-06-01' }
  ];
  assert.deepEqual(explorer.sortBuildings(buildings, 'evidence').map(item => item.buildingKey), ['c', 'a', 'b']);
  assert.deepEqual(explorer.sortBuildings(buildings, 'adjusted-per-sqm').map(item => item.buildingKey), ['b', 'a', 'c']);
  assert.deepEqual(explorer.sortBuildings(buildings, 'recent').map(item => item.buildingKey), ['b', 'c', 'a']);
  assert.deepEqual(buildings.map(item => item.buildingKey), ['a', 'b', 'c']);
});

test('map viewport filters located points without inventing coordinates', () => {
  const viewport = require('../explore/map-viewport.js');
  const bounds = { north:37.6, south:37.5, east:127.1, west:126.9 };
  const models = [
    { id:'inside', lat:37.55, lng:127 },
    { id:'north', lat:37.7, lng:127 },
    { id:'missing', lat:null, lng:null }
  ];
  assert.deepEqual(viewport.filterModelsByBounds(models, bounds).map(item => item.id), ['inside']);
  const many = Array.from({ length:80 }, (_, index) => ({ id:`inside-${index}`, lat:37.55, lng:127 }));
  assert.equal(viewport.selectModelsForViewport(many, bounds, 80).length, 60);
  assert.equal(viewport.selectModelsForViewport([...many, models[1]], bounds, 10).length, 10);
  assert.equal(viewport.hasCompleteViewportCoverage({ markerScope:'building', locatedCount:36, totalCount:60 }), false);
  assert.equal(viewport.hasCompleteViewportCoverage({ markerScope:'building', locatedCount:60, totalCount:60 }), true);
  assert.equal(viewport.hasCompleteViewportCoverage({ markerScope:'neighborhood', locatedCount:15, totalCount:15 }), true);
});

test('workspace padding keeps selected markers clear of desktop panels', () => {
  const viewport = require('../explore/map-viewport.js');
  assert.deepEqual(viewport.workspacePadding({ viewportWidth:1440, mobile:false, drawerOpen:false }), { top:72, right:32, bottom:72, left:392 });
  assert.deepEqual(viewport.workspacePadding({ viewportWidth:1440, mobile:false, drawerOpen:true }), { top:72, right:552, bottom:72, left:392 });
  assert.deepEqual(viewport.workspacePadding({ viewportWidth:390, mobile:true, drawerOpen:true }), { top:56, right:32, bottom:300, left:32 });
});

test('building map pins use the same adjusted square-metre value as the list', () => {
  const controller = require('../explore/map-controller.js');
  const [model] = controller.buildBuildingMarkerModels({
    lawdCd:'11680',
    propertyType:'officetel',
    locale:'en',
    buildings:[{
      buildingKey:'역삼동::테스트', buildingName:'테스트', dong:'역삼동',
      lat:37.5, lng:127.03, contractCount:12, adjustedPerSqmWon:26_042
    }]
  });
  assert.equal(model.adjustedPerSqmWon, 26_042);
  assert.equal(controller.advancedPinVisual(model, false).glyphText, '₩26k');
});

test('both Explorer locales expose one map-first workspace and comparable controls', () => {
  for (const file of ['explore/index.html', 'zh/explore/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /class="explorer-map-layout[^\"]*map-first-workspace/);
    assert.match(html, /id="explorerSearchArea"/);
    assert.match(html, /id="explorerBuildingSort"/);
    assert.match(html, /id="metricPerSqm"/);
    assert.match(html, /id="explorerSheetToggle"/);
    assert.match(html, /src="\/explore\/map-viewport\.js"/);
  }
});

test('both Explorer locales merge map title actions and legend into one command bar', () => {
  for (const file of ['explore/index.html', 'zh/explore/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    const commandStart = html.indexOf('class="explorer-map-commandbar"');
    const toolbar = html.indexOf('class="explorer-map-toolbar"');
    const legend = html.indexOf('class="explorer-map-legend"');
    const surface = html.indexOf('class="explorer-map-surface"');
    assert.ok(commandStart >= 0, file);
    assert.ok(commandStart < toolbar && toolbar < legend && legend < surface, file);
  }
  const css = fs.readFileSync('styles.css', 'utf8');
  const finalPass = css.slice(css.indexOf('/* v18 unified Explorer command bar */'));
  assert.match(finalPass, /\.map-first-workspace \.explorer-map-commandbar\{[^}]*position:absolute/);
  assert.match(finalPass, /\.map-first-workspace \.explorer-map-legend\{[^}]*position:static/);
});

test('both Explorer locales version the drawer, Panorama and workspace CSS assets', () => {
  for (const file of ['explore/index.html', 'zh/explore/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /styles\.css\?v=25/, file);
    assert.match(html, /building-window\.js\?v=25/, file);
    assert.match(html, /panorama\.js\?v=25/, file);
  }
});

test('Explorer CSS gives the map most desktop space and mobile document-flow results', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /\.explorer-page\{max-width:1440px/);
  assert.match(css, /\.map-first-workspace\{[^}]*grid-template-columns:minmax\(0,1\.8fr\) minmax\(360px,1fr\)/);
  assert.match(css, /@media\(max-width:760px\)/);
  const start = css.indexOf('@media(max-width:760px)', css.indexOf('/* v22 P0 document-flow Explorer'));
  const finalMobile = css.slice(start, css.indexOf('/* v23 mobile Rent Check completion */'));
  assert.match(finalMobile, /grid-template-areas:"map" "main"/);
  assert.match(finalMobile, /\.explorer-map-main\{position:relative/);
  assert.match(css, /\.explorer-search-area/);
});

test('viewport-only list updates never republish markers or refit the map', () => {
  for (const file of ['explore/app.js','zh/explore/app.js']) {
    const app = fs.readFileSync(file, 'utf8');
    assert.match(app, /function renderDongs\(dongs, \{ publish = true \} = \{\}\)/);
    assert.match(app, /khg:map-viewport-change[\s\S]*?renderDongs\(currentAreaData\.dongs \|\| \[\], \{ publish:false \}\)/);
  }
  const map = fs.readFileSync('explore/map.js', 'utf8');
  assert.match(map, /function renderMarkers\(\{ fitViewport = true \} = \{\}\)/);
  assert.match(map, /const requestedBounds = currentMapBounds\(\)/);
  assert.match(map, /showBuildingLayer\(latestBuildingDetail, \{ reset:false, fitViewport:false, requestedBounds \}\)/);
  assert.match(map, /renderMarkers\(\{ fitViewport \}\)/);
  assert.match(map, /selectModelsForViewport\(known, requestedBounds, MAX_BUILDING_MARKERS\)/);
  assert.match(map, /Search this area/);
});
