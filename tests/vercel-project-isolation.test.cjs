const assert = require('node:assert/strict');
const test = require('node:test');

const config = require('../vercel.json');

test('legacy KoreaHomeGuide has no repository-managed deployment exclusions', () => {
  assert.equal(config.git?.deploymentEnabled, undefined);
});
