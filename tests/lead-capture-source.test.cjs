const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('lead module listens for rent-check result and posts only to /api/lead', () => {
  const source = fs.readFileSync('lead-capture.js','utf8');
  assert.match(source, /khg:rent-check-result/);
  assert.match(source, /fetch\(['"]\/api\/lead/);
  assert.doesNotMatch(source, /script\.google\.com/);
  assert.doesNotMatch(source, /LEAD_SHEET_SHARED_SECRET/);
});

test('lead module supports both current locales but deliberately no Japanese copy', () => {
  const source = fs.readFileSync('lead-capture.js','utf8');
  assert.match(source, /zh-CN/);
  assert.match(source, /en/);
  assert.doesNotMatch(source, /language:\s*['"]ja['"]/);
});

test('GA tracking source never adds email or helpMessage to analytics params', () => {
  const source = fs.readFileSync('lead-capture.js','utf8');
  assert.doesNotMatch(source, /gtag\([^\n]*(email|helpMessage)/);
  assert.doesNotMatch(source, /track\([^\n]*(email|helpMessage)/);
});

test('lead module exposes the three lead-funnel event names', () => {
  const source = fs.readFileSync('lead-capture.js','utf8');
  for (const event of ['lead_form_view','lead_submit','help_request']) assert.match(source, new RegExp(event));
});
