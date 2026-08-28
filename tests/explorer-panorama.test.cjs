const test = require('node:test');
const assert = require('node:assert/strict');

const panorama = require('../explore/panorama.js');

test('NAVER panorama SDK URL encodes the public key and loads only the panorama module', () => {
  assert.equal(
    panorama.buildSdkUrl('key with/slash'),
    'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=key%20with%2Fslash&submodules=panorama'
  );
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
