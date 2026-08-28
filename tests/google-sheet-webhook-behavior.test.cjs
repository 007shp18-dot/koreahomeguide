const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadWebhook() {
  const sent = [];
  const context = { console:{ error() {} }, MailApp:{ sendEmail:message => sent.push(message) }, sent };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('ops/google-apps-script/lead-webhook.gs', 'utf8'), context);
  return context;
}

class FakeSheet {
  constructor(rows = []) {
    this.rows = rows.map(row => [...row]);
  }

  getLastRow() {
    return this.rows.length;
  }

  appendRow(row) {
    this.rows.push([...row]);
  }

  getRange(row, column, rowCount, columnCount) {
    return {
      getValues:() => Array.from({ length:rowCount }, (_, rowOffset) =>
        Array.from({ length:columnCount }, (_, columnOffset) =>
          this.rows[row - 1 + rowOffset]?.[column - 1 + columnOffset] ?? ''
        )
      ),
      setValues:values => values.forEach((sourceRow, rowOffset) => sourceRow.forEach((value, columnOffset) => {
        const targetRow = row - 1 + rowOffset;
        if (!this.rows[targetRow]) this.rows[targetRow] = [];
        this.rows[targetRow][column - 1 + columnOffset] = value;
      }))
    };
  }
}

class FakeSpreadsheet {
  constructor() {
    this.sheets = {};
  }

  getSheetByName(name) {
    return this.sheets[name] || null;
  }

  insertSheet(name) {
    const sheet = new FakeSheet();
    this.sheets[name] = sheet;
    return sheet;
  }
}

test('repeated lead capture keeps one row using normalized email as the key', () => {
  const webhook = loadWebhook();
  const sheet = new FakeSheet();

  const created = webhook.upsertLeadRow_(sheet, {
    kind:'lead_capture', email:' User@Example.com ', created_at:'2026-08-25T00:00:00Z'
  });
  const duplicate = webhook.upsertLeadRow_(sheet, {
    kind:'lead_capture', email:'user@example.com', created_at:'2026-08-25T01:00:00Z'
  });

  assert.deepEqual(JSON.parse(JSON.stringify(created)), { ok:true, created:true });
  assert.deepEqual(JSON.parse(JSON.stringify(duplicate)), { ok:true, duplicate:true });
  assert.equal(sheet.rows.length, 2);
  assert.equal(sheet.rows[1][1], 'user@example.com');
});

test('owner notification is minimal and duplicate-safe', () => {
  const webhook = loadWebhook();
  const properties = { getProperty:key => key === 'LEAD_NOTIFICATION_EMAIL' ? 'owner@example.com' : '' };
  const row = {
    kind:'lead_capture', email:' User@Example.com ', language:'en', district_code:'11440',
    property_type:'officetel', source_page:'/guides/seoul-officetel-rent/', created_at:'2026-08-27T00:00:00Z',
    deposit_won:10000000, monthly_rent_won:1200000, help_message:'private contract concern'
  };

  assert.equal(webhook.notifyOwner_(properties, row, { created:true }, 'sheet-id'), true);
  assert.equal(webhook.sent.length, 1);
  assert.match(webhook.sent[0].body, /user@example\.com/);
  assert.match(webhook.sent[0].body, /docs\.google\.com\/spreadsheets\/d\/sheet-id\/edit/);
  assert.doesNotMatch(webhook.sent[0].body, /10000000|1200000|private contract concern/);
  assert.equal(webhook.notifyOwner_(properties, row, { duplicate:true }, 'sheet-id'), false);
  assert.equal(webhook.sent.length, 1);
});

test('mail failure never changes a successful Sheet write into an exception', () => {
  const webhook = loadWebhook();
  webhook.MailApp.sendEmail = () => { throw new Error('quota'); };
  const properties = { getProperty:() => 'owner@example.com' };
  assert.equal(webhook.notifyOwner_(properties, { kind:'help_request', email:'user@example.com' }, { updated:true }, 'sheet-id'), false);
});

test('help request merges into the existing email row instead of appending', () => {
  const webhook = loadWebhook();
  const sheet = new FakeSheet();

  webhook.upsertLeadRow_(sheet, {
    kind:'lead_capture', email:'user@example.com', created_at:'2026-08-25T00:00:00Z'
  });
  const updated = webhook.upsertLeadRow_(sheet, {
    kind:'help_request', email:'USER@example.com', help_message:'Need help', created_at:'2026-08-25T02:00:00Z'
  });

  assert.deepEqual(JSON.parse(JSON.stringify(updated)), { ok:true, updated:true });
  assert.equal(sheet.rows.length, 2);
  assert.equal(sheet.rows[1][21], true);
  assert.equal(sheet.rows[1][22], 'Need help');
  assert.equal(sheet.rows[1][24], '2026-08-25T02:00:00Z');
});

test('help request without an earlier capture creates the canonical row', () => {
  const webhook = loadWebhook();
  const sheet = new FakeSheet();

  const created = webhook.upsertLeadRow_(sheet, {
    kind:'help_request', email:'first@example.com', help_requested:true,
    help_message:'Signing tomorrow', created_at:'2026-08-25T03:00:00Z'
  });

  assert.deepEqual(JSON.parse(JSON.stringify(created)), { ok:true, created:true });
  assert.equal(sheet.rows.length, 2);
  assert.equal(sheet.rows[1][1], 'first@example.com');
  assert.equal(sheet.rows[1][21], true);
});

test('experience reports use a separate sheet and deduplicate by report ID', () => {
  const webhook = loadWebhook();
  const spreadsheet = new FakeSpreadsheet();
  const report = {
    kind:'experience_report', report_id:'rpt_0123456789abcdef', language:'en', district_code:'11440',
    property_type:'apartment', deposit_won:10000000, monthly_rent_won:800000, area_sqm:59,
    agent_fee_paid_won:360000, deposit_outcome:'returned_late', legal_cap_won:300000,
    fee_above_cap:true, cap_status:'calculated', brokerage_rule_version:'seoul-2026-08-28',
    created_at:'2026-08-28T05:00:00Z', privacy_consent:true, privacy_notice_version:'2026-08-28'
  };

  const created = webhook.storeSubmission_(spreadsheet, report);
  const duplicate = webhook.storeSubmission_(spreadsheet, report);

  assert.deepEqual(JSON.parse(JSON.stringify(created)), { ok:true, created:true });
  assert.deepEqual(JSON.parse(JSON.stringify(duplicate)), { ok:true, duplicate:true });
  assert.equal(spreadsheet.sheets.Experiences.rows.length, 2);
  assert.equal(spreadsheet.sheets.Leads, undefined);
  assert.equal(spreadsheet.sheets.Experiences.rows[1][0], 'rpt_0123456789abcdef');
});

test('lead submissions retain the existing Leads sheet behavior', () => {
  const webhook = loadWebhook();
  const spreadsheet = new FakeSpreadsheet();
  const result = webhook.storeSubmission_(spreadsheet, {
    kind:'lead_capture', email:'user@example.com', created_at:'2026-08-28T05:00:00Z'
  });
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { ok:true, created:true });
  assert.equal(spreadsheet.sheets.Leads.rows.length, 2);
  assert.equal(spreadsheet.sheets.Experiences, undefined);
});
