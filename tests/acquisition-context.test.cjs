const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ENTRY_CONTEXTS,
  findEntryContext,
  validatedEntrySource,
  validatedResultSource
} = require('../acquisition-context.js');

test('shared acquisition context contains only the 38 canonical entry pages', () => {
  assert.equal(ENTRY_CONTEXTS.length, 38);
  assert.equal(new Set(ENTRY_CONTEXTS.map(item => item.path)).size, 38);
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

test('guide and explorer hubs are recognized as bounded acquisition sources', () => {
  for (const path of ['/guides/','/explore/','/zh/guides/','/zh/explore/']) {
    assert.equal(findEntryContext(path).kind, 'hub', path);
    assert.equal(validatedEntrySource(path), path);
    assert.equal(validatedResultSource(path), path);
  }
});

test('dynamic Dong sources require a supported route, district, and property tuple', () => {
  const path = '/seoul/gangnam-gu/%EC%97%AD%EC%82%BC%EB%8F%99/officetel/';
  const zhPath = '/zh/seoul/mapo-gu/%EC%84%9C%EA%B5%90%EB%8F%99/villa/';
  assert.deepEqual(findEntryContext(path), {
    path,
    kind:'dong',
    districtSlug:'gangnam-gu',
    lawdCd:'11680',
    propertyType:'officetel'
  });
  assert.equal(validatedEntrySource(path, '11680', 'officetel'), path);
  assert.equal(validatedEntrySource(path, '11440', 'officetel'), '');
  assert.equal(validatedEntrySource(zhPath, '11440', 'villa'), zhPath);
  assert.equal(validatedResultSource(path), path);
  assert.equal(findEntryContext('/seoul/gangnam-gu/../officetel/'), null);
  assert.equal(findEntryContext('/seoul/not-seoul/%EC%97%AD%EC%82%BC%EB%8F%99/officetel/'), null);
  assert.equal(findEntryContext('/seoul/gangnam-gu/%2F/officetel/'), null);
});
