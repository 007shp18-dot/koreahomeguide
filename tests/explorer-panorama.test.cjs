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
  assert.equal(en.unavailable, 'No street view is available within 50 m of this building.');
  assert.equal(en.error, 'Street view could not be loaded. Please try again later.');
  assert.equal(zh.unavailable, '该建筑 50 米范围内暂无可用街景。');
  assert.equal(zh.error, '街景暂时无法加载，请稍后再试。');
  assert.notEqual(en.error, en.unavailable);
  assert.notEqual(zh.error, zh.unavailable);
});

test('nearby panorama guard rejects imagery more than 50 metres from the building', () => {
  const building = { lat:37.5665, lng:126.9780 };
  assert.equal(panorama.isNearby(building, { lat:37.5668, lng:126.9780 }), true);
  assert.equal(panorama.isNearby(building, { lat:37.5671, lng:126.9780 }), false);
  assert.equal(panorama.isNearby(building, null), false);
});

test('panorama result keeps a nearby capture and its photo date', () => {
  const result = panorama.evaluateResult({
    status:'OK',
    target:{ lat:37.5665, lng:126.9780 },
    location:{ coord:{ lat:() => 37.5668, lng:() => 126.9780 }, photodate:'2025.04' }
  });
  assert.deepEqual(result, { available:true, photoDate:'2025.04' });
});

test('panorama result hides failed and distant captures instead of showing a wrong building', () => {
  assert.deepEqual(panorama.evaluateResult({ status:'ERROR', target:{ lat:37.5, lng:127 }, location:null }), { available:false, photoDate:'' });
  assert.deepEqual(panorama.evaluateResult({
    status:'OK',
    target:{ lat:37.5665, lng:126.9780 },
    location:{ coord:{ lat:() => 37.5680, lng:() => 126.9780 }, photodate:'2025.04' }
  }), { available:false, photoDate:'' });
});
