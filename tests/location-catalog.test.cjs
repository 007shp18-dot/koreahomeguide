const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../location-catalog.js');
const mapLocations = require('../explore/map-locations.js');

test('district labels preserve Korean search and contract names', () => {
  assert.equal(catalog.districtLabel('11680','en'), 'Gangnam-gu (강남구)');
  assert.equal(catalog.districtLabel('11680','zh-CN'), '江南区（강남구）');
  assert.equal(catalog.districtLabel('11440','en'), 'Mapo-gu (마포구)');
  assert.equal(catalog.districtLabel('11590','en'), 'Dongjak-gu (동작구)');
  assert.equal(catalog.districtLabel('11590','zh-CN'), '铜雀区（동작구）');
});

test('dong labels use established localized names and Korean references', () => {
  assert.equal(catalog.dongLabel('연남동','en'), 'Yeonnam-dong (연남동)');
  assert.equal(catalog.dongLabel('연남동','zh-CN'), '延南洞（연남동）');
  assert.equal(catalog.dongLabel('성수동1가','zh'), '圣水洞1街（성수동1가）');
  assert.equal(catalog.dongLabel('봉천동','en'), 'Bongcheon-dong (봉천동)');
  assert.equal(catalog.dongLabel('봉천동','zh-CN'), 'Bongcheon-dong（봉천동）');
});

test('the location catalog covers 231 curated legal dongs plus the supported Mullae aggregate', () => {
  assert.equal(Object.keys(catalog.DONGS).length, 232);
  assert.deepEqual(Object.keys(catalog.DONGS).filter(name => !mapLocations.neighborhood(name)), []);
  assert.equal(catalog.DONGS['신림동'].slug, 'sillim-dong');
  assert.equal(catalog.DONGS['압구정동'].en, 'Apgujeong-dong');
});

test('housing labels avoid globally misleading standalone villa copy', () => {
  assert.equal(catalog.propertyTypeLabel('officetel','en'), 'Officetel (오피스텔)');
  assert.equal(catalog.propertyTypeLabel('villa','en'), 'Villa / low-rise multifamily (연립·다세대)');
  assert.equal(catalog.propertyTypeLabel('studio','en'), 'Studio / one-room (원룸)');
});

test('unknown values use deterministic fallbacks', () => {
  assert.equal(catalog.districtLabel('99999','zh-CN'), '99999');
  assert.equal(catalog.dongLabel('새동','zh-CN'), '새동');
  assert.equal(catalog.propertyTypeLabel('new-type','en'), 'new-type');
});
