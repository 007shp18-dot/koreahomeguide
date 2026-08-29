const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('Seoul district geometry contains one slugged feature per district', () => {
  const geo = JSON.parse(fs.readFileSync('data/seoul-districts.geojson', 'utf8'));
  assert.equal(geo.type, 'FeatureCollection');
  assert.equal(geo.features.length, 25);
  assert.equal(new Set(geo.features.map(feature => feature.properties.slug)).size, 25);
  assert.ok(geo.features.every(feature => /^\d{5}$/.test(feature.properties.districtCode)));
});

test('district rows expose the same server-computed metric used by map labels', () => {
  const districtMap = require('../explore/district-map.js');
  const row = districtMap.normalizeDistrict({
    districtCode:'11680', slug:'gangnam-gu', districtName:'Gangnam-gu',
    summary:{ adjustedPerSqmWon:37861, medianMonthlyRentWon:830000,
      medianDepositWon:20000000, totalContracts:2183, monthsUsed:6 }
  });
  assert.equal(districtMap.metricValue(row, 'adjusted-per-sqm'), 37861);
  assert.equal(districtMap.metricValue(row, 'monthly'), 830000);
  assert.equal(districtMap.metricValue(row, 'deposit'), 20000000);
  assert.equal(row.contractCount, 2183);
});

test('district metric ranges ignore missing evidence and use five stable steps', () => {
  const districtMap = require('../explore/district-map.js');
  const rows = [10, 20, null, 30, 40, 50].map((value, index) => ({
    districtCode:String(index), summary:{ adjustedPerSqmWon:value }
  }));
  const range = districtMap.metricRange(rows, 'adjusted-per-sqm');
  assert.deepEqual(range, { min:10, max:50 });
  assert.equal(districtMap.rampIndex(10, range), 0);
  assert.equal(districtMap.rampIndex(50, range), 4);
  assert.equal(districtMap.rampIndex(null, range), -1);
});
