const assert = require('node:assert/strict');
const test = require('node:test');

const config = require('../vercel.json');

test('legacy KoreaHomeGuide does not deploy SignedPrice feature branches', () => {
  assert.equal(
    config.git?.deploymentEnabled?.['codex/signedprice-*'],
    false,
  );
});
