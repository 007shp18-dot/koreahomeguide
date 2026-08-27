const COLUMNS = [
  'kind','email','language','district_code','property_type',
  'deposit_won','monthly_rent_won','area_sqm','rating','confidence',
  'asking_value_won','median_value_won','difference_pct','comparable_count','months_used','data_through_month',
  'source_page','utm_source','utm_medium','utm_campaign','referrer_host','help_requested','help_message','created_at','updated_at',
  'privacy_consent','privacy_notice_version'
];

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}


function sanitizeCell_(value) {
  if (value == null) return '';
  if (typeof value !== 'string') return value;
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function normalizeEmail_(value) {
  return String(value || '').trim().toLowerCase();
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    return;
  }
  sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
}

function findEmailRow_(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const target = normalizeEmail_(email);
  const values = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  const index = values.findIndex(item => normalizeEmail_(item[0]) === target);
  return index < 0 ? 0 : index + 2;
}

function upsertLeadRow_(sheet, incomingRow) {
  const row = Object.assign({}, incomingRow || {});
  row.email = normalizeEmail_(row.email);
  ensureHeaders_(sheet);

  const existingRowNumber = findEmailRow_(sheet, row.email);
  if (existingRowNumber && row.kind === 'lead_capture') {
    return { ok:true, duplicate:true };
  }

  if (existingRowNumber && row.kind === 'help_request') {
    const existing = sheet.getRange(existingRowNumber, 1, 1, COLUMNS.length).getValues()[0];
    existing[COLUMNS.indexOf('help_requested')] = true;
    existing[COLUMNS.indexOf('help_message')] = sanitizeCell_(row.help_message);
    existing[COLUMNS.indexOf('updated_at')] = sanitizeCell_(row.created_at);
    sheet.getRange(existingRowNumber, 1, 1, COLUMNS.length).setValues([existing]);
    return { ok:true, updated:true };
  }

  row.help_requested = row.kind === 'help_request' || row.help_requested === true;
  row.updated_at = row.created_at;
  sheet.appendRow(COLUMNS.map(key => sanitizeCell_(row[key])));
  return { ok:true, created:true };
}

function doPost(e) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const expectedSecret = properties.getProperty('LEAD_SHARED_SECRET');
    const sheetId = properties.getProperty('LEAD_SHEET_ID');
    if (!expectedSecret || !sheetId) return jsonResponse_({ ok:false, error:'Not configured' });

    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!payload.secret || payload.secret !== expectedSecret) return jsonResponse_({ ok:false, error:'Unauthorized' });

    const row = payload.row || {};
    const lock = LockService.getScriptLock();
    lock.waitLock(5000);
    let result;
    try {
      const spreadsheet = SpreadsheetApp.openById(sheetId);
      const sheet = spreadsheet.getSheetByName('Leads') || spreadsheet.insertSheet('Leads');
      result = upsertLeadRow_(sheet, row);
    } finally {
      lock.releaseLock();
    }
    return jsonResponse_(result);
  } catch (error) {
    console.error('Lead webhook failed');
    return jsonResponse_({ ok:false, error:'Write failed' });
  }
}
