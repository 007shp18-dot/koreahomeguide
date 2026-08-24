const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('building detail is a non-indexed historical transaction view with a Rent Check handoff', () => {
  const html = fs.readFileSync('explore/building/index.html','utf8');
  assert.match(html, /<meta name="robots" content="noindex,follow">/);
  assert.match(html, /Historical signed rental transactions — not a live listing\./);
  for (const id of ['buildingName','buildingRent','buildingDeposit','buildingArea','buildingContracts','trendChart','recentBuildingContracts','rentCheckCta']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /G-6SXH5BREDP/);
  assert.doesNotMatch(html, /For rent|Book a viewing|Contact landlord/i);
});

test('building runtime loads the exact building detail, renders trend data, and builds a contextual Rent Check link', () => {
  const js = fs.readFileSync('explore/building/app.js','utf8');
  assert.match(js, /\/api\/explore-building/);
  assert.match(js, /monthlyTrend/);
  assert.match(js, /recentTransactions/);
  assert.match(js, /\/api\/fx/);
  assert.match(js, /\/tools\/seoul-rent-check\//);
  assert.match(js, /lawdCd/);
  assert.match(js, /type/);
});
