const test = require('node:test');
const assert = require('node:assert/strict');

const panorama = require('../explore/panorama.js');

test('NAVER panorama SDK resources load the core before the panorama module', () => {
  assert.equal(
    panorama.buildCoreSdkUrl('key with/slash'),
    'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=key%20with%2Fslash&submodules=geocoder'
  );
  assert.equal(panorama.PANORAMA_MODULE_URL, 'https://oapi.map.naver.com/openapi/v3/maps-panorama.js');
});

test('NAVER loader waits for the core before requesting the panorama module', async () => {
  const scripts = [];
  const windowObject = {
    document:{
      createElement(){
        const listeners = {};
        return {
          async:false,
          src:'',
          addEventListener(type, handler){ listeners[type] = handler; },
          fire(type){ listeners[type](); }
        };
      },
      head:{ appendChild(script){ scripts.push(script); } }
    },
    setTimeout,
    clearTimeout
  };

  const loaded = panorama.loadSdk(windowObject, 'browser-key');
  assert.equal(scripts.length, 1);
  assert.match(scripts[0].src, /maps\.js\?ncpKeyId=browser-key&submodules=geocoder$/);

  windowObject.naver = { maps:{} };
  scripts[0].fire('load');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(scripts.length, 2);
  assert.equal(scripts[1].src, panorama.PANORAMA_MODULE_URL);

  windowObject.naver.maps.Panorama = function Panorama() {};
  scripts[1].fire('load');
  await loaded;
});

test('street-view copy distinguishes a genuine empty result from an SDK failure', () => {
  const en = panorama.statusCopy(false);
  const zh = panorama.statusCopy(true);
  assert.equal(en.unavailable, 'No nearby street view is available for this building.');
  assert.equal(en.error, 'Street view could not be loaded. Please try again later.');
  assert.equal(zh.unavailable, '该建筑附近暂无可用街景。');
  assert.equal(zh.error, '街景暂时无法加载，请稍后再试。');
  assert.notEqual(en.error, en.unavailable);
  assert.notEqual(zh.error, zh.unavailable);
});

test('street-view caption makes the capture distance from the mapped building explicit', () => {
  const en = panorama.statusCopy(false);
  const zh = panorama.statusCopy(true);
  assert.equal(en.captured('2025.04', 167), 'Street view captured 2025.04 · 167 m from mapped building');
  assert.equal(zh.captured('2025.04', 167), '街景拍摄时间：2025.04 · 距地图中的建筑 167 米');
  assert.equal(en.captured('', null), 'Nearby street view');
  assert.equal(zh.captured('', null), '建筑附近街景');
});

test('panorama result keeps a nearby capture and its photo date', () => {
  const result = panorama.evaluateResult({
    status:'OK',
    target:{ lat:37.5665, lng:126.9780 },
    location:{ coord:{ lat:() => 37.5668, lng:() => 126.9780 }, photodate:'2025.04' }
  });
  assert.deepEqual(result, { available:true, photoDate:'2025.04', distanceMeters:33 });
});

test('panorama result keeps NAVER successful captures beyond the former 50 metre cutoff', () => {
  assert.deepEqual(panorama.evaluateResult({
    status:'OK',
    target:{ lat:37.5665, lng:126.9780 },
    location:{ coord:{ lat:() => 37.5680, lng:() => 126.9780 }, photodate:'2025.04' }
  }), { available:true, photoDate:'2025.04', distanceMeters:167 });
});

test('panorama result hides only a failed NAVER panorama lookup', () => {
  assert.deepEqual(
    panorama.evaluateResult({ status:'ERROR', target:{ lat:37.5, lng:127 }, location:null }),
    { available:false, photoDate:'', distanceMeters:null }
  );
});

test('panorama result keeps a successful viewer when location metadata is delayed', () => {
  assert.deepEqual(
    panorama.evaluateResult({ status:'OK', target:{ lat:37.5, lng:127 }, location:null }),
    { available:true, photoDate:'', distanceMeters:null }
  );
});

test('NAVER reverse-geocode result exposes only a matching legal-dong code', () => {
  const response = { v2:{ results:[{
    name:'legalcode', code:{ id:'1168010100' },
    region:{ area2:{ name:'강남구' }, area3:{ name:'역삼동' } }
  }] } };
  assert.equal(panorama.legalCodeFromResponse(response, { districtCode:'11680', dong:'역삼동' }), '1168010100');
  assert.equal(panorama.legalCodeFromResponse(response, { districtCode:'11440', dong:'역삼동' }), '');
  assert.equal(panorama.legalCodeFromResponse(response, { districtCode:'11680', dong:'논현동' }), '');
});

test('initial panorama bearing faces the selected building from the capture point', () => {
  assert.equal(panorama.bearingDegrees({ lat:0, lng:0 }, { lat:1, lng:0 }), 0);
  assert.equal(panorama.bearingDegrees({ lat:0, lng:0 }, { lat:0, lng:1 }), 90);
  assert.equal(panorama.bearingDegrees({ lat:0, lng:0 }, { lat:-1, lng:0 }), 180);
  assert.equal(panorama.bearingDegrees({ lat:0, lng:0 }, { lat:0, lng:-1 }), -90);
  assert.equal(Math.round(panorama.bearingDegrees({ lat:0, lng:0 }, { lat:1, lng:1 })), 45);
  assert.equal(panorama.bearingDegrees(null, { lat:1, lng:1 }), null);
});

test('NAVER LatLng instance methods keep their receiver during bearing calculation', () => {
  const capture = {
    _lat:37.5,
    _lng:127,
    lat() { return this._lat; },
    lng() { return this._lng; }
  };
  assert.equal(Math.round(panorama.bearingDegrees(capture, { lat:37.6, lng:127 })), 0);
  assert.equal(panorama.evaluateResult({
    status:'OK',
    target:{ lat:37.5001, lng:127 },
    location:{ coord:capture, photodate:'2026-07' }
  }).available, true);
});

test('panorama frame size stays 16 by 9 even when a hidden canvas reports zero height', () => {
  const element = {
    clientWidth:422,
    clientHeight:0,
    getBoundingClientRect() { return { width:422, height:0 }; }
  };
  assert.deepEqual(panorama.panoramaFrameSize(element), { width:422, height:237 });
});

test('successful panorama result synchronizes size and faces the building', async () => {
  const nodes = new Map();
  const classNames = new Set();
  const node = extra => ({
    hidden:false,
    dataset:{},
    textContent:'',
    clientWidth:422,
    clientHeight:0,
    replaceChildren() {},
    getBoundingClientRect() { return { width:422, height:0 }; },
    ...extra
  });
  nodes.set('#explorerStreetView', node());
  nodes.set('#explorerStreetViewCanvas', node({ hidden:true }));
  nodes.set('#explorerStreetViewStatus', node());
  nodes.set('#explorerStreetViewMeta', node());
  nodes.set('.building-status-window', node({ classList:{ add:value => classNames.add(value), remove:value => classNames.delete(value) } }));

  let panoramaInstance = null;
  const listeners = {};
  function Panorama(_canvas, options) {
    this.options = options;
    this.sizeCalls = [];
    this.povCalls = [];
    this.setSize = size => this.sizeCalls.push(size);
    this.setPov = pov => this.povCalls.push(pov);
    this.setVisible = () => {};
    this.getLocation = () => ({ coord:{ lat:() => 37.5, lng:() => 127.0 }, photodate:'2026.07' });
    panoramaInstance = this;
  }
  const windowObject = {
    document:{
      documentElement:{ lang:'en' },
      querySelector:selector => nodes.get(selector) || null
    },
    naver:{ maps:{
      Panorama,
      LatLng:function LatLng(lat, lng) { this.lat = lat; this.lng = lng; },
      Size:function Size(width, height) { this.width = width; this.height = height; },
      Event:{ addListener(_target, type, handler) { listeners[type] = handler; } }
    } },
    fetch:async () => ({ ok:true, json:async () => ({ naverKeyId:'key' }) }),
    addEventListener() {},
    dispatchEvent() {},
    setTimeout,
    clearTimeout
  };
  const controller = panorama.install(windowObject);
  await controller.show({ kind:'building', lat:37.501, lng:127.0, districtCode:'11680', propertyType:'officetel' });
  listeners.pano_status('OK');

  assert.equal(panoramaInstance.sizeCalls.at(-1).width, 422);
  assert.equal(panoramaInstance.sizeCalls.at(-1).height, 237);
  assert.equal(panoramaInstance.povCalls.at(-1).pan, 0);
  assert.equal(panoramaInstance.povCalls.at(-1).tilt, 0);
  assert.equal(panoramaInstance.povCalls.at(-1).fov, 90);
  assert.equal(classNames.has('has-street-view'), true);
});
