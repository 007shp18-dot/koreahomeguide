const test = require('node:test');
const assert = require('node:assert/strict');
const { createLeadStore } = require('../lib/lead-store.cjs');

function responseRecorder(){ return { statusCode:200, headers:{}, body:null, status(code){this.statusCode=code;return this;}, setHeader(k,v){this.headers[k]=v;}, json(v){this.body=v;return this;} }; }

test('lead store sends webhook URL and secret only server-side', async () => {
  let seen = null;
  const fetchImpl = async (url, options) => { seen = { url, options }; return { ok:true, json:async()=>({ ok:true }) }; };
  const store = createLeadStore({ fetchImpl, webhookUrl:'https://script.google.com/macros/s/test/exec', sharedSecret:'server-secret', timeoutMs:5000 });
  await store({ email:'user@example.com', kind:'lead_capture' });
  assert.equal(seen.url, 'https://script.google.com/macros/s/test/exec');
  const body = JSON.parse(seen.options.body);
  assert.equal(body.secret, 'server-secret');
  assert.equal(body.row.email, 'user@example.com');
});

test('lead store throws a generic error on webhook failure', async () => {
  const store = createLeadStore({ fetchImpl:async()=>({ ok:false, status:500, text:async()=>'' }), webhookUrl:'https://script.google.com/macros/s/test/exec', sharedSecret:'server-secret' });
  await assert.rejects(() => store({ email:'u@example.com' }), /storage unavailable/i);
});

const leadApi = require('../api/lead.js');

test('lead endpoint rejects GET', async () => {
  const handler = leadApi.createHandler({ storeLead:async()=>({ ok:true }) });
  const res = responseRecorder();
  await handler({ method:'GET', headers:{}, body:{} }, res);
  assert.equal(res.statusCode, 405);
});

test('lead endpoint rejects untrusted production source before storage', async () => {
  const old = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = 'production';
  let calls = 0;
  const handler = leadApi.createHandler({ storeLead:async()=>{ calls += 1; } });
  const res = responseRecorder();
  await handler({ method:'POST', headers:{ origin:'https://evil.example' }, body:{} }, res);
  assert.equal(res.statusCode, 403);
  assert.equal(calls, 0);
  if (old == null) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = old;
});

test('lead endpoint validates before storage', async () => {
  let calls = 0;
  const handler = leadApi.createHandler({ storeLead:async()=>{ calls += 1; } });
  const res = responseRecorder();
  await handler({ method:'POST', headers:{ origin:'https://koreahomeguide.com' }, body:{ kind:'lead_capture', email:'not-email' } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(calls, 0);
});

test('lead endpoint stores a valid lead and disables caching', async () => {
  let row = null;
  const handler = leadApi.createHandler({ storeLead:async(value)=>{ row=value; return {ok:true}; }, now:()=>new Date('2026-08-25T00:00:00Z') });
  const res = responseRecorder();
  await handler({ method:'POST', headers:{ origin:'https://koreahomeguide.com' }, body:{ kind:'lead_capture', privacyConsent:true, privacyNoticeVersion:'2026-08-27', email:'u@example.com', language:'en', districtCode:'11440', propertyType:'villa', areaSqm:25 } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.ok, true);
  assert.equal(row.email, 'u@example.com');
  assert.equal(res.headers['Cache-Control'], 'no-store');
});

test('lead endpoint stores a valid anonymous experience through its dedicated schema', async () => {
  let row = null;
  const handler = leadApi.createHandler({ storeLead:async(value)=>{ row=value; return {ok:true}; }, now:()=>new Date('2026-08-28T05:00:00Z') });
  const res = responseRecorder();
  await handler({ method:'POST', headers:{ origin:'https://koreahomeguide.com' }, body:{
    kind:'experience_report', reportId:'rpt_0123456789abcdef', privacyConsent:true, privacyNoticeVersion:'2026-08-28',
    language:'en', districtCode:'11440', propertyType:'apartment', depositWon:10000000,
    monthlyRentWon:800000, areaSqm:59, agentFeePaidWon:360000, depositOutcome:'returned_late'
  } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(row.report_id, 'rpt_0123456789abcdef');
  assert.equal(row.email, undefined);
  assert.equal(row.legal_cap_won, 300000);
  assert.equal(row.fee_above_cap, true);
});

test('lead endpoint rejects an invalid experience before storage', async () => {
  let calls = 0;
  const handler = leadApi.createHandler({ storeLead:async()=>{ calls += 1; } });
  const res = responseRecorder();
  await handler({ method:'POST', headers:{ origin:'https://koreahomeguide.com' }, body:{
    kind:'experience_report', reportId:'rpt_0123456789abcdef', privacyConsent:true, privacyNoticeVersion:'2026-08-28',
    language:'en', districtCode:'11440', propertyType:'apartment', depositWon:10000000,
    monthlyRentWon:800000, areaSqm:59, depositOutcome:'not-a-real-outcome'
  } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(calls, 0);
});

test('storage failure returns 503 without exposing PII', async () => {
  const handler = leadApi.createHandler({ storeLead:async()=>{ throw new Error('storage unavailable private@example.com'); } });
  const res = responseRecorder();
  const oldError = console.error;
  let logged = '';
  console.error = (...args) => { logged += JSON.stringify(args); };
  try {
    await handler({ method:'POST', headers:{ origin:'https://koreahomeguide.com' }, body:{ kind:'lead_capture', privacyConsent:true, privacyNoticeVersion:'2026-08-27', email:'private@example.com', language:'en', districtCode:'11440', propertyType:'villa', areaSqm:25 } }, res);
  } finally { console.error = oldError; }
  assert.equal(res.statusCode, 503);
  assert.doesNotMatch(JSON.stringify(res.body), /private@example\.com/);
  assert.doesNotMatch(logged, /private@example\.com/);
});

test('lead endpoint rejects oversized request bodies before storage', async () => {
  let calls = 0;
  const handler = leadApi.createHandler({ storeLead:async()=>{ calls += 1; } });
  const res = responseRecorder();
  await handler({
    method:'POST',
    headers:{ origin:'https://koreahomeguide.com' },
    body:JSON.stringify({ payload:'x'.repeat(17 * 1024) })
  }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(calls, 0);
});

test('lead store aborts a stalled webhook and returns a generic storage error', async () => {
  const fetchImpl = (_url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('aborted secret detail')), { once:true });
  });
  const store = createLeadStore({
    fetchImpl,
    webhookUrl:'https://script.google.com/macros/s/test/exec',
    sharedSecret:'server-secret',
    timeoutMs:5
  });
  await assert.rejects(() => store({ email:'u@example.com' }), /^Error: Lead storage unavailable\.$/);
});
