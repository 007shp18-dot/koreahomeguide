const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const modulePath = '../experience-capture.js';
const context = {
  language:'en', sourcePage:'/tools/seoul-rent-check/', districtCode:'11440',
  propertyType:'villa', savedPropertyType:'studio', depositWon:10000000,
  monthlyRentWon:800000, areaSqm:25, rating:'fair'
};

test('experience payload sends only the approved report fields and hidden quote context', () => {
  const { buildExperiencePayload } = require(modulePath);
  const payload = buildExperiencePayload(context, {
    districtCode:'11440', propertyType:'studio', agentFeePaidWon:360000,
    depositOutcome:'returned_late'
  }, 'rpt_0123456789abcdef');
  assert.deepEqual(payload, {
    kind:'experience_report',
    reportId:'rpt_0123456789abcdef',
    privacyConsent:true,
    privacyNoticeVersion:'2026-08-28',
    language:'en',
    districtCode:'11440',
    propertyType:'studio',
    depositWon:10000000,
    monthlyRentWon:800000,
    areaSqm:25,
    agentFeePaidWon:360000,
    depositOutcome:'returned_late',
    sourcePage:'/tools/seoul-rent-check/'
  });
  for (const forbidden of ['email','name','address','agency','landlord','legalCapWon','ip']) {
    assert.equal(Object.hasOwn(payload, forbidden), false);
  }
});

test('experience analytics excludes money, report identity, and page attribution', () => {
  const { analyticsParams } = require(modulePath);
  assert.deepEqual(analyticsParams(context, {
    districtCode:'11440', propertyType:'studio', depositOutcome:'still_renting', agentFeePaidWon:null
  }), {
    language:'en', district_code:'11440', property_type:'studio',
    deposit_outcome:'still_renting', has_fee:false
  });
});

test('fee input accepts grouped KRW and rejects non-numeric or excessive values', () => {
  const { normalizeFeeInput, formatFeeInput } = require(modulePath);
  assert.equal(normalizeFeeInput('360,000'), 360000);
  assert.equal(normalizeFeeInput(''), null);
  assert.equal(normalizeFeeInput('abc'), null);
  assert.equal(normalizeFeeInput('1,000,000,001'), null);
  assert.equal(formatFeeInput('0360000'), '360,000');
});

test('context fingerprint is stable without exposing raw quote amounts', () => {
  const { contextFingerprint } = require(modulePath);
  const first = contextFingerprint(context);
  assert.equal(first, contextFingerprint({ ...context }));
  assert.notEqual(first, contextFingerprint({ ...context, monthlyRentWon:900000 }));
  assert.doesNotMatch(first, /10000000|800000|11440/);
});

test('localized form markup uses mutually exclusive outcomes and no identifier fields', () => {
  const { formMarkup } = require(modulePath);
  const areaOptions = [{ value:'11440', label:'Mapo-gu (마포구)' }];
  const typeOptions = [{ value:'officetel', label:'Officetel (오피스텔)' }];
  for (const language of ['en','zh-CN']) {
    const html = formMarkup(language, areaOptions, typeOptions, { districtCode:'11440', propertyType:'officetel' });
    for (const outcome of ['returned_on_time','returned_late','returned_with_deductions','not_returned_after_moveout','still_renting']) {
      assert.match(html, new RegExp(`value="${outcome}"`));
    }
    assert.match(html, /name="depositOutcome" type="radio"/);
    assert.doesNotMatch(html, /type="email"|name="address"|name="agency"|textarea/i);
    assert.match(html, language === 'zh-CN' ? /不含增值税和其他服务费/ : /excluding VAT and separate service charges/);
  }
});

test('thank-you copy exposes a non-personal report reference for deletion requests', () => {
  const { thanksMarkup } = require(modulePath);
  const html = thanksMarkup('en', 'rpt_1234567890abcdef');
  assert.match(html, /rpt_1234567890abcdef/);
  assert.match(html, /report reference/i);
  assert.doesNotMatch(html, /email|name|address|agency/i);
});

test('all four Rent Check surfaces load experience assets before their app runtime', () => {
  for (const file of ['index.html','zh/index.html','tools/seoul-rent-check/index.html','zh/tools/seoul-rent-check/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /href="\/experience-capture\.css"/);
    assert.match(html, /src="\/experience-capture\.js"/);
    assert.ok(html.indexOf('/experience-capture.js') < html.lastIndexOf('/app.js'), file);
  }
});
