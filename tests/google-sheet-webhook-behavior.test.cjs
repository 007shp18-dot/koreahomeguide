const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadWebhook() {
  const context = { console };
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
