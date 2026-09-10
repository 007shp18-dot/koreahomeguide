const test = require('node:test');
const assert = require('node:assert/strict');

const modulePath = '../lib/experience-report.cjs';
const base = {
  kind:'experience_report',
  reportId:'rpt_0123456789abcdef',
  privacyConsent:true,
  privacyNoticeVersion:'2026-08-28',
  language:'en',
  districtCode:'11440',
  propertyType:'apartment',
  depositWon:10_000_000,
  monthlyRentWon:800_000,
  areaSqm:59,
  agentFeePaidWon:360_000,
  depositOutcome:'returned_on_time',
  sourcePage:'/tools/seoul-rent-check/'
};

test('housing report stores source terms and computes the ceiling on the server', () => {
  const { normalizeExperiencePayload } = require(modulePath);
  const result = normalizeExperiencePayload({ ...base, legalCapWon:1 }, new Date('2026-08-28T05:00:00Z'));
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    kind:'experience_report',
    report_id:'rpt_0123456789abcdef',
    language:'en',
    district_code:'11440',
    property_type:'apartment',
    deposit_won:10_000_000,
    monthly_rent_won:800_000,
    area_sqm:59,
    agent_fee_paid_won:360_000,
    deposit_outcome:'returned_on_time',
    legal_cap_won:300_000,
    fee_above_cap:true,
    cap_status:'calculated',
    brokerage_rule_version:'seoul-2026-08-28',
    source_page:'/tools/seoul-rent-check/',
    created_at:'2026-08-28T05:00:00.000Z',
    privacy_consent:true,
    privacy_notice_version:'2026-08-28'
  });
});

test('blank fee remains optional and does not create an over-cap result', () => {
  const { normalizeExperiencePayload } = require(modulePath);
  const result = normalizeExperiencePayload({ ...base, agentFeePaidWon:'' });
  assert.equal(result.ok, true);
  assert.equal(result.value.agent_fee_paid_won, null);
  assert.equal(result.value.legal_cap_won, 300_000);
  assert.equal(result.value.fee_above_cap, null);
});

test('officetel reports never guess statutory facility eligibility', () => {
  const { normalizeExperiencePayload } = require(modulePath);
  const result = normalizeExperiencePayload({ ...base, propertyType:'officetel' });
  assert.equal(result.ok, true);
  assert.equal(result.value.legal_cap_won, null);
  assert.equal(result.value.fee_above_cap, null);
  assert.equal(result.value.cap_status, 'undetermined');
});

test('studio reports use the housing brokerage rule', () => {
  const { normalizeExperiencePayload } = require(modulePath);
  const result = normalizeExperiencePayload({ ...base, propertyType:'studio' });
  assert.equal(result.ok, true);
  assert.equal(result.value.property_type, 'studio');
  assert.equal(result.value.legal_cap_won, 300_000);
});

test('experience report rejects invalid identity, taxonomy, amounts, and consent', () => {
  const { normalizeExperiencePayload } = require(modulePath);
  for (const payload of [
    { ...base, reportId:'short' },
    { ...base, language:'ja' },
    { ...base, districtCode:'99999' },
    { ...base, propertyType:'castle' },
    { ...base, depositOutcome:'late-ish' },
    { ...base, depositWon:-1 },
    { ...base, monthlyRentWon:-1 },
    { ...base, areaSqm:0 },
    { ...base, agentFeePaidWon:-1 },
    { ...base, privacyConsent:false },
    { ...base, privacyNoticeVersion:'' }
  ]) assert.equal(normalizeExperiencePayload(payload).ok, false, JSON.stringify(payload));
});

test('all deposit outcomes are mutually exclusive stored values', () => {
  const { normalizeExperiencePayload, DEPOSIT_OUTCOMES } = require(modulePath);
  assert.deepEqual([...DEPOSIT_OUTCOMES], [
    'returned_on_time',
    'returned_late',
    'returned_with_deductions',
    'not_returned_after_moveout',
    'still_renting'
  ]);
  for (const depositOutcome of DEPOSIT_OUTCOMES) {
    assert.equal(normalizeExperiencePayload({ ...base, depositOutcome }).value.deposit_outcome, depositOutcome);
  }
});
