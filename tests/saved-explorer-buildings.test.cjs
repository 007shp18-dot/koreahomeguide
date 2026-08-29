const test = require('node:test');
const assert = require('node:assert/strict');
const { createStore } = require('../explore/saved-buildings.js');

test('saved building store toggles public identity and bounds persisted records', () => {
  const memory = new Map();
  const storage = { getItem:key => memory.get(key) || null, setItem:(key, value) => memory.set(key, value) };
  const store = createStore(storage, { limit:2 });
  store.toggle({ buildingKey:'a', buildingName:'A', districtCode:'11680', propertyType:'apartment', quoteRent:999 });
  store.toggle({ buildingKey:'b', buildingName:'B', districtCode:'11680', propertyType:'apartment' });
  store.toggle({ buildingKey:'c', buildingName:'C', districtCode:'11680', propertyType:'apartment' });
  assert.deepEqual(store.all().map(item => item.buildingKey), ['c','b']);
  assert.equal('quoteRent' in store.all()[0], false);
  assert.equal(store.toggle({ buildingKey:'b' }).saved, false);
  assert.deepEqual(store.all().map(item => item.buildingKey), ['c']);
});

test('saved building store recovers from malformed browser data', () => {
  const storage = { getItem:() => '{broken', setItem:() => {} };
  assert.deepEqual(createStore(storage).all(), []);
});
