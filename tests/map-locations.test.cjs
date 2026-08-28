const test = require('node:test');
const assert = require('node:assert/strict');
const locations = require('../explore/map-locations.js');

test('all fifteen supported districts have finite Seoul coordinates', () => {
  for (const code of ['11680','11440','11170','11200','11560','11620','11230','11410','11290','11215','11650','11710','11740','11110','11140']) {
    const point = locations.district(code);
    assert.ok(point);
    assert.ok(Number.isFinite(point.lat) && Number.isFinite(point.lng));
    assert.ok(point.lat > 37.4 && point.lat < 37.7);
    assert.ok(point.lng > 126.7 && point.lng < 127.2);
  }
});

test('each newly supported district has a curated representative neighborhood center', () => {
  for (const dong of ['서초동','잠실동','천호동','숭인동','신당동']) {
    const point = locations.neighborhood(dong);
    assert.ok(point, `${dong} has a map center`);
    assert.ok(Number.isFinite(point.lat) && Number.isFinite(point.lng));
  }
});

test('new districts map a useful set of common rental neighborhoods', () => {
  const names = [
    '서초동','반포동','잠원동','방배동','양재동',
    '잠실동','송파동','가락동','문정동','방이동',
    '천호동','성내동','암사동','명일동','고덕동',
    '숭인동','창신동','무악동','내수동','혜화동',
    '신당동','황학동','중림동','순화동','장충동2가'
  ];
  for (const name of names) assert.ok(locations.neighborhood(name), `${name} has a map center`);
});

test('curated SEO neighborhoods resolve by raw Korean name', () => {
  assert.deepEqual(locations.neighborhood('연남동'), { lat:37.5624, lng:126.9217 });
  assert.deepEqual(locations.centerFor('11440','unknown'), locations.district('11440'));
});
