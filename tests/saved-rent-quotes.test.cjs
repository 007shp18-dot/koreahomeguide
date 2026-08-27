const test = require('node:test');
const assert = require('node:assert/strict');
const saved = require('../saved-rent-quotes.js');

function quote(overrides = {}) {
  return {
    districtCode:'11440', propertyType:'officetel', depositWon:10000000,
    monthlyRentWon:1200000, areaSqm:25, rating:'fair', confidence:'medium',
    medianValueWon:1180000, differencePct:1.7, comparableCount:12,
    dataThroughMonth:'2026-07', ...overrides
  };
}

function memoryStorage() {
  const values = new Map();
  return {
    getItem:key => values.get(key) || null,
    setItem:(key, value) => values.set(key, value),
    removeItem:key => values.delete(key), values
  };
}

test('normalizes only supported, bounded rent-check fields and sanitizes labels', () => {
  const result = saved.normalizeQuote(quote({ label:'  Mapo\u0000 broker phone  010  ', email:'private@example.com' }), {
    now:Date.UTC(2026, 7, 27), idFactory:() => 'quote-1'
  });
  assert.equal(result.id, 'quote-1');
  assert.equal(result.label, 'Mapo broker phone 010');
  assert.equal(Object.hasOwn(result, 'email'), false);
  assert.equal(Object.hasOwn(result, 'address'), false);
  assert.equal(Date.parse(result.expiresAt) - Date.parse(result.savedAt), saved.RETENTION_MS);
  assert.equal(saved.normalizeQuote(null), null);
  assert.equal(saved.normalizeQuote(quote({ districtCode:'99999' })), null);
});

test('store keeps at most eight newest quotes and supports remove and clear', () => {
  const storage = memoryStorage();
  let clock = Date.UTC(2026, 7, 27);
  let id = 0;
  const store = saved.createStore({ storage, now:() => clock++, idFactory:() => `q-${++id}` });
  for (let index = 0; index < 10; index += 1) store.save(quote({ label:`Home ${index}` }));
  assert.equal(store.list().length, saved.MAX_QUOTES);
  assert.equal(store.list()[0].label, 'Home 9');
  const removed = store.list()[2].id;
  assert.equal(store.remove(removed), true);
  assert.equal(store.list().some(item => item.id === removed), false);
  assert.equal(store.clear(), true);
  assert.deepEqual(store.list(), []);
});

test('expired quotes are pruned on read', () => {
  const storage = memoryStorage();
  const now = Date.UTC(2026, 7, 27);
  storage.setItem(saved.STORAGE_KEY, JSON.stringify([
    saved.normalizeQuote(quote({ id:'old', savedAt:'2026-01-01T00:00:00.000Z', expiresAt:'2026-02-01T00:00:00.000Z' }), { now }),
    saved.normalizeQuote(quote({ id:'current' }), { now })
  ]));
  const store = saved.createStore({ storage, now:() => now });
  assert.deepEqual(store.list().map(item => item.id), ['current']);
});

test('analytics uses only a saved-count bucket', () => {
  assert.equal(saved.countBucket(0), '0');
  assert.equal(saved.countBucket(2), '2');
  assert.equal(saved.countBucket(3), '3+');
});
