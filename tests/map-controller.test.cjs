const test = require('node:test');
const assert = require('node:assert/strict');
const controller = require('../explore/map-controller.js');

test('map SDK URL requests asynchronous loading and the advanced-marker library', () => {
  const url = new URL(controller.buildMapsSdkUrl({ apiKey:'browser key', callback:'maps-ready' }));
  assert.equal(url.origin + url.pathname, 'https://maps.googleapis.com/maps/api/js');
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    key:'browser key',
    v:'weekly',
    loading:'async',
    libraries:'marker',
    callback:'maps-ready',
    language:'en',
    region:'KR'
  });
});

test('map SDK follows the Explorer locale while keeping Korean regional bias', () => {
  const url = new URL(controller.buildMapsSdkUrl({ apiKey:'browser key', callback:'maps-ready', locale:'zh-CN' }));
  assert.equal(url.searchParams.get('language'), 'zh-CN');
  assert.equal(url.searchParams.get('region'), 'KR');
});

test('marker models preserve raw dong IDs and localize labels', () => {
  const models = controller.buildMarkerModels({ lawdCd:'11440', propertyType:'villa', locale:'zh-CN', dongs:[{ dong:'연남동', contractCount:12, contextualMedianMonthlyRentWon:900000, contextualMedianDepositWon:10000000 }] });
  assert.deepEqual(models, [{
    id:'dong:연남동',
    kind:'neighborhood',
    dong:'연남동',
    label:'延南洞（연남동）',
    lat:37.5624,
    lng:126.9217,
    districtCode:'11440',
    propertyType:'villa',
    contractCount:12,
    evidenceCount:12,
    rentWon:900000,
    depositWon:10000000,
    evidenceLevel:'strong',
    budgetStatus:'unfiltered',
    tone:'strong',
    scale:12
  }]);
});

test('building marker models preserve verified coordinates and building identity', () => {
  const [model] = controller.buildBuildingMarkerModels({
    lawdCd:'11680',
    propertyType:'apartment',
    locale:'en',
    buildings:[{
      buildingKey:'역삼동::테헤란아이파크',
      buildingName:'테헤란아이파크',
      dong:'역삼동',
      lat:37.5012,
      lng:127.0396,
      contractCount:14,
      contextualMedianMonthlyRentWon:2400000,
      contextualMedianDepositWon:100000000
    }]
  });

  assert.equal(model.kind, 'building');
  assert.equal(model.id, 'building:역삼동::테헤란아이파크');
  assert.equal(model.buildingKey, '역삼동::테헤란아이파크');
  assert.equal(model.buildingName, '테헤란아이파크');
  assert.equal(model.dong, '역삼동');
  assert.equal(model.lat, 37.5012);
  assert.equal(model.lng, 127.0396);
  assert.equal(model.contractCount, 14);
  assert.equal(model.rentWon, 2400000);
  assert.equal(model.depositWon, 100000000);
  assert.equal(model.evidenceLevel, 'strong');
});

test('budget marker uses matching deposit-band evidence and price context', () => {
  const [model] = controller.buildMarkerModels({
    lawdCd:'11440',
    propertyType:'apartment',
    locale:'en',
    limits:{ maxRent:1200000, maxDeposit:10000000 },
    dongs:[{
      dong:'연남동',
      contractCount:30,
      contextualMedianMonthlyRentWon:1500000,
      contextualMedianDepositWon:20000000,
      depositBands:[
        { medianMonthlyRentWon:1100000, medianDepositWon:10000000, count:8 },
        { medianMonthlyRentWon:900000, medianDepositWon:20000000, count:22 }
      ]
    }]
  });

  assert.equal(model.rentWon, 1100000);
  assert.equal(model.depositWon, 10000000);
  assert.equal(model.evidenceCount, 8);
  assert.equal(model.evidenceLevel, 'limited');
  assert.equal(model.budgetStatus, 'fit');
  assert.equal(model.tone, 'limited');
  assert.equal(model.scale, 10);
});

test('non-fitting neighborhood stays mapped with outside-budget classification', () => {
  const [model] = controller.buildMarkerModels({
    lawdCd:'11440',
    propertyType:'officetel',
    limits:{ maxRent:800000, maxDeposit:5000000 },
    dongs:[{
      dong:'연남동',
      contractCount:25,
      contextualMedianMonthlyRentWon:1300000,
      contextualMedianDepositWon:10000000
    }]
  });

  assert.equal(model.evidenceCount, 0);
  assert.equal(model.evidenceLevel, 'limited');
  assert.equal(model.budgetStatus, 'outside');
  assert.equal(model.tone, 'outside');
  assert.equal(model.rentWon, 1300000);
  assert.equal(model.depositWon, 10000000);
});

test('map analytics exposes only bounded decision context', () => {
  assert.deepEqual(controller.buildMapAnalyticsEvent('explorer_map_view', {
    locale:'zh-CN', lawdCd:'11440', propertyType:'villa', hasBudget:true,
    markerCount:12, fittingCount:8, budgetStatus:'fit', evidenceLevel:'strong',
    monthlyRentWon:900000, email:'person@example.com',
    pageLocation:'https://koreahomeguide.com/explore/?lawdCd=11440&type=villa&maxRent=1200000&maxDeposit=10000000'
  }), {
    locale:'zh-CN',
    district_code:'11440',
    property_type:'villa',
    marker_scope:'neighborhood',
    budget_filter:'active',
    marker_count:12,
    fitting_count:8,
    page_location:'https://koreahomeguide.com/explore/'
  });

  assert.deepEqual(controller.buildMapAnalyticsEvent('explorer_map_select', {
    locale:'en', lawdCd:'all', propertyType:'apartment', hasBudget:false,
    markerCount:200, fittingCount:200, budgetStatus:'unfiltered', evidenceLevel:'limited',
    pageLocation:'https://koreahomeguide.com/zh/explore/?maxRent=800000#map'
  }), {
    locale:'en-US',
    district_code:'all',
    property_type:'apartment',
    marker_scope:'neighborhood',
    budget_filter:'none',
    budget_status:'unfiltered',
    evidence_level:'limited',
    page_location:'https://koreahomeguide.com/zh/explore/'
  });
  assert.equal(controller.buildMapAnalyticsEvent('not_allowed', {}), null);
});

test('marker visuals map decision tones to accessible colors and preserve evidence scale', () => {
  assert.deepEqual(controller.markerVisual({ tone:'strong', scale:14 }), {
    fillColor:'#15803d',
    strokeColor:'#ffffff',
    fillOpacity:0.94,
    strokeWeight:2,
    scale:14
  });
  assert.deepEqual(controller.markerVisual({ tone:'limited', scale:10 }), {
    fillColor:'#b45309',
    strokeColor:'#ffffff',
    fillOpacity:0.94,
    strokeWeight:2,
    scale:10
  });
  assert.deepEqual(controller.markerVisual({ tone:'outside', scale:12 }), {
    fillColor:'#64748b',
    strokeColor:'#ffffff',
    fillOpacity:0.86,
    strokeWeight:2,
    scale:12
  });
  assert.equal(controller.markerVisual({ tone:'strong', scale:14 }, true).fillColor, '#2563eb');
  assert.equal(controller.markerVisual({ tone:'strong', scale:99 }).scale, 16);
});

test('advanced pin visuals preserve marker meaning, count, and selected state', () => {
  assert.deepEqual(controller.advancedPinVisual({ tone:'strong', scale:14, contractCount:12 }), {
    background:'#15803d',
    borderColor:'#ffffff',
    glyphColor:'#ffffff',
    glyphText:'12',
    glyphFontSize:'11px',
    scale:1.17
  });
  assert.equal(controller.advancedPinVisual({ tone:'outside', scale:10, contractCount:0 }).glyphText, '');
  assert.equal(controller.advancedPinVisual({ tone:'strong', scale:14, contractCount:1250 }).glyphText, '999+');
  assert.equal(controller.advancedPinVisual({ tone:'limited', scale:10, contractCount:8 }, true).background, '#2563eb');
});

test('advanced pin glyphs shrink as contract counts gain digits', () => {
  assert.equal(controller.advancedPinVisual({ contractCount:8 }).glyphFontSize, '11px');
  assert.equal(controller.advancedPinVisual({ contractCount:66 }).glyphFontSize, '11px');
  assert.equal(controller.advancedPinVisual({ contractCount:159 }).glyphFontSize, '10px');
  assert.equal(controller.advancedPinVisual({ contractCount:885 }).glyphFontSize, '10px');
  assert.equal(controller.advancedPinVisual({ contractCount:1250 }).glyphFontSize, '9px');
});

test('advanced marker badge applies the explicit digit-aware font outside Google pin internals', () => {
  const badge = { textContent:'', style:{} };
  const updated = controller.applyAdvancedMarkerBadge(badge, { tone:'strong', scale:14, contractCount:885 });

  assert.equal(updated, badge);
  assert.equal(badge.textContent, '885');
  assert.equal(badge.style.fontSize, '10px');
  assert.equal(badge.style.backgroundColor, '#15803d');
  assert.equal(badge.style.borderColor, '#ffffff');
  assert.equal(badge.style.transform, 'scale(1.17)');

  controller.applyAdvancedMarkerBadge(badge, { tone:'strong', scale:14, contractCount:885 }, true);
  assert.equal(badge.style.backgroundColor, '#2563eb');
});

test('advanced markers require a production map ID and runtime capability support', () => {
  const supportedMap = { getMapCapabilities:() => ({ isAdvancedMarkersAvailable:true }) };
  const unsupportedMap = { getMapCapabilities:() => ({ isAdvancedMarkersAvailable:false }) };
  const brokenMap = { getMapCapabilities:() => { throw new Error('not ready'); } };

  assert.equal(controller.advancedMarkersAvailable(supportedMap, 'production-map-id'), true);
  assert.equal(controller.advancedMarkersAvailable(unsupportedMap, 'production-map-id'), false);
  assert.equal(controller.advancedMarkersAvailable(supportedMap, 'DEMO_MAP_ID'), false);
  assert.equal(controller.advancedMarkersAvailable({}, 'production-map-id'), false);
  assert.equal(controller.advancedMarkersAvailable(brokenMap, 'production-map-id'), false);
});

test('missing neighborhood coordinates are omitted rather than guessed', () => {
  assert.deepEqual(controller.buildMarkerModels({ lawdCd:'11440', locale:'en', dongs:[{ dong:'없는동', contractCount:1 }] }), []);
});

test('all ten supported districts include mapped, localized legal neighborhoods', () => {
  const [model] = controller.buildMarkerModels({ lawdCd:'11620', locale:'en', dongs:[{ dong:'봉천동', contractCount:7 }] });
  assert.equal(model.label, 'Bongcheon-dong (봉천동)');
  assert.equal(model.districtCode, '11620');
  assert.equal(Number.isFinite(model.lat) && Number.isFinite(model.lng), true);
});

test('selection returns a new immutable state', () => {
  const before = { selectedDong:'', markerIds:['dong:연남동'] };
  const after = controller.selectDong(before, '연남동');
  assert.equal(before.selectedDong, '');
  assert.equal(after.selectedDong, '연남동');
});
