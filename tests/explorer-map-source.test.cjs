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
    assert.match(source, /mapSelectionClose\.addEventListener\('click', \(\) => \{/);
    assert.doesNotMatch(source, /restoreArea/);
    assert.match(source, /function activateNeighborhood\(model/);
    assert.match(source, /KHGExplorer\.buildDongSeoUrl/);
    assert.match(source, /KHGExplorer\.buildBuildingDetailUrl/);
    assert.match(source, /khg:explorer-buildings/);
    assert.match(source, /khg:map-select-building/);
    assert.match(source, /areaSnapshotForDong\(currentAreaData, dong\)/);
    assert.match(source, /publishMapBuildings\(dong, snapshot\.buildings/);
    assert.match(source, /highlightMapCard\(model\.dong\)/);
    assert.match(source, /updateRentCheckHandoff\(\{ lawdCd:model\.districtCode, propertyType:model\.propertyType \}\)/);
    assert.match(source, /areaSelect\.addEventListener\('change',handleSelectionChange\)/);
    assert.match(source, /typeSelect\.addEventListener\('change',handleSelectionChange\)/);
    assert.match(source, /maxRentSelect\.addEventListener\('change',handleSelectionChange\)/);
    assert.match(source, /maxDepositSelect\.addEventListener\('change',handleSelectionChange\)/);
    assert.doesNotMatch(source, /scrollIntoView/);
    assert.match(source, /neighborhood-guide-link/);
  }
});

test('Chinese district rows sent to the map use localized catalog labels', () => {
  const source = fs.readFileSync('zh/explore/app.js','utf8');
  assert.match(source, /function publishMapDistricts\(districts\)[^]*districtName:KHGLocations\.districtLabel\(row\.districtCode, 'zh-CN'\)/);
});

test('map viewport movement never re-filters or re-renders the discovery rail', () => {
  for (const file of ['explore/app.js','zh/explore/app.js']) {
    const source = fs.readFileSync(file,'utf8');
    assert.doesNotMatch(source, /khg:map-viewport-change/);
    assert.doesNotMatch(source, /currentVisibleDongs|currentVisibleBuildingKeys/);
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
    assert.match(html, /id="explorerMapBack"/);
  }
});

test('Explorer relies on the complete area selector instead of a partial district chip list', () => {
  for (const file of ['explore/index.html','zh/explore/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /explorerChips|data-explore-area/, file);
  }
  for (const file of ['explore/app.js','zh/explore/app.js']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /explorerChips|data-explore-area/, file);
  }
});

test('building map layer verifies precise geocodes, caps candidates, and supports returning', () => {
  const source = fs.readFileSync('explore/map.js','utf8');
  assert.match(source, /importLibrary\('geocoding'\)/);
  assert.match(source, /\['ROOFTOP','GEOMETRIC_CENTER'\]/);
  assert.match(source, /!result\.partial_match/);
  assert.match(source, /distanceKm\(center, point\) <= 4/);
  assert.match(source, /locateBuildingCandidates/);
  assert.match(source, /buildingLayerRequestId/);
  assert.match(source, /zoom > 15/);
  assert.match(source, /buildingViewportPadding/);
  assert.match(source, /khg:explorer-buildings/);
  assert.match(source, /khg:map-select-building/);
  assert.match(source, /khg:map-back-neighborhoods/);
});

test('All-Seoul building layers keep the selected neighborhood district context', () => {
  const controller = require('../explore/map-controller.js');
  const context = controller.mapLayerContext(
    { lawdCd:'all', propertyType:'apartment', locale:'en' },
    { lawdCd:'11680', dong:'역삼동' },
    'building'
  );
  const [model] = controller.buildBuildingMarkerModels({
    ...context,
    buildings:[{ buildingKey:'역삼동::테스트', buildingName:'테스트', dong:'역삼동', lat:37.5, lng:127, contractCount:3 }]
  });
  assert.equal(context.lawdCd, '11680');
  assert.equal(model.districtCode, '11680');
  const source = fs.readFileSync('explore/map.js', 'utf8');
  assert.match(source, /function activeBuildingContext\(item = null\)/);
  assert.match(source, /latestBuildingDetail \|\| itemContext/);
  assert.match(source, /buildingGeocodeQueries\(item\)[\s\S]*?activeBuildingContext\(item\)/);
});

test('opening a building from the mobile list starts the lazy map before locating street view', () => {
  const source = fs.readFileSync('explore/map.js','utf8');
  assert.match(source, /async function publishBuildingWindowLocation\(selection\)/);
  assert.match(source, /if \(!map && !started\) await start\(\)/);
  assert.match(source, /void publishBuildingWindowLocation\(selection\)/);
});

test('building locator fills a useful map progressively without geocoding every reported building', async () => {
  const controller = require('../explore/map-controller.js');
  const buildings = Array.from({ length:88 }, (_, index) => ({
    buildingKey:`building-${index + 1}`,
    mapLocation:{ buildingName:`Building ${index + 1}` }
  }));
  let attempts = 0;
  const located = await controller.locateBuildingCandidates(buildings, async building => {
    attempts += 1;
    return Number(building.buildingKey.split('-')[1]) % 2 === 0 ? { lat:37.5, lng:127 } : null;
  });

  assert.equal(attempts, 60);
  assert.equal(located.length, 30);
  assert.equal(located[0].buildingKey, 'building-2');
  assert.equal(located.at(-1).buildingKey, 'building-60');
});

test('building locator stops after 36 verified markers instead of spending the full candidate budget', async () => {
  const controller = require('../explore/map-controller.js');
  const buildings = Array.from({ length:88 }, (_, index) => ({
    buildingKey:`building-${index + 1}`,
    mapLocation:{ buildingName:`Building ${index + 1}` }
  }));
  let attempts = 0;
  const located = await controller.locateBuildingCandidates(buildings, async () => {
    attempts += 1;
    return { lat:37.5, lng:127 };
  });

  assert.equal(attempts, 36);
  assert.equal(located.length, 36);
});

test('building geocoding tries precise official addresses before a building-name fallback', () => {
  const controller = require('../explore/map-controller.js');
  const queries = controller.buildingGeocodeQueries({
    mapLocation:{ buildingName:'역삼래미안', dong:'역삼동', jibun:'757', roadAddress:'선릉로69길 19' }
  }, '강남구');

  assert.deepEqual(queries, [
    '서울특별시 강남구 선릉로69길 19',
    '서울특별시 강남구 역삼동 757',
    '역삼래미안, 역삼동, 강남구, 서울특별시'
  ]);
});

test('Explorer building lists reveal ten recent named buildings at a time', () => {
  for (const file of ['explore/app.js','zh/explore/app.js']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /buildingVisibleCount = 10/, file);
    assert.match(source, /items\.slice\(0, buildingVisibleCount\)/, file);
  }
});

test('map details panel can be moved without leaving the map surface', () => {
  const source = fs.readFileSync('explore/map.js','utf8');
  assert.match(source, /explorerMapSelectionDrag/);
  assert.match(source, /setPointerCapture/);
  assert.match(source, /clampPanelPosition/);
  assert.match(source, /ArrowLeft/);
  assert.match(source, /mobileMapLayout\(\)/);
  assert.match(source, /if \(mobileMapLayout\(\)\) \{ resetSelectionPanelPosition\(\); return; \}/);
  for (const file of ['explore/index.html','zh/explore/index.html']) {
    assert.match(fs.readFileSync(file,'utf8'), /id="explorerMapSelectionDrag"/);
  }
});
