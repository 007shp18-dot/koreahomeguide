const assert = require('node:assert/strict');
const test = require('node:test');

const config = require('../vercel.json');

test('legacy KoreaHomeGuide keeps its deployed redirects without rebuilding on every app commit', () => {
  assert.equal(config.git?.deploymentEnabled, false);
});
