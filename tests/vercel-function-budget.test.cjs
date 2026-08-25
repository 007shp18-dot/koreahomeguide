const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Hobby deployment keeps one function below the twelve-function ceiling', () => {
  const functionFiles = fs.readdirSync(path.join(__dirname, '..', 'api'))
    .filter(name => /\.(?:js|cjs|mjs)$/.test(name));

  assert.ok(
    functionFiles.length <= 11,
    `Expected at most 11 deployable API files, found ${functionFiles.length}: ${functionFiles.join(', ')}`
  );
});
