const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../location-catalog.js');

test('district labels preserve Korean search and contract names', () => {
  assert.equal(catalog.districtLabel('11680','en'), 'Gangnam-gu (강남구)');
  assert.equal(catalog.districtLabel('11680','zh-CN'), '江南区（강남구）');
  assert.equal(catalog.districtLabel('11440','en'), 'Mapo-gu (마포구)');
});

test('dong labels use established localized names and Korean references', () => {
  assert.equal(catalog.dongLabel('연남동','en'), 'Yeonnam-dong (연남동)');
  assert.equal(catalog.dongLabel('연남동','zh-CN'), '延南洞（연남동）');
  assert.equal(catalog.dongLabel('성수동1가','zh'), '圣水洞1街（성수동1가）');
});

test('housing labels avoid globally misleading standalone villa copy', () => {
  assert.equal(catalog.propertyTypeLabel('officetel','en'), 'Officetel (오피스텔)');
  assert.equal(catalog.propertyTypeLabel('villa','en'), 'Low-rise multifamily / Villa (연립·다세대)');
  assert.equal(catalog.propertyTypeLabel('studio','en'), 'Studio / One-room (원룸)');
});

test('unknown values use deterministic fallbacks', () => {
  assert.equal(catalog.districtLabel('99999','zh-CN'), '99999');
  assert.equal(catalog.dongLabel('새동','zh-CN'), '새동');
  assert.equal(catalog.propertyTypeLabel('new-type','en'), 'new-type');
});
