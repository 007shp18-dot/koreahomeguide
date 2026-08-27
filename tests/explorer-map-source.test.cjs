const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('map adapter is lazy and has explicit failure states', () => {
  const source = fs.readFileSync('explore/map.js','utf8');
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /\/api\/maps-config/);
  assert.match(source, /buildMapsSdkUrl/);
  assert.match(source, /Map temporarily unavailable/);
});

test('map adapter applies decision visuals and emits bounded view and selection events', () => {
  const source = fs.readFileSync('explore/map.js','utf8');
  assert.match(source, /KHGMapController\.markerVisual\(model, selected\)/);
  assert.match(source, /google\.maps\.SymbolPath\.CIRCLE/);
  assert.match(source, /buildMapAnalyticsEvent\(name, context\)/);
  assert.match(source, /safeTrack\('explorer_map_view'/);
  assert.match(source, /safeTrack\('explorer_map_select'/);
  assert.match(source, /detail:\{ dong:model\.dong, model \}/);
  assert.match(source, /AdvancedMarkerElement/);
  assert.doesNotMatch(source, /PinElement/);
  assert.match(source, /document\.createElement\('span'\)/);
  assert.match(source, /applyAdvancedMarkerBadge/);
  assert.match(source, /config\.mapId/);
  assert.match(source, /advancedMarkersAvailable\(map, configuredMapId\)/);
  assert.match(source, /gmpClickable:true/);
  assert.match(source, /addEventListener\('gmp-click'/);
  assert.match(source, /mapcapabilities_changed/);
});

test('Explorer runtimes publish raw dong models after rendering', () => {
  for (const file of ['explore/app.js','zh/explore/app.js']) {
    const source = fs.readFileSync(file,'utf8');
    assert.match(source, /khg:explorer-dongs/);
    assert.match(source, /data-dong=/);
    assert.match(source, /khg:map-select-dong/);
    assert.match(source, /propertyType:typeSelect\.value/);
    assert.match(source, /limits:budgetValues\(\)/);
    assert.match(source, /publishMapDongs\(allItems\)/);
    assert.match(source, /function renderMapSelection\(model\)/);
    assert.match(source, /function clearMapSelection\(\)/);
    assert.match(source, /function highlightMapCard\(dong\)/);
    assert.match(source, /function setExplorerView\(view = 'map'\)/);
    assert.match(source, /explorerViewButtons\.forEach/);
    assert.match(source, /mapSelectionClose\.addEventListener\('click', clearMapSelection\)/);
    assert.match(source, /mapSelectionDetail\.href = KHGExplorer\.buildDongSeoUrl/);
    assert.match(source, /highlightMapCard\(model\.dong\)/);
    assert.match(source, /updateRentCheckHandoff\(\{ lawdCd:model\.districtCode, propertyType:model\.propertyType \}\)/);
    assert.match(source, /areaSelect\.addEventListener\('change',handleSelectionChange\)/);
    assert.match(source, /typeSelect\.addEventListener\('change',handleSelectionChange\)/);
    assert.match(source, /maxRentSelect\.addEventListener\('change',handleSelectionChange\)/);
    assert.match(source, /maxDepositSelect\.addEventListener\('change',handleSelectionChange\)/);
    assert.doesNotMatch(source, /scrollIntoView/);
  }
});

test('map adapter clears selected markers and overrides automatic page-location query capture', () => {
  const source = fs.readFileSync('explore/map.js','utf8');
  assert.match(source, /pageLocation:window\.location\.href/);
  assert.match(source, /khg:map-clear-selection/);
  assert.match(source, /highlight\('', false\)/);
});

test('Explorer pages load map dependencies before their locale runtime', () => {
  for (const file of ['explore/index.html','zh/explore/index.html']) {
    const html = fs.readFileSync(file,'utf8');
    for (const script of ['/explore/map-locations.js','/explore/map-controller.js','/explore/map.js']) assert.ok(html.includes(script), `${file}: ${script}`);
  }
});
