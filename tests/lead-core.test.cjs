const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeLeadPayload, normalizeEmail, normalizeLocale } = require('../lib/lead-core.cjs');

test('normalizes email and accepts a valid lead_capture payload', () => {
  const result = normalizeLeadPayload({
    kind:'lead_capture', email:'  USER@Example.COM ', language:'en', districtCode:'11440', propertyType:'villa',
    depositWon:10000000, monthlyRentWon:800000, areaSqm:25, rating:'fair', confidence:'medium',
    askingValueWon:800000, medianValueWon:780000, differencePct:2.6, comparableCount:14, monthsUsed:6,
    dataThroughMonth:'2026-07', sourcePage:'/tools/seoul-rent-check/'
  }, new Date('2026-08-25T00:00:00Z'));
  assert.equal(result.ok, true);
  assert.equal(result.value.email, 'user@example.com');
  assert.equal(result.value.language, 'en');
  assert.equal(result.value.district_code, '11440');
  assert.equal(result.value.help_requested, false);
  assert.equal(result.value.created_at, '2026-08-25T00:00:00.000Z');
});

test('rejects unsupported locale, district, property type, and invalid email', () => {
  for (const body of [
    { kind:'lead_capture', email:'bad', language:'en', districtCode:'11440', propertyType:'villa', areaSqm:25 },
    { kind:'lead_capture', email:'a@b.com', language:'ja', districtCode:'11440', propertyType:'villa', areaSqm:25 },
    { kind:'lead_capture', email:'a@b.com', language:'en', districtCode:'99999', propertyType:'villa', areaSqm:25 },
    { kind:'lead_capture', email:'a@b.com', language:'en', districtCode:'11440', propertyType:'castle', areaSqm:25 }
  ]) assert.equal(normalizeLeadPayload(body).ok, false);
});

test('help_request requires a valid normalized email and caps message length', () => {
  const good = normalizeLeadPayload({ kind:'help_request', email:'user@example.com', language:'zh-CN', districtCode:'11440', propertyType:'villa', areaSqm:25, helpMessage:'I am signing next week.' });
  assert.equal(good.ok, true);
  assert.equal(good.value.help_requested, true);
  assert.equal(good.value.help_message, 'I am signing next week.');
  const tooLong = normalizeLeadPayload({ kind:'help_request', email:'user@example.com', language:'en', districtCode:'11440', propertyType:'villa', areaSqm:25, helpMessage:'x'.repeat(2001) });
  assert.equal(tooLong.ok, false);
});

test('locale contract deliberately excludes Japanese for this release', () => {
  assert.equal(normalizeEmail(' A@B.COM '), 'a@b.com');
  assert.equal(normalizeLocale('en'), 'en');
  assert.equal(normalizeLocale('zh-CN'), 'zh-CN');
  assert.equal(normalizeLocale('ja'), null);
});

test('rejects impossible area and negative money while preserving optional null metrics', () => {
  assert.equal(normalizeLeadPayload({ kind:'lead_capture', email:'a@b.com', language:'en', districtCode:'11440', propertyType:'villa', areaSqm:0 }).ok, false);
  assert.equal(normalizeLeadPayload({ kind:'lead_capture', email:'a@b.com', language:'en', districtCode:'11440', propertyType:'villa', areaSqm:25, depositWon:-1 }).ok, false);
  const ok = normalizeLeadPayload({ kind:'lead_capture', email:'a@b.com', language:'en', districtCode:'11440', propertyType:'villa', areaSqm:25 });
  assert.equal(ok.ok, true);
  assert.equal(ok.value.median_value_won, null);
});
