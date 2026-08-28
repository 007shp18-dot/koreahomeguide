const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
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

test('studio quotes can be saved and localized', () => {
  const result = saved.normalizeQuote(quote({ propertyType:'studio' }), {
    now:Date.UTC(2026, 7, 27), idFactory:() => 'studio-1'
  });
  assert.equal(result.propertyType, 'studio');
  assert.equal(saved.propertyLabel('studio', 'en'), 'Studio / One-room');
  assert.equal(saved.propertyLabel('studio', 'zh-CN'), '单间 / One-room');
});

test('new Seoul districts survive save, compare labels, and recheck normalization', () => {
  const result = saved.normalizeQuote(quote({ districtCode:'11710' }), {
    now:Date.UTC(2026, 7, 28), idFactory:() => 'songpa-1'
  });
  assert.equal(result.districtCode, '11710');
  assert.equal(saved.districtLabel('11710', 'en'), 'Songpa-gu');
  assert.equal(saved.districtLabel('11710', 'zh-CN'), '松坡区');
  assert.equal(saved.normalizeQuote(quote({ districtCode:'11110' })).districtCode, '11110');
});

test('a missing browser district catalog never erases existing saved quotes', () => {
  const source = fs.readFileSync('saved-rent-quotes.js', 'utf8');
  const existing = JSON.stringify([{
    ...quote(), id:'existing-1', label:'Mapo A', savedAt:'2026-08-28T00:00:00.000Z', expiresAt:'2099-01-01T00:00:00.000Z'
  }]);
  let stored = existing;
  let writes = 0;
  const storage = {
    getItem:() => stored,
    setItem:(_key, value) => { stored = value; writes += 1; },
    removeItem:() => {}
  };
  const root = { localStorage:storage };
  vm.runInNewContext(source, { window:root, globalThis:root, console });
  const store = root.KHGSavedQuotes.createStore({ storage });
  const listed = store.list();
  assert.equal(Array.isArray(listed), true);
  assert.equal(listed.length, 0);
  assert.equal(writes, 0);
  assert.equal(stored, existing);
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

test('store updates an identical labeled quote instead of adding a duplicate', () => {
  const storage = memoryStorage();
  let clock = Date.UTC(2026, 7, 27);
  let id = 0;
  const store = saved.createStore({ storage, now:() => clock++, idFactory:() => `q-${++id}` });
  const first = store.save(quote({ label:'Mapo A', medianValueWon:1_100_000 }));
  const updated = store.save(quote({ label:'  Mapo A  ', medianValueWon:1_250_000 }));
  assert.equal(store.list().length, 1);
  assert.equal(updated.id, first.id);
  assert.equal(store.list()[0].medianValueWon, 1_250_000);
  const separate = store.save(quote({ label:'Mapo B' }));
  assert.notEqual(separate.id, first.id);
  assert.equal(store.list().length, 2);
});

test('store edits only the saved home label', () => {
  const storage = memoryStorage();
  const store = saved.createStore({ storage, now:() => Date.UTC(2026, 7, 27), idFactory:() => 'q-1' });
  const original = store.save(quote({ label:'Old label' }));
  const updated = store.updateLabel(original.id, '  New\u0000 label  ');
  assert.equal(updated.label, 'New label');
  assert.equal(updated.id, original.id);
  assert.equal(updated.depositWon, original.depositWon);
  assert.equal(store.updateLabel('missing', 'Nope'), null);
});

test('saved quotes keep optional management fees and favorite state without changing old quotes', () => {
  const now = Date.UTC(2026, 7, 28);
  const oldQuote = saved.normalizeQuote(quote(), { now, idFactory:() => 'old-q' });
  assert.equal(oldQuote.managementFeeWon, null);
  assert.equal(oldQuote.isFavorite, false);

  const enriched = saved.normalizeQuote(quote({ managementFeeWon:150000, isFavorite:true }), {
    now, idFactory:() => 'new-q'
  });
  assert.equal(enriched.managementFeeWon, 150000);
  assert.equal(enriched.isFavorite, true);
  assert.equal(saved.normalizeQuote(quote({ managementFeeWon:-1 })).managementFeeWon, null);
});

test('store updates comparison details and derives fixed monthly cost only when fee is known', () => {
  const storage = memoryStorage();
  const store = saved.createStore({ storage, now:() => Date.UTC(2026, 7, 28), idFactory:() => 'q-1' });
  const original = store.save(quote({ label:'Mapo A' }));
  assert.equal(saved.fixedMonthlyCostWon(original), null);

  const updated = store.updateComparisonDetails(original.id, { managementFeeWon:180000, isFavorite:true });
  assert.equal(updated.managementFeeWon, 180000);
  assert.equal(updated.isFavorite, true);
  assert.equal(saved.fixedMonthlyCostWon(updated), 1380000);
  assert.equal(updated.label, original.label);
  assert.equal(store.updateComparisonDetails('missing', { managementFeeWon:1 }), null);
});

test('comparison priority keeps favorites first and then lower known fixed monthly costs', () => {
  const values = [
    saved.normalizeQuote(quote({ id:'unknown', managementFeeWon:null }), { idFactory:() => 'unknown' }),
    saved.normalizeQuote(quote({ id:'lower', monthlyRentWon:900000, managementFeeWon:100000 }), { idFactory:() => 'lower' }),
    saved.normalizeQuote(quote({ id:'favorite', monthlyRentWon:1400000, managementFeeWon:200000, isFavorite:true }), { idFactory:() => 'favorite' })
  ];
  assert.deepEqual(saved.sortForComparison(values).map(item => item.id), ['favorite', 'lower', 'unknown']);
});

test('lowest known monthly cost requires at least two complete totals', () => {
  const knownA = saved.normalizeQuote(quote({ monthlyRentWon:900000, managementFeeWon:100000 }));
  const knownB = saved.normalizeQuote(quote({ monthlyRentWon:1100000, managementFeeWon:150000 }));
  const unknown = saved.normalizeQuote(quote({ monthlyRentWon:800000, managementFeeWon:null }));
  assert.equal(saved.lowestKnownMonthlyCost([knownA, knownB, unknown]), 1000000);
  assert.equal(saved.lowestKnownMonthlyCost([knownA, unknown]), null);
});

test('comparison selection limit is three on mobile and four on wider screens', () => {
  assert.equal(saved.comparisonSelectionLimit(true), 3);
  assert.equal(saved.comparisonSelectionLimit(false), 4);
});

test('management fee input distinguishes unknown, zero, valid, and invalid amounts', () => {
  assert.deepEqual(saved.parseManagementFeeWon(''), { valid:true, value:null });
  assert.deepEqual(saved.parseManagementFeeWon('0'), { valid:true, value:0 });
  assert.deepEqual(saved.parseManagementFeeWon('150000'), { valid:true, value:150000 });
  assert.deepEqual(saved.parseManagementFeeWon('-1'), { valid:false, value:null });
  assert.deepEqual(saved.parseManagementFeeWon('100000001'), { valid:false, value:null });
  assert.deepEqual(saved.parseManagementFeeWon('not-a-number'), { valid:false, value:null });
});

test('saving a checked quote again preserves its private comparison details', () => {
  const storage = memoryStorage();
  let clock = Date.UTC(2026, 7, 28);
  const store = saved.createStore({ storage, now:() => clock++, idFactory:() => 'q-1' });
  const original = store.save(quote({ label:'Mapo A' }));
  store.updateComparisonDetails(original.id, { managementFeeWon:170000, isFavorite:true });
  const refreshed = store.save(quote({ label:'Mapo A', comparableCount:30 }));
  assert.equal(refreshed.managementFeeWon, 170000);
  assert.equal(refreshed.isFavorite, true);
  assert.equal(refreshed.comparableCount, 30);
});

test('rechecking an edited quote updates its stable saved id without duplicating or losing details', () => {
  const storage = memoryStorage();
  const session = memoryStorage();
  let clock = Date.UTC(2026, 7, 28);
  const store = saved.createStore({ storage, now:() => clock++, idFactory:() => 'q-1' });
  const original = store.save(quote({ label:'Mapo A' }));
  store.updateLabel(original.id, 'Mapo B');
  const edited = store.updateComparisonDetails(original.id, { managementFeeWon:170000, isFavorite:true });

  assert.equal(saved.writeRecheckPrefill(session, edited, { now:clock }), true);
  const prefill = saved.takeRecheckPrefill(session, { now:clock + 1 });
  assert.equal(prefill.savedQuoteId, original.id);
  const refreshed = store.save(quote({ id:prefill.savedQuoteId, label:'Mapo default', comparableCount:31 }));

  assert.equal(store.list().length, 1);
  assert.equal(refreshed.id, original.id);
  assert.equal(refreshed.label, 'Mapo B');
  assert.equal(refreshed.managementFeeWon, 170000);
  assert.equal(refreshed.isFavorite, true);
  assert.equal(refreshed.comparableCount, 31);
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

test('recheck prefill is private, short-lived, and consumed once', () => {
  const storage = memoryStorage();
  const now = Date.UTC(2026, 7, 27, 10);
  assert.equal(saved.writeRecheckPrefill(storage, quote({ label:'Private label' }), { now }), true);
  const raw = storage.values.get(saved.RECHECK_STORAGE_KEY);
  assert.doesNotMatch(raw, /Private label|medianValueWon|differencePct/);
  assert.deepEqual(saved.takeRecheckPrefill(storage, { now:now + 1000 }), {
    lawdCd:'11440', type:'officetel', depositWon:10000000, rentWon:1200000, areaSqm:25,
    from:'/saved-homes/'
  });
  assert.equal(saved.takeRecheckPrefill(storage, { now:now + 2000 }), null);
  saved.writeRecheckPrefill(storage, quote(), { now });
  assert.equal(saved.takeRecheckPrefill(storage, { now:now + saved.RECHECK_TTL_MS + 1 }), null);
});

test('comparison visit marker detects a return only after the cooldown', () => {
  const storage = memoryStorage();
  const start = Date.UTC(2026, 7, 27, 10);
  assert.equal(saved.markComparisonVisit(storage, { now:start }), false);
  assert.equal(saved.markComparisonVisit(storage, { now:start + saved.RETURN_VISIT_MS - 1 }), false);
  assert.equal(saved.markComparisonVisit(storage, { now:start + saved.RETURN_VISIT_MS + 1 }), true);
});
