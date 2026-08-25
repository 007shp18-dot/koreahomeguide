const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('Apps Script validates secret and appends a fixed schema', () => {
  const source = fs.readFileSync('ops/google-apps-script/lead-webhook.gs','utf8');
  assert.match(source, /PropertiesService\.getScriptProperties\(\)/);
  assert.match(source, /LEAD_SHARED_SECRET/);
  assert.match(source, /LEAD_SHEET_ID/);
  assert.match(source, /appendRow/);
  assert.match(source, /const COLUMNS = \[/);
  assert.doesNotMatch(source, /doGet\s*\(/);
});

test('operations guide documents the two Vercel env vars and Apps Script properties', () => {
  const doc = fs.readFileSync('docs/operations/google-sheet-lead-capture.md','utf8');
  for (const term of ['LEAD_SHEET_WEBHOOK_URL','LEAD_SHEET_SHARED_SECRET','LEAD_SHARED_SECRET','LEAD_SHEET_ID']) assert.match(doc, new RegExp(term));
});

test('Apps Script neutralizes spreadsheet formula prefixes before appendRow', () => {
  const source = fs.readFileSync('ops/google-apps-script/lead-webhook.gs','utf8');
  assert.match(source, /sanitizeCell_/);
  assert.equal(source.includes('/^[=+\\-@]/'), true);
  assert.match(source, /COLUMNS\.map\(key => sanitizeCell_/);
});

test('Apps Script serializes Sheet writes to avoid duplicate header races', () => {
  const source = fs.readFileSync('ops/google-apps-script/lead-webhook.gs','utf8');
  assert.match(source, /LockService\.getScriptLock\(\)/);
  assert.match(source, /waitLock\(/);
  assert.match(source, /releaseLock\(\)/);
});

test('Apps Script exposes one locked upsert path for normalized email records', () => {
  const source = fs.readFileSync('ops/google-apps-script/lead-webhook.gs','utf8');
  assert.match(source, /function normalizeEmail_\(/);
  assert.match(source, /function findEmailRow_\(/);
  assert.match(source, /function upsertLeadRow_\(/);
  assert.match(source, /'updated_at'/);
});
