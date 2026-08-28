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

test('Apps Script keeps experience reports in an isolated fixed schema', () => {
  const source = fs.readFileSync('ops/google-apps-script/lead-webhook.gs','utf8');
  assert.match(source, /const EXPERIENCE_COLUMNS = \[/);
  assert.match(source, /getSheetByName\('Experiences'\)/);
  assert.match(source, /function appendExperienceRow_\(/);
  assert.match(source, /function storeSubmission_\(/);
});

test('operations guide documents the two Vercel env vars and Apps Script properties', () => {
  const doc = fs.readFileSync('docs/operations/google-sheet-lead-capture.md','utf8');
  for (const term of ['LEAD_SHEET_WEBHOOK_URL','LEAD_SHEET_SHARED_SECRET','LEAD_SHARED_SECRET','LEAD_SHEET_ID','LEAD_NOTIFICATION_EMAIL']) assert.match(doc, new RegExp(term));
});

test('Apps Script sends only a minimal owner notification after a successful new write', () => {
  const source = fs.readFileSync('ops/google-apps-script/lead-webhook.gs','utf8');
  assert.match(source, /MailApp\.sendEmail/);
  assert.match(source, /LEAD_NOTIFICATION_EMAIL/);
  assert.match(source, /result\.duplicate/);
  assert.match(source, /exact quote amounts and the help message are not copied/);
  assert.match(source, /Lead notification failed/);
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
  assert.match(source, /'privacy_consent','privacy_notice_version'/);
});

test('operations guide requires Apps Script redeployment and consent-record verification', () => {
  const doc = fs.readFileSync('docs/operations/google-sheet-lead-capture.md','utf8');
  assert.match(doc, /does not update the Apps Script deployment automatically/);
  assert.match(doc, /privacy_consent=true/);
  assert.match(doc, /privacy_notice_version=2026-08-27/);
});

test('operations guide documents isolated experience storage and safe activation order', () => {
  const doc = fs.readFileSync('docs/operations/google-sheet-lead-capture.md','utf8');
  assert.match(doc, /experience_report/);
  assert.match(doc, /`Experiences`/);
  assert.match(doc, /report_id/);
  assert.match(doc, /privacy_notice_version=2026-08-28/);
  assert.match(doc, /before enabling the public experience form/i);
  assert.match(doc, /does not send an owner notification/i);
});

test('rate-limit guide covers experience reports without retaining raw IP data', () => {
  const doc = fs.readFileSync('docs/operations/lead-rate-limit.md','utf8');
  assert.match(doc, /experience_report/);
  assert.match(doc, /raw IP/i);
  assert.match(doc, /request bod/i);
});
