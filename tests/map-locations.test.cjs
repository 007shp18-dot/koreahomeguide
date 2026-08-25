const test = require('node:test');
const assert = require('node:assert/strict');
const locations = require('../explore/map-locations.js');

test('all ten supported districts have finite Seoul coordinates', () => {
  for (const code of ['11680','11440','11170','11200','11560','11620','11230','11410','11290','11215']) {
    const point = locations.district(code);
    assert.ok(point);
    assert.ok(Number.isFinite(point.lat) && Number.isFinite(point.lng));
    assert.ok(point.lat > 37.4 && point.lat < 37.7);
    assert.ok(point.lng > 126.7 && point.lng < 127.2);
  }
});

test('curated SEO neighborhoods resolve by raw Korean name', () => {
  assert.deepEqual(locations.neighborhood('연남동'), { lat:37.5624, lng:126.9217 });
  assert.deepEqual(locations.centerFor('11440','unknown'), locations.district('11440'));
});
