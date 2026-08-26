const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ENTRY_CONTEXTS,
  findEntryContext,
  validatedEntrySource,
  validatedResultSource
} = require('../acquisition-context.js');

test('shared acquisition context contains only the 37 canonical entry pages', () => {
  assert.equal(ENTRY_CONTEXTS.length, 37);
  assert.equal(new Set(ENTRY_CONTEXTS.map(item => item.path)).size, 37);
  assert.equal(findEntryContext('/guides/wolse-vs-jeonse').kind, 'guide');
  assert.equal(findEntryContext('/rent/gangnam-gu/apartment/').lawdCd, '11680');
  assert.equal(findEntryContext('/guides/not-real/'), null);
  assert.equal(findEntryContext('/rent/not-a-district/apartment/'), null);
});

test('market attribution requires one matching path, district, and property tuple', () => {
  assert.equal(
    validatedEntrySource('/rent/gangnam-gu/apartment/', '11680', 'apartment'),
    '/rent/gangnam-gu/apartment/'
  );
  assert.equal(validatedEntrySource('/rent/gangnam-gu/apartment/', '11440', 'villa'), '');
  assert.equal(validatedEntrySource('/rent/not-a-district/apartment/', '11680', 'apartment'), '');
});

test('result attribution preserves a known entry after the user changes quote filters', () => {
  assert.equal(
    validatedResultSource('/rent/gangnam-gu/apartment/', '11440', 'villa'),
    '/rent/gangnam-gu/apartment/'
  );
  assert.equal(
    validatedResultSource('/tools/seoul-rent-check/', '11440', 'villa'),
    '/tools/seoul-rent-check/'
  );
  assert.equal(validatedResultSource('/admin/', '11440', 'villa'), '');
});
