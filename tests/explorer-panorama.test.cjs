const test = require('node:test');
const assert = require('node:assert/strict');

const panorama = require('../explore/panorama.js');

test('NAVER panorama SDK resources load the core before the panorama module', () => {
  assert.equal(
    panorama.buildCoreSdkUrl('key with/slash'),
    'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=key%20with%2Fslash'
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
  assert.match(scripts[0].src, /maps\.js\?ncpKeyId=browser-key$/);

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
