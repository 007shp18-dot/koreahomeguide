const test = require('node:test');
const assert = require('node:assert/strict');
const controller = require('../explore/map-controller.js');

test('marker models preserve raw dong IDs and localize labels', () => {
  const models = controller.buildMarkerModels({ lawdCd:'11440', locale:'zh-CN', dongs:[{ dong:'연남동', contractCount:12 }] });
  assert.deepEqual(models, [{ id:'dong:연남동', dong:'연남동', label:'延南洞（연남동）', lat:37.5624, lng:126.9217, contractCount:12 }]);
});

test('missing neighborhood coordinates are omitted rather than guessed', () => {
  assert.deepEqual(controller.buildMarkerModels({ lawdCd:'11440', locale:'en', dongs:[{ dong:'없는동', contractCount:1 }] }), []);
});

test('selection returns a new immutable state', () => {
  const before = { selectedDong:'', markerIds:['dong:연남동'] };
  const after = controller.selectDong(before, '연남동');
  assert.equal(before.selectedDong, '');
  assert.equal(after.selectedDong, '연남동');
});
