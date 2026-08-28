const test = require('node:test');
const assert = require('node:assert/strict');

const Explorer = require('../explore/explorer-utils.js');

test('Explorer opens results first on mobile and keeps the map first on wider screens', () => {
  assert.equal(Explorer.initialViewForWidth(375), 'list');
  assert.equal(Explorer.initialViewForWidth(760), 'list');
  assert.equal(Explorer.initialViewForWidth(761), 'map');
  assert.equal(Explorer.initialViewForWidth(1440), 'map');
});

test('Explorer defaults safely to the map when a viewport width is unavailable', () => {
  assert.equal(Explorer.initialViewForWidth(undefined), 'map');
  assert.equal(Explorer.initialViewForWidth('unknown'), 'map');
});
