const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeLeadPayload, normalizeEmail, normalizeLocale } = require('../lib/lead-core.cjs');
const consent = { privacyConsent:true, privacyNoticeVersion:'2026-08-27' };

test('normalizes email and accepts a valid lead_capture payload', () => {
  const result = normalizeLeadPayload({
    ...consent,
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
  assert.equal(result.value.privacy_consent, true);
  assert.equal(result.value.privacy_notice_version, '2026-08-27');
});

test('rejects email submission without explicit, versioned privacy consent', () => {
  const base = { kind:'lead_capture', email:'a@b.com', language:'en', districtCode:'11440', propertyType:'villa', areaSqm:25 };
  assert.equal(normalizeLeadPayload(base).ok, false);
  assert.equal(normalizeLeadPayload({ ...base, privacyConsent:true }).ok, false);
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
  const good = normalizeLeadPayload({ ...consent, kind:'help_request', email:'user@example.com', language:'zh-CN', districtCode:'11440', propertyType:'villa', areaSqm:25, helpMessage:'I am signing next week.' });
  assert.equal(good.ok, true);
  assert.equal(good.value.help_requested, true);
  assert.equal(good.value.help_message, 'I am signing next week.');
  const tooLong = normalizeLeadPayload({ ...consent, kind:'help_request', email:'user@example.com', language:'en', districtCode:'11440', propertyType:'villa', areaSqm:25, helpMessage:'x'.repeat(2001) });
  assert.equal(tooLong.ok, false);
});

test('locale contract deliberately excludes Japanese for this release', () => {
  assert.equal(normalizeEmail(' A@B.COM '), 'a@b.com');
  assert.equal(normalizeLocale('en'), 'en');
  assert.equal(normalizeLocale('zh-CN'), 'zh-CN');
  assert.equal(normalizeLocale('ja'), null);
});

test('rejects impossible area and negative money while preserving optional null metrics', () => {
  assert.equal(normalizeLeadPayload({ ...consent, kind:'lead_capture', email:'a@b.com', language:'en', districtCode:'11440', propertyType:'villa', areaSqm:0 }).ok, false);
  assert.equal(normalizeLeadPayload({ ...consent, kind:'lead_capture', email:'a@b.com', language:'en', districtCode:'11440', propertyType:'villa', areaSqm:25, depositWon:-1 }).ok, false);
  const ok = normalizeLeadPayload({ ...consent, kind:'lead_capture', email:'a@b.com', language:'en', districtCode:'11440', propertyType:'villa', areaSqm:25 });
  assert.equal(ok.ok, true);
  assert.equal(ok.value.median_value_won, null);
});

test('lead storage accepts known source paths independently of mutable quote filters', () => {
  const base = {
    ...consent,
    kind:'lead_capture',
    email:'a@b.com',
    language:'en',
    districtCode:'11440',
    propertyType:'villa',
    areaSqm:25
  };
  const valid = normalizeLeadPayload({
    ...base,
    sourcePage:'/rent/mapo-gu/villa/'
  });
  const mismatch = normalizeLeadPayload({
    ...base,
    sourcePage:'/rent/gangnam-gu/apartment/'
  });
  const fake = normalizeLeadPayload({
    ...base,
    sourcePage:'/guides/not-real/'
  });
  const direct = normalizeLeadPayload({
    ...base,
    sourcePage:'/tools/seoul-rent-check/'
  });

  assert.equal(valid.value.source_page, '/rent/mapo-gu/villa/');
  assert.equal(mismatch.value.source_page, '/rent/gangnam-gu/apartment/');
  assert.equal(fake.value.source_page, '');
  assert.equal(direct.value.source_page, '/tools/seoul-rent-check/');
});
